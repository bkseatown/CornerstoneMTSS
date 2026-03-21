#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const appMainPath = path.join(repoRoot, 'js', 'word-quest-runtime.js');
const htmlPath = path.join(repoRoot, 'word-quest.html');

const appMain = fs.readFileSync(appMainPath, 'utf8');
const html = fs.readFileSync(htmlPath, 'utf8');

const factoryPattern = /const\s+([A-Za-z0-9_]+Factory)\s*=\s*window\.(create[A-Za-z0-9_]+)/g;
const factories = [];
let match;
while ((match = factoryPattern.exec(appMain))) {
  factories.push({
    localName: match[1],
    globalName: match[2]
  });
}

const uniqueFactories = Array.from(
  new Map(factories.map((entry) => [entry.globalName, entry])).values()
);

const scriptPattern = /<script\s+src="([^"]+)"/g;
const scripts = [];
while ((match = scriptPattern.exec(html))) {
  scripts.push(match[1]);
}

function expectedScriptCandidates(globalName) {
  const base = globalName.replace(/^create/, '').replace(/Module$/, '');
  const kebab = base
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
  return [
    `js/${kebab}.js`,
    `js/app-${kebab}.js`
  ];
}

function isScriptLoaded(candidate) {
  return scripts.some((src) => src.startsWith(candidate));
}

const results = uniqueFactories.map((entry) => {
  const candidates = expectedScriptCandidates(entry.globalName);
  const loadedCandidate = candidates.find(isScriptLoaded) || null;
  return {
    ...entry,
    candidates,
    loaded: Boolean(loadedCandidate),
    loadedCandidate
  };
});

const missing = results.filter((entry) => !entry.loaded);

console.log(`Found ${results.length} module factories referenced by js/word-quest-runtime.js.`);
console.log(`Loaded by word-quest.html: ${results.length - missing.length}`);
console.log(`Missing matching script tag candidates: ${missing.length}`);

if (missing.length) {
  console.log('\nMissing or non-standard factory script matches:');
  missing.forEach((entry) => {
    console.log(`- ${entry.globalName} (${entry.localName})`);
    console.log(`  expected one of: ${entry.candidates.join(', ')}`);
  });
  process.exitCode = 1;
} else {
  console.log('\nPASS: Every factory referenced in js/word-quest-runtime.js has a matching loaded script candidate in word-quest.html.');
}
