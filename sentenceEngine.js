(function sentenceEngineModule() {
  "use strict";

  function sanitize(text) {
    return String(text || "").replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function esc(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function create(config) {
    var sentenceBank = Array.isArray(config && config.sentenceBank) && config.sentenceBank.length
      ? config.sentenceBank
      : [
        { subject: "The", noun: "dog", verb: "ran", trail: "across the yard" },
        { subject: "The", noun: "student", verb: "wrote", trail: "during class" },
        { subject: "The", noun: "team", verb: "worked", trail: "on the project" }
      ];

    var verbOptions = (config && config.verbOptions) || ["sprinted", "dashed", "raced", "bolted", "hurried"];

    var state = {
      index: 0,
      step: 0,
      maxActions: 4,
      appliedActions: new Set(),
      activeSlotId: null,
      model: null,
      slots: {
        reason: { id: "reason", type: "reason", visible: false, value: "", placeholder: "your reason", scaffold: "because" },
        adjective: { id: "adjective", type: "adjective", visible: false, value: "", placeholder: "detail", scaffold: "" },
        clause: { id: "clause", type: "clause-extension", visible: false, value: "", placeholder: "when...", scaffold: "when" },
        verb: { id: "verb", type: "verb-upgrade", visible: false, value: "", placeholder: "ran", scaffold: "" }
      },
      history: []
    };

    function baseModel() {
      return sentenceBank[state.index % sentenceBank.length];
    }

    function resetSentence() {
      state.model = baseModel();
      state.step = 0;
      state.appliedActions = new Set();
      state.activeSlotId = null;
      state.slots.reason.visible = false;
      state.slots.reason.value = "";
      state.slots.adjective.visible = false;
      state.slots.adjective.value = "";
      state.slots.clause.visible = false;
      state.slots.clause.value = "";
      state.slots.verb.visible = false;
      state.slots.verb.value = "";
      return getSentenceText();
    }

    function setActiveSlot(slotId) {
      state.activeSlotId = slotId || null;
      Object.keys(state.slots).forEach(function (id) {
        if (id !== slotId) {
          // one active scaffold at a time
          state.slots[id].active = false;
        }
      });
      if (slotId && state.slots[slotId]) state.slots[slotId].active = true;
    }

    function markAction(action) {
      if (!state.appliedActions.has(action)) {
        state.appliedActions.add(action);
        state.step = Math.min(state.maxActions, state.step + 1);
      }
    }

    function applyAction(action) {
      if (action === "why") {
        state.slots.reason.visible = true;
        markAction("why");
        setActiveSlot("reason");
      }
      if (action === "detail") {
        state.slots.adjective.visible = true;
        markAction("detail");
        setActiveSlot("adjective");
      }
      if (action === "verb") {
        state.slots.verb.visible = true;
        markAction("verb");
        setActiveSlot("verb");
      }
      if (action === "clause") {
        state.slots.clause.visible = true;
        markAction("clause");
        setActiveSlot("clause");
      }
      return getRenderModel();
    }

    function setSlotValue(slotId, raw) {
      if (!state.slots[slotId]) return;
      state.slots[slotId].value = sanitize(raw);
    }

    function chooseVerb(value) {
      state.slots.verb.visible = true;
      state.slots.verb.value = sanitize(value);
      markAction("verb");
      setActiveSlot(null);
    }

    function slotHtml(slot) {
      var value = sanitize(slot.value);
      var classes = ["ss-slot", "ss-" + slot.type + "-slot"];
      if (state.activeSlotId === slot.id) classes.push("active");
      if (!value) classes.push("placeholder");
      return '<span class="' + classes.join(" ") + '" contenteditable="true" data-slot-id="' + slot.id + '" data-type="' + slot.type + '" aria-label="' + esc(slot.type) + '">' + esc(value || slot.placeholder) + '</span>';
    }

    function getRenderModel() {
      var m = state.model || baseModel();
      var verb = sanitize(state.slots.verb.value) || m.verb;
      var adjective = state.slots.adjective.visible
        ? slotHtml(state.slots.adjective) + " "
        : "";
      var html = "";
      html += '<span class="ss-segment">' + esc(m.subject) + " " + adjective + esc(m.noun) + " " + esc(verb) + "</span>";
      if (state.slots.reason.visible) {
        html += '<span class="ss-segment"> because </span>' + slotHtml(state.slots.reason);
      }
      html += '<span class="ss-segment"> ' + esc(m.trail) + '</span>';
      if (state.slots.clause.visible) {
        html += '<span class="ss-segment">, when </span>' + slotHtml(state.slots.clause);
      }
      html += '<span class="ss-segment">.</span>';
      return {
        html: html,
        activeSlotId: state.activeSlotId,
        progress: Math.max(8, Math.round((state.step / state.maxActions) * 100)),
        step: state.step,
        maxActions: state.maxActions,
        actionsDone: state.appliedActions.size
      };
    }

    function getSentenceText() {
      var m = state.model || baseModel();
      var verb = sanitize(state.slots.verb.value) || m.verb;
      var parts = [m.subject];
      if (state.slots.adjective.visible && sanitize(state.slots.adjective.value)) parts.push(sanitize(state.slots.adjective.value));
      parts.push(m.noun);
      parts.push(verb);
      if (state.slots.reason.visible) {
        parts.push("because");
        if (sanitize(state.slots.reason.value)) parts.push(sanitize(state.slots.reason.value));
      }
      parts.push(m.trail);
      if (state.slots.clause.visible) {
        parts.push("when");
        if (sanitize(state.slots.clause.value)) parts.push(sanitize(state.slots.clause.value));
      }
      return sanitize(parts.join(" ")) + ".";
    }

    function getSnapshot() {
      return {
        sentence: getSentenceText(),
        step: state.step,
        maxActions: state.maxActions,
        actionsDone: state.appliedActions.size,
        slots: JSON.parse(JSON.stringify(state.slots))
      };
    }

    function finalizeSentence() {
      var snapshot = getSnapshot();
      state.history.push(snapshot.sentence);
      return snapshot;
    }

    function nextSentence() {
      state.index = (state.index + 1) % sentenceBank.length;
      return resetSentence();
    }

    function getHistory() {
      return state.history.slice();
    }

    resetSentence();

    return {
      state: state,
      verbOptions: verbOptions,
      applyAction: applyAction,
      setActiveSlot: setActiveSlot,
      setSlotValue: setSlotValue,
      chooseVerb: chooseVerb,
      getRenderModel: getRenderModel,
      getSentenceText: getSentenceText,
      getSnapshot: getSnapshot,
      finalizeSentence: finalizeSentence,
      nextSentence: nextSentence,
      getHistory: getHistory
    };
  }

  window.SentenceEngine = { create: create };
})();
