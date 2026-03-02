#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fail(msg) {
  console.error("[taxonomy:audit] " + msg);
  process.exit(1);
}

const root = process.cwd();
const taxonomyPath = path.join(root, "data", "skill-taxonomy.v1.json");
const mappingPath = path.join(root, "data", "skill-mapping.v1.json");
const progressionPath = path.join(root, "data", "micro-progression.v1.json");
const probesPath = path.join(root, "data", "decodingdiag-probes.v1.json");

if (!fs.existsSync(taxonomyPath)) fail("Missing data/skill-taxonomy.v1.json");
if (!fs.existsSync(mappingPath)) fail("Missing data/skill-mapping.v1.json");
if (!fs.existsSync(progressionPath)) fail("Missing data/micro-progression.v1.json");
if (!fs.existsSync(probesPath)) fail("Missing data/decodingdiag-probes.v1.json");

const taxonomy = readJson(taxonomyPath);
const mapping = readJson(mappingPath);
const progression = readJson(progressionPath);
const probes = readJson(probesPath);
const resolver = require(path.join(root, "js", "skill-resolver.js"));

const known = new Set(["NUM.FLU.FACT", "NUM.STRAT.USE"]);
(taxonomy.strands || []).forEach((strand) => {
  if (!strand || !strand.id) return;
  known.add(String(strand.id));
  (strand.skills || []).forEach((skill) => {
    if (!skill || !skill.id) return;
    known.add(String(skill.id));
    (skill.micro || []).forEach((micro) => {
      if (micro && micro.id) known.add(String(micro.id));
    });
  });
});

const issues = [];
function checkSkillId(id, source) {
  const resolved = resolver && typeof resolver.resolveSkillId === "function"
    ? resolver.resolveSkillId(id)
    : { canonical: String(id || "").trim(), known: true };
  if (!resolved.canonical || !known.has(resolved.canonical)) {
    issues.push({ id: String(id || ""), source, canonical: resolved.canonical || "" });
  }
}

Object.values(resolver.listAliases()).forEach((canonicalId) => checkSkillId(canonicalId, "resolver.aliases"));

Object.entries(mapping.modules || {}).forEach(([moduleId, row]) => {
  (row.primary || []).forEach((id) => checkSkillId(id, "mapping." + moduleId + ".primary"));
  (row.secondary || []).forEach((id) => checkSkillId(id, "mapping." + moduleId + ".secondary"));
});

Object.entries(progression.ladders || {}).forEach(([skillId, row]) => {
  checkSkillId(skillId, "progression.ladder");
  (row.ordered || []).forEach((id) => checkSkillId(id, "progression.ordered"));
});

(probes.targets || []).forEach((row) => checkSkillId(row && row.targetId, "decodingdiag.target"));

if (issues.length) {
  console.error("[taxonomy:audit] Found unresolved skill references:");
  issues.slice(0, 50).forEach((issue) => {
    console.error(" - " + issue.source + ": " + issue.id + " -> " + (issue.canonical || "<empty>"));
  });
  fail("Unresolved skill references: " + issues.length);
}

console.log("[taxonomy:audit] OK");
console.log("[taxonomy:audit] knownCanonical=" + known.size);
console.log("[taxonomy:audit] aliasCount=" + Object.keys(resolver.listAliases()).length);
