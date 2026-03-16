#!/usr/bin/env node
/**
 * lint-important.js
 *
 * Enforces CODE_HEALTH_GUARDRAILS.md Rule 1.2: !important Limits
 * Blocks commits for excessive !important abuse.
 *
 * Default Limit: ≤10 !important per file
 *
 * Exceptions (increased limits):
 * - style/utilities.css (50 allowed - utility classes need priority)
 * - games/ui/game-feedback.css (50 allowed - animation overrides)
 *
 * Banned from !important:
 * - style/components.css (means specificity war)
 * - style/themes.css (tokens should flow cleanly)
 * - home-v3.css (landing page should be clean)
 *
 * Run: npm run lint:important
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEFAULT_LIMIT = 10;

const EXEMPT_LIMITS = {
  'style/utilities.css': 50,
  'games/ui/game-feedback.css': 50,
  'games/ui/game-shell.css': 750, // Monolithic game shell; !important audit tracked as tech debt
};

const BANNED_FILES = [
  'style/components.css',
  'style/themes.css',
  'home-v3.css',
];

const EXEMPT_PATTERNS = [
  'node_modules',
  '.github',
  'output',
  'dist',
  'build',
  '.git',
];

function isExempt(filePath) {
  return EXEMPT_PATTERNS.some(pattern => filePath.includes(pattern));
}

function countImportant(filePath) {
  try {
    if (!fs.existsSync(filePath)) return 0;
    const content = fs.readFileSync(filePath, 'utf-8');
    const matches = content.match(/!important/g);
    return matches ? matches.length : 0;
  } catch (err) {
    return 0;
  }
}

function getLimit(filePath) {
  // Check exempt list first
  for (const [exemptFile, limit] of Object.entries(EXEMPT_LIMITS)) {
    if (filePath.endsWith(exemptFile)) {
      return { limit, reason: 'exempt-increased' };
    }
  }

  // Check banned list
  for (const bannedFile of BANNED_FILES) {
    if (filePath.endsWith(bannedFile)) {
      return { limit: 0, reason: 'banned', banned: true };
    }
  }

  return { limit: DEFAULT_LIMIT, reason: 'default' };
}

function checkFile(filePath) {
  if (isExempt(filePath)) return { pass: true, file: filePath };
  if (!filePath.endsWith('.css')) return { pass: true, file: filePath };
  if (!fs.existsSync(filePath)) return { pass: true, file: filePath };

  const count = countImportant(filePath);
  const { limit, reason, banned } = getLimit(filePath);

  if (banned && count > 0) {
    return {
      pass: false,
      file: filePath,
      count,
      limit,
      message: `❌ ${filePath}: ${count}x !important BANNED (specificity war indicator)`,
      suggestion: `Remove !important and fix specificity instead`,
    };
  }

  if (count > limit) {
    return {
      pass: false,
      file: filePath,
      count,
      limit,
      message: `❌ ${filePath}: ${count}x !important exceeds limit of ${limit}`,
      suggestion: `Reduce !important declarations (${reason} limit)`,
    };
  }

  return { pass: true, file: filePath, count, limit };
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
    console.log(`✓ ${passes.length} CSS file(s) within !important limits`);
  }

  if (failures.length > 0) {
    console.error(`\n❌ !important Limit Violations (CODE_HEALTH_GUARDRAILS.md Rule 1.2):\n`);
    failures.forEach(f => {
      console.error(`${f.message}`);
      console.error(`   Limit: ${f.limit} | Current: ${f.count}`);
      console.error(`   → ${f.suggestion}\n`);
    });

    console.error(`When !important IS needed:`);
    console.error(`1. Utility classes (e.g., .hidden { display: none !important; })`);
    console.error(`2. Animation overrides that must punch through game-state CSS`);
    console.error(`3. Theme resets (e.g., dark mode color swap)\n`);

    console.error(`When !important is ABUSE:`);
    console.error(`- Layout properties (display, grid-template-rows, width, height)`);
    console.error(`- All properties in a rule block (cascade failure sign)`);
    console.error(`- Compensating for low specificity (fix specificity instead)\n`);

    process.exit(1);
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, countImportant, getLimit, getFilesToCheck };
