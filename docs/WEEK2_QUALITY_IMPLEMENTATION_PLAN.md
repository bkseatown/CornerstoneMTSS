# Week 2 Implementation Plan — Quality Excellence Focus

**Quality Bar**: 9.5/10 across all pages (not ready for user feedback until achieved)
**Primary Focus**: Game Fun + Visual Excellence + 100% Accuracy
**Timeline**: Week 2 (Days 1-5)

---

## Part A: Game Celebration Wiring (Typing Quest)

### Day 1-2: Core Integration

**Objective**: Wire JavaScript events to trigger celebration CSS animations

#### Step 1: HTML Structure Updates
```html
<!-- Game board container -->
<div class="cg-game-board">
  <!-- Score display (updated in real-time) -->
  <div class="cg-score-display">
    <span class="cg-score-label">Score</span>
    <div class="cg-score-with-delta">
      <span class="cg-score-value" id="current-score">0</span>
      <span class="cg-score-unit">pts</span>
      <span class="cg-score-delta positive" id="score-delta" style="display:none;"></span>
    </div>
  </div>

  <!-- Progress bar (shows X of Y) -->
  <div class="cg-progress-bar">
    <div class="cg-progress-label">
      <span id="progress-text">Word 1 of 15</span>
      <span id="progress-percent">7%</span>
    </div>
    <div class="cg-progress-track">
      <div class="cg-progress-fill" id="progress-fill"></div>
    </div>
  </div>

  <!-- Next word preview -->
  <div class="cg-next-word-preview" id="next-word-preview" style="display:none;">
    <span class="cg-preview-label">Next word</span>
    <span class="cg-preview-word" id="next-word-text">rhythm</span>
  </div>

  <!-- Feedback container (triggers celebration animation) -->
  <div class="cg-feedback" id="feedback" style="display:none;"></div>

  <!-- Streak indicator (appears when streak > 3) -->
  <div class="cg-streak" id="streak-indicator" style="display:none;">
    <span>🔥</span>
    <span class="cg-streak-number" id="streak-number">0</span>
    <span>in a row</span>
  </div>

  <!-- Game board content here -->
</div>
```

#### Step 2: JavaScript Event Handlers

**File**: `games/core/game-engine.js` (or `typing-quest.js`)

```javascript
// Hook into correct answer event
onAnswerCorrect: function(pointsAwarded, currentStreak, totalCorrect, totalWords) {
  // 1. Trigger feedback celebration
  showCelebration({
    tone: 'positive',
    points: pointsAwarded,
    streak: currentStreak
  });

  // 2. Update score display with delta animation
  updateScoreDisplay(pointsAwarded);

  // 3. Update progress bar
  updateProgressBar(totalCorrect, totalWords);

  // 4. Show/update streak if >= 3
  if (currentStreak >= 3) {
    showStreakIndicator(currentStreak);
  }

  // 5. Check for milestone (every 5, 10, 20)
  if (totalCorrect % 10 === 0) {
    showMilestoneOverlay(`${totalCorrect} Correct!`);
  }

  // 6. Show next word if available
  if (nextWord) {
    showNextWordPreview(nextWord);
  }

  // 7. Auto-advance after 2 second celebration pause
  setTimeout(() => {
    moveToNextWord();
  }, 2000);
},

// Helper functions
function showCelebration(config) {
  const feedbackEl = document.getElementById('feedback');
  feedbackEl.setAttribute('data-tone', config.tone);
  feedbackEl.innerHTML = `
    <span class="cg-feedback-icon">✓</span>
    <div class="cg-feedback-copy">
      <strong>Correct!</strong>
      <span>+${config.points} points</span>
    </div>
    <div class="cg-points-badge">${config.points}</div>
  `;
  feedbackEl.style.display = 'grid';

  // Auto-hide after animation
  setTimeout(() => {
    feedbackEl.style.display = 'none';
  }, 2600);
}

function updateScoreDisplay(delta) {
  const score = parseInt(document.getElementById('current-score').textContent) + delta;
  document.getElementById('current-score').textContent = score;

  // Show delta with animation
  const deltaEl = document.getElementById('score-delta');
  deltaEl.textContent = `+${delta}`;
  deltaEl.style.display = 'inline-block';

  // Hide after animation
  setTimeout(() => {
    deltaEl.style.display = 'none';
  }, 1200);
}

function updateProgressBar(correct, total) {
  const percent = Math.round((correct / total) * 100);
  document.getElementById('progress-fill').style.width = percent + '%';
  document.getElementById('progress-text').textContent = `Word ${correct} of ${total}`;
  document.getElementById('progress-percent').textContent = percent + '%';
}

function showStreakIndicator(streak) {
  const streakEl = document.getElementById('streak-indicator');
  document.getElementById('streak-number').textContent = streak;
  streakEl.style.display = 'flex';
}

function showMilestoneOverlay(text) {
  const overlay = document.createElement('div');
  overlay.className = 'cg-milestone-reached';
  overlay.innerHTML = `
    <div class="cg-milestone-icon">🎉</div>
    <div class="cg-milestone-text">${text}</div>
    <div class="cg-milestone-subtext">You're doing great! 🔥</div>
  `;
  document.body.appendChild(overlay);

  // Remove after animation
  setTimeout(() => {
    overlay.remove();
  }, 2200);
}

function showNextWordPreview(word) {
  const previewEl = document.getElementById('next-word-preview');
  document.getElementById('next-word-text').textContent = word;
  previewEl.style.display = 'flex';
}
```

