/**
 * app-reveal-runtime-support.js
 * Low-risk reveal/state helpers that do not own round orchestration.
 */

function createRevealRuntimeSupportModule(deps) {
  const {
    DEFAULT_PREFS = {},
    WQGame = null,
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    getRevealMeaningPayload = () => ({ definition: '', funAddOn: '', line: '', readAll: '' }),
    isSorNotationEnabled = () => false,
    shouldIncludeFunInMeaning = () => false,
    buildRevealReadCue = () => ''
  } = deps || {};

  function getKidFriendlyFocusLabel(notation) {
    const raw = String(notation || '').replace(/\s+/g, ' ').trim();
    const normalized = raw.toLowerCase();
    if (!raw) return '';
    if (normalized.includes('floss')) return 'FLOSS Rule: doubled ending letters (-ss, -ll, -ff, -zz)';
    if (normalized.includes('cvc') || normalized.includes('short vowel') || normalized.includes('closed syllable')) {
      return 'Sound Steps: CVC short-vowel pattern (cat, dog)';
    }
    if (normalized.includes('cvce') || normalized.includes('magic e') || normalized.includes('silent e')) {
      return 'Magic E Rule: CVCe pattern (cap -> cape)';
    }
    if (normalized.includes('digraph')) return 'Sound Buddies: digraph (sh as in ship)';
    if (normalized.includes('vowel team')) return 'Vowel Team focus (ai as in rain)';
    if (normalized.includes('r-controlled')) return 'Bossy R focus (ar as in car)';
    if (normalized.includes('blend')) {
      if (normalized.includes('initial') || normalized.includes('ccvc')) return 'Blend Builders: initial blend (b+r as in bring)';
      if (normalized.includes('final') || normalized.includes('cvcc')) return 'Blend Builders: final blend (m+p as in camp)';
      return 'Blend Builders: consonant blend focus (br in bring)';
    }
    if (normalized.includes('trigraph')) return 'Three-letter team focus (igh as in light)';
    if (normalized.includes('diphthong')) return 'Glide vowel focus (oi in coin, ou in cloud)';
    if (normalized.includes('prefix')) return 'Prefix focus (re- as in replay)';
    if (normalized.includes('suffix')) return 'Suffix focus (-ed as in jumped)';
    if (normalized.includes('schwa')) return 'Schwa focus (a in about says /uh/)';
    if (normalized.includes('multisyll')) return 'Syllable strategy focus (chunk + blend)';
    return raw;
  }

  function getKidFriendlyFocusDetail(notation) {
    const normalized = String(notation || '').toLowerCase();
    if (normalized.includes('floss')) {
      return 'Floss Rule: after a short vowel at the end of a one-syllable word, double f, l, s, or z.';
    }
    if (normalized.includes('cvce') || normalized.includes('magic e') || normalized.includes('silent e')) {
      return 'Magic E makes the vowel say its name: cap -> cape, kit -> kite.';
    }
    if (normalized.includes('digraph')) {
      return 'Digraphs are two letters that work together to make one sound.';
    }
    if (normalized.includes('vowel team')) {
      return 'Vowel teams are two vowels working together to make one main sound.';
    }
    if (normalized.includes('r-controlled')) {
      return 'Bossy R changes the vowel sound in patterns like ar, or, er, ir, and ur.';
    }
    if (normalized.includes('blend')) {
      return 'Blends keep both consonant sounds. Initial blend example: b+r in bring. Final blend example: m+p in camp.';
    }
    if (normalized.includes('schwa')) {
      return 'Schwa is the unstressed /uh/ sound in words like about or sofa.';
    }
    return '';
  }

  function updateRevealSorBadge(entry) {
    const sor = el('modal-sor');
    if (!sor) return;
    const notation = String(entry?.phonics || '').trim();
    if (!isSorNotationEnabled() || !notation || notation.toLowerCase() === 'all') {
      sor.textContent = '';
      sor.removeAttribute('title');
      sor.classList.add('hidden');
      return;
    }
    sor.textContent = getKidFriendlyFocusLabel(notation);
    const detail = getKidFriendlyFocusDetail(notation);
    if (detail) sor.setAttribute('title', detail);
    else sor.removeAttribute('title');
    sor.classList.remove('hidden');
  }

  function syncRevealReadCue(nextEntry) {
    const cueEl = el('modal-read-cue');
    if (!cueEl) return;
    const sourceText = String(nextEntry?.sentence || '').trim() || String(nextEntry?.text_to_read_definition || '').trim();
    const cue = buildRevealReadCue(sourceText) || '';
    cueEl.textContent = cue || '';
    cueEl.classList.toggle('hidden', !cue);
  }

  function syncRevealMeaningHighlight(nextEntry) {
    const wrap = el('modal-meaning-highlight');
    const lineEl = el('modal-meaning-highlight-line');
    if (!wrap || !lineEl) return;

    const meaning = getRevealMeaningPayload(nextEntry, shouldIncludeFunInMeaning()) || {
      definition: '',
      funAddOn: '',
      line: '',
      readAll: ''
    };
    lineEl.textContent = meaning.line;
    wrap.classList.toggle('hidden', !meaning.line);
    syncRevealReadCue(nextEntry);
  }

  function getActiveMaxGuesses() {
    const stateMax = Number(WQGame?.getState?.()?.maxGuesses || 0);
    const prefMax = Number.parseInt(el('s-guesses')?.value || DEFAULT_PREFS.guesses, 10);
    return Math.max(1, Number.isFinite(stateMax) && stateMax > 0
      ? stateMax
      : Number.isFinite(prefMax) && prefMax > 0
        ? prefMax
        : 6);
  }

  return Object.freeze({
    getActiveMaxGuesses,
    syncRevealMeaningHighlight,
    syncRevealReadCue,
    updateRevealSorBadge
  });
}

window.createRevealRuntimeSupportModule = createRevealRuntimeSupportModule;
