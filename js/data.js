/**
 * data.js — Word Quest v2
 * Loads word data and normalizes it to a unified internal format.
 * Supports both the new app_ready_database_FINAL.json AND the old
 * window.WORD_ENTRIES format so the app works right now.
 */

const WQData = (() => {
  const VALID_GRADE_BANDS = new Set(['K-2', 'G3-5', 'G6-8', 'G9-12']);
  const GRADE_BAND_ORDER = Object.freeze(['K-2', 'G3-5', 'G6-8', 'G9-12']);
  const GRADE_BAND_ALIASES = new Map([
    ['K2', 'K-2'],
    ['K-2', 'K-2'],
    ['G3-5', 'G3-5'],
    ['G6-8', 'G6-8'],
    ['G9-12', 'G9-12'],
    ['G11-12', 'G9-12'],
    ['G12+', 'G9-12']
  ]);

  // ─── Unified entry shape ───────────────────────────────────────────
  // All internal code uses this shape regardless of source:
  // {
  //   word:        string,
  //   definition:  string,
  //   sentence:    string,
  //   fun_add_on:  string,
  //   syllables:   string,   e.g. "trap•e•zoid"
  //   phonics:     string|null,
  //   grade_band:  string,   e.g. "G3-5"
  //   tier:        string,   e.g. "Tier 2"
  //   game_tag:    string,   "playable" | "too_long" | "multi_word" | etc.
  //   audio: {
  //     word:      string|null,  path to mp3
  //     def:       string|null,
  //     sentence:  string|null,
  //     fun:       string|null,
  //   }
  // }

  let _entries = {};      // word → unified entry
  let _playable = [];     // words with game_tag === 'playable'
  let _quarantineItems = [];
  let _loaded = false;

  function _normalizeGradeBand(rawGradeBand) {
    const raw = String(rawGradeBand || '').trim();
    if (!raw) return '';
    if (VALID_GRADE_BANDS.has(raw)) return raw;
    const key = raw.toUpperCase().replace(/\s+/g, '');
    return GRADE_BAND_ALIASES.get(key) || '';
  }

  function _expandGradeBands(requestedBand) {
    const normalized = _normalizeGradeBand(requestedBand);
    if (!normalized) return [];
    const idx = GRADE_BAND_ORDER.indexOf(normalized);
    if (idx < 0) return [normalized];
    return GRADE_BAND_ORDER.slice(0, idx + 1);
  }

  function _isDevMode() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      if (String(params.get('env') || '').toLowerCase() === 'dev') return true;
      return localStorage.getItem('cs_allow_dev') === '1';
    } catch (_e) {
      return false;
    }
  }

  function _classifyInvalidGradeBand(rawGradeBand) {
    const raw = String(rawGradeBand || '').trim();
    if (!raw) return 'missing';
    // Valid-looking range syntax but outside known set -> unknown band.
    if (/^(K|G?\d+)\s*-\s*(\d+)$/.test(raw.toUpperCase())) return 'unknown_band';
    return 'invalid_format';
  }

  function _pushQuarantine(word, rawGradeBand, reason) {
    _quarantineItems.push({
      word: String(word || '').toLowerCase(),
      raw_grade_band: String(rawGradeBand || '').trim(),
      reason: String(reason || 'invalid_format')
    });
  }

  // ─── Normalise NEW JSON format ─────────────────────────────────────
  function _fromNew(raw) {
    const entries = {};
    for (const [, v] of Object.entries(raw)) {
      const word = (v.display_word || '').toLowerCase().trim();
      if (!word) continue;
      const rawGradeBand = v.metadata?.grade_band || '';
      const gradeBand = _normalizeGradeBand(rawGradeBand);
      let gameTag = v.game_tag || 'playable';
      if (gameTag === 'playable' && !gradeBand) {
        gameTag = 'invalid_grade_band';
        _pushQuarantine(word, rawGradeBand, _classifyInvalidGradeBand(rawGradeBand));
      }
      entries[word] = {
        word,
        definition:  v.content?.definition  || '',
        sentence:    v.content?.sentence    || '',
        fun_add_on:  v.content?.fun_add_on  || '',
        syllables:   _buildSyllables(word, v.metadata?.syllables),
        phonics:     v.instructional_paths?.phonics || null,
        grade_band:  gradeBand,
        grade_band_raw: String(rawGradeBand || '').trim(),
        tier:        v.metadata?.tier        || '',
        game_tag:    gameTag,
        audio: {
          word:     v.audio_paths?.word_audio     || null,
          def:      v.audio_paths?.definition_audio || null,
          sentence: v.audio_paths?.sentence_audio || null,
          fun:      v.audio_paths?.fun_audio       || null,
        }
      };
    }
    return entries;
  }

  // ─── Normalise OLD window.WORD_ENTRIES format ──────────────────────
  function _fromOld(raw) {
    const entries = {};
    for (const [word, v] of Object.entries(raw)) {
      const w = word.toLowerCase().trim();
      if (!w) continue;
      const en = v.en || {};
      const rawGradeBand = v.grade_band || '';
      const gradeBand = _normalizeGradeBand(rawGradeBand);
      let gameTag = w.includes(' ') ? 'multi_word'
        : w.length > 12   ? 'too_long'
          : 'playable';
      if (gameTag === 'playable' && !gradeBand) {
        gameTag = 'invalid_grade_band';
        _pushQuarantine(w, rawGradeBand, _classifyInvalidGradeBand(rawGradeBand));
      }
      entries[w] = {
        word:        w,
        definition:  en.def      || v.def      || '',
        sentence:    en.sentence || v.sentence || '',
        fun_add_on:  en.fun      || v.fun      || '',
        syllables:   v.syllables || w,
        phonics:     v.phonics?.patterns?.[0] || null,
        grade_band:  gradeBand,
        grade_band_raw: String(rawGradeBand || '').trim(),
        tier:        v.tier       || '',
        game_tag:    gameTag,
        audio: { word: null, def: null, sentence: null, fun: null }
      };
    }
    return entries;
  }

  function _buildSyllables(word, count) {
    // If we don't have syllable breakdown yet, just return the word
    if (!count || count <= 1) return word;
    return word; // Will be enhanced when syllable data is available
  }

  // ─── Load ──────────────────────────────────────────────────────────
  async function load() {
    if (_loaded) return _entries;
    _quarantineItems = [];

    // 1. Inline JS variable (works with file:// — no server needed)
    if (window.WQ_WORD_DATA && Object.keys(window.WQ_WORD_DATA).length > 0) {
      _entries = _fromNew(window.WQ_WORD_DATA);
      console.log(`[WQData] Loaded ${Object.keys(_entries).length} words from inline data`);
      _finalize();
      return _entries;
    }

    // 2. Try fetch (works when served over http/https)
    try {
      const res = await fetch('./data/words.json');
      if (res.ok) {
        const raw = await res.json();
        _entries = _fromNew(raw);
        console.log(`[WQData] Loaded ${Object.keys(_entries).length} words from new JSON`);
        _finalize();
        return _entries;
      }
    } catch (e) {
      console.log('[WQData] New JSON not available, trying legacy data');
    }

    // 3. Fall back to old window.WORD_ENTRIES
    if (window.WORD_ENTRIES && Object.keys(window.WORD_ENTRIES).length > 0) {
      _entries = _fromOld(window.WORD_ENTRIES);
      console.log(`[WQData] Loaded ${Object.keys(_entries).length} words from legacy WORD_ENTRIES`);
      _finalize();
      return _entries;
    }

    console.error('[WQData] No word data available');
    return {};
  }

  function _finalize() {
    _playable = Object.keys(_entries).filter(w => _entries[w].game_tag === 'playable');
    const quarantined = _quarantineItems.length;
    _loaded = true;
    console.log(`[WQData] ${_playable.length} words are game-playable`);
    if (quarantined > 0) {
      console.info(`[WQData] ${quarantined} entries quarantined due to invalid grade band metadata.`);
    }
    if (_isDevMode()) {
      window.WQ_QUARANTINE = {
        count: quarantined,
        items: _quarantineItems.slice()
      };
    }
  }

  // ─── Public API ────────────────────────────────────────────────────
  function getEntry(word) {
    return _entries[(word || '').toLowerCase()] || null;
  }

  function getPlayableWords(opts = {}) {
    let pool = [..._playable];

    if (opts.gradeBand && opts.gradeBand !== 'all') {
      const normalizedBand = _normalizeGradeBand(opts.gradeBand);
      if (normalizedBand) {
        if (opts.includeLowerBands) {
          const allowed = new Set(_expandGradeBands(normalizedBand));
          pool = pool.filter((w) => allowed.has(_entries[w].grade_band));
        } else {
          pool = pool.filter((w) => _entries[w].grade_band === normalizedBand);
        }
      } else {
        pool = [];
      }
    }
    if (opts.length && opts.length !== 'any') {
      const len = parseInt(opts.length, 10);
      if (!isNaN(len)) pool = pool.filter(w => w.length === len);
    }
    if (opts.phonics && opts.phonics !== 'all') {
      pool = pool.filter(w => _entries[w].phonics === opts.phonics);
    }
    return pool;
  }

  function isLoaded() { return _loaded; }

  function getQuarantineReport() {
    return {
      count: _quarantineItems.length,
      items: _quarantineItems.slice()
    };
  }

  return { load, getEntry, getPlayableWords, isLoaded, getQuarantineReport };
})();
