#!/usr/bin/env node
/**
 * lint-tokens.js
 *
 * Enforces CODE_HEALTH_GUARDRAILS.md Part 2: Design System Compliance
 * Detects hardcoded colors, fonts, and spacing outside token system.
 *
 * Rule: ALL values MUST come from tokens
 * - 162-token color palette limit
 * - 10-tier font size scale
 * - Spacing scale (var(--space-0), --space-1, ..., --space-6)
 *
 * Violations detected:
 * - Hardcoded hex colors (#fff, #12304f, etc.)
 * - RGB colors (rgb(255, 255, 255))
 * - Hardcoded font sizes (14px, 18px) not from scale
 * - Hardcoded margins/padding not from spacing scale
 *
 * Run: npm run lint:tokens
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VALID_TOKEN_PATTERNS = [
  /var\(--[\w-]+\)/,  // var(--token-name)
  /hsla?\(/,          // hsl() and hsla() allow dynamic color calc
];

const HARDCODED_VIOLATIONS = {
  color: /^(#[0-9a-fA-F]{3,6}|rgb\(|rgba\(|hsl\(|hsla\()/,
  'font-size': /^\d+px$/,
  'margin': /^\d+px$/,
  'padding': /^\d+px$/,
  'gap': /^\d+px$/,
  'line-height': /^\d+\.?\d*$/,
};

const EXEMPT_PATTERNS = [
  'node_modules',
  '.github',
  'output',
  'dist',
  'build',
  '.git',
];

const VALID_FONT_SIZES = [
  '10px',
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
  '40px',
];

function isExempt(filePath) {
  return EXEMPT_PATTERNS.some(pattern => filePath.includes(pattern));
}

function parseCSS(content) {
  const rules = [];
  let currentRule = '';
  let inComment = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    // Skip comments
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

    if (char === '{') {
      const selector = currentRule.trim();
      let properties = '';
      let depth = 1;
      i++;

      while (i < content.length && depth > 0) {
        if (content[i] === '{') depth++;
        if (content[i] === '}') depth--;
        if (depth > 0) properties += content[i];
        i++;
      }

      rules.push({ selector, properties });
      currentRule = '';
    } else {
      currentRule += char;
    }
  }

  return rules;
}

function parseProperties(propertiesStr) {
  const props = [];
  const lines = propertiesStr.split(';');

  for (const line of lines) {
    const match = line.match(/^\s*([^:]+):\s*(.+)\s*$/);
    if (match) {
      props.push({
        prop: match[1].trim(),
        value: match[2].trim(),
      });
    }
  }

  return props;
}

function isValidTokenValue(value) {
  // Allow tokens
  if (value.includes('var(')) return true;

  // Allow transparent, inherit, auto, etc.
  if (['transparent', 'inherit', 'auto', 'none', 'normal'].includes(value)) return true;

  // Allow calcuations with tokens
  if (value.includes('calc(') && value.includes('var(')) return true;

  return false;
}

function checkProperty(prop, value) {
  // Skip comments and calc
  if (prop.startsWith('/*') || value.startsWith('/*')) return null;

  // Check font sizes
  if (prop === 'font-size') {
    if (!isValidTokenValue(value) && !VALID_FONT_SIZES.includes(value)) {
      return {
        violation: true,
        type: 'hardcoded-font-size',
        prop,
        value,
        message: `Hardcoded font size (not from 10-tier scale): ${value}`,
      };
    }
  }

  // Check colors
  if (['color', 'background-color', 'border-color', 'outline-color'].includes(prop)) {
    if (!isValidTokenValue(value) && /#[0-9a-fA-F]|rgb\(|rgba\(/.test(value)) {
      return {
        violation: true,
        type: 'hardcoded-color',
        prop,
        value,
        message: `Hardcoded color (not from token): ${value}`,
      };
    }
  }

  // Check spacing
  if (['margin', 'padding', 'gap', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'].includes(prop)) {
    if (!isValidTokenValue(value) && /^\d+px$/.test(value)) {
      return {
        violation: true,
        type: 'hardcoded-spacing',
        prop,
        value,
        message: `Hardcoded spacing (use var(--space-N)): ${value}`,
      };
    }
  }

  return null;
}

function checkFile(filePath) {
  if (isExempt(filePath)) return { pass: true, file: filePath };
  if (!filePath.endsWith('.css')) return { pass: true, file: filePath };
  if (!fs.existsSync(filePath)) return { pass: true, file: filePath };

  const content = fs.readFileSync(filePath, 'utf-8');
  const rules = parseCSS(content);
  const violations = [];

  for (const rule of rules) {
    const properties = parseProperties(rule.properties);

    for (const { prop, value } of properties) {
      const violation = checkProperty(prop, value);
      if (violation) {
        violations.push({
          ...violation,
          selector: rule.selector,
          line: content.substring(0, content.indexOf(rule.selector)).split('\n').length,
        });
      }
    }
  }

  if (violations.length === 0) {
    return { pass: true, file: filePath, violations };
  }

  return {
    pass: false,
    file: filePath,
    violations,
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
    console.log(`✓ ${passes.length} CSS file(s) use token-first design`);
  }

  if (failures.length > 0) {
    console.error(`\n❌ Token Compliance Violations (CODE_HEALTH_GUARDRAILS.md Part 2):\n`);

    failures.forEach(f => {
      console.error(`${f.file}:`);
      f.violations.forEach(v => {
        console.error(`  Line ~${v.line} | ${v.selector}`);
        console.error(`    ${v.prop}: ${v.value}`);
        console.error(`    ✗ ${v.message}`);
      });
      console.error('');
    });

    console.error(`Token Replacements:\n`);
    console.error(`Color:    #fff → var(--color-white)`);
    console.error(`Font:     14px → var(--fs-body)`);
    console.error(`Spacing:  16px → var(--space-2)`);
    console.error(`Background: rgb(241, 247, 250) → var(--bg-canvas)\n`);

    console.error(`Reference: style/tokens.css (162 color tokens)`);
    console.error(`           style/components.css (font scale, spacing)\n`);

    process.exit(1);
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, parseCSS, parseProperties, checkProperty, getFilesToCheck };