### Day 3: Mastery Badges at Session End

**Objective**: Calculate and display achievement badges

```javascript
function calculateMasteryBadges(sessionData) {
  const badges = [];

  // Perfect: 100% accuracy
  if (sessionData.accuracy === 100) {
    badges.push({
      type: 'perfect',
      icon: '💯',
      label: 'Perfect',
      description: '100% accuracy'
    });
  }

  // Streak: 5+ correct in a row
  if (sessionData.maxStreak >= 5) {
    badges.push({
      type: 'streak',
      icon: '🔥',
      label: `${sessionData.maxStreak}-Streak`,
      description: `${sessionData.maxStreak} in a row`
    });
  }

  // Speedster: Completed in under 30 seconds
  if (sessionData.durationSeconds < 30) {
    badges.push({
      type: 'speedster',
      icon: '⚡',
      label: 'Speedster',
      description: `${sessionData.durationSeconds}s`
    });
  }

  // Improved: Better than last session
  if (sessionData.accuracy > sessionData.previousAccuracy) {
    const improvement = Math.round(sessionData.accuracy - sessionData.previousAccuracy);
    badges.push({
      type: 'improved',
      icon: '📈',
      label: 'Improved',
      description: `+${improvement}%`
    });
  }

  return badges;
}

function renderMasteryBadges(badges) {
  const badgeContainer = document.createElement('div');
  badgeContainer.className = 'cg-mastery-badges';

  badges.forEach(badge => {
    const badgeEl = document.createElement('div');
    badgeEl.className = `cg-badge ${badge.type}`;
    badgeEl.innerHTML = `
      <span>${badge.icon}</span>
      <span>${badge.label}</span>
    `;
    badgeContainer.appendChild(badgeEl);
  });

  return badgeContainer;
}
```

---

## Part B: Visual Excellence Audit (All Pages)

### Day 1-5: Systematic Audit

#### Audit Checklist for Each Page

**[ ] Contrast & Readability**
- [ ] No all-white backgrounds (add subtle tint or pattern)
- [ ] No blue-on-blue text (contrast ratio >4.5:1)
- [ ] Text legible at 100% and 150% zoom
- [ ] Color not sole indicator (use icons/emoji too)

**[ ] Visual Hierarchy**
- [ ] H1/H2/H3 clearly differentiated by size + weight
- [ ] CTAs visually distinct from regular buttons
- [ ] Important info highlighted (color, size, or position)
- [ ] No wall-of-text paragraphs (max 3 lines)

**[ ] Color Variety**
- [ ] Not monochrome (at least 3 distinct colors in use)
- [ ] Accent colors consistent across surfaces
- [ ] Background colors have purpose (status, section, etc.)
- [ ] Dark mode compatibility tested

