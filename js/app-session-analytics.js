/**
 * app-session-analytics.js
 * Telemetry-backed session analytics and adoption dashboard helpers.
 */

function createSessionAnalyticsModule(deps) {
  const {
    applyChipTone = () => {},
    buildMissionSummaryStats = () => ({ count: 0, completionRate: null }),
    el = () => null,
    getActiveStudentLabel = () => 'Class',
    getLatestProbePerformance = () => null,
    getTelemetryQueue = () => [],
    sessionSummary = {}
  } = deps || {};

  function formatSignedDelta(value, digits = 1) {
    if (!Number.isFinite(value)) return '--';
    const rounded = Number(value.toFixed(digits));
    if (rounded > 0) return `+${rounded}`;
    return String(rounded);
  }

  function loadTelemetryRows() {
    try {
      const parsed = getTelemetryQueue();
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((entry) => {
          const event = String(entry?.event_name || entry?.event || entry?.name || '').trim().toLowerCase();
          const timestamp = Number(entry?.ts_ms || entry?.ts || entry?.timestamp || entry?.time || 0);
          const payload = entry?.payload && typeof entry.payload === 'object'
            ? entry.payload
            : (entry?.data && typeof entry.data === 'object' ? entry.data : entry);
          return { event, timestamp, payload };
        })
        .filter((entry) => entry.event && Number.isFinite(entry.timestamp) && entry.timestamp > 0);
    } catch {
      return [];
    }
  }

  function buildAdoptionHealthMetrics() {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const telemetryRows = loadTelemetryRows().filter((row) => row.timestamp >= (now - sevenDaysMs));

    const byEvent = (names) => {
      const allowed = new Set([].concat(names || []).map((name) => String(name || '').toLowerCase()).filter(Boolean));
      return telemetryRows.filter((row) => allowed.has(row.event));
    };
    const pct = (value) => Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100);
    const durationSeconds = (start, end) => Math.max(0, (Number(end) - Number(start)) / 1000);
    const metric = (key, label, valuePct, tone = '', detail = '', available = true, weight = 1) => ({
      key,
      label,
      valuePct: Number.isFinite(valuePct) ? Math.max(0, Math.min(100, Math.round(valuePct))) : null,
      tone,
      detail,
      available: Boolean(available),
      weight: Math.max(0, Number(weight) || 0)
    });

    const roundStarts = byEvent(['wq_round_start']).sort((a, b) => a.timestamp - b.timestamp);
    const supportEvents = byEvent(['wq_support_used', 'wq_hint_open', 'wq_hint_used', 'wq_clue_open', 'wq_coach_open'])
      .sort((a, b) => a.timestamp - b.timestamp);
    let noEarlySupportCount = 0;
    if (roundStarts.length) {
      roundStarts.forEach((start) => {
        const earlySupport = supportEvents.find((event) => {
          const delta = event.timestamp - start.timestamp;
          return delta >= 0 && delta <= 90_000;
        });
        if (!earlySupport) noEarlySupportCount += 1;
      });
    }
    const clarityFromTelemetry = roundStarts.length ? (noEarlySupportCount / roundStarts.length) : null;
    const clarityFromSession = sessionSummary.rounds
      ? Math.max(0, 1 - (sessionSummary.hintRounds / Math.max(1, sessionSummary.rounds)))
      : null;
    const clarityRate = clarityFromTelemetry ?? clarityFromSession;
    const clarity = clarityRate === null
      ? metric('clarity', 'Clarity', null, '', 'Need more rounds to score first-90s independence.', false, 1.1)
      : metric(
          'clarity',
          'Clarity',
          pct(clarityRate),
          clarityRate >= 0.72 ? 'good' : (clarityRate >= 0.5 ? 'warn' : 'bad'),
          `No-support first 90s: ${pct(clarityRate)}%.`,
          true,
          1.1
        );

    const zpdRows = telemetryRows.filter((row) => Object.prototype.hasOwnProperty.call(row.payload || {}, 'zpd_in_band'));
    const zpdRate = zpdRows.length
      ? (zpdRows.filter((row) => Boolean(row.payload?.zpd_in_band)).length / zpdRows.length)
      : null;
    const probeSummary = getLatestProbePerformance(getActiveStudentLabel());
    const zpdFallbackRate = probeSummary && probeSummary.roundsDone > 0
      ? Math.max(0, Math.min(1, ((probeSummary.accuracyRate * 0.7) + ((1 - probeSummary.hintRate) * 0.3))))
      : null;
    const zpdEffectiveRate = zpdRate ?? zpdFallbackRate;
    const zpd = zpdEffectiveRate === null
      ? metric('zpd', 'ZPD Fit', null, '', 'Need telemetry or a completed probe to estimate fit.', false, 1.15)
      : metric(
          'zpd',
          'ZPD Fit',
          pct(zpdEffectiveRate),
          zpdEffectiveRate >= 0.78 ? 'good' : (zpdEffectiveRate >= 0.6 ? 'warn' : 'bad'),
          `In-band estimate: ${pct(zpdEffectiveRate)}%.`,
          true,
          1.15
        );

    const hubOpens = byEvent(['wq_teacher_hub_open']).sort((a, b) => a.timestamp - b.timestamp);
    const targetApplies = byEvent(['wq_target_apply']).sort((a, b) => a.timestamp - b.timestamp);
    const setupDurations = [];
    hubOpens.forEach((openRow) => {
      const nextApply = targetApplies.find((applyRow) => applyRow.timestamp >= openRow.timestamp);
      if (nextApply) setupDurations.push(durationSeconds(openRow.timestamp, nextApply.timestamp));
    });
    const setupMedian = setupDurations.length
      ? setupDurations.slice().sort((a, b) => a - b)[Math.floor(setupDurations.length / 2)]
      : null;
    const setupSpeed = setupMedian === null
      ? metric('setup', 'Setup Speed', null, '', 'Open Specialist Hub and apply a target to score setup speed.', false, 0.9)
      : metric(
          'setup',
          'Setup Speed',
          pct(Math.max(0, Math.min(1, 1 - (setupMedian / 180)))),
          setupMedian <= 45 ? 'good' : (setupMedian <= 90 ? 'warn' : 'bad'),
          `Median hub->target apply: ${Math.round(setupMedian)}s.`,
          true,
          0.9
        );

    const targetKeyOf = (row) => String(
      row?.payload?.lesson_target_id ||
      row?.payload?.target_id ||
      row?.payload?.lessonId ||
      ''
    ).trim();
    const roundCompletes = byEvent(['wq_round_complete']).sort((a, b) => a.timestamp - b.timestamp);
    let fidelityTotal = 0;
    let fidelityMatched = 0;
    if (targetApplies.length && roundCompletes.length) {
      roundCompletes.forEach((row) => {
        const priorApply = targetApplies
          .filter((applyRow) => applyRow.timestamp <= row.timestamp)
          .slice(-1)[0];
        const applyKey = targetKeyOf(priorApply);
        const roundKey = targetKeyOf(row);
        if (applyKey || roundKey) {
          fidelityTotal += 1;
          if (applyKey && roundKey && applyKey === roundKey) fidelityMatched += 1;
        }
      });
    }
    const fidelityRate = fidelityTotal > 0 ? (fidelityMatched / fidelityTotal) : null;
    const fidelity = fidelityRate === null
      ? metric('fidelity', 'Lesson Fidelity', null, '', 'Need target-apply and round-complete telemetry to score fidelity.', false, 1.05)
      : metric(
          'fidelity',
          'Lesson Fidelity',
          pct(fidelityRate),
          fidelityRate >= 0.85 ? 'good' : (fidelityRate >= 0.65 ? 'warn' : 'bad'),
          `Rounds aligned to active lesson target: ${pct(fidelityRate)}%.`,
          true,
          1.05
        );

    const missionStats = buildMissionSummaryStats({
      sessionOnly: true,
      student: getActiveStudentLabel() === 'Class' ? '' : getActiveStudentLabel()
    });
    const deepDiveRateTelemetry = (() => {
      const completes = byEvent(['wq_deep_dive_complete']);
      if (!completes.length) return null;
      const passed = completes.filter((row) => {
        const doneCount = Number(row.payload?.done_count || row.payload?.doneCount || 0);
        const completionRate = Number(row.payload?.completion_rate || row.payload?.completionRate || 0);
        return doneCount >= 3 || completionRate >= 0.75;
      }).length;
      return passed / completes.length;
    })();
    const deepDiveRate = deepDiveRateTelemetry ?? (missionStats.count ? missionStats.completionRate : null);
    const deepDive = deepDiveRate === null
      ? metric('deepdive', 'Deep Dive Completion', null, '', 'Complete at least one Deep Dive to score this KPI.', false, 0.95)
      : metric(
          'deepdive',
          'Deep Dive Completion',
          pct(deepDiveRate),
          deepDiveRate >= 0.7 ? 'good' : (deepDiveRate >= 0.5 ? 'warn' : 'bad'),
          `Completed at strong threshold: ${pct(deepDiveRate)}%.`,
          true,
          0.95
        );

    const errorRows = byEvent(['wq_error']);
    const blockerCount = errorRows.filter((row) => {
      const severity = String(row.payload?.severity || row.payload?.level || '').toLowerCase();
      return severity === 'blocker' || severity === 'critical' || severity === 'fatal';
    }).length;
    const sessionAnchors = byEvent(['wq_session_start', 'wq_teacher_hub_open']);
    const sessionCount = Math.max(1, sessionAnchors.length || (sessionSummary.rounds > 0 ? 1 : 0));
    const blockerRate = blockerCount / sessionCount;
    const reliabilityScore = Math.max(0, Math.min(1, 1 - blockerRate));
    const reliability = metric(
      'reliability',
      'Reliability',
      pct(reliabilityScore),
      blockerRate === 0 ? 'good' : (blockerRate <= 0.2 ? 'warn' : 'bad'),
      blockerCount ? `${blockerCount} blocker-level issue(s) detected in recent sessions.` : 'No blocker issues detected.',
      true,
      0.85
    );

    const metrics = [clarity, zpd, setupSpeed, fidelity, deepDive, reliability];
    const weighted = metrics
      .filter((item) => item.available && item.valuePct !== null)
      .reduce((acc, item) => {
        acc.value += item.valuePct * item.weight;
        acc.weight += item.weight;
        return acc;
      }, { value: 0, weight: 0 });
    const overallScore = weighted.weight > 0 ? Math.round(weighted.value / weighted.weight) : null;
    const overallTone = overallScore === null
      ? ''
      : (overallScore >= 80 ? 'good' : (overallScore >= 60 ? 'warn' : 'bad'));
    return { metrics, overallScore, overallTone };
  }

  function renderAdoptionHealthPanel() {
    const overallEl = el('session-adoption-overall');
    const noteEl = el('session-adoption-note');
    const clarityEl = el('session-adoption-clarity');
    const zpdEl = el('session-adoption-zpd');
    const setupEl = el('session-adoption-setup');
    const fidelityEl = el('session-adoption-fidelity');
    const deepDiveEl = el('session-adoption-deepdive');
    const reliabilityEl = el('session-adoption-reliability');
    const metricEls = { clarity: clarityEl, zpd: zpdEl, setup: setupEl, fidelity: fidelityEl, deepdive: deepDiveEl, reliability: reliabilityEl };
    if (!overallEl) return;

    const snapshot = buildAdoptionHealthMetrics();
    const availableCount = snapshot.metrics.filter((metricEntry) => metricEntry.available).length;
    const totalCount = snapshot.metrics.length;
    if (snapshot.overallScore === null) {
      overallEl.textContent = 'Overall: --';
      overallEl.setAttribute('title', 'Complete a few rounds/probes to unlock adoption scoring.');
      applyChipTone(overallEl, '');
    } else {
      overallEl.textContent = `Overall: ${snapshot.overallScore}/100`;
      overallEl.setAttribute('title', `Adoption health based on ${availableCount} of ${totalCount} KPIs.`);
      applyChipTone(overallEl, snapshot.overallTone);
    }

    snapshot.metrics.forEach((entry) => {
      const node = metricEls[entry.key];
      if (!node) return;
      node.textContent = entry.valuePct === null ? `${entry.label}: --` : `${entry.label}: ${entry.valuePct}%`;
      node.setAttribute('title', entry.detail || `${entry.label} score`);
      applyChipTone(node, entry.available ? entry.tone : '');
    });

    if (noteEl) {
      noteEl.textContent = `Data readiness: ${availableCount}/${totalCount} KPIs active (7-day local window).`;
    }
  }

  function renderTelemetryDashboards() {
    const adoptionEl = el('telemetry-dashboard-adoption');
    const learningEl = el('telemetry-dashboard-learning');
    const reliabilityEl = el('telemetry-dashboard-reliability');
    const noteEl = el('telemetry-dashboard-note');
    if (!adoptionEl || !learningEl || !reliabilityEl) return;

    const adoptionSnapshot = buildAdoptionHealthMetrics();
    const adoptionScore = adoptionSnapshot.overallScore;
    adoptionEl.textContent = adoptionScore === null ? 'Adoption: --' : `Adoption: ${adoptionScore}/100`;
    applyChipTone(adoptionEl, adoptionSnapshot.overallTone || '');

    const rows = loadTelemetryRows();
    const rounds = rows.filter((row) => row.event === 'wq_round_complete');
    const wins = rounds.filter((row) => Boolean(row.payload?.won)).length;
    const roundWinRate = rounds.length ? (wins / rounds.length) : null;
    const deepDive = rows.filter((row) => row.event === 'wq_funnel_deep_dive_completed' || row.event === 'wq_deep_dive_complete');
    const deepDiveCompletion = deepDive.length
      ? (deepDive.reduce((sum, row) => sum + Math.max(0, Math.min(1, Number(row.payload?.completion_rate || 0))), 0) / deepDive.length)
      : null;
    const learningScoreRaw = [roundWinRate, deepDiveCompletion].filter((value) => value !== null);
    const learningScore = learningScoreRaw.length
      ? Math.round((learningScoreRaw.reduce((sum, value) => sum + value, 0) / learningScoreRaw.length) * 100)
      : null;
    learningEl.textContent = learningScore === null ? 'Learning: --' : `Learning: ${learningScore}/100`;
    applyChipTone(learningEl, learningScore === null ? '' : (learningScore >= 80 ? 'good' : learningScore >= 60 ? 'warn' : 'bad'));

    const errorRows = rows.filter((row) => row.event === 'wq_error');
    const blockerCount = errorRows.filter((row) => {
      const severity = String(row.payload?.severity || row.payload?.level || '').toLowerCase();
      return severity === 'blocker' || severity === 'critical' || severity === 'fatal';
    }).length;
    const reliabilityScore = Math.max(0, 100 - (blockerCount * 20));
    reliabilityEl.textContent = `Reliability: ${reliabilityScore}/100`;
    applyChipTone(reliabilityEl, blockerCount === 0 ? 'good' : blockerCount <= 2 ? 'warn' : 'bad');

    if (noteEl) {
      noteEl.textContent = `Funnel events tracked: ${rows.filter((row) => row.event.startsWith('wq_funnel_')).length}.`;
    }
  }

  return {
    buildAdoptionHealthMetrics,
    formatSignedDelta,
    loadTelemetryRows,
    renderAdoptionHealthPanel,
    renderTelemetryDashboards
  };
}

window.createSessionAnalyticsModule = createSessionAnalyticsModule;
