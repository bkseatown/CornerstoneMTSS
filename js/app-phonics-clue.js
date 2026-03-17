/**
 * app-phonics-clue.js
 * Phonics Clue Sprint game mode
 * Extracted from app.js Section 9 (lines 17956-18411)
 *
 * Dependencies: _el (DOM query), WQUI.showToast (UI notifications)
 */

function createPhonicsClueModule(deps) {
  const { _el, WQUI } = deps;

  const PHONICS_CLUE_DECKS_URL = './data/taboo-phonics-starter-decks.json';
  const PHONICS_CLUE_DECK_OPTIONS = Object.freeze([
    Object.freeze({ id: 'taboo_phonics_k_1_starter_30', label: 'K-1 Starter (30 cards)' }),
    Object.freeze({ id: 'taboo_phonics_g2_3_starter_30', label: 'G2-3 Starter (30 cards)' }),
    Object.freeze({ id: 'taboo_phonics_g4_5_starter_30', label: 'G4-5 Starter (30 cards)' })
  ]);
  const PHONICS_CLUE_CONTEXT_LABELS = Object.freeze({
    solo: 'Solo',
    intervention: '1:1',
    small_group: 'Group'
  });
  const PHONICS_CLUE_CONTEXT_NOTES = Object.freeze({
    solo: 'Solo mode: read clues out loud to yourself, guess, then bank one bonus action before moving on.',
    intervention: '1:1 mode: alternate clue-giver each card. Keep one quick bonus check for intervention progress.',
    small_group: 'Small-group mode: rotate clue giver, guesser, speller, and checker every card.'
  });
  const PHONICS_CLUE_BONUS_PROMPTS = Object.freeze({
    spell: 'Bonus prompt: spell the target word.',
    segment: 'Bonus prompt: segment the word into sounds or chunks.',
    sentence: 'Bonus prompt: use the word in a full sentence.',
    meaning: 'Bonus prompt: explain the meaning in your own words.'
  });
  const PHONICS_CLUE_TIMER_OPTIONS = new Set(['off', '45', '60', '75', '90']);

  let phonicsClueDeckMap = Object.create(null);
  let phonicsClueDeckPromise = null;
  const phonicsClueState = {
    deckId: 'taboo_phonics_g2_3_starter_30',
    context: 'solo',
    timer: '60',
    bonus: 'spell',
    cards: [],
    index: -1,
    current: null,
    started: false,
    targetHidden: false,
    guessAwarded: false,
    bonusAwarded: false,
    guessPoints: 0,
    bonusPoints: 0,
    turnTimerId: 0,
    turnEndsAt: 0,
    turnSecondsLeft: 0
  };

  function normalizePhonicsClueDeckId(value, fallback = 'taboo_phonics_g2_3_starter_30') {
    const normalized = String(value || '').trim();
    const allowed = PHONICS_CLUE_DECK_OPTIONS.find((deck) => deck.id === normalized);
    if (allowed) return allowed.id;
    return fallback;
  }

  function normalizePhonicsClueContext(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(PHONICS_CLUE_CONTEXT_NOTES, normalized)
      ? normalized
      : 'solo';
  }

  function normalizePhonicsClueBonus(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(PHONICS_CLUE_BONUS_PROMPTS, normalized)
      ? normalized
      : 'spell';
  }

  function normalizePhonicsClueTimer(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (PHONICS_CLUE_TIMER_OPTIONS.has(normalized)) return normalized;
    const seconds = Number.parseInt(normalized, 10);
    if (!Number.isFinite(seconds) || seconds <= 0) return 'off';
    if (seconds <= 45) return '45';
    if (seconds <= 60) return '60';
    if (seconds <= 75) return '75';
    return '90';
  }

  function normalizePhonicsClueCard(raw, index) {
    if (!raw || typeof raw !== 'object') return null;
    const targetWord = String(raw.target_word || '').trim().toLowerCase();
    if (!targetWord) return null;
    let tabooWords = Array.isArray(raw.taboo_words)
      ? raw.taboo_words
      : [raw.taboo_1, raw.taboo_2, raw.taboo_3];
    tabooWords = tabooWords
      .map((word) => String(word || '').trim())
      .filter(Boolean)
      .slice(0, 3);
    while (tabooWords.length < 3) tabooWords.push('—');
    return Object.freeze({
      id: Math.max(1, Number(raw.id) || index + 1),
      deckId: normalizePhonicsClueDeckId(String(raw.deck_id || '').trim(), ''),
      gradeBand: String(raw.grade_band || '').trim(),
      targetWord,
      markedWord: String(raw.marked_word || targetWord).trim() || targetWord,
      tabooWords: Object.freeze([...tabooWords]),
      definition: String(raw.definition || '').trim(),
      exampleSentence: String(raw.example_sentence || '').trim()
    });
  }

  function shufflePhonicsClueCards(cards) {
    const next = Array.isArray(cards) ? [...cards] : [];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  }

  function clearPhonicsClueTurnTimer() {
    if (phonicsClueState.turnTimerId) {
      clearInterval(phonicsClueState.turnTimerId);
      phonicsClueState.turnTimerId = 0;
    }
    phonicsClueState.turnEndsAt = 0;
    phonicsClueState.turnSecondsLeft = 0;
  }

  function resolvePhonicsClueTurnSeconds() {
    if (phonicsClueState.timer === 'off') return 0;
    return Math.max(0, Number.parseInt(phonicsClueState.timer, 10) || 0);
  }

  function isPhonicsClueTurnExpired() {
    const timerSeconds = resolvePhonicsClueTurnSeconds();
    if (timerSeconds <= 0) return false;
    if (!phonicsClueState.started || !phonicsClueState.current) return false;
    return phonicsClueState.turnSecondsLeft <= 0;
  }

  function syncPhonicsClueTimerChip() {
    const chip = _el('phonics-clue-timer-chip');
    if (!chip) return;
    if (!phonicsClueState.started || !phonicsClueState.current) {
      chip.textContent = 'Timer: --';
      return;
    }
    const timerSeconds = resolvePhonicsClueTurnSeconds();
    if (timerSeconds <= 0) {
      chip.textContent = 'Timer: Off';
      return;
    }
    const left = Math.max(0, Number(phonicsClueState.turnSecondsLeft) || 0);
    chip.textContent = left > 0 ? `Timer: ${left}s` : 'Timer: Time up';
  }

  function syncPhonicsClueActionButtons() {
    const startBtn = _el('phonics-clue-start-btn');
    const guessBtn = _el('phonics-clue-guess-btn');
    const bonusBtn = _el('phonics-clue-bonus-btn');
    const nextBtn = _el('phonics-clue-next-btn');
    const skipBtn = _el('phonics-clue-skip-btn');
    const hideBtn = _el('phonics-clue-hide-btn');
    if (startBtn) {
      startBtn.textContent = phonicsClueState.started ? 'Restart Deck' : 'Start Deck';
    }
    const activeCard = Boolean(phonicsClueState.started && phonicsClueState.current);
    const expired = isPhonicsClueTurnExpired();
    if (guessBtn) guessBtn.disabled = !activeCard || phonicsClueState.guessAwarded || expired;
    if (bonusBtn) bonusBtn.disabled = !activeCard || phonicsClueState.bonusAwarded || expired;
    if (nextBtn) nextBtn.disabled = !activeCard;
    if (skipBtn) skipBtn.disabled = !activeCard;
    if (hideBtn) {
      hideBtn.disabled = !activeCard;
      hideBtn.textContent = phonicsClueState.targetHidden ? 'Show Target' : 'Hide Target';
      hideBtn.setAttribute('aria-pressed', phonicsClueState.targetHidden ? 'true' : 'false');
    }
  }

  function applyPhonicsClueTargetVisibility() {
    const targetEl = _el('phonics-clue-target-word');
    if (!targetEl) return;
    targetEl.classList.toggle('is-hidden', !!phonicsClueState.targetHidden);
  }

  function renderPhonicsCluePanel() {
    const cardChip = _el('phonics-clue-card-chip');
    const scoreChip = _el('phonics-clue-score-chip');
    const bonusChip = _el('phonics-clue-bonus-chip');
    const contextChip = _el('phonics-clue-context-chip');
    const targetWordEl = _el('phonics-clue-target-word');
    const markedWordEl = _el('phonics-clue-marked-word');
    const tabooListEl = _el('phonics-clue-taboo-list');
    const defEl = _el('phonics-clue-definition');
    const exampleEl = _el('phonics-clue-example');
    const bonusPromptEl = _el('phonics-clue-bonus-prompt');
    const contextNoteEl = _el('phonics-clue-context-note');

    if (cardChip) {
      if (phonicsClueState.started && phonicsClueState.current) {
        cardChip.textContent = `Card: ${phonicsClueState.index + 1}/${phonicsClueState.cards.length}`;
      } else if (phonicsClueState.started && !phonicsClueState.current) {
        cardChip.textContent = `Card: ${phonicsClueState.cards.length}/${phonicsClueState.cards.length} complete`;
      } else {
        cardChip.textContent = 'Card: --';
      }
    }
    if (scoreChip) scoreChip.textContent = `Guess points: ${phonicsClueState.guessPoints}`;
    if (bonusChip) bonusChip.textContent = `Bonus points: ${phonicsClueState.bonusPoints}`;
    if (contextChip) {
      contextChip.textContent = PHONICS_CLUE_CONTEXT_LABELS[phonicsClueState.context] || 'Solo';
    }
    if (bonusPromptEl) {
      bonusPromptEl.textContent = PHONICS_CLUE_BONUS_PROMPTS[phonicsClueState.bonus] || PHONICS_CLUE_BONUS_PROMPTS.spell;
    }
    if (contextNoteEl) {
      contextNoteEl.textContent = PHONICS_CLUE_CONTEXT_NOTES[phonicsClueState.context] || PHONICS_CLUE_CONTEXT_NOTES.solo;
    }

    const current = phonicsClueState.current;
    if (!current) {
      if (targetWordEl) targetWordEl.textContent = 'Start a round to reveal the first card.';
      if (markedWordEl) markedWordEl.textContent = 'Marked: —';
      if (tabooListEl) tabooListEl.innerHTML = '<li>—</li><li>—</li><li>—</li>';
      if (defEl) defEl.textContent = 'Definition: —';
      if (exampleEl) exampleEl.textContent = 'Example: —';
      phonicsClueState.targetHidden = false;
      applyPhonicsClueTargetVisibility();
      syncPhonicsClueTimerChip();
      syncPhonicsClueActionButtons();
      return;
    }

    if (targetWordEl) targetWordEl.textContent = current.targetWord.toUpperCase();
    if (markedWordEl) markedWordEl.textContent = `Marked: ${current.markedWord}`;
    if (tabooListEl) {
      tabooListEl.innerHTML = '';
      current.tabooWords.forEach((tabooWord) => {
        const li = document.createElement('li');
        li.textContent = tabooWord;
        tabooListEl.appendChild(li);
      });
    }
    if (defEl) defEl.textContent = `Definition: ${current.definition || '—'}`;
    if (exampleEl) exampleEl.textContent = `Example: ${current.exampleSentence || '—'}`;
    applyPhonicsClueTargetVisibility();
    syncPhonicsClueTimerChip();
    syncPhonicsClueActionButtons();
  }

  function syncPhonicsClueDeckSelect() {
    const select = _el('phonics-clue-deck-select');
    if (!select) return;
    const preferred = normalizePhonicsClueDeckId(select.value || phonicsClueState.deckId);
    select.innerHTML = '';
    PHONICS_CLUE_DECK_OPTIONS.forEach((deck) => {
      const count = Array.isArray(phonicsClueDeckMap[deck.id]) ? phonicsClueDeckMap[deck.id].length : 0;
      const option = document.createElement('option');
      option.value = deck.id;
      option.textContent = count > 0 ? deck.label : `${deck.label} (unavailable)`;
      option.disabled = count <= 0;
      select.appendChild(option);
    });
    let nextDeck = preferred;
    if (!Array.isArray(phonicsClueDeckMap[nextDeck]) || phonicsClueDeckMap[nextDeck].length <= 0) {
      const fallback = PHONICS_CLUE_DECK_OPTIONS.find(
        (deck) => Array.isArray(phonicsClueDeckMap[deck.id]) && phonicsClueDeckMap[deck.id].length > 0
      );
      nextDeck = fallback?.id || preferred;
    }
    select.value = nextDeck;
    phonicsClueState.deckId = nextDeck;
  }

  function updatePhonicsClueControlsFromUI() {
    phonicsClueState.deckId = normalizePhonicsClueDeckId(
      _el('phonics-clue-deck-select')?.value || phonicsClueState.deckId
    );
    phonicsClueState.context = normalizePhonicsClueContext(
      _el('phonics-clue-context-select')?.value || phonicsClueState.context
    );
    phonicsClueState.timer = normalizePhonicsClueTimer(
      _el('phonics-clue-timer-select')?.value || phonicsClueState.timer
    );
    phonicsClueState.bonus = normalizePhonicsClueBonus(
      _el('phonics-clue-bonus-select')?.value || phonicsClueState.bonus
    );
    const deckSelect = _el('phonics-clue-deck-select');
    if (deckSelect) deckSelect.value = phonicsClueState.deckId;
    const contextSelect = _el('phonics-clue-context-select');
    if (contextSelect) contextSelect.value = phonicsClueState.context;
    const timerSelect = _el('phonics-clue-timer-select');
    if (timerSelect) timerSelect.value = phonicsClueState.timer;
    const bonusSelect = _el('phonics-clue-bonus-select');
    if (bonusSelect) bonusSelect.value = phonicsClueState.bonus;
  }

  async function ensurePhonicsClueDeckData() {
    if (Object.keys(phonicsClueDeckMap).length > 0) return phonicsClueDeckMap;
    if (phonicsClueDeckPromise) return phonicsClueDeckPromise;
    phonicsClueDeckPromise = (async () => {
      try {
        const response = await fetch(PHONICS_CLUE_DECKS_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`deck fetch failed (${response.status})`);
        const rows = await response.json();
        const grouped = Object.create(null);
        if (Array.isArray(rows)) {
          rows.forEach((rawCard, index) => {
            const card = normalizePhonicsClueCard(rawCard, index);
            if (!card || !card.deckId) return;
            if (!grouped[card.deckId]) grouped[card.deckId] = [];
            grouped[card.deckId].push(card);
          });
        }
        PHONICS_CLUE_DECK_OPTIONS.forEach((deck) => {
          const cards = Array.isArray(grouped[deck.id]) ? grouped[deck.id] : [];
          if (cards.length) {
            phonicsClueDeckMap[deck.id] = cards;
          }
        });
      } catch (error) {
        console.warn('[WordQuest] Phonics Clue Sprint deck load failed:', error?.message || error);
      } finally {
        phonicsClueDeckPromise = null;
      }
      return phonicsClueDeckMap;
    })();
    return phonicsClueDeckPromise;
  }

  function startPhonicsClueTurnTimer() {
    clearPhonicsClueTurnTimer();
    const seconds = resolvePhonicsClueTurnSeconds();
    if (!phonicsClueState.started || !phonicsClueState.current || seconds <= 0) {
      syncPhonicsClueTimerChip();
      syncPhonicsClueActionButtons();
      return;
    }
    phonicsClueState.turnEndsAt = Date.now() + (seconds * 1000);
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((phonicsClueState.turnEndsAt - Date.now()) / 1000));
      phonicsClueState.turnSecondsLeft = remaining;
      if (remaining <= 0) {
        clearPhonicsClueTurnTimer();
        WQUI.showToast('Time is up. Move to the next card.');
      }
      syncPhonicsClueTimerChip();
      syncPhonicsClueActionButtons();
    };
    tick();
    phonicsClueState.turnTimerId = setInterval(tick, 250);
  }

  function setPhonicsClueCard(index) {
    phonicsClueState.index = index;
    phonicsClueState.current = phonicsClueState.cards[index] || null;
    phonicsClueState.targetHidden = false;
    phonicsClueState.guessAwarded = false;
    phonicsClueState.bonusAwarded = false;
  }

  async function startPhonicsClueDeck() {
    updatePhonicsClueControlsFromUI();
    await ensurePhonicsClueDeckData();
    syncPhonicsClueDeckSelect();
    const cards = Array.isArray(phonicsClueDeckMap[phonicsClueState.deckId])
      ? phonicsClueDeckMap[phonicsClueState.deckId]
      : [];
    if (!cards.length) {
      WQUI.showToast('Phonics Clue Sprint deck data is unavailable on this build.');
      renderPhonicsCluePanel();
      return false;
    }
    phonicsClueState.cards = shufflePhonicsClueCards(cards);
    phonicsClueState.started = true;
    phonicsClueState.guessPoints = 0;
    phonicsClueState.bonusPoints = 0;
    setPhonicsClueCard(0);
    startPhonicsClueTurnTimer();
    renderPhonicsCluePanel();
    return true;
  }

  function completePhonicsClueDeck() {
    clearPhonicsClueTurnTimer();
    phonicsClueState.started = false;
    phonicsClueState.current = null;
    phonicsClueState.index = phonicsClueState.cards.length - 1;
    renderPhonicsCluePanel();
    WQUI.showToast(
      `Round complete: ${phonicsClueState.guessPoints} guess points + ${phonicsClueState.bonusPoints} bonus points.`,
      3200
    );
  }

  function advancePhonicsClueCard() {
    if (!phonicsClueState.started || !phonicsClueState.current) return;
    const nextIndex = phonicsClueState.index + 1;
    if (nextIndex >= phonicsClueState.cards.length) {
      completePhonicsClueDeck();
      return;
    }
    setPhonicsClueCard(nextIndex);
    startPhonicsClueTurnTimer();
    renderPhonicsCluePanel();
  }

  function skipPhonicsClueCard() {
    if (!phonicsClueState.started || !phonicsClueState.current) return;
    WQUI.showToast('Card skipped.');
    advancePhonicsClueCard();
  }

  function awardPhonicsClueGuessPoint() {
    if (!phonicsClueState.started || !phonicsClueState.current) return;
    if (isPhonicsClueTurnExpired()) {
      WQUI.showToast('Timer ended. Move to the next card.');
      return;
    }
    if (phonicsClueState.guessAwarded) {
      WQUI.showToast('Guess point already banked for this card.');
      return;
    }
    phonicsClueState.guessPoints += 1;
    phonicsClueState.guessAwarded = true;
    renderPhonicsCluePanel();
  }

  function awardPhonicsClueBonusPoint() {
    if (!phonicsClueState.started || !phonicsClueState.current) return;
    if (isPhonicsClueTurnExpired()) {
      WQUI.showToast('Timer ended. Move to the next card.');
      return;
    }
    if (phonicsClueState.bonusAwarded) {
      WQUI.showToast('Bonus point already banked for this card.');
      return;
    }
    phonicsClueState.bonusPoints += 1;
    phonicsClueState.bonusAwarded = true;
    renderPhonicsCluePanel();
  }

  function togglePhonicsClueTargetVisibility() {
    if (!phonicsClueState.started || !phonicsClueState.current) return;
    phonicsClueState.targetHidden = !phonicsClueState.targetHidden;
    applyPhonicsClueTargetVisibility();
    syncPhonicsClueActionButtons();
  }

  async function openPhonicsClueModal() {
    _el('phonics-clue-modal')?.classList.remove('hidden');
    await ensurePhonicsClueDeckData();
    syncPhonicsClueDeckSelect();
    updatePhonicsClueControlsFromUI();
    if (phonicsClueState.started && phonicsClueState.current) {
      startPhonicsClueTurnTimer();
    }
    renderPhonicsCluePanel();
  }

  function closePhonicsClueModal() {
    _el('phonics-clue-modal')?.classList.add('hidden');
    clearPhonicsClueTurnTimer();
  }

  // Public API
  return {
    // State reference for direct access (used in event listener conditions)
    phonicsClueState,
    // Methods
    openModal: openPhonicsClueModal,
    closeModal: closePhonicsClueModal,
    startDeck: startPhonicsClueDeck,
    advanceCard: advancePhonicsClueCard,
    skipCard: skipPhonicsClueCard,
    awardGuessPoint: awardPhonicsClueGuessPoint,
    awardBonusPoint: awardPhonicsClueBonusPoint,
    toggleTargetVisibility: togglePhonicsClueTargetVisibility,
    renderPanel: renderPhonicsCluePanel,
    syncDeckSelect: syncPhonicsClueDeckSelect,
    updateControlsFromUI: updatePhonicsClueControlsFromUI,
    ensureDeckData: ensurePhonicsClueDeckData
  };
}