**[ ] Layout & Spacing**
- [ ] Margins/padding follow token grid (4, 8, 12, 16, 20, 24, 32)
- [ ] No orphaned whitespace
- [ ] Responsive at 320px, 768px, 1280px
- [ ] Touch targets >=44px (mobile)

**[ ] Polish & Micro-interactions**
- [ ] Hover states obvious (color change + scale/shadow)
- [ ] Focus rings visible (2px outline)
- [ ] Animations respect prefers-reduced-motion
- [ ] Loading states visible (not silent)
- [ ] Success/error states clear

#### Pages to Audit (Priority Order)

**HIGH PRIORITY** (User-facing daily):
1. **Typing Quest** (`typing-quest.html` + CSS)
   - Current issues: Plain white board, minimal feedback
   - Target: Colorful, celebratory, instant reward

2. **Word Quest** (`word-quest.html` + CSS)
   - Current issues: Gray board, subtle feedback
   - Target: Vibrant, engaging, clear progress

3. **Learning Hub** (`learning-hub.html` + CSS)
   - Current issues: Maybe too much blue gradient?
   - Target: Balanced colors, clear card hierarchy

4. **Session Runner** (`session-runner.html` + CSS)
   - Current issues: Dark theme readability on some monitors
   - Target: High contrast, clear workflow

**MEDIUM PRIORITY**:
5. **Reading Lab** (`reading-lab.html`)
6. **Reports** (`reports.html`)
7. **Case Management** (`case-management.html`)

**LOW PRIORITY**:
8. Game platform shell
9. Supporting surfaces

---

## Part C: Curriculum Accuracy Verification

### Day 1-3: Verify Mappings

#### Curriculum Data Validation

**Task**: Ensure 100% accuracy on all curriculum references

```javascript
// Curriculum verification checklist:
// [ ] Fishtank ELA
//     [ ] Grade 1-5 coverage verified
//     [ ] Unit names match official site (fishtanklearning.org)
//     [ ] No made-up lesson numbers
//     [ ] Official focus statements used

// [ ] Illustrative Math
//     [ ] Grade K-5 coverage verified
//     [ ] Unit/Lesson combos match official IM site
//     [ ] Focus statements from official cool-downs
//     [ ] Links to source verified

// [ ] Fundations (Wilson)
//     [ ] Scope & sequence accurate
//     [ ] Lesson structure matches product
//     [ ] Heart words database reliable

// [ ] UFLI (University of Florida)
//     [ ] Scope & sequence verified
//     [ ] If referenced, validate source
```

**Action Items**:
- [ ] Visit fishtanklearning.org → verify Grade 1-5 current units are correct
- [ ] Visit illustrativemathematics.org → spot-check 10 random lessons
- [ ] Pull Wilson Fundations scope & sequence → verify any references
- [ ] Document any curriculum claims in learning-hub.html

**File to Update**: `js/curriculum-truth.js`
- Add any missing curricula
- Verify all official focus statements
- Add source URLs for spot-checking

---

## Part D: Wow Moments & Delight Details

### Goal: Create Features That Grow More Impressive

**Principles**:
- First impression: Clean, professional
- Second glance: "Oh, that's thoughtful"
- Deeper exploration: "Wow, this is really well-designed"

#### Ideas to Implement (Pick 3 for Week 2):

**1. Streak "Fire" Animation Escalation**
```css
/* Streak 1-2: Subtle glow */
/* Streak 3-5: Pulse + color shift */
/* Streak 10+: Confetti particle animation */
```

**2. Progress Visualization Evolution**
```
0-25%: "Just getting started..." → blue
25-50%: "You're halfway there!" → cyan
50-75%: "Almost done!" → green
75-100%: "Last push!" → gold
100%: Confetti explosion
```

**3. Mastery Badge Unlock Ceremony**
```
- First badge: Simple pop animation
- Each subsequent: More elaborate (spin, glow, bounce)
- 5 badges: "Champion Mode Unlocked!" overlay
```

**4. Word Difficulty Visual Indicator**
```
Easy words: Green highlight on correct
Medium: Yellow highlight
Hard: Red highlight → GREEN when correct (big relief)
```

