#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE_DIR = path.join(ROOT, 'docs', 'sas', 'source');
const ROOT_FALLBACK_DIR = ROOT;
const DERIVED_DIR = path.join(ROOT, 'docs', 'sas', 'derived');
const PACK_PATH = path.join(DERIVED_DIR, 'sas_alignment_pack.json');
const INDEX_PATH = path.join(DERIVED_DIR, 'sas_alignment_index.json');

const TARGET_DOCS = [
  'Support Services PD 2025-26',
  'Support Services Area of Focus & Beliefs',
  'Support Services Onboarding 2025-26',
  'Official Learning Support Interventions',
  'Instructional Intervention Recommendation Report',
  'Goal Bank for Intervention Plans for Rising G2',
  'Aligning SLP and LS Literacy Goals',
  'MS Math Goals',
  'MS Literacy Goals',
  'Intervention Plan Goal Bank (Gr 3 to Gr 4)',
  'MS_PPG',
  'High_School_PPG',
  'ElementarySchoolProgramGuide2025-26',
  'ESQ Adult w definitions',
  'Intervention planning form w case example'
];

function safeRead(filePath, fallback = '') {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (_e) {
    return fallback;
  }
}

function stableId(prefix, payload) {
  const hash = crypto.createHash('sha1').update(prefix + '::' + payload).digest('hex').slice(0, 12);
  return `${prefix}_${hash}`;
}

function normalize(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function shortSnippet(text, max = 200) {
  return normalize(text).slice(0, max);
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'doc';
}

function listPdfFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => /\.pdf$/i.test(name))
    .sort((a, b) => a.localeCompare(b));
}

function listSourceCandidates() {
  const primary = listPdfFiles(SOURCE_DIR).map((file) => ({
    file,
    filePath: path.join(SOURCE_DIR, file),
    location: 'docs/sas/source'
  }));

  const fallback = listPdfFiles(ROOT_FALLBACK_DIR).map((file) => ({
    file,
    filePath: path.join(ROOT_FALLBACK_DIR, file),
    location: 'repo-root'
  }));

  const byName = new Map();
  primary.forEach((row) => byName.set(row.file.toLowerCase(), row));
  fallback.forEach((row) => {
    const key = row.file.toLowerCase();
    if (!byName.has(key)) byName.set(key, row);
  });
  return Array.from(byName.values()).sort((a, b) => a.file.localeCompare(b.file));
}

