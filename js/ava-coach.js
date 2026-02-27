(function avaCoachModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.AvaCoach = factory();
})(typeof window !== "undefined" ? window : this, function avaCoachFactory() {
  "use strict";

  var PHRASE_URLS = ["./data/ava-phrases-v1.json", "./data/ava-phrases.json"];
  var LOCAL_MANIFEST_URL = "./audio/ava/v1/manifest.json";
  var RECENT_LIMIT = 3;
  var FALLBACK_PHRASES = [
    "Pause and choose one clear next step.",
    "Use evidence from this attempt.",
    "Keep your strategy calm and specific.",
    "Try one focused revision now."
  ];

  var state = {
    bank: null,
    loadPromise: null,
    manifest: null,
    manifestPromise: null,
    recentBySubcategory: Object.create(null),
    liveAudio: null,
    liveAudioUrl: ""
  };

  function sanitizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeKey(value) {
    return sanitizeText(value).toLowerCase();
  }

  function isDemoMode() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return params.get("demo") === "1";
    } catch (_e) {
      return false;
    }
  }

  function randomInt(max) {
    return Math.floor(Math.random() * Math.max(1, max));
  }

  function normalizeEntry(entry) {
    if (!entry) return null;
    if (typeof entry === "string") {
      var text = sanitizeText(entry);
      return text ? { text: text, clip: "" } : null;
    }
    if (typeof entry === "object") {
      var phrase = sanitizeText(entry.text || entry.phrase || "");
      if (!phrase) return null;
      return {
        text: phrase,
        clip: sanitizeText(entry.clip || entry.audio || entry.file || "")
      };
    }
    return null;
  }

  function resolvePool(category, subcategory) {
    if (!state.bank || !state.bank.categories) return [];
    var group = state.bank.categories[category];
    if (!group || typeof group !== "object") return [];
    var list = group[subcategory];
    if (!Array.isArray(list)) return [];
    return list.map(normalizeEntry).filter(Boolean);
  }

  function resolveCategoryFallback(category) {
    if (!state.bank || !state.bank.categories) return [];
    var group = state.bank.categories[category];
    if (!group || typeof group !== "object") return [];
    var merged = [];
    Object.keys(group).forEach(function (sub) {
      var list = group[sub];
      if (!Array.isArray(list)) return;
      list.forEach(function (entry) {
        var normalized = normalizeEntry(entry);
        if (normalized) merged.push(normalized);
      });
    });
    return merged;
  }

  function pickEntry(category, subcategory) {
    var key = String(category || "") + ":" + String(subcategory || "");
    var recent = state.recentBySubcategory[key] || [];

    var pool = resolvePool(category, subcategory);
    if (!pool.length) pool = resolveCategoryFallback(category);
    if (!pool.length) pool = FALLBACK_PHRASES.map(function (text) { return { text: text, clip: "" }; });

    var filtered = pool.filter(function (entry) {
      return recent.indexOf(entry.text) === -1;
    });
    var source = filtered.length ? filtered : pool;
    var selected = source[randomInt(source.length)] || { text: FALLBACK_PHRASES[0], clip: "" };

    var nextRecent = recent.slice();
    nextRecent.push(selected.text);
    if (nextRecent.length > RECENT_LIMIT) {
      nextRecent = nextRecent.slice(nextRecent.length - RECENT_LIMIT);
    }
    state.recentBySubcategory[key] = nextRecent;

    return selected;
  }

  function load() {
    if (state.bank) return Promise.resolve(state.bank);
    if (state.loadPromise) return state.loadPromise;

    state.loadPromise = PHRASE_URLS.reduce(function (chain, url) {
      return chain.then(function (loaded) {
        if (loaded) return loaded;
        return fetch(url, { cache: "no-store" })
          .then(function (res) {
            if (!res.ok) return null;
            return res.json();
          })
          .then(function (json) {
            if (json && typeof json === "object" && json.categories) {
              state.bank = json;
              return state.bank;
            }
            return null;
          })
          .catch(function () {
            return null;
          });
      });
    }, Promise.resolve(null)).finally(function () {
      state.loadPromise = null;
    });

    return state.loadPromise;
  }

  function get(category, subcategory) {
    void load();
    return pickEntry(category, subcategory).text;
  }

  function loadManifest() {
    if (state.manifest) return Promise.resolve(state.manifest);
    if (state.manifestPromise) return state.manifestPromise;

    state.manifestPromise = fetch(LOCAL_MANIFEST_URL, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (json) {
        if (!json || !Array.isArray(json.files)) {
          state.manifest = { byText: Object.create(null) };
          return state.manifest;
        }
        var byText = Object.create(null);
        json.files.forEach(function (entry) {
          var text = normalizeKey(entry && entry.text);
          var file = sanitizeText(entry && entry.file);
          if (!text || !file) return;
          byText[text] = file;
        });
        state.manifest = {
          version: sanitizeText(json.version || ""),
          voice: sanitizeText(json.voice || ""),
          byText: byText
        };
        return state.manifest;
      })
      .catch(function () {
        state.manifest = { byText: Object.create(null) };
        return state.manifest;
      })
      .finally(function () {
        state.manifestPromise = null;
      });

    return state.manifestPromise;
  }

  function pickVoice(voices, preferAva) {
    var list = Array.isArray(voices) ? voices : [];
    if (!list.length) return null;
    if (preferAva) {
      var ava = list.find(function (voice) {
        return /^en(-|$)/i.test(String(voice.lang || "")) && /\bava\b/i.test(String(voice.name || ""));
      });
      if (ava) return ava;
    }
    var english = list.find(function (voice) {
      return /^en(-|$)/i.test(String(voice.lang || ""));
    });
    return english || list[0] || null;
  }

  function speakWithSpeechSynthesis(text) {
    return new Promise(function (resolve) {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        resolve(false);
        return;
      }
      var safeText = sanitizeText(text);
      if (!safeText) {
        resolve(false);
        return;
      }

      var voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      var avaVoice = pickVoice(voices, true);
      var defaultVoice = pickVoice(voices, false);

      function run(voice, onDone) {
        var utterance = new SpeechSynthesisUtterance(safeText);
        utterance.rate = 0.92;
        utterance.pitch = 1;
        utterance.lang = "en-US";
        if (voice) utterance.voice = voice;
        utterance.onend = function () { onDone(true); };
        utterance.onerror = function () { onDone(false); };
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        } catch (_e) {
          onDone(false);
        }
      }

      run(avaVoice, function (ok) {
        if (ok) {
          resolve(true);
          return;
        }
        run(defaultVoice, function (ok2) {
          resolve(!!ok2);
        });
      });
    });
  }

  function resolveAzureConfig() {
    var key = sanitizeText(
      (window.CS_AZURE_TTS_KEY || window.AZURE_TTS_KEY || window.AZURE_SPEECH_KEY || "")
    );
    var region = sanitizeText(
      (window.CS_AZURE_TTS_REGION || window.AZURE_TTS_REGION || window.AZURE_SPEECH_REGION || "")
    );
    if (!key || !region) return null;
    return { key: key, region: region };
  }

  function playBlobAudio(blob) {
    return new Promise(function (resolve) {
      try {
        if (state.liveAudio) {
          state.liveAudio.pause();
          state.liveAudio.currentTime = 0;
        }
        if (state.liveAudioUrl) {
          URL.revokeObjectURL(state.liveAudioUrl);
          state.liveAudioUrl = "";
        }
        var audio = state.liveAudio || new Audio();
        state.liveAudio = audio;
        state.liveAudioUrl = URL.createObjectURL(blob);
        audio.src = state.liveAudioUrl;
        audio.preload = "auto";
        audio.volume = 0.92;
        var done = false;
        function finish(ok) {
          if (done) return;
          done = true;
          resolve(!!ok);
        }
        audio.onended = function () { finish(true); };
        audio.onerror = function () { finish(false); };
        var playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () { finish(false); });
        }
      } catch (_e) {
        resolve(false);
      }
    });
  }

  async function synthesizeAzureLive(text) {
    var cfg = resolveAzureConfig();
    if (!cfg || !text) return false;

    var endpoint = "https://" + cfg.region + ".tts.speech.microsoft.com/cognitiveservices/v1";
    var escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&apos;");

    var ssml = [
      "<speak version=\"1.0\" xml:lang=\"en-US\">",
      "<voice name=\"en-US-AvaMultilingualNeural\">",
      "<prosody rate=\"0%\" pitch=\"0%\">" + escaped + "</prosody>",
      "</voice>",
      "</speak>"
    ].join("");

    try {
      var response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": cfg.key,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-48khz-192kbitrate-mono-mp3",
          "User-Agent": "WordQuestAvaCoach/1.0"
        },
        body: ssml
      });
      if (!response.ok) return false;
      var blob = await response.blob();
      if (!blob || !blob.size) return false;
      return await playBlobAudio(blob);
    } catch (_err) {
      return false;
    }
  }

  async function speak(category, subcategory) {
    await load();
    var selected = pickEntry(category, subcategory);
    if (!selected || !selected.text) return "";

    var manifest = await loadManifest();
    var fromManifest = manifest && manifest.byText ? manifest.byText[normalizeKey(selected.text)] : "";
    var localClip = selected.clip || fromManifest || "";

    var spoke = false;
    if (window.WQAudio && typeof window.WQAudio.playCoachPhrase === "function" && localClip) {
      try {
        spoke = await window.WQAudio.playCoachPhrase({
          text: selected.text,
          clip: localClip
        }, {
          source: "ava-coach",
          demo: isDemoMode()
        });
      } catch (_err) {
        spoke = false;
      }
    }

    if (!spoke) {
      spoke = await synthesizeAzureLive(selected.text);
    }
    if (!spoke) {
      await speakWithSpeechSynthesis(selected.text);
    }

    return selected.text;
  }

  return {
    load: load,
    get: get,
    speak: speak
  };
});
