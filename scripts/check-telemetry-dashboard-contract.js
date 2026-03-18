#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const appPath = path.join(root, 'js', 'app.js');
const source = fs.readFileSync(appPath, 'utf8');

function requirePattern(pattern, message) {
  if (!pattern.test(source)) {
    throw new Error(message);
  }
}

function requireMetricWeight(metricKey, weight, message) {
  const normalizedWeight = String(weight).replace('.', '\\.');
  const pattern = new RegExp(`metric\\([\\s\\S]*?'${metricKey}'[\\s\\S]*?${normalizedWeight}\\s*\\)`);
  requirePattern(pattern, message);
}

// Adoption weighted KPI contract
requireMetricWeight('clarity', 1.1, 'Adoption clarity weight (1.1) missing.');
requireMetricWeight('zpd', 1.15, 'Adoption zpd weight (1.15) missing.');
requireMetricWeight('setup', 0.9, 'Adoption setup weight (0.9) missing.');
requireMetricWeight('fidelity', 1.05, 'Adoption fidelity weight (1.05) missing.');
requireMetricWeight('deepdive', 0.95, 'Adoption deepdive weight (0.95) missing.');
requireMetricWeight('reliability', 0.85, 'Adoption reliability weight (0.85) missing.');
requirePattern(/Math\.round\(weighted\.value \/ weighted\.weight\)/, 'Adoption weighted average formula missing.');
requirePattern(/overallScore >= 80 \? 'good' : \(overallScore >= 60 \? 'warn' : 'bad'\)/, 'Adoption tone thresholds missing.');

// Learning dashboard contract
requirePattern(/rows\.filter\(\(row\) => row\.event === 'wq_round_complete'\)/, 'Learning round_complete source missing.');
requirePattern(/row\.event === 'wq_funnel_deep_dive_completed' \|\| row\.event === 'wq_deep_dive_complete'/, 'Learning deep dive source missing.');
requirePattern(/learningScoreRaw = \[roundWinRate, deepDiveCompletion\]\.filter/, 'Learning component averaging contract missing.');
requirePattern(/Math\.round\(\(learningScoreRaw\.reduce\(\(sum, value\) => sum \+ value, 0\) \/ learningScoreRaw\.length\) \* 100\)/, 'Learning score formula missing.');
requirePattern(/learningScore >= 80 \? 'good' : learningScore >= 60 \? 'warn' : 'bad'/, 'Learning tone thresholds missing.');

// Reliability dashboard contract
requirePattern(/rows\.filter\(\(row\) => row\.event === 'wq_error'\)/, 'Reliability error source missing.');
requirePattern(/severity === 'blocker' \|\| severity === 'critical' \|\| severity === 'fatal'/, 'Reliability blocker severity filter missing.');
requirePattern(/Math\.max\(0, 100 - \(blockerCount \* 20\)\)/, 'Reliability penalty formula missing.');
requirePattern(/blockerCount === 0 \? 'good' : blockerCount <= 2 \? 'warn' : 'bad'/, 'Reliability tone thresholds missing.');

console.log('telemetry dashboard contract passed');