**5. Session Summary Reveal Animation**
```
- Slide in from bottom (not instant appear)
- Badges animate in sequence (not all at once)
- Score counter increments (1...50...100)
- Celebration overlay at the end
```

---

## Part E: Regression Prevention Checklist

### Before Committing Any Code

**[ ] Visual Regression Check**
- [ ] All pages screenshot at 1280px
- [ ] All pages screenshot at 768px (tablet)
- [ ] Compare to previous week screenshots
- [ ] No unexpected layout shifts
- [ ] No color blindness issues (check with accessibility checker)

**[ ] Functional Regression Check**
- [ ] Emoji icons still visible (not broken Unicode)
- [ ] Animations still smooth (no lag)
- [ ] Buttons still clickable (no overlapping elements)
- [ ] Forms still submittable
- [ ] Navigation still works

**[ ] Code Quality Check**
- [ ] No hardcoded px values (all tokens)
- [ ] No `!important` abuse
- [ ] Reduced motion respected
- [ ] Focus rings visible
- [ ] No console errors

**[ ] Performance Check**
- [ ] Page load <3 seconds (Lighthouse)
- [ ] Animations 60fps (DevTools)
- [ ] No memory leaks (DevTools)

---

## Week 2 Daily Standup Template

### Day 1 (Monday)
**Done**: Game celebration HTML structure added to Typing Quest
**Doing**: JavaScript event handlers for correct answer
**Blockers**: None yet
**Quality Checks**: ✅ Screenshots taken before/after

### Day 2 (Tuesday)
**Done**: Feedback animation, score display, progress bar wiring
**Doing**: Mastery badge calculation
**Blockers**: None
**Quality Checks**: ✅ No regressions on other pages, ✅ Contrast verified

### Day 3 (Wednesday)
**Done**: Session-end badge rendering
**Doing**: Visual audit on Typing Quest + Word Quest
**Blockers**: None
**Quality Checks**: ✅ Accessibility verified, ✅ Curriculum mappings spot-checked

### Day 4 (Thursday)
**Done**: Visual improvements on 2+ game surfaces
**Doing**: Curriculum accuracy verification across all mappings
**Blockers**: None
**Quality Checks**: ✅ Learning Hub visuals refined, ✅ No color blindness issues

### Day 5 (Friday)
**Done**: Curriculum truth file validated
**Doing**: Final visual polish + wow moment additions
**Blockers**: None
**Quality Checks**: ✅ Full regression test across all surfaces, ✅ 9.0/10 quality bar reached

---

## Quality Metrics to Track

### Visual Excellence Score (out of 100)
- [ ] Contrast compliance: 25 points
- [ ] Color variety: 15 points
- [ ] Hierarchy clarity: 20 points
- [ ] Polish & micro-interactions: 20 points
- [ ] Accessibility: 20 points

### Accuracy Score (out of 100)
- [ ] Curriculum mapping accuracy: 60 points
- [ ] Feature completion: 25 points
- [ ] No regressions: 15 points

### Target: 9.5/10 across both scores

---

## Success Criteria for Week 2

### Must-Have ✅
- [ ] Typing Quest celebrations wired (score, progress, streak, badges)
- [ ] All curriculum references verified (100% accuracy)
- [ ] No visual regressions introduced
- [ ] All pages have good contrast + color variety
- [ ] 9.0/10 quality bar reached (ready for refinement)

### Nice-to-Have 🎯
- [ ] 2+ wow moments implemented
- [ ] Dark mode tested
- [ ] Mobile responsiveness verified
- [ ] Accessibility audit complete

### Blockers / Red Flags
- If any page has <4.5:1 contrast → fix immediately
- If any curriculum mapping is inaccurate → fix immediately
- If regressions appear → revert + investigate

---

## Handoff to Week 3

**Prerequisites for Teacher Burden Reduction Work**:
- ✅ Game celebrations fully wired
- ✅ Curriculum accuracy 100% confirmed
- ✅ Visual excellence 9.0+/10
- ✅ All surfaces contrast-verified
- ✅ No known regressions

**Ready to proceed with**: Reports dashboard at-a-glance insights