function decodeBinaryToText(buffer) {
  return String(buffer)
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDocText(filePath) {
  const raw = fs.readFileSync(filePath);
  let pages = [];
  let usedParser = 'binary-fallback';

  try {
    // Optional dependency. Build still works without it.
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const pdfParse = require('pdf-parse');
    const parsed = pdfParse(raw);
    usedParser = 'pdf-parse';
    return parsed.then((result) => {
      const text = normalize(result.text || '');
      pages = text ? [text] : [];
      return { pages, usedParser };
    }).catch(() => {
      const fallback = decodeBinaryToText(raw);
      return { pages: fallback ? [fallback] : [], usedParser: 'binary-fallback' };
    });
  } catch (_e) {
    const fallback = decodeBinaryToText(raw);
    return Promise.resolve({ pages: fallback ? [fallback] : [], usedParser });
  }
}

function matchesDoc(name) {
  const lower = name.toLowerCase();
  return TARGET_DOCS.some((target) => lower.includes(target.toLowerCase().replace(/\s+/g, ' ')));
}

function tierFromText(text) {
  const t = text.toLowerCase();
  if (/tier\s*3|intensive/.test(t)) return 'T3';
  if (/tier\s*2|targeted/.test(t)) return 'T2';
  return 'T1';
}

function areaFromText(text) {
  const t = text.toLowerCase();
  if (/math|numeracy/.test(t)) return 'math';
  if (/writing|sentence/.test(t)) return 'writing';
  if (/behavior|executive|self-reg/.test(t)) return 'executive';
  if (/fluency/.test(t)) return 'fluency';
  if (/morph|vocab/.test(t)) return 'vocabulary';
  return 'literacy';
}

function gradeBandsFromText(text) {
  const t = text.toLowerCase();
  const out = [];
  if (/k|kindergarten|g1|grade 1|elementary/.test(t)) out.push('K-2');
  if (/g2|g3|g4|g5|grade 3|grade 4|grade 5/.test(t)) out.push('3-5');
  if (/middle|ms|grade 6|grade 7|grade 8/.test(t)) out.push('6-8');
  if (/high|hs|grade 9|grade 10|grade 11|grade 12/.test(t)) out.push('9-12');
  return out.length ? Array.from(new Set(out)) : ['K-12'];
}

function mkSourceRef(doc, page, snippet) {
  return {
    doc,
    page: Math.max(1, Number(page) || 1),
    quote_or_snippet: shortSnippet(snippet || doc)
  };
}

function buildEntriesForDoc(docInfo) {
  const doc = docInfo.doc;
  const text = normalize(docInfo.pages.join(' '));
  const tier = tierFromText(text + ' ' + doc);
  const area = areaFromText(text + ' ' + doc);
  const grades = gradeBandsFromText(text + ' ' + doc);
  const snippet = shortSnippet(text || doc, 180);
  const sourceRef = mkSourceRef(doc, 1, snippet || doc);

  const interventions = [];
  const assessments = [];
  const goals = [];
  const principles = [];
  const templates = [];

  if (/intervention|fundations|ufli|lexia|lli|corrective|read naturally|wilson/i.test(doc + ' ' + text)) {
    const name = /Official Learning Support Interventions/i.test(doc)
      ? 'SAS Structured Literacy Intervention Block'
      : `${doc.replace(/\.pdf$/i, '')} Intervention`; 
    interventions.push({
      id: stableId('intv', `${doc}:${name}`),
      name,
      area,
      tier,
      grades,
      prerequisites: ['Baseline evidence captured', 'Student context selected'],
      dosage: tier === 'T3' ? '25 min, 4x/week' : tier === 'T2' ? '20 min, 3x/week' : '15-20 min, 2-3x/week',
      materials: ['Core curriculum text', 'Intervention routine checklist'],
      fidelity_notes: 'Use consistent protocol and quick fidelity checks per session.',
      progress_monitoring: 'Weekly quick-check with 2-week review window.',
      linked_assessments: ['aimsweb', 'map', 'core-phonics'],
      tags: [area, tier.toLowerCase(), 'sas-alignment'],
      source_refs: [sourceRef]
    });
  }

  if (/map|aimsweb|dibels|phonics|assessment|psi|esi|usi/i.test(doc + ' ' + text)) {
    const name = /map/i.test(doc + ' ' + text) ? 'MAP Growth' : /aimsweb/i.test(doc + ' ' + text) ? 'Aimsweb' : 'Structured Skills Check';
    assessments.push({
      id: stableId('asm', `${doc}:${name}`),
      name,
      domain: area,
      grades,
      cadence: tier === 'T3' ? 'Every 7 days' : 'Every 14 days',
      what_it_measures: 'Target skill performance and response-to-intervention trend.',
      interpretation_notes: 'Combine benchmark score, error patterns, and classroom transfer notes.',
      source_refs: [sourceRef]
    });
  }

  if (/goal bank|goals|smart|intervention plan/i.test(doc + ' ' + text)) {
    goals.push({
      id: stableId('goal', `${doc}:${area}:${grades.join('-')}`),
      domain: area,
      grade_band: grades[0] || 'K-12',
      skill: area === 'math' ? 'Problem solving accuracy' : area === 'writing' ? 'Sentence clarity' : 'Decoding and fluency transfer',
      baseline_prompt: 'Current baseline (include date + source):',
      goal_template_smart: 'By [date], student will improve [skill] from [baseline] to [target] as measured by [assessment/method] in [setting].',
      progress_monitoring_method: 'Weekly quick-check + biweekly trend review.',
      accommodations_link: 'Link to classroom-ready accommodations and implementation notes.',
      source_refs: [sourceRef]
    });
  }

  if (/belief|focus|principle|onboarding|support services/i.test(doc + ' ' + text)) {
    principles.push({
      id: stableId('principle', `${doc}:${snippet}`),
      principle: /co-?teach|push-?in/i.test(text) ? 'Push-in and co-teaching supports are first-line.' : 'Intervention should be explicit, structured, and evidence-linked.',
      implication_for_design: 'Keep workflows quick, student-centered, and export-ready for team meetings.',
      source_refs: [sourceRef]
    });
  }

  if (/form|template|planning/i.test(doc + ' ' + text)) {
    templates.push({
      id: stableId('tmpl', `${doc}:template`),
      name: `${doc.replace(/\.pdf$/i, '')} Template`,
      fields: ['Student', 'Concern area', 'Goal', 'Intervention plan', 'Review date'],
      usage_notes: 'Use as a meeting-ready planning scaffold with clear action owners.',
      source_refs: [sourceRef]
    });
  }

  return { interventions, assessments, goals, principles, templates };
}

function dedupeById(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    if (!row || !row.id) return false;
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

function indexPack(pack) {
  const sections = [
    ['interventions', pack.interventions],
    ['assessments', pack.assessments],
    ['goal_bank', pack.goal_bank],
    ['beliefs_principles', pack.beliefs_principles],
    ['forms_templates', pack.forms_templates]
  ];

  const items = [];
  const tokenSet = new Set();

  sections.forEach(([type, rows]) => {
    rows.forEach((row) => {
      const textBlob = normalize([
        row.id,
        row.name,
        row.label,
        row.domain,
        row.area,
        row.skill,
        row.tier,
        row.grade_band,
        Array.isArray(row.grades) ? row.grades.join(' ') : '',
        Array.isArray(row.tags) ? row.tags.join(' ') : '',
        row.goal_template_smart,
        row.principle,
        row.usage_notes
      ].filter(Boolean).join(' ')).toLowerCase();

      textBlob.split(/[^a-z0-9]+/).filter((tok) => tok.length >= 3).forEach((tok) => tokenSet.add(tok));

      items.push({
        id: row.id,
        type,
        title: row.name || row.skill || row.principle || row.id,
        tokens: textBlob
      });
    });
  });

  return {
    version: 'sas_alignment_index.v1',
    generatedAt: pack.generatedAt,
    counts: {
      interventions: pack.interventions.length,
      assessments: pack.assessments.length,
      goal_bank: pack.goal_bank.length,
      beliefs_principles: pack.beliefs_principles.length,
      forms_templates: pack.forms_templates.length
    },
    tokens: Array.from(tokenSet).sort(),
    items
  };
}

async function main() {
  fs.mkdirSync(DERIVED_DIR, { recursive: true });

  const candidates = listSourceCandidates();
  const docs = candidates.filter((row) => matchesDoc(row.file)).length
    ? candidates.filter((row) => matchesDoc(row.file))
    : candidates;
  const sourceDocs = [];

  const allInterventions = [];
  const allAssessments = [];
  const allGoals = [];
  const allPrinciples = [];
  const allTemplates = [];

  for (const docRow of docs) {
    const file = docRow.file;
    const filePath = docRow.filePath;
    const raw = fs.readFileSync(filePath);
    const sha1 = crypto.createHash('sha1').update(raw).digest('hex');
    const extracted = await extractDocText(filePath);
    const pages = Array.isArray(extracted.pages) ? extracted.pages : [];
    const docInfo = {
      doc: file,
      docId: slug(file.replace(/\.pdf$/i, '')),
      sha1,
      pages: Math.max(1, pages.length),
      parser: extracted.usedParser,
      location: docRow.location
    };
    sourceDocs.push(docInfo);

    const built = buildEntriesForDoc({ doc: file, pages });
    allInterventions.push(...built.interventions);
    allAssessments.push(...built.assessments);
    allGoals.push(...built.goals);
    allPrinciples.push(...built.principles);
    allTemplates.push(...built.templates);
  }

  const generatedAtSeed = sourceDocs.map((d) => `${d.doc}:${d.sha1}`).join('|') || 'no-source-docs';
  const generatedAt = `seed-${crypto.createHash('sha1').update(generatedAtSeed).digest('hex').slice(0, 12)}`;

  const pack = {
    version: 'sas_alignment_pack.v1',
    generatedAt,
    sourceDocs: sourceDocs.map(({ doc, docId, sha1, pages }) => ({ doc, docId, sha1, pages })),
    interventions: dedupeById(allInterventions).sort((a, b) => a.id.localeCompare(b.id)),
    assessments: dedupeById(allAssessments).sort((a, b) => a.id.localeCompare(b.id)),
    goal_bank: dedupeById(allGoals).sort((a, b) => a.id.localeCompare(b.id)),
    beliefs_principles: dedupeById(allPrinciples).sort((a, b) => a.id.localeCompare(b.id)),
    forms_templates: dedupeById(allTemplates).sort((a, b) => a.id.localeCompare(b.id))
  };

  const index = indexPack(pack);

  fs.writeFileSync(PACK_PATH, `${JSON.stringify(pack, null, 2)}\n`);
  fs.writeFileSync(INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`);

  // eslint-disable-next-line no-console
  console.log(`sas:build complete -> ${path.relative(ROOT, PACK_PATH)} (${pack.sourceDocs.length} docs)`);
  // eslint-disable-next-line no-console
  console.log(`sas:build index -> ${path.relative(ROOT, INDEX_PATH)} (${index.items.length} items)`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('sas:build failed', err);
  process.exit(1);
});
