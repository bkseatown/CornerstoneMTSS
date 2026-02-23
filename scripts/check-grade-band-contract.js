#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const WORDS_FILE = path.join(ROOT, 'data', 'words-inline.js');
const VALID_GRADE_BANDS = ['K-2', 'G3-5', 'G6-8', 'G9-12'];
const VALID_GRADE_SET = new Set(VALID_GRADE_BANDS);

// Current dataset baseline. Non-strict mode fails only when drift gets worse.
const MAX_INVALID_PLAYABLE_GRADE_BANDS = 891;

const GRADE_BAND_ALIASES = new Map([
  ['K2', 'K-2'],
  ['K-2', 'K-2'],
  ['G3-5', 'G3-5'],
  ['G6-8', 'G6-8'],
  ['G9-12', 'G9-12'],
  ['G11-12', 'G9-12'],
  ['G12+', 'G9-12']
]);

const strictMode = process.argv.includes('--strict');
let failures = 0;

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function normalizeGradeBand(rawGradeBand) {
  const raw = String(rawGradeBand || '').trim();
  if (!raw) return '';
  if (VALID_GRADE_SET.has(raw)) return raw;
  const key = raw.toUpperCase().replace(/\s+/g, '');
  return GRADE_BAND_ALIASES.get(key) || '';
}

function loadWords() {
  if (!fs.existsSync(WORDS_FILE)) {
    fail('Missing data/words-inline.js');
    return {};
  }
  const source = fs.readFileSync(WORDS_FILE, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'words-inline.js' });
  const data = sandbox.window?.WQ_WORD_DATA;
  if (!data || typeof data !== 'object') {
    fail('window.WQ_WORD_DATA is missing in data/words-inline.js');
    return {};
  }
  pass(`Loaded ${Object.keys(data).length} entries from data/words-inline.js.`);
  return data;
}

function analyze(wordData) {
  const gradeCounts = new Map(VALID_GRADE_BANDS.map((grade) => [grade, 0]));
  const aliasCount = new Map();
  const invalidCounts = new Map();

  let playableTotal = 0;
  let invalidPlayable = 0;

  for (const [id, entry] of Object.entries(wordData)) {
    const gameTag = String(entry?.game_tag || 'playable').trim() || 'playable';
    if (gameTag !== 'playable') continue;
    playableTotal += 1;
    const rawGrade = String(entry?.metadata?.grade_band || '').trim();
    const normalizedGrade = normalizeGradeBand(rawGrade);

    if (!normalizedGrade) {
      invalidPlayable += 1;
      const key = rawGrade || '<empty>';
      invalidCounts.set(key, (invalidCounts.get(key) || 0) + 1);
      continue;
    }

    gradeCounts.set(normalizedGrade, (gradeCounts.get(normalizedGrade) || 0) + 1);
    if (rawGrade && rawGrade !== normalizedGrade) {
      aliasCount.set(rawGrade, (aliasCount.get(rawGrade) || 0) + 1);
    }

    if (!id || typeof id !== 'string') {
      fail('Encountered an invalid word key while scanning playable entries.');
    }
  }

  pass(`Playable entries scanned: ${playableTotal}.`);
  VALID_GRADE_BANDS.forEach((grade) => {
    const count = gradeCounts.get(grade) || 0;
    if (!count) fail(`No playable entries found for ${grade}.`);
    else pass(`${grade} has ${count} playable entr${count === 1 ? 'y' : 'ies'}.`);
  });

  const allowedInvalid = strictMode ? 0 : MAX_INVALID_PLAYABLE_GRADE_BANDS;
  if (invalidPlayable > allowedInvalid) {
    fail(
      `Invalid playable grade-band entries = ${invalidPlayable}, allowed ${allowedInvalid}.` +
      (strictMode ? '' : ' Update data or baseline after intentional cleanup.')
    );
  } else {
    pass(
      `Invalid playable grade-band entries = ${invalidPlayable} (allowed ${allowedInvalid}${strictMode ? ', strict mode' : ', baseline guard'}).`
    );
  }

  if (aliasCount.size) {
    const topAliases = [...aliasCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([raw, count]) => `${raw} (${count})`)
      .join(', ');
    pass(`Alias-normalized grade labels detected: ${topAliases}.`);
  }

  if (invalidCounts.size) {
    const topInvalid = [...invalidCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([raw, count]) => `${raw} (${count})`)
      .join(', ');
    console.log(`INFO: Top invalid grade-band values: ${topInvalid}.`);
  }
}

function run() {
  const words = loadWords();
  if (failures) {
    console.error(`\nGrade-band contract check failed with ${failures} issue(s).`);
    process.exit(1);
  }

  analyze(words);

  if (failures) {
    console.error(`\nGrade-band contract check failed with ${failures} issue(s).`);
    process.exit(1);
  }
  console.log('\nGrade-band contract check passed.');
}

run();
