#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const themeNavSource = fs.readFileSync(path.join(root, 'js/theme-nav.js'), 'utf8');

function requireText(source, pattern, message) {
  if (!pattern.test(source)) throw new Error(message);
}

requireText(indexHtml, /id="teacher-panel-btn"/, 'Teacher panel trigger button is missing from index.html.');
requireText(indexHtml, /id="teacher-panel"/, 'Teacher panel container is missing from index.html.');

requireText(
  themeNavSource,
  /window\.addEventListener\(OPEN_TEACHER_HUB_EVENT,\s*openTeacherPanel\)/,
  'Theme nav does not listen for the shared open-teacher-hub event.'
);
requireText(
  themeNavSource,
  /window\.dispatchEvent\(new CustomEvent\(TEACHER_PANEL_TOGGLE_EVENT,\s*\{ detail: \{ open: true \} \}\)\)/,
  'Theme nav no longer dispatches teacher panel open events.'
);

requireText(
  appSource,
  /window\.addEventListener\(openTeacherHubEvent,\s*\(\)\s*=>\s*\{\s*_el\('teacher-panel-btn'\)\?\.click\(\);/m,
  'App no longer routes open-teacher-hub events to teacher panel button click.'
);
requireText(
  appSource,
  /window\.dispatchEvent\(new CustomEvent\(openTeacherHubEvent\)\)/,
  'App no longer emits shared open-teacher-hub event.'
);

console.log('browser smoke check passed: teacher hub open contract');
