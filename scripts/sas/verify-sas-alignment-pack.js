#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const PACK_PATH = path.join(ROOT, 'docs', 'sas', 'derived', 'sas_alignment_pack.json');
const INDEX_PATH = path.join(ROOT, 'docs', 'sas', 'derived', 'sas_alignment_index.json');

function fail(msg) {
  // eslint-disable-next-line no-console
  console.error(`sas:verify failed: ${msg}`);
  process.exit(1);
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) fail(`missing ${path.relative(ROOT, filePath)}`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    fail(`invalid JSON in ${path.relative(ROOT, filePath)} (${err.message})`);
  }
}

function assertArray(val, label) {
  if (!Array.isArray(val)) fail(`${label} must be an array`);
}

function verifySourceRefs(rows, label) {
  rows.forEach((row) => {
    if (!Array.isArray(row.source_refs) || row.source_refs.length === 0) {
      fail(`${label}/${row.id || 'unknown'} missing source_refs`);
    }
    row.source_refs.forEach((ref) => {
      if (!ref || typeof ref.doc !== 'string' || !Number.isInteger(ref.page) || ref.page < 1 || typeof ref.quote_or_snippet !== 'string') {
        fail(`${label}/${row.id || 'unknown'} has invalid source_ref`);
      }
      if (ref.quote_or_snippet.length > 200) {
        fail(`${label}/${row.id || 'unknown'} source_ref.quote_or_snippet exceeds 200 chars`);
      }
    });
  });
}

function main() {
  const pack = loadJson(PACK_PATH);
  const index = loadJson(INDEX_PATH);

  if (pack.version !== 'sas_alignment_pack.v1') fail('pack.version mismatch');
  if (!pack.generatedAt || typeof pack.generatedAt !== 'string') fail('pack.generatedAt required');

  assertArray(pack.sourceDocs, 'sourceDocs');
  assertArray(pack.interventions, 'interventions');
  assertArray(pack.assessments, 'assessments');
  assertArray(pack.goal_bank, 'goal_bank');
  assertArray(pack.beliefs_principles, 'beliefs_principles');
  assertArray(pack.forms_templates, 'forms_templates');

  verifySourceRefs(pack.interventions, 'interventions');
  verifySourceRefs(pack.assessments, 'assessments');
  verifySourceRefs(pack.goal_bank, 'goal_bank');
  verifySourceRefs(pack.beliefs_principles, 'beliefs_principles');
  verifySourceRefs(pack.forms_templates, 'forms_templates');

  if (index.version !== 'sas_alignment_index.v1') fail('index.version mismatch');
  assertArray(index.tokens, 'index.tokens');
  assertArray(index.items, 'index.items');

  // eslint-disable-next-line no-console
  console.log('sas:verify passed');
  // eslint-disable-next-line no-console
  console.log(`pack counts -> interventions:${pack.interventions.length} assessments:${pack.assessments.length} goals:${pack.goal_bank.length}`);
}

main();
