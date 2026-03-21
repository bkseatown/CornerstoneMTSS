/**
 * app-session-exports.js
 * Session summary, curriculum handout, MTSS note, and CSV export helpers.
 */

function createSessionExportsModule(deps) {
  const {
    buildMissionSummaryStats = () => ({ count: 0, avgScore: 0, strongRate: 0, completionRate: 0, completedCount: 0, onTimeRate: 0, topLevelLabel: '--' }),
    buildProbeSummary = () => ({}),
    buildProbeSummaryText = () => 'No weekly probe results yet.',
    copyTextToClipboard = async () => {},
    defaultPrefs = {},
    deepDiveBuilders = null,
    documentRef = document,
    downloadTextFile = () => false,
    formatGradeBandLabel = (value) => String(value || ''),
    formatLengthPrefLabel = (value) => String(value || ''),
    formatSignedDelta = (value) => String(value),
    formatDurationLabel = () => '0s',
    getActiveStudentLabel = () => 'Class',
    getAssignedPlaylistForStudent = () => null,
    getComparableProbeTrend = () => ({ current: null, previous: null }),
    getCurriculumSnapshot = () => ({}),
    getCurriculumSelectionLabel = () => '',
    getFocusLabel = () => '',
    getGoalEval = () => ({ statusLabel: 'Not set', progressLabel: 'Set accuracy + guesses target.', goal: null }),
    getLatestProbeSourceForStudent = () => null,
    deriveMiniLessonKey = () => 'context_strategy',
    getMissionLabRecords = () => [],
    getProbeRecencyMeta = () => ({ label: 'Probe Recency: No baseline' }),
    getSupportFlagMeta = () => ({ label: 'Support Flag: Collect baseline' }),
    getTopMasteryEntry = () => null,
    getVisibleMasteryRows = () => ({ rows: [], allRows: [], sortMode: 'attempts_desc', filterMode: 'all' }),
    getWQData = () => null,
    normalizeLessonPackId = (value) => value,
    normalizeLessonTargetId = (_pack, value) => value,
    sessionSummary = {},
    shouldExpandGradeBandForFocus = () => false,
    showToast = () => {},
    supportMeta = null,
    WQData = null
  } = deps || {};

  function resolveSupportMetaValue(value) {
    return typeof value === 'function' ? value() : value;
  }

  function csvEscapeCell(value) {
    const text = String(value ?? '');
    if (!/[",\n]/.test(text)) return text;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function sanitizeFilenameToken(value, fallback = 'class') {
    const normalized = String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return normalized || fallback;
  }

  function buildCsvBundlePrefix() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const student = sanitizeFilenameToken(getActiveStudentLabel(), 'class');
    return `word-quest-${student}-${year}${month}${day}-${hour}${minute}`;
  }

  function pickSamplePracticeWords(limit = 8) {
    const snapshot = getCurriculumSnapshot();
    const focus = snapshot.focus || 'all';
    const gradeBand = snapshot.effectiveGrade || snapshot.selectedGrade || defaultPrefs.grade;
    const length = snapshot.length || defaultPrefs.length;
    const data = WQData || getWQData();
    const pool = data?.getPlayableWords?.({
      gradeBand,
      length,
      phonics: focus,
      includeLowerBands: shouldExpandGradeBandForFocus(focus)
    });
    if (!Array.isArray(pool) || !pool.length) return [];
    const copy = [...pool];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.max(1, Math.min(12, limit)));
  }

  function buildMtssIepNoteText() {
    const student = getActiveStudentLabel();
    const now = new Date();
    const topErrorLabel = supportMeta?.getTopErrorLabel?.(sessionSummary.errorTotals) || '--';
    const nextStep = supportMeta?.getInstructionalNextStep?.(sessionSummary.errorTotals) || 'Continue current lesson target.';
    const assignedPlaylist = getAssignedPlaylistForStudent(student);
    const trend = getComparableProbeTrend(student);
    const recency = getProbeRecencyMeta(student);
    const support = getSupportFlagMeta(student);
    const goalEval = getGoalEval(student);
    const goal = goalEval.goal;
    const goalStatusText = `Goal: ${goalEval.statusLabel}`;
    const goalProgressText = `Goal Progress: ${goalEval.progressLabel}`;
    const currentProbe = trend.current;
    const previousProbe = trend.previous;
    const trendLine = (!currentProbe || !previousProbe || currentProbe.roundsDone <= 0 || previousProbe.roundsDone <= 0)
      ? 'Probe trend: baseline in progress (need two probe points for delta).'
      : `Probe trend: accuracy ${formatSignedDelta((currentProbe.accuracyRate - previousProbe.accuracyRate) * 100)} pts, avg guesses ${formatSignedDelta(currentProbe.avgGuesses - previousProbe.avgGuesses)}, avg time ${formatSignedDelta(currentProbe.avgTimeSeconds - previousProbe.avgTimeSeconds)}s versus prior probe.`;
    const sessionWinRate = sessionSummary.rounds ? `${Math.round((sessionSummary.wins / sessionSummary.rounds) * 100)}%` : '--';
    const sessionAvgGuesses = sessionSummary.rounds ? (sessionSummary.totalGuesses / sessionSummary.rounds).toFixed(1) : '--';
    const sessionAvgTime = sessionSummary.rounds ? (formatDurationLabel(sessionSummary.totalDurationMs / sessionSummary.rounds) || '0s') : '--';

    return [
      'WordQuest MTSS/IEP Progress Note',
      `Student: ${student}`,
      `Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      `Curriculum: ${getCurriculumSelectionLabel()}`,
      assignedPlaylist ? `Assigned Playlist: ${assignedPlaylist.name}` : 'Assigned Playlist: --',
      '',
      'Session Snapshot',
      `Rounds: ${sessionSummary.rounds} | Win Rate: ${sessionWinRate} | Avg Guesses: ${sessionAvgGuesses} | Avg Time: ${sessionAvgTime}`,
      `Hint Rounds: ${sessionSummary.hintRounds} | Voice Attempts: ${sessionSummary.voiceAttempts}`,
      `Top Error Pattern: ${topErrorLabel}`,
      `Instructional Next Step: ${nextStep}`,
      '',
      'Weekly Probe Snapshot',
      buildProbeSummaryText(),
      recency.label,
      support.label,
      trendLine,
      '',
      'Student Goal',
      goal ? `Targets: accuracy >= ${goal.accuracyTarget}% and avg guesses <= ${goal.avgGuessesTarget}.` : 'Targets: no active goal set for this student.',
      `${goalStatusText} | ${goalProgressText}`,
      '',
      'Teacher Interpretation',
      `Use the next block for targeted reteach: ${nextStep}`
    ].join('\n');
  }

  function buildFamilyHandoutText() {
    const snapshot = getCurriculumSnapshot();
    const student = getActiveStudentLabel();
    const assignedPlaylist = getAssignedPlaylistForStudent(student);
    const focusLabel = getFocusLabel(snapshot.focus || 'all').replace(/[—]/g, '').replace(/\s+/g, ' ').trim() || 'Classic';
    const words = pickSamplePracticeWords(8);
    const wordLines = words.length
      ? words.map((word, index) => `${index + 1}. ${String(word || '').toUpperCase()}`).join('\n')
      : 'No words available for the current filters. Adjust lesson target or grade band.';
    return [
      'WordQuest Family Practice Handout',
      `Student: ${student}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Curriculum Target: ${getCurriculumSelectionLabel()}`,
      assignedPlaylist ? `Assigned Playlist: ${assignedPlaylist.name}` : 'Assigned Playlist: --',
      `Quest Focus: ${focusLabel}`,
      `Grade Band: ${formatGradeBandLabel(snapshot.effectiveGrade || snapshot.selectedGrade)}`,
      `Word Length: ${formatLengthPrefLabel(snapshot.length)}`,
      '',
      'At-Home Routine (10 minutes)',
      '1. Read each word out loud.',
      '2. Tap or stretch sounds/chunks.',
      '3. Spell the word once from memory.',
      '4. Use two words in oral sentences.',
      '',
      'Practice Word List',
      wordLines,
      '',
      'Family Tip: Keep practice positive and short. Accuracy first, speed second.'
    ].join('\n');
  }

  function getMiniLessonKeyFromSession() {
    return deriveMiniLessonKey();
  }

  function renderMiniLessonPanel() {
    const key = getMiniLessonKeyFromSession();
    const textEl = documentRef.getElementById('session-mini-lesson-copy');
    if (!textEl) return;
    const validPlans = resolveSupportMetaValue(supportMeta?.errorMiniLessonPlans) || {};
    const patternLabels = resolveSupportMetaValue(supportMeta?.errorPatternLabels) || {};
    const planText = supportMeta?.buildMiniLessonPlanText?.(key, {
      validPlans
    }) || '';
    textEl.textContent = planText;
    textEl.setAttribute('title', `Current quick mini-lesson: ${patternLabels[key] || key}`);
  }

  function buildSessionSummaryText() {
    const startedAt = new Date(sessionSummary.startedAt || Date.now());
    const activeStudent = getActiveStudentLabel();
    const winRate = sessionSummary.rounds ? `${Math.round((sessionSummary.wins / sessionSummary.rounds) * 100)}%` : '--';
    const avgGuesses = sessionSummary.rounds ? (sessionSummary.totalGuesses / sessionSummary.rounds).toFixed(1) : '--';
    const avgTime = sessionSummary.rounds ? (formatDurationLabel(sessionSummary.totalDurationMs / sessionSummary.rounds) || '0s') : '--';
    const missionStats = buildMissionSummaryStats({
      sessionOnly: true,
      student: activeStudent === 'Class' ? '' : activeStudent
    });
    return [
      'WordQuest Session Summary',
      `Student: ${activeStudent}`,
      `Started: ${startedAt.toLocaleString()}`,
      `Rounds: ${sessionSummary.rounds}`,
      `Wins: ${sessionSummary.wins}`,
      `Win Rate: ${winRate}`,
      `Hint Rounds: ${sessionSummary.hintRounds}`,
      `Voice Attempts: ${sessionSummary.voiceAttempts}`,
      `Avg Guesses: ${avgGuesses}`,
      `Avg Time: ${avgTime}`,
      `Top Error Pattern: ${supportMeta?.getTopErrorLabel?.(sessionSummary.errorTotals) || '--'}`,
      `Next Instructional Step: ${supportMeta?.getInstructionalNextStep?.(sessionSummary.errorTotals) || 'Continue current lesson target.'}`,
      `Deep Dive Rounds: ${missionStats.count}`,
      `Deep Dive Avg Score: ${missionStats.count ? `${Math.round(missionStats.avgScore)}/100` : '--'}`,
      `Deep Dive Strong+ Rate: ${missionStats.count ? `${Math.round(missionStats.strongRate * 100)}%` : '--'}`,
      `Deep Dive Completion: ${missionStats.count ? `${Math.round(missionStats.completionRate * 100)}%` : '--'}`,
      `Deep Dive On-time: ${missionStats.completedCount ? `${Math.round(missionStats.onTimeRate * 100)}%` : '--'}`,
      `Deep Dive Top Level: ${missionStats.topLevelLabel}`
    ].join('\n');
  }

  function buildSessionOutcomesSummaryText() {
    const rounds = Math.max(0, Number(sessionSummary.rounds) || 0);
    const masteryState = getVisibleMasteryRows();
    const masteryRows = Array.isArray(masteryState?.allRows) ? masteryState.allRows : [];
    const topSkill = masteryRows[0] || null;
    const generatedAt = new Date().toLocaleString();
    const focusValue = String(documentRef.getElementById('setting-focus')?.value || deps.prefs?.focus || defaultPrefs.focus || 'all').trim() || 'all';
    const focusLabel = getFocusLabel(focusValue).replace(/[—]/g, '').replace(/\s+/g, ' ').trim() || 'Classic';
    const presetId = deps.detectTeacherPreset?.() || '';
    const presetBtn = presetId ? documentRef.querySelector(`[data-teacher-preset="${presetId}"]`) : null;
    const presetLabel = presetBtn instanceof HTMLElement
      ? String(presetBtn.textContent || '').replace(/\s+/g, ' ').trim()
      : 'Custom';
    const missionStats = buildMissionSummaryStats({
      sessionOnly: true,
      student: getActiveStudentLabel() === 'Class' ? '' : getActiveStudentLabel()
    });
    const trend = getComparableProbeTrend(getActiveStudentLabel());
    const hasTrend = Boolean(trend.current && trend.previous && trend.current.roundsDone > 0 && trend.previous.roundsDone > 0);
    const trendLabel = hasTrend
      ? `Accuracy ${formatSignedDelta((trend.current.accuracyRate - trend.previous.accuracyRate) * 100, 0)} pts, Avg guesses ${formatSignedDelta(trend.current.avgGuesses - trend.previous.avgGuesses)}`
      : 'Not enough probe trend data yet.';
    const startedAt = new Date(sessionSummary.startedAt || Date.now()).toLocaleString();
    return [
      `Session outcomes (${startedAt})`,
      `Timestamp: ${generatedAt}`,
      `Active focus: ${focusLabel}`,
      `Active preset: ${presetLabel}`,
      `Attempts: ${rounds}`,
      `Mastery trend: ${topSkill ? `${topSkill.label} at ${topSkill.accuracyLabel} across ${topSkill.attempts} attempts` : 'No mastery rows yet.'}`,
      `Probe trend: ${trendLabel}`,
      `Deep Dive completion: ${missionStats.count ? `${Math.round(missionStats.completionRate * 100)}% (${missionStats.completedCount}/${missionStats.count})` : '--'}`
    ].join('\n');
  }

  function buildSessionSummaryCsvText() {
    const rounds = Math.max(0, Number(sessionSummary.rounds) || 0);
    const avgGuesses = rounds ? (sessionSummary.totalGuesses / rounds).toFixed(1) : '--';
    const avgTimeSeconds = rounds ? Number(((sessionSummary.totalDurationMs / rounds) / 1000).toFixed(1)) : 0;
    const winRate = rounds ? `${Math.round((sessionSummary.wins / rounds) * 100)}%` : '--';
    const topSkill = getTopMasteryEntry();
    const activeStudent = getActiveStudentLabel();
    const missionStats = buildMissionSummaryStats({
      sessionOnly: true,
      student: activeStudent === 'Class' ? '' : activeStudent
    });
    const lines = [[
      'Student','Generated','Started','Rounds','Wins','Win Rate','Hint Rounds','Voice Attempts','Avg Guesses','Avg Time (s)','Top Error Pattern','Next Instructional Step','Top Skill','Top Skill Accuracy','Deep Dive Rounds','Deep Dive Avg Score','Deep Dive Strong+','Deep Dive Completion','Deep Dive On-Time','Deep Dive Top Level'
    ], [
      activeStudent,
      new Date().toLocaleString(),
      new Date(sessionSummary.startedAt || Date.now()).toLocaleString(),
      String(rounds),
      String(Math.max(0, Number(sessionSummary.wins) || 0)),
      winRate,
      String(Math.max(0, Number(sessionSummary.hintRounds) || 0)),
      String(Math.max(0, Number(sessionSummary.voiceAttempts) || 0)),
      avgGuesses,
      String(avgTimeSeconds),
      supportMeta?.getTopErrorLabel?.(sessionSummary.errorTotals) || '--',
      supportMeta?.getInstructionalNextStep?.(sessionSummary.errorTotals) || 'Continue current lesson target.',
      topSkill?.label || '--',
      topSkill?.accuracyLabel || '--',
      String(missionStats.count),
      missionStats.count ? `${Math.round(missionStats.avgScore)}/100` : '--',
      missionStats.count ? `${Math.round(missionStats.strongRate * 100)}%` : '--',
      missionStats.count ? `${Math.round(missionStats.completionRate * 100)}%` : '--',
      missionStats.completedCount ? `${Math.round(missionStats.onTimeRate * 100)}%` : '--',
      missionStats.topLevelLabel
    ]];
    return lines.map((line) => line.map(csvEscapeCell).join(',')).join('\n');
  }

  function buildMasteryReportText() {
    const { rows, allRows, sortMode, filterMode } = getVisibleMasteryRows();
    const header = [
      'WordQuest Mastery Report',
      `Student: ${getActiveStudentLabel()}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Session rounds: ${sessionSummary.rounds}`,
      `Filter: ${deps.describeMasteryFilterMode?.(filterMode) || filterMode}`,
      `Sort: ${deps.describeMasterySortMode?.(sortMode) || sortMode}`,
      `Next Instructional Step: ${supportMeta?.getInstructionalNextStep?.(sessionSummary.errorTotals) || 'Continue current lesson target.'}`
    ];
    if (!allRows.length) return [...header, 'No skill rows yet.'].join('\n');
    if (!rows.length) return [...header, 'No skill rows match the current filter.'].join('\n');
    const lines = rows.map((row) => `${row.label}: accuracy ${row.accuracyLabel} | attempts ${row.attempts} | hints ${row.hintRounds} (${row.hintRateLabel}) | voice attempts ${row.voiceAttempts} | avg guesses ${row.avgGuessesLabel} | avg time ${row.avgTimeLabel} | top error ${row.topErrorLabel}`);
    return [...header, '', ...lines].join('\n');
  }

  function buildMasteryReportCsvText() {
    const { rows, allRows, sortMode, filterMode } = getVisibleMasteryRows();
    const generated = new Date().toLocaleString();
    const student = getActiveStudentLabel();
    const lines = [[
      'Student','Generated','Filter','Sort','Skill','Accuracy','Attempts','Wins','Hint Rounds','Hint Rate','Voice Attempts','Avg Guesses','Avg Time (s)','Top Error','Session Next Step'
    ]];
    const filterLabel = deps.describeMasteryFilterMode?.(filterMode) || filterMode;
    const sortLabel = deps.describeMasterySortMode?.(sortMode) || sortMode;
    const nextStep = supportMeta?.getInstructionalNextStep?.(sessionSummary.errorTotals) || 'Continue current lesson target.';
    if (!allRows.length) {
      lines.push([student, generated, filterLabel, sortLabel, 'No skill rows yet.', '', '', '', '', '', '', '', '', '', nextStep]);
    } else if (!rows.length) {
      lines.push([student, generated, filterLabel, sortLabel, 'No skill rows match current filter.', '', '', '', '', '', '', '', '', '', nextStep]);
    } else {
      rows.forEach((row) => {
        lines.push([student, generated, filterLabel, sortLabel, row.label, row.accuracyLabel, String(row.attempts), String(row.wins), String(row.hintRounds), row.hintRateLabel, String(row.voiceAttempts), row.avgGuessesLabel, String(row.avgTimeSeconds), row.topErrorLabel, nextStep]);
      });
    }
    return lines.map((line) => line.map(csvEscapeCell).join(',')).join('\n');
  }

  function buildProbeSummaryCsvText() {
    const lines = [[
      'Student','Focus','Grade','Status','Started','Completed','Rounds Done','Rounds Target','Accuracy','Avg Guesses','Avg Time (s)','Hint Rate'
    ]];
    const records = [];
    const probeState = deps.getProbeState?.() || {};
    const probeHistory = deps.getProbeHistory?.() || [];
    if (probeState.active) records.push({ ...probeState, completedAt: 0, status: 'Active' });
    probeHistory.forEach((record) => records.push({ ...record, status: 'Completed' }));
    if (!records.length) {
      lines.push(['Class', '', '', 'No probe records yet', '', '', '', '', '', '', '', '']);
      return lines.map((line) => line.map(csvEscapeCell).join(',')).join('\n');
    }
    records.forEach((record) => {
      const summary = buildProbeSummary(record);
      const started = new Date(record.startedAt || Date.now()).toLocaleString();
      const completed = record.completedAt ? new Date(record.completedAt).toLocaleString() : '';
      lines.push([
        String(record.student || 'Class'),
        String(record.focusLabel || 'Mixed'),
        String(record.gradeLabel || 'All'),
        String(record.status || 'Completed'),
        started,
        completed,
        String(Math.max(0, Number(record.roundsDone) || 0)),
        String(Math.max(0, Number(record.roundsTarget) || 0)),
        summary.accuracy,
        summary.avgGuesses,
        String(Math.max(0, Number(record.roundsDone) || 0) ? Number(((Math.max(0, Number(record.totalDurationMs) || 0) / Math.max(1, Number(record.roundsDone) || 1)) / 1000).toFixed(1)) : 0),
        summary.hintRate
      ]);
    });
    return lines.map((line) => line.map(csvEscapeCell).join(',')).join('\n');
  }

  function buildClassRollupCsvText() {
    const students = new Set();
    (deps.getRosterStudents?.() || []).forEach((name) => {
      const normalized = String(name || '').trim();
      if (normalized) students.add(normalized);
    });
    (deps.getProbeHistory?.() || []).forEach((record) => {
      const normalized = String(record?.student || '').trim() || 'Class';
      students.add(normalized);
    });
    const probeState = deps.getProbeState?.() || {};
    if (probeState.active) students.add(String(probeState.student || '').trim() || 'Class');
    if (!students.size) students.add('Class');

    const lines = [[
      'Student','Probe Status','Probe Date','Probe Recency','Accuracy','Avg Guesses','Avg Time (s)','Hint Rate','Support Flag','Accuracy Delta (pts)','Guess Delta','Time Delta (s)','Goal Accuracy Target','Goal Avg Guesses Target','Goal Status','Goal Progress'
    ]];

    Array.from(students).sort((a, b) => a.localeCompare(b)).forEach((student) => {
      const source = getLatestProbeSourceForStudent(student);
      const summary = buildProbeSummary(source || {});
      const trend = getComparableProbeTrend(student);
      const goalEval = getGoalEval(student);
      const goal = goalEval.goal;
      const recency = getProbeRecencyMeta(student);
      const support = getSupportFlagMeta(student);
      const hasTrend = Boolean(trend.current && trend.previous && trend.current.roundsDone > 0 && trend.previous.roundsDone > 0);
      const accuracyDelta = hasTrend ? formatSignedDelta((trend.current.accuracyRate - trend.previous.accuracyRate) * 100) : '--';
      const guessesDelta = hasTrend ? formatSignedDelta(trend.current.avgGuesses - trend.previous.avgGuesses) : '--';
      const timeDelta = hasTrend ? formatSignedDelta(trend.current.avgTimeSeconds - trend.previous.avgTimeSeconds) : '--';
      const probeDate = source ? new Date(source.completedAt || source.startedAt || Date.now()).toLocaleDateString() : '';
      const probeStatus = source ? ((probeState.active && deps.matchesProbeRecordStudent?.(probeState.student, student)) ? 'Active' : 'Recent') : 'No probe data';
      const avgTimeSeconds = source && Math.max(0, Number(source.roundsDone) || 0) > 0 ? Number(((Math.max(0, Number(source.totalDurationMs) || 0) / Math.max(1, Number(source.roundsDone) || 1)) / 1000).toFixed(1)) : 0;
      lines.push([
        student, probeStatus, probeDate, recency.label.replace(/^Probe Recency:\s*/, ''), summary.accuracy, summary.avgGuesses, String(avgTimeSeconds), summary.hintRate, support.label.replace(/^Support Flag:\s*/, ''), accuracyDelta, guessesDelta, timeDelta, goal ? String(goal.accuracyTarget) : '', goal ? String(goal.avgGuessesTarget) : '', goalEval.statusLabel, goalEval.progressLabel
      ]);
    });
    return lines.map((line) => line.map(csvEscapeCell).join(',')).join('\n');
  }

  function buildMissionSummaryText() {
    const activeStudent = getActiveStudentLabel();
    const stats = buildMissionSummaryStats({ sessionOnly: true, student: activeStudent === 'Class' ? '' : activeStudent });
    const recent = stats.records?.[0] || null;
    const lines = [
      'WordQuest Deep Dive Summary',
      `Student: ${activeStudent}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Session started: ${new Date(sessionSummary.startedAt || Date.now()).toLocaleString()}`,
      `Deep Dive rounds: ${stats.count}`,
      `Deep Dive average score: ${stats.count ? `${Math.round(stats.avgScore)}/100` : '--'}`,
      `Strong+ rounds: ${stats.count ? `${Math.round(stats.strongRate * 100)}%` : '--'}`,
      `Deep Dive completion: ${stats.count ? `${Math.round(stats.completionRate * 100)}%` : '--'}`,
      `Average attempts per station: ${stats.count ? stats.avgAttemptsPerStation.toFixed(1) : '--'}`,
      `On-time finishes: ${stats.completedCount ? `${Math.round(stats.onTimeRate * 100)}%` : '--'}`,
      `Most-used thinking level: ${stats.topLevelLabel}`
    ];
    if (recent) {
      lines.push('', 'Most recent Deep Dive', `${new Date(recent.ts).toLocaleString()} · ${recent.word || '--'} · ${recent.topic || '--'} · Grade ${recent.grade || '--'} · Student ${recent.student || 'Class'}`, `Level: ${deepDiveBuilders?.getChallengeLevelDisplay?.(recent.level) || recent.level} · Score: ${recent.score}/100 (${recent.scoreBand}) · On time: ${recent.onTime ? 'yes' : 'no'}`);
    }
    return lines.join('\n');
  }

  function buildMissionLabCsvText() {
    const records = getMissionLabRecords({ newestFirst: false });
    const lines = [[
      'Timestamp','Deep Dive ID','Source','Student','Word','Topic','Grade','Thinking Level','Score Band','Deep Dive Score','Clarity','Evidence','Vocabulary','Completed','On Time','Seconds Left','Listen Complete','Analyze Complete','Create Complete','Analyze Response','Create Response'
    ]];
    if (!records.length) {
      lines.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'No Deep Dive records yet.', '']);
      return lines.map((line) => line.map(csvEscapeCell).join(',')).join('\n');
    }
    records.forEach((record) => {
      const tasks = record?.tasks || {};
      lines.push([
        new Date(Number(record?.ts) || Date.now()).toLocaleString(),
        String(record?.attemptId || ''), String(record?.source || ''), String(record?.student || ''), String(record?.word || ''), String(record?.topic || ''), String(record?.grade || ''), String(record?.level || ''), String(record?.scoreBand || ''), String(Math.max(0, Number(record?.score) || 0)), String(Math.max(0, Number(record?.clarity) || 0)), String(Math.max(0, Number(record?.evidence) || 0)), String(Math.max(0, Number(record?.vocabulary) || 0)), record?.completed ? 'yes' : 'no', record?.onTime ? 'yes' : 'no', String(Math.max(0, Number(record?.secondsLeft) || 0)), tasks.listen ? 'yes' : 'no', tasks.analyze ? 'yes' : 'no', tasks.create ? 'yes' : 'no', String(record?.analyze || ''), String(record?.create || '')
      ]);
    });
    return lines.map((line) => line.map(csvEscapeCell).join(',')).join('\n');
  }

  function downloadCsvBundle() {
    const prefix = buildCsvBundlePrefix();
    const files = [
      { name: `${prefix}-session-summary.csv`, content: buildSessionSummaryCsvText() },
      { name: `${prefix}-mastery.csv`, content: buildMasteryReportCsvText() },
      { name: `${prefix}-probe.csv`, content: buildProbeSummaryCsvText() },
      { name: `${prefix}-class-rollup.csv`, content: buildClassRollupCsvText() },
      { name: `${prefix}-deep-dive.csv`, content: buildMissionLabCsvText() }
    ];
    const started = files.reduce((count, file) => count + (downloadTextFile(file.name, file.content, 'text/csv;charset=utf-8') ? 1 : 0), 0);
    if (started === files.length) {
      showToast(`CSV bundle download started (${files.length} files).`);
      return;
    }
    if (started > 0) {
      showToast(`CSV bundle partially downloaded (${started}/${files.length}).`);
      return;
    }
    showToast('Could not start CSV bundle download on this device.');
  }

  async function copySessionSummary() {
    await copyTextToClipboard(buildSessionSummaryText(), 'Session summary copied.', 'Could not copy summary on this device.');
  }

  async function copySessionOutcomesSummary() {
    await copyTextToClipboard(
      buildSessionOutcomesSummaryText(),
      'Session outcomes copied.',
      'Could not copy session outcomes on this device.'
    );
  }

  async function copyMiniLessonPlan() {
    const key = getMiniLessonKeyFromSession();
    const validPlans = resolveSupportMetaValue(supportMeta?.errorMiniLessonPlans) || {};
    await copyTextToClipboard(
      supportMeta?.buildMiniLessonPlanText?.(key, {
        validPlans
      }) || '',
      'Mini-lesson plan copied.',
      'Could not copy mini-lesson plan on this device.'
    );
  }

  async function copyMasterySummary() {
    await copyTextToClipboard(buildMasteryReportText(), 'Mastery report copied.', 'Could not copy mastery report on this device.');
  }

  async function copyMasterySummaryCsv() {
    await copyTextToClipboard(buildMasteryReportCsvText(), 'Mastery CSV copied.', 'Could not copy mastery CSV on this device.');
  }

  async function copyMissionSummary() {
    await copyTextToClipboard(buildMissionSummaryText(), 'Deep Dive summary copied.', 'Could not copy Deep Dive summary on this device.');
  }

  async function copyMissionSummaryCsv() {
    await copyTextToClipboard(buildMissionLabCsvText(), 'Deep Dive CSV copied.', 'Could not copy Deep Dive CSV on this device.');
  }

  async function copyProbeSummary() {
    await copyTextToClipboard(buildProbeSummaryText(), 'Probe summary copied.', 'Could not copy probe summary on this device.');
  }

  async function copyProbeSummaryCsv() {
    await copyTextToClipboard(buildProbeSummaryCsvText(), 'Probe CSV copied.', 'Could not copy probe CSV on this device.');
  }

  async function copyMtssIepNote() {
    await copyTextToClipboard(buildMtssIepNoteText(), 'MTSS/IEP note copied.', 'Could not copy MTSS/IEP note on this device.');
  }

  async function copyFamilyHandout() {
    await copyTextToClipboard(buildFamilyHandoutText(), 'Family handout copied.', 'Could not copy family handout on this device.');
  }

  function downloadClassRollupCsv() {
    const prefix = buildCsvBundlePrefix();
    const filename = `${prefix}-class-rollup.csv`;
    if (downloadTextFile(filename, buildClassRollupCsvText(), 'text/csv;charset=utf-8')) {
      showToast('Class rollup CSV download started.');
      return true;
    }
    showToast('Could not start class rollup download on this device.');
    return false;
  }

  function downloadFamilyHandout() {
    const prefix = buildCsvBundlePrefix();
    const filename = `${prefix}-family-handout.txt`;
    if (downloadTextFile(filename, buildFamilyHandoutText(), 'text/plain;charset=utf-8')) {
      showToast('Family handout download started.');
      return;
    }
    showToast('Could not start family handout download on this device.');
  }

  return {
    buildClassRollupCsvText,
    buildCsvBundlePrefix,
    buildCurriculumSelectionLabel: getCurriculumSelectionLabel,
    buildFamilyHandoutText,
    buildMasteryReportCsvText,
    buildMasteryReportText,
    buildMissionLabCsvText,
    buildMissionSummaryText,
    buildMtssIepNoteText,
    buildProbeSummaryCsvText,
    buildSessionOutcomesSummaryText,
    buildSessionSummaryCsvText,
    buildSessionSummaryText,
    copyMiniLessonPlan,
    copyFamilyHandout,
    copyMasterySummary,
    copyMasterySummaryCsv,
    copyMissionSummary,
    copyMissionSummaryCsv,
    copyMtssIepNote,
    copyProbeSummary,
    copyProbeSummaryCsv,
    copySessionOutcomesSummary,
    copySessionSummary,
    downloadClassRollupCsv,
    downloadTextFile,
    downloadCsvBundle,
    downloadFamilyHandout,
    getMiniLessonKeyFromSession,
    pickSamplePracticeWords,
    renderMiniLessonPanel
  };
}

window.createSessionExportsModule = createSessionExportsModule;
