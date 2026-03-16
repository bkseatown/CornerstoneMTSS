#!/usr/bin/env node
/**
 * lint-file-size.js
 *
 * Enforces CODE_HEALTH_GUARDRAILS.md Rule 1.1: File Size Limits
 * Blocks commits for oversized files that violate architectural guardrails.
 *
 * Limits:
 * - CSS: 4,000 lines (modularize beyond)
 * - JS: 8,000 lines (break into modules beyond)
 * - HTML: 500 lines (extract components beyond)
 *
 * Run: npm run lint:sizes
 * Run in CI: scripts/lint-file-size.js (all files)
 * Run in pre-commit: scripts/lint-file-size.js (staged files only)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LIMITS = {
  '.css': 4000,
  '.js': 8000,
  '.html': 500,
};

// Per-file overrides for large compound templates that pre-date the 500-line rule.
// Each entry is the file's basename and the approved higher limit.
const FILE_LIMIT_OVERRIDES = {
  'reports.html': 1200,
  'teacher-hub-v2.html': 1200,
  'game-shell.css': 12000, // Monolithic game shell CSS; modularisation tracked as tech debt
};

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

function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (err) {
    return 0;
  }
}

function checkFile(filePath) {
  if (isExempt(filePath)) return { pass: true, file: filePath };

  const ext = path.extname(filePath);
  const basename = path.basename(filePath);
  const limit = FILE_LIMIT_OVERRIDES[basename] !== undefined
    ? FILE_LIMIT_OVERRIDES[basename]
    : LIMITS[ext];

  if (!limit) return { pass: true, file: filePath };
  if (!fs.existsSync(filePath)) return { pass: true, file: filePath };

  const lines = countLines(filePath);

  if (lines > limit) {
    return {
      pass: false,
      file: filePath,
      lines,
      limit,
      message: `❌ ${filePath}: ${lines} lines exceeds limit of ${limit}`,
      suggestion: `Split into modules and re-run lint`,
    };
  }

  return { pass: true, file: filePath, lines, limit };
}

function getFilesToCheck(isStaged = true) {
  try {
    if (isStaged) {
      // Only check staged files (for pre-commit hook)
      const output = execSync('git diff --name-only --staged', {
        encoding: 'utf-8',
      });
      return output.split('\n').filter(f => f.trim());
    } else {
      // Check all non-exempt files (for CI)
      const output = execSync('git ls-files', {
        encoding: 'utf-8',
      });
      return output.split('\n').filter(f => f.trim() && Object.keys(LIMITS).includes(path.extname(f)));
    }
  } catch (err) {
    console.error('Error getting file list:', err.message);
    return [];
  }
}

function main() {
  const isCI = process.env.CI === 'true';
  const isPreCommit = process.env.HUSKY === '1';
  const isStaged = isPreCommit || !isCI;

  const files = getFilesToCheck(isStaged);

  if (files.length === 0) {
    console.log('✓ No files to check');
    process.exit(0);
  }

  const results = files.map(checkFile);
  const failures = results.filter(r => !r.pass);
  const passes = results.filter(r => r.pass);

  if (passes.length > 0) {
    console.log(`✓ ${passes.length} file(s) within size limits`);
  }

  if (failures.length > 0) {
    console.error(`\n❌ File Size Limit Violations (CODE_HEALTH_GUARDRAILS.md Rule 1.1):\n`);
    failures.forEach(f => {
      console.error(`${f.message}`);
      console.error(`   Limit: ${f.limit} lines | Current: ${f.lines} lines`);
      console.error(`   → ${f.suggestion}\n`);
    });

    console.error(`\nException Process:`);
    console.error(`1. Create RFC ticket explaining architecture change`);
    console.error(`2. Approval required from 2 senior engineers + architect`);
    console.error(`3. Exception granted for max 6 months (then mandatory refactor)\n`);

    process.exit(1);
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, countLines, getFilesToCheck };
