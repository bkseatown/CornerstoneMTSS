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

requireText(gameplayHtml, /id="new-game-btn"[\s\S]*>Next Word</, 'Primary CTA text should be "Next Word".');
requireText(gameplayHtml, /id="hint-clue-title"[^>]*>Sound Clue</, 'Hint card title microcopy regressed.');
requireText(gameplayHtml, /id="starter-word-title"[^>]*>Try a Starter Word</, 'Starter word title microcopy regressed.');
requireText(gameplayHtml, /id="modal-challenge-launch-helper"[^>]*>Optional after each solved word\. Complete 3 quick steps\.</, 'Deep Dive helper microcopy regressed.');
requireText(appSource, /'Tap Next Word to start\. Make your first guess when ready\.'/, 'Next action prompt microcopy regressed.');
requireText(appSource, /'Start with any test word\. Then use tile colors to guide the next guess\.'/, 'Guided first-guess microcopy regressed.');
requireText(appSource, /'Voice practice is required before moving on\.'/, 'Voice practice microcopy regressed.');

console.log('regression check passed: student microcopy');
