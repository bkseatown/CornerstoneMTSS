(function gameCelebrationsModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSGameCelebrations = factory();
})(typeof globalThis !== "undefined" ? globalThis : window, function createGameCelebrations() {
  "use strict";

  /**
   * Game Celebrations Module
   * Wires JavaScript events to celebration CSS animations
   * Manages score display, progress tracking, streak indicators, and mastery badges
   */

  function create(config) {
    var cfg = config && typeof config === "object" ? config : {};
    var elements = {};
    var state = {
      currentScore: 0,
      currentStreak: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      lastPoints: 0
    };
    var cachedValues = {
      lastPercent: -1,
      lastStreak: -1,
      lastGradient: null,
      lastDisplay: {}
    };
    var timeoutIds = [];

    /**
     * Safely schedule timeout with cleanup tracking
     */
    function scheduleTimeout(callback, delay) {
      var id = setTimeout(function () {
        callback();
        // Remove from tracking when timeout fires
        var idx = timeoutIds.indexOf(id);
        if (idx >= 0) timeoutIds.splice(idx, 1);
      }, delay);
      timeoutIds.push(id);
      return id;
    }

    /**
     * Cancel all pending timeouts
     */
    function clearAllTimeouts() {
      for (var i = 0; i < timeoutIds.length; i++) {
        clearTimeout(timeoutIds[i]);
      }
      timeoutIds = [];
    }

    /**
     * Initialize elements from the DOM
     */
    function initElements() {
      // Only initialize once to avoid unnecessary DOM queries
      if (elements.scoreValue) return;

      elements = {
        // Score display
        scoreValue: document.getElementById("cg-score-value"),
        scoreDelta: document.getElementById("cg-score-delta"),

        // Progress bar
        progressFill: document.getElementById("cg-progress-fill"),
        progressText: document.getElementById("cg-progress-text"),
        progressPercent: document.getElementById("cg-progress-percent"),

        // Next word preview
        nextWordPreview: document.getElementById("cg-next-word-preview"),
        nextWordText: document.getElementById("cg-next-word-text"),

        // Streak indicator
        streakIndicator: document.getElementById("cg-streak-indicator"),
        streakNumber: document.getElementById("cg-streak-number"),

        // Feedback container
        feedback: document.getElementById("cg-feedback"),

        // Mastery badges container
        masteryBadges: document.getElementById("cg-mastery-badges"),

        // Milestone overlay
        milestoneReached: document.getElementById("cg-milestone-reached")
      };
    }

    /**
     * Show celebration feedback when answer is correct
     * Enhanced with GSAP animations for particle burst effect
     */
    function showCelebration(config) {
      var opts = config && typeof config === "object" ? config : {};
      if (!elements.feedback) return;

      var feedbackEl = elements.feedback;
      feedbackEl.setAttribute("data-tone", opts.tone || "positive");
      feedbackEl.innerHTML = [
        '<span class="cg-feedback-icon">✓</span>',
        '<div class="cg-feedback-copy">',
        '  <strong>Correct!</strong>',
        '  <span>+' + String(opts.points || 0) + ' points</span>',
        '</div>',
        '<div class="cg-points-badge">' + String(opts.points || 0) + '</div>'
      ].join("");

      feedbackEl.style.display = "grid";
      feedbackEl.style.opacity = "0";
      feedbackEl.style.transform = "scale(0.5)";

      // Use GSAP for celebration animations if available
      if (typeof gsap !== "undefined") {
        // Scale-up pop animation
        gsap.to(feedbackEl, {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "back.out",
          overwrite: "auto"
        });

        // Create particle burst effect
        createParticleBurst(feedbackEl);

        // Fade out and hide
        scheduleTimeout(function () {
          gsap.to(feedbackEl, {
            opacity: 0,
            scale: 0.8,
            duration: 0.3,
            ease: "power2.in",
            onComplete: function () {
              if (feedbackEl) feedbackEl.style.display = "none";
            }
          });
        }, 2300);
      } else {
        // Fallback without GSAP
        feedbackEl.style.opacity = "1";
        feedbackEl.style.transform = "scale(1)";
        scheduleTimeout(function () {
          if (feedbackEl) feedbackEl.style.display = "none";
        }, 2600);
      }
    }

    /**
     * Create particle burst effect around celebration element
     */
    function createParticleBurst(element) {
      if (typeof gsap === "undefined") return;

      var rect = element.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;
      var particleCount = 12;

      for (var i = 0; i < particleCount; i++) {
        var particle = document.createElement("div");
        particle.style.position = "fixed";
        particle.style.pointerEvents = "none";
        particle.style.left = centerX + "px";
        particle.style.top = centerY + "px";
        particle.style.width = "8px";
        particle.style.height = "8px";
        particle.style.borderRadius = "50%";
        particle.style.zIndex = "99999";

        // Alternate colors: gold, yellow, white
        var colors = ["#fbbf24", "#fcd34d", "#ffffff"];
        particle.style.backgroundColor = colors[i % colors.length];
        particle.style.boxShadow = "0 0 4px rgba(251, 191, 36, 0.6)";

        document.body.appendChild(particle);

        // Animate particle burst outward with gravity
        var angle = (i / particleCount) * Math.PI * 2;
        var distance = 80 + Math.random() * 40;
        var endX = Math.cos(angle) * distance;
        var endY = Math.sin(angle) * distance - 60; // Subtract for gravity

        gsap.to(particle, {
          x: endX,
          y: endY,
          opacity: 0,
          scale: 0,
          duration: 0.8,
          ease: "power2.out",
          delay: i * 0.03,
          onComplete: function () {
            if (particle && particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          }
        });
      }
    }

    /**
     * Update score display with delta animation
     */
    function updateScoreDisplay(delta) {
      if (!elements.scoreValue) return;

      state.currentScore += delta;
      elements.scoreValue.textContent = String(state.currentScore);

      // Show delta with animation
      if (elements.scoreDelta) {
        elements.scoreDelta.textContent = "+" + String(delta);
        elements.scoreDelta.style.display = "inline-block";

        // Hide after animation (use tracked timeout for cleanup)
        scheduleTimeout(function () {
          if (elements.scoreDelta) elements.scoreDelta.style.display = "none";
        }, 1200);
      }
    }

    /**
     * Map percent to gradient color (change detection)
     */
    function percentToGradient(percent) {
      if (percent < 25) return "linear-gradient(90deg, #3b82f6, #60a5fa)";
      if (percent < 50) return "linear-gradient(90deg, #06b6d4, #22d3ee)";
      if (percent < 75) return "linear-gradient(90deg, #10b981, #34d399)";
      if (percent === 100) return "linear-gradient(90deg, #fbbf24, #fcd34d)";
      return "linear-gradient(90deg, #f59e0b, #fbbf24)";
    }

    /**
     * Update progress bar with evolutionary color changes
     * WOW MOMENT: Colors evolve as progress increases
     * 0-25%: Blue (just getting started)
     * 25-50%: Cyan (halfway there!)
     * 50-75%: Green (almost done!)
     * 75-100%: Gold (last push!)
     */
    function updateProgressBar(correct, total) {
      if (!elements.progressFill) return;

      state.correctAnswers = correct;
      state.totalAnswers = total;

      var percent = total > 0 ? Math.round((correct / total) * 100) : 0;

      // Only update width if percent changed (change detection)
      if (percent !== cachedValues.lastPercent) {
        elements.progressFill.style.width = percent + "%";
        cachedValues.lastPercent = percent;
      }

      // Only update gradient if it changed
      var gradient = percentToGradient(percent);
      if (gradient !== cachedValues.lastGradient) {
        elements.progressFill.style.background = gradient;
        cachedValues.lastGradient = gradient;

        // Apply pulse animation only at 100%
        if (percent === 100) {
          elements.progressFill.style.animation = "cg-progress-pulse 600ms cubic-bezier(0.34, 1.56, 0.64, 1)";
        } else {
          elements.progressFill.style.animation = "none";
        }
      }

      if (elements.progressText) {
        elements.progressText.textContent = "Word " + String(correct) + " of " + String(total);
      }

      if (elements.progressPercent) {
        elements.progressPercent.textContent = percent + "%";
      }
    }

    /**
     * Get streak style tier (for change detection)
     */
    function getStreakTier(streak) {
      if (streak >= 10) return "intense";
      if (streak >= 6) return "strong";
      return "gentle";
    }

    /**
     * Show streak indicator when streak >= 3
     * WOW MOMENT: Escalating fire effect as streak increases
     * 3-5 streak: gentle glow
     * 6-9 streak: stronger glow + scale
     * 10+ streak: intense glow + confetti potential
     */
    function showStreakIndicator(streak) {
      if (!elements.streakIndicator || !elements.streakNumber) return;

      state.currentStreak = streak;
      elements.streakNumber.textContent = String(streak);
      elements.streakIndicator.style.display = "flex";

      // Only update styles if streak tier changed (change detection)
      var tier = getStreakTier(streak);
      if (tier === cachedValues.lastStreak) return;
      cachedValues.lastStreak = tier;

      // Escalating visual intensity (WOW MOMENT)
      if (tier === "intense") {
        // Intense glow + scale up for major streak
        elements.streakIndicator.style.transform = "scale(1.15)";
        elements.streakIndicator.style.boxShadow = "0 0 0 3px rgba(255, 107, 107, 0.4), 0 0 20px rgba(255, 107, 107, 0.6)";
      } else if (tier === "strong") {
        // Strong glow for solid streak
        elements.streakIndicator.style.transform = "scale(1.08)";
        elements.streakIndicator.style.boxShadow = "0 0 0 2px rgba(255, 107, 107, 0.3), 0 0 12px rgba(255, 107, 107, 0.4)";
      } else {
        // Gentle glow for 3-5 streak
        elements.streakIndicator.style.transform = "scale(1)";
        elements.streakIndicator.style.boxShadow = "0 4px 12px rgba(255, 107, 107, 0.3)";
      }
    }

    /**
     * Hide streak indicator
     */
    function hideStreakIndicator() {
      if (!elements.streakIndicator) return;
      elements.streakIndicator.style.display = "none";
      state.currentStreak = 0;
    }

    /**
     * Build milestone HTML (extracted to reduce duplication)
     */
    function buildMilestoneHtml(text) {
      return [
        '<div class="cg-milestone-icon">🎉</div>',
        '<div class="cg-milestone-text">' + escapeHtml(text) + '</div>',
        '<div class="cg-milestone-subtext">You\'re on a roll 🔥</div>'
      ].join("");
    }

    /**
     * Show milestone celebration overlay
     */
    function showMilestoneOverlay(text) {
      if (!elements.milestoneReached) {
        // Create milestone overlay if it doesn't exist
        var overlay = document.createElement("div");
        overlay.id = "cg-milestone-reached";
        overlay.className = "cg-milestone-reached";
        overlay.innerHTML = buildMilestoneHtml(text);
        document.body.appendChild(overlay);
        elements.milestoneReached = overlay;
      } else {
        elements.milestoneReached.innerHTML = buildMilestoneHtml(text);
        elements.milestoneReached.style.display = "flex";
      }

      // Remove after animation (use tracked timeout for cleanup)
      scheduleTimeout(function () {
        if (elements.milestoneReached) {
          elements.milestoneReached.style.display = "none";
        }
      }, 2200);
    }

    /**
     * Show next word preview
     */
    function showNextWordPreview(word) {
      if (!elements.nextWordPreview || !elements.nextWordText) return;

      elements.nextWordText.textContent = String(word).toUpperCase();
      elements.nextWordPreview.style.display = "flex";
    }

    /**
     * Hide next word preview
     */
    function hideNextWordPreview() {
      if (!elements.nextWordPreview) return;
      elements.nextWordPreview.style.display = "none";
    }

    /**
     * Calculate mastery badges based on session data
     */
    function calculateMasteryBadges(sessionData) {
      var badges = [];
      var data = sessionData && typeof sessionData === "object" ? sessionData : {};

      // Perfect: 100% accuracy
      if (Number(data.accuracy || 0) === 100) {
        badges.push({
          type: "perfect",
          icon: "💯",
          label: "Perfect",
          description: "100% accuracy"
        });
      }

      // Streak: 5+ correct in a row
      if (Number(data.maxStreak || 0) >= 5) {
        badges.push({
          type: "streak",
          icon: "🔥",
          label: String(data.maxStreak) + "-Streak",
          description: String(data.maxStreak) + " in a row"
        });
      }

      // Speedster: Completed in under 30 seconds
      if (Number(data.durationSeconds || 0) < 30 && Number(data.durationSeconds || 0) > 0) {
        badges.push({
          type: "speedster",
          icon: "⚡",
          label: "Speedster",
          description: String(data.durationSeconds) + "s"
        });
      }

      // Improved: Better than last session
      if (Number(data.accuracy || 0) > Number(data.previousAccuracy || 0)) {
        var improvement = Math.round(Number(data.accuracy || 0) - Number(data.previousAccuracy || 0));
        badges.push({
          type: "improved",
          icon: "📈",
          label: "Improved",
          description: "+" + String(improvement) + "%"
        });
      }

      return badges;
    }

    /**
     * Render mastery badges with reveal animation
     * WOW MOMENT: Badges animate in sequence from left to right
     * Each badge has staggered timing for dramatic effect
     */
    function renderMasteryBadges(badges) {
      if (!elements.masteryBadges) return;

      var badgesArray = Array.isArray(badges) ? badges : [];
      var html = badgesArray.map(function (badge, index) {
        // Stagger animation delay: each badge appears 150ms after previous
        var delay = (index * 150) + "ms";
        return [
          '<div class="cg-badge ' + escapeHtml(badge.type || "") + '" style="animation-delay: ' + delay + ';">',
          '  <span>' + escapeHtml(badge.icon || "") + '</span>',
          '  <span>' + escapeHtml(badge.label || "") + '</span>',
          '</div>'
        ].join("");
      }).join("");

      elements.masteryBadges.innerHTML = html;
      elements.masteryBadges.style.display = html ? "flex" : "none";
    }

    /**
     * Handle correct answer
     */
    function onAnswerCorrect(pointsAwarded, currentStreak, totalCorrect, totalWords, nextWord) {
      // 1. Show celebration feedback
      showCelebration({
        tone: "positive",
        points: pointsAwarded
      });

      // 2. Update score display with delta
      updateScoreDisplay(pointsAwarded);

      // 3. Update progress bar
      updateProgressBar(totalCorrect, totalWords);

      // 4. Show/update streak if >= 3
      if (currentStreak >= 3) {
        showStreakIndicator(currentStreak);
      } else {
        hideStreakIndicator();
      }

      // 5. Check for milestone (every 10 correct)
      if (totalCorrect > 0 && totalCorrect % 10 === 0) {
        showMilestoneOverlay(String(totalCorrect) + " Correct!");
      }

      // 6. Show next word if available
      if (nextWord) {
        showNextWordPreview(nextWord);
      }
    }

    /**
     * Handle incorrect answer
     */
    function onAnswerIncorrect() {
      hideStreakIndicator();
    }

    /**
     * Reset celebration state
     */
    function reset() {
      // Clear all pending timeouts to prevent memory leaks
      clearAllTimeouts();

      state.currentScore = 0;
      state.currentStreak = 0;
      state.correctAnswers = 0;
      state.totalAnswers = 0;
      state.lastPoints = 0;

      // Reset cached values for change detection
      cachedValues.lastPercent = -1;
      cachedValues.lastStreak = -1;
      cachedValues.lastGradient = null;

      if (elements.scoreValue) elements.scoreValue.textContent = "0";
      if (elements.scoreDelta) elements.scoreDelta.style.display = "none";
      if (elements.progressFill) elements.progressFill.style.width = "0%";
      if (elements.progressText) elements.progressText.textContent = "Word 0 of 0";
      if (elements.progressPercent) elements.progressPercent.textContent = "0%";
      if (elements.streakIndicator) elements.streakIndicator.style.display = "none";
      if (elements.feedback) elements.feedback.style.display = "none";
      if (elements.masteryBadges) elements.masteryBadges.innerHTML = "";
      if (elements.nextWordPreview) elements.nextWordPreview.style.display = "none";
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    // Initialize on creation
    initElements();

    return {
      initElements: initElements,
      showCelebration: showCelebration,
      updateScoreDisplay: updateScoreDisplay,
      updateProgressBar: updateProgressBar,
      showStreakIndicator: showStreakIndicator,
      hideStreakIndicator: hideStreakIndicator,
      showMilestoneOverlay: showMilestoneOverlay,
      showNextWordPreview: showNextWordPreview,
      hideNextWordPreview: hideNextWordPreview,
      calculateMasteryBadges: calculateMasteryBadges,
      renderMasteryBadges: renderMasteryBadges,
      onAnswerCorrect: onAnswerCorrect,
      onAnswerIncorrect: onAnswerIncorrect,
      reset: reset,
      getState: function () { return Object.assign({}, state); }
    };
  }

  return {
    create: create
  };
});
