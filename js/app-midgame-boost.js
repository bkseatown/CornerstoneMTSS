/**
 * app-midgame-boost.js
 * Mid-round encouragement card runtime.
 */

function createMidgameBoostModule(deps) {
  const {
    WQUI = null,
    areBoostPopupsEnabled = () => true,
    documentRef = document,
    el = (id) => document.getElementById(id),
    escapeHtml = (value) => String(value || ''),
    gameplayStats = null,
    getMidgameBoostEnabled = () => false,
    getPref = () => '',
    getWqEngagementBoosts = () => [],
    isAssessmentRoundLocked = () => false,
    requestAnimationFrameRef = (fn) => requestAnimationFrame(fn),
    setMidgameBoostShown = () => {},
    setPref = () => {},
    showToast = () => {}
  } = deps || {};

  const MIDGAME_BOOST_KEY = 'wq_v2_midgame_boost_state_v1';
  const MIDGAME_BOOST_TRIGGER_GUESS = 3;
  const MIDGAME_BOOST_FALLBACK = Object.freeze([
    Object.freeze({ type: 'fact', text: 'Your brain gets stronger when you keep trying.' }),
    Object.freeze({ type: 'joke', text: 'What is a spelling bee\'s favorite snack? Letter chips.' }),
    Object.freeze({ type: 'quote', text: 'Progress is built one guess at a time.' }),
    Object.freeze({ type: 'fact', text: 'Guess three is where pattern recognition usually clicks.' }),
    Object.freeze({ type: 'joke', text: 'Why did the clue smile? It knew you would solve it.' }),
    Object.freeze({ type: 'quote', text: 'Effort now becomes confidence later.' })
  ]);
  const MIDGAME_BOOST_POOL = (() => {
    const raw = Array.isArray(getWqEngagementBoosts()) ? getWqEngagementBoosts() : [];
    const cleaned = raw
      .map((item) => ({
        type: String(item?.type || 'fact').toLowerCase(),
        text: String(item?.text || '').trim()
      }))
      .filter((item) => item.text.length > 0)
      .map((item) => ({
        type: ['joke', 'fact', 'quote'].includes(item.type) ? item.type : 'fact',
        text: item.text
      }));

    if (!cleaned.length) return MIDGAME_BOOST_FALLBACK;
    return Object.freeze(cleaned.map((item) => Object.freeze(item)));
  })();

  let midgameBoostAutoHideTimer = 0;

  function clearMidgameBoostAutoHideTimer() {
    if (!midgameBoostAutoHideTimer) return;
    clearTimeout(midgameBoostAutoHideTimer);
    midgameBoostAutoHideTimer = 0;
  }

  function buildMidgameBoostState() {
    const order = Array.from({ length: MIDGAME_BOOST_POOL.length }, (_, index) => index);
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return { order, cursor: 0 };
  }

  function hideMidgameBoost() {
    const boost = el('midgame-boost');
    if (!boost) return;
    clearMidgameBoostAutoHideTimer();
    boost.classList.remove('is-visible');
    if (!boost.classList.contains('hidden')) {
      setTimeout(() => {
        boost.classList.add('hidden');
        boost.innerHTML = '';
      }, 180);
    }
  }

  function splitBoostQuestionAndAnswer(type, text) {
    const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return { question: '', answer: '' };
    if (type !== 'joke') return { question: cleaned, answer: '' };
    const questionEnd = cleaned.indexOf('?');
    if (questionEnd > -1 && questionEnd < cleaned.length - 1) {
      return {
        question: cleaned.slice(0, questionEnd + 1).trim(),
        answer: cleaned.slice(questionEnd + 1).trim().replace(/^[\-–—:]+\s*/, '')
      };
    }
    return { question: cleaned, answer: '' };
  }

  function shouldKeepMidgameBoostOpen(target) {
    const node = target instanceof Element ? target : null;
    if (!node) return false;
    return Boolean(
      node.closest(
        '#keyboard, #game-board, .board-plate, .gameplay-audio, #new-game-btn, #focus-inline-wrap, #settings-btn'
      )
    );
  }

  function showMidgameBoost() {
    if (!getMidgameBoostEnabled()) return;
    if (!areBoostPopupsEnabled()) return;
    if (isAssessmentRoundLocked()) return;
    const boost = el('midgame-boost');
    if (!boost) return;
    clearMidgameBoostAutoHideTimer();
    const card = gameplayStats?.nextMidgameBoostCard?.() || null;
    if (!card) return;
    const content = splitBoostQuestionAndAnswer(card.type, card.text);
    const isQnA = (card.type === 'joke' || card.type === 'riddle') && Boolean(content.answer);
    const isRiddle = isQnA && content.question.includes('?');
    const hasAnswer = isQnA;
    const label =
      card.type === 'quote'
        ? 'Coach Tip'
        : card.type === 'joke'
          ? (isRiddle ? 'Riddle' : 'Joke')
          : 'Fun Fact';
    const mascot =
      card.type === 'quote'
        ? '🧠'
        : card.type === 'joke'
          ? (isRiddle ? '🕵️' : '😄')
          : '🛰️';
    boost.innerHTML = `
      <div class="midgame-boost-bubble">
        <span class="midgame-boost-mascot" aria-hidden="true">${mascot}</span>
        <span class="midgame-boost-tag">${escapeHtml(label)}</span>
        <p class="midgame-boost-question">${escapeHtml(content.question)}</p>
        ${hasAnswer ? '<button type="button" class="midgame-boost-answer-btn">Reveal answer</button><p class="midgame-boost-answer hidden"></p>' : ''}
        <div class="midgame-boost-actions">
          <span class="midgame-boost-round-note">Visible for this round.</span>
          <button type="button" class="midgame-boost-action midgame-boost-turn-off">Turn off round cards</button>
        </div>
      </div>
    `;
    const answerEl = boost.querySelector('.midgame-boost-answer');
    const answerBtn = boost.querySelector('.midgame-boost-answer-btn');
    if (answerEl) answerEl.textContent = content.answer;
    answerBtn?.addEventListener('click', () => {
      if (!answerEl) return;
      const reveal = answerEl.classList.contains('hidden');
      answerEl.classList.toggle('hidden', !reveal);
      answerBtn.textContent = reveal ? 'Hide answer' : 'Reveal answer';
    });
    boost.querySelector('.midgame-boost-turn-off')?.addEventListener('click', () => {
      const select = el('s-boost-popups');
      if (select) select.value = 'off';
      setPref('boostPopups', 'off');
      hideMidgameBoost();
      setMidgameBoostShown(false);
      showToast('Round cards are off. Turn them back on in Settings.');
    });
    boost.classList.remove('hidden');
    requestAnimationFrameRef(() => boost.classList.add('is-visible'));
  }

  return Object.freeze({
    MIDGAME_BOOST_KEY,
    MIDGAME_BOOST_POOL,
    MIDGAME_BOOST_TRIGGER_GUESS,
    buildMidgameBoostState,
    clearMidgameBoostAutoHideTimer,
    hideMidgameBoost,
    shouldKeepMidgameBoostOpen,
    showMidgameBoost,
    splitBoostQuestionAndAnswer
  });
}

window.createMidgameBoostModule = createMidgameBoostModule;
