#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const gameplayHtmlPath = fs.existsSync(path.join(root, 'cornerstone-mtss.html'))
  ? path.join(root, 'cornerstone-mtss.html')
  : path.join(root, 'word-quest.html');
const gameplayHtml = fs.readFileSync(gameplayHtmlPath, 'utf8');
const appSource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');

function requireText(source, pattern, message) {
  if (!pattern.test(source)) throw new Error(message);
}

requireText(
  gameplayHtml,
  /id="focus-inline-search"[\s\S]*placeholder="Select your quest or track"/,
  'Focus search placeholder text changed unexpectedly in gameplay HTML.'
);
requireText(
  appSource,
  /inputEl\.placeholder = 'Select your quest or track';/,
  'Focus search placeholder reset is missing in updateFocusSummaryLabel.'
);
requireText(
  appSource,
  /inputEl\.setAttribute\('aria-label', `Select your quest or track\. Current selection: \$\{currentLabel\}`\);/,
  'Focus search aria-label microcopy contract is missing.'
);

console.log('regression check passed: focus search placeholder');
