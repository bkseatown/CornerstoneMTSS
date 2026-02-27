(function heroV2Init() {
  "use strict";

  var root = document.getElementById("hero-preview-rotator");
  if (!root) return;

  var ROTATE_MS = 8000;
  var FADE_MS = 400;
  var TYPE_MS = 70;
  var FLIP_MS = 280;
  var timers = [];
  var current = 0;
  var running = true;

  function setTimer(fn, ms) {
    var id = window.setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function clearTimers() {
    while (timers.length) {
      window.clearTimeout(timers.pop());
    }
  }

  function pane(label, bodyHtml) {
    var el = document.createElement("section");
    el.className = "hero-preview-pane";
    el.innerHTML = '<div class="hero-preview-label">' + label + '</div>' + bodyHtml;
    return el;
  }

  var wordQuestPane = pane("Word Quest Preview", [
    '<div class="hero-board" id="heroWqBoard">',
    '  <div class="hero-row" data-row="0">' + Array(5).fill('<div class="hero-tile"></div>').join('') + '</div>',
    '  <div class="hero-row" data-row="1">' + Array(5).fill('<div class="hero-tile"></div>').join('') + '</div>',
    '  <div class="hero-row" data-row="2">' + Array(5).fill('<div class="hero-tile"></div>').join('') + '</div>',
    '</div>',
    '<div class="hero-mini-kbd" id="heroWqKbd">' + 'qwertyuiopasdfghjklzxcvbnm'.split('').map(function (k) { return '<span class="hero-key" data-k="' + k + '">' + k + '</span>'; }).join('') + '</div>'
  ].join(''));

  var sentencePane = pane("Sentence Growth Engine", [
    '<div class="hero-sentence-line" id="heroSentenceLine">The dog ran.</div>',
    '<div class="hero-level" id="heroSentenceLevel">Level 1</div>',
    '<div class="hero-metrics">',
    '  <div class="hero-metric-row"><span>Detail</span><div class="hero-track"><div class="hero-fill" id="heroSentenceDetail"></div></div></div>',
    '  <div class="hero-metric-row"><span>Reasoning</span><div class="hero-track"><div class="hero-fill" id="heroSentenceReason"></div></div></div>',
    '</div>'
  ].join(''));

  var paragraphPane = pane("Paragraph Builder", [
    '<div class="hero-metrics">',
    '  <div class="hero-pb-slot" id="heroPbTopic"></div>',
    '  <div class="hero-pb-slot" id="heroPbBody1"></div>',
    '  <div class="hero-pb-slot" id="heroPbBody2"></div>',
    '  <div class="hero-pb-slot" id="heroPbConclusion"></div>',
    '</div>',
    '<div class="hero-metrics">',
    '  <div class="hero-metric-row"><span>Cohesion</span><div class="hero-track"><div class="hero-fill" id="heroPbCohesion"></div></div></div>',
    '  <div class="hero-metric-row"><span>Reasoning</span><div class="hero-track"><div class="hero-fill" id="heroPbReason"></div></div></div>',
    '</div>'
  ].join(''));

  root.appendChild(wordQuestPane);
  root.appendChild(sentencePane);
  root.appendChild(paragraphPane);
  var panes = [wordQuestPane, sentencePane, paragraphPane];

  function setActive(index) {
    panes.forEach(function (paneEl, idx) {
      paneEl.classList.toggle("is-active", idx === index);
    });
  }

  function clearWordQuestPane() {
    var board = wordQuestPane.querySelectorAll(".hero-tile");
    board.forEach(function (tile) {
      tile.textContent = "";
      tile.classList.remove("state-gray", "state-yellow", "state-green", "flip");
    });
    wordQuestPane.querySelectorAll(".hero-key").forEach(function (k) {
      k.classList.remove("k-gray", "k-yellow", "k-green");
    });
  }

  function colorKey(letter, state) {
    var key = wordQuestPane.querySelector('.hero-key[data-k="' + letter.toLowerCase() + '"]');
    if (!key) return;
    key.classList.remove("k-gray", "k-yellow", "k-green");
    key.classList.add(state);
  }

  function animateGuess(row, guess, states, done) {
    var rowEl = wordQuestPane.querySelector('.hero-row[data-row="' + row + '"]');
    if (!rowEl) return;
    var tiles = Array.prototype.slice.call(rowEl.querySelectorAll(".hero-tile"));
    var i = 0;

    function typeNext() {
      if (!running || document.hidden) return;
      if (i >= guess.length) {
        flipNext(0);
        return;
      }
      tiles[i].textContent = guess[i];
      i += 1;
      setTimer(typeNext, TYPE_MS);
    }

    function flipNext(idx) {
      if (!running || document.hidden) return;
      if (idx >= tiles.length) {
        if (typeof done === "function") done();
        return;
      }
      tiles[idx].classList.add("flip");
      setTimer(function () {
        tiles[idx].classList.remove("flip");
        tiles[idx].classList.add(states[idx]);
        colorKey(guess[idx], states[idx].replace("state", "k"));
        setTimer(function () { flipNext(idx + 1); }, FLIP_MS);
      }, FLIP_MS);
    }

    typeNext();
  }

  function runWordQuestPreview() {
    clearWordQuestPane();
    animateGuess(0, "SLATE", ["state-gray", "state-green", "state-green", "state-yellow", "state-gray"], function () {
      setTimer(function () {
        animateGuess(1, "PLAIN", ["state-green", "state-green", "state-green", "state-gray", "state-gray"], function () {
          setTimer(function () {
            animateGuess(2, "PLANT", ["state-green", "state-green", "state-green", "state-green", "state-green"]);
          }, 420);
        });
      }, 420);
    });
  }

  function runSentencePreview() {
    var line = sentencePane.querySelector("#heroSentenceLine");
    var level = sentencePane.querySelector("#heroSentenceLevel");
    var detail = sentencePane.querySelector("#heroSentenceDetail");
    var reason = sentencePane.querySelector("#heroSentenceReason");
    if (!line || !level || !detail || !reason) return;

    line.textContent = "The dog ran.";
    level.textContent = "Level 1";
    detail.style.width = "16%";
    reason.style.width = "12%";

    setTimer(function () {
      if (!running || document.hidden) return;
      line.textContent = "The dog ran because it heard a crash.";
      level.textContent = "Level 3";
      detail.style.width = "44%";
      reason.style.width = "72%";
    }, 1600);

    setTimer(function () {
      if (!running || document.hidden) return;
      line.textContent = "The dog sprinted because it heard a crash.";
      level.textContent = "Level 4";
      detail.style.width = "62%";
      reason.style.width = "84%";
    }, 3600);
  }

  function runParagraphPreview() {
    var topic = paragraphPane.querySelector("#heroPbTopic");
    var body1 = paragraphPane.querySelector("#heroPbBody1");
    var body2 = paragraphPane.querySelector("#heroPbBody2");
    var conclusion = paragraphPane.querySelector("#heroPbConclusion");
    var cohesion = paragraphPane.querySelector("#heroPbCohesion");
    var reason = paragraphPane.querySelector("#heroPbReason");
    if (!topic || !body1 || !body2 || !conclusion || !cohesion || !reason) return;

    topic.textContent = "";
    body1.textContent = "";
    body2.textContent = "";
    conclusion.textContent = "";
    cohesion.style.width = "0%";
    reason.style.width = "0%";

    setTimer(function () { if (!running || document.hidden) return; topic.textContent = "Dogs help people."; }, 800);
    setTimer(function () { if (!running || document.hidden) return; body1.textContent = "They work as companions in hospitals."; }, 1800);
    setTimer(function () { if (!running || document.hidden) return; body2.textContent = "Because they comfort patients, recovery improves."; }, 3000);
    setTimer(function () { if (!running || document.hidden) return; conclusion.textContent = "Dogs make a meaningful difference."; }, 4300);
    setTimer(function () {
      if (!running || document.hidden) return;
      cohesion.style.width = "78%";
      reason.style.width = "86%";
    }, 5200);
  }

  function runCurrentPane() {
    clearTimers();
    if (!running || document.hidden) return;
    if (current === 0) runWordQuestPreview();
    if (current === 1) runSentencePreview();
    if (current === 2) runParagraphPreview();
    setTimer(function () {
      if (!running || document.hidden) return;
      current = (current + 1) % panes.length;
      setActive(current);
      runCurrentPane();
    }, ROTATE_MS);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
      clearTimers();
      return;
    }
    running = true;
    setActive(current);
    runCurrentPane();
  });

  setActive(0);
  runCurrentPane();
})();
