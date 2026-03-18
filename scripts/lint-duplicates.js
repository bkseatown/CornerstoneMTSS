#!/usr/bin/env node
/**
 * lint-duplicates.js
 *
 * Enforces CODE_HEALTH_GUARDRAILS.md Rule 1.3: Selector Deduplication
 * Detects duplicate CSS selectors within the same file.
 *
 * Rule: No selector appears >1 time in the same file (except @media queries)
 *
 * This prevents cascade battles where the same selector is defined 2-4 times
 * with conflicting properties, as happened with game-shell.css (69 duplicates).
 *
 * Run: npm run lint:duplicates
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXEMPT_PATTERNS = [
  'node_modules',
  '.github',
  'output',
  'dist',
  'build',
  '.git',
];

// Per-file exemptions for files that pre-date the duplicate-selector rule.
const FILE_EXEMPTIONS = new Set([
  'components.css', // Monolithic component library; deduplication tracked as tech debt
  'game-shell.css', // Monolithic game shell; deduplication tracked as tech debt
  'game-animations.css', // Extracted from game-shell.css; deduplication tracked as tech debt
  'game-gallery-animations.css', // Extracted from game-shell.css; deduplication tracked as tech debt
  'teacher-hub-animations.css', // Extracted from teacher-hub-v2.css; deduplication tracked as tech debt
  'teacher-hub-main.css', // Extracted from teacher-hub-v2.css; deduplication tracked as tech debt
]);

function isExempt(filePath) {
  if (FILE_EXEMPTIONS.has(require('path').basename(filePath))) return true;
  return EXEMPT_PATTERNS.some(pattern => filePath.includes(pattern));
}

function parseSelectors(content) {
  const selectors = [];
  let currentSelector = '';
  let inComment = false;
  let inMedia = false;
  let braceDepth = 0;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];
    const prev = i > 0 ? content[i - 1] : '';

    // Track comments
    if (char === '/' && next === '*') {
      inComment = true;
      i++;
      continue;
    }
    if (char === '*' && next === '/') {
      inComment = false;
      i++;
      continue;
    }

    if (inComment) continue;

    // Track media queries
    if (char === '@' && content.substring(i).startsWith('@media')) {
      inMedia = true;
    }

    // Count braces
    if (char === '{') {
      const selector = currentSelector.trim();

      // Only track if not inside @media or if at depth 0
      if (selector && !inMedia) {
        selectors.push({
          selector,
          isDuplicate: false,
          line: content.substring(0, i).split('\n').length,
          inMedia: false,
        });
      }

      currentSelector = '';
      braceDepth++;
    } else if (char === '}') {
      braceDepth--;
      if (braceDepth === 0) {
        inMedia = false;
      }
    } else if (char !== '\n' || prev !== '}') {
      currentSelector += char;
    }
  }

  return selectors;
}

function findDuplicates(selectors) {
  const seen = new Map();
  const duplicates = [];

  for (const sel of selectors) {
    const key = sel.selector.trim();

    if (seen.has(key)) {
      seen.get(key).push(sel);
      if (!sel.isDuplicate) {
        sel.isDuplicate = true;
        duplicates.push(key);
      }
    } else {
      seen.set(key, [sel]);
    }
  }

  return { duplicates, selectorMap: seen };
}

function checkFile(filePath) {
  if (isExempt(filePath)) return { pass: true, file: filePath };
  if (!filePath.endsWith('.css')) return { pass: true, file: filePath };
  if (!fs.existsSync(filePath)) return { pass: true, file: filePath };

  const content = fs.readFileSync(filePath, 'utf-8');
  const selectors = parseSelectors(content);
  const { duplicates, selectorMap } = findDuplicates(selectors);

  if (duplicates.length === 0) {
    return { pass: true, file: filePath, selectorCount: selectors.length };
  }

  const violations = duplicates.map(dup => ({
    selector: dup,
    occurrences: selectorMap.get(dup).map(s => s.line),
  }));

  return {
    pass: false,
    file: filePath,
    violations,
    duplicateCount: duplicates.length,
    selectorCount: selectors.length,
  };
}

function getFilesToCheck(isStaged = true) {
  try {
    if (isStaged) {
      const output = execSync('git diff --name-only --staged', {
        encoding: 'utf-8',
      });
      return output.split('\n').filter(f => f.trim() && f.endsWith('.css'));
    } else {
      const output = execSync('git ls-files *.css', {
        encoding: 'utf-8',
      });
      return output.split('\n').filter(f => f.trim());
    }
  } catch (err) {
    return [];
  }
}

function main() {
  const isCI = process.env.CI === 'true';
  const isPreCommit = process.env.HUSKY === '1';
  const isStaged = isPreCommit || !isCI;

  const files = getFilesToCheck(isStaged);

  if (files.length === 0) {
    console.log('✓ No CSS files to check');
    process.exit(0);
  }

  const results = files.map(checkFile);
  const failures = results.filter(r => !r.pass);
  const passes = results.filter(r => r.pass);

  if (passes.length > 0) {
    const totalSelectors = passes.reduce((sum, p) => sum + p.selectorCount, 0);
    console.log(`✓ ${passes.length} CSS file(s) with no duplicate selectors (${totalSelectors} unique)`);
  }

  if (failures.length > 0) {
    console.error(`\n❌ Duplicate Selector Violations (CODE_HEALTH_GUARDRAILS.md Rule 1.3):\n`);
    console.error(`Duplicate selectors indicate cascade battles - same rule defined 2+ times.\n`);

    failures.forEach(f => {
      console.error(`${f.file}: ${f.duplicateCount} duplicate selector(s) found`);
      f.violations.forEach(v => {
        console.error(`  ✗ ${v.selector}`);
        console.error(`    Defined at lines: ${v.occurrences.join(', ')}`);
        console.error(`    → Consolidate to single definition`);
      });
      console.error('');
    });

    console.error(`Why This Matters:\n`);
    console.error(`- Duplicate selectors waste parser time and confuse maintenance`);
    console.error(`- Indicates unresolved cascade battles (why define twice?)`);
    console.error(`- game-shell.css had 69 duplicates (5% wasted parsing)`);
    console.error(`- Solution: Find root rule, update once, delete duplicates\n`);

    process.exit(1);
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, parseSelectors, findDuplicates, getFilesToCheck };
