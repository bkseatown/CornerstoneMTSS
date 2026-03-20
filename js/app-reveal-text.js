/**
 * app-reveal-text.js
 * Shared text and feedback helpers for reveal flows.
 */

function createRevealTextModule() {
  function trimToastDefinition(definition) {
    const text = String(definition || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    if (text.length <= 72) return text;
    return `${text.slice(0, 69).trim()}...`;
  }

  function ensureTerminalPunctuation(text) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    return /[.!?]$/.test(clean) ? clean : `${clean}.`;
  }

  function buildCombinedMeaningLine(definition, funAddOn) {
    const def = String(definition || '').replace(/\s+/g, ' ').trim();
    const fun = String(funAddOn || '').replace(/\s+/g, ' ').trim();
    if (!def && !fun) return '';
    if (!def) return ensureTerminalPunctuation(fun);
    if (!fun) return ensureTerminalPunctuation(def);
    const defBase = def.replace(/[.!?]+$/, '').trim();
    if (/^[,.;:!?]/.test(fun)) {
      return ensureTerminalPunctuation(`${defBase}${fun}`);
    }
    const funNoLeadPunc = fun.replace(/^[,.;:!?]\s*/, '').trim();
    return ensureTerminalPunctuation(`${defBase} and ${funNoLeadPunc}`);
  }

  function getRevealMeaningPayload(nextEntry, includeFun = false) {
    const definition = String(nextEntry?.definition || '').replace(/\s+/g, ' ').trim();
    const funAddOn = includeFun
      ? String(nextEntry?.fun_add_on || '').replace(/\s+/g, ' ').trim()
      : '';
    const line = buildCombinedMeaningLine(definition, funAddOn);
    const readDef = String(nextEntry?.text_to_read_definition || '').replace(/\s+/g, ' ').trim()
      || ensureTerminalPunctuation(
        nextEntry?.word && definition
          ? `${nextEntry.word} means ${definition}`
          : definition
      );
    const readFun = includeFun
      ? String(nextEntry?.text_to_read_fun || '').replace(/\s+/g, ' ').trim() || funAddOn
      : '';
    const readAll = (() => {
      if (readDef && readFun) {
        const smoothDef = readDef.replace(/[.!?]+$/, '').trim();
        const smoothFun = readFun.replace(/^[,.;:!?]\s*/, '').trim();
        return ensureTerminalPunctuation(`${smoothDef} and ${smoothFun}`);
      }
      return [readDef, readFun].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    })();
    return { definition, funAddOn, line, readAll };
  }

  function buildRevealReadCue(text) {
    const sentence = String(text || '').replace(/\s+/g, ' ').trim();
    if (!sentence) return '';
    const cues = [];
    if (/\?$/.test(sentence)) cues.push('Lift your voice slightly at the end for the question mark.');
    else if (/!$/.test(sentence)) cues.push('Use a strong voice at the exclamation point.');
    if (/,/.test(sentence)) cues.push('Pause briefly at commas.');
    else if (/\b(because|although|when|if|while)\b/i.test(sentence)) cues.push('Add a small pause before the clause word.');
    return cues.slice(0, 2).join(' ');
  }

  function getRevealFeedbackCopy(result, deps = {}) {
    const {
      maxGuesses = 6,
      pickRandom = (items) => (Array.isArray(items) && items.length ? items[0] : null),
      winToasts = {},
      lossToasts = {}
    } = deps;
    const guessCount = Math.max(1, Number(result?.guesses?.length || 0));

    if (result?.won) {
      let key = 'steady';
      if (guessCount <= 1) key = 'lightning';
      else if (guessCount <= Math.max(2, Math.ceil(maxGuesses * 0.34))) key = 'fast';
      else if (guessCount >= Math.max(4, maxGuesses - 1)) key = 'resilient';
      return pickRandom(winToasts[key]) || { lead: 'Great solve!', coach: '' };
    }

    const remaining = Math.max(0, maxGuesses - guessCount);
    let key = 'mid';
    if (remaining <= 1) key = 'close';
    else if (guessCount <= 2) key = 'early';
    return pickRandom(lossToasts[key]) || { lead: 'Keep going.', coach: '' };
  }

  return {
    buildRevealReadCue,
    getRevealFeedbackCopy,
    getRevealMeaningPayload,
    trimToastDefinition
  };
}
