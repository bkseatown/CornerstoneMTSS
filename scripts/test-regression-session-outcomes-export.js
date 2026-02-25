#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const appSource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function requireText(source, pattern, message) {
  if (!pattern.test(source)) throw new Error(message);
}

requireText(
  indexHtml,
  /id="session-copy-outcomes-btn"[^>]*>Copy Session Outcomes</,
  'Session outcomes export button is missing.'
);

requireText(
  appSource,
  /function buildSessionOutcomesSummaryText\(\)/,
  'Session outcomes builder function is missing.'
);

requireText(
  appSource,
  /`Timestamp: \$\{generatedAt\}`/,
  'Session outcomes timestamp field regressed.'
);

requireText(
  appSource,
  /`Active focus: \$\{focusLabel\}`/,
  'Session outcomes active focus field regressed.'
);

requireText(
  appSource,
  /`Active preset: \$\{presetLabel\}`/,
  'Session outcomes active preset field regressed.'
);

requireText(
  appSource,
  /`Attempts: \$\{rounds\}`/,
  'Session outcomes attempts field regressed.'
);

requireText(
  appSource,
  /`Mastery trend: \$\{topSkill \?/,
  'Session outcomes mastery trend field regressed.'
);

requireText(
  appSource,
  /`Deep Dive completion: \$\{missionStats\.count \?/,
  'Session outcomes deep dive completion field regressed.'
);

console.log('regression check passed: session outcomes export');
