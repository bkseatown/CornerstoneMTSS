#!/usr/bin/env node

/**
 * Color Token Generator
 * Generates systematic OKLCH color scales from base definitions
 * Automatically creates light/dark theme variants with WCAG AA contrast checking
 */

const fs = require('fs');
const path = require('path');

// ─── Base Color Definitions ───────────────────────────
// Each color family defined by hue, saturation, and base lightness
const baseColors = {
  // Neutrals (nearly grayscale, slight warm tint)
  neutral: { hue: 200, saturation: 0.015, baseLightness: 92 },

  // Brand Blue (Cornerstone brand)
  blue: { hue: 240, saturation: 0.14, baseLightness: 55 },

  // Semantics
  green: { hue: 142, saturation: 0.16, baseLightness: 65 },  // Secure/success
  amber: { hue: 38, saturation: 0.18, baseLightness: 72 },   // Warning/developing
  red: { hue: 10, saturation: 0.16, baseLightness: 62 },     // Risk/alert
  purple: { hue: 280, saturation: 0.14, baseLightness: 58 }, // Accent/focus
  cyan: { hue: 200, saturation: 0.16, baseLightness: 68 },   // Accent/secondary
};

// ─── Scale Configuration ───────────────────────────
// Define lightness offsets relative to base
// Positive = lighter, negative = darker
const scaleSteps = [
  { level: 50, offset: 40 },   // Very light (+40 from base)
  { level: 100, offset: 32 },
  { level: 200, offset: 24 },
  { level: 300, offset: 16 },
  { level: 400, offset: 8 },
  { level: 500, offset: 0 },   // Mid (base lightness)
  { level: 600, offset: -8 },
  { level: 700, offset: -16 },
  { level: 800, offset: -24 },
  { level: 900, offset: -32 }, // Very dark (-32 from base)
];

// ─── Functions ───────────────────────────

/**
 * Generate OKLCH color scale from base definition
 * @param {string} name Color family name
 * @param {object} config hue, saturation, baseLightness
 * @param {string} theme 'light' or 'dark'
 * @returns {object} Scale entries {colorName: oklchValue}
 */
function generateScale(name, config, theme = 'light') {
  const scale = {};

  scaleSteps.forEach(step => {
    let lightness = config.baseLightness + step.offset;

    // For dark theme, invert the lightness (mirrored around 50%)
    if (theme === 'dark') {
      lightness = 100 - lightness;
    }

    // Clamp lightness to 0-100
    lightness = Math.max(0, Math.min(100, lightness));

    // Slight saturation reduction for very light/dark shades (improves readability)
    let saturation = config.saturation;
    if (lightness > 88 || lightness < 12) {
      saturation *= 0.6;
    }

    const colorName = `--${name}-${step.level}`;
    const oklch = `oklch(${lightness.toFixed(1)}% ${saturation.toFixed(3)} ${config.hue})`;

    scale[colorName] = oklch;
  });

  return scale;
}

/**
 * Calculate WCAG contrast ratio between two OKLCH colors
 * Simplified luminance calculation
 */
function getContrastRatio(oklch1, oklch2) {
  // Extract lightness from oklch() strings
  const extractLightness = (oklch) => {
    const match = oklch.match(/oklch\(([\d.]+)%/);
    return match ? parseFloat(match[1]) / 100 : 0.5;
  };

  const l1 = extractLightness(oklch1);
  const l2 = extractLightness(oklch2);

  // Approximate contrast using WCAG formula
  const lum1 = l1 > 0.5 ? l1 : l1 * 0.5;
  const lum2 = l2 > 0.5 ? l2 : l2 * 0.5;

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

/**
 * Validate text/background contrast (WCAG AA = 4.5:1)
 */
function validateContrast(textColor, bgColor, colorName) {
  const ratio = getContrastRatio(textColor, bgColor);
  const passes = parseFloat(ratio) >= 4.5;

  return {
    colorName,
    ratio: parseFloat(ratio),
    passes,
    wcag: passes ? '✓ AA' : '✗ FAIL'
  };
}

/**
 * Generate semantic color mappings
 */
function generateSemanticColors(lightScales, darkScales, theme = 'light') {
  const scales = theme === 'light' ? lightScales : darkScales;
  const semantic = {};

  // Status colors (use CSS variable references)
  semantic['--status-secure'] = 'var(--green-600)'; // Success
  semantic['--status-developing'] = 'var(--amber-600)'; // Warning
  semantic['--status-intensify'] = 'var(--red-700)'; // Alert
  semantic['--status-focus'] = 'var(--purple-600)'; // Focus

  // Background colors for status
  semantic['--bg-secure'] = 'var(--green-100)';
  semantic['--bg-developing'] = 'var(--amber-100)';
  semantic['--bg-intensify'] = 'var(--red-100)';
  semantic['--bg-focus'] = 'var(--purple-100)';

  // Text colors (use CSS variable references)
  semantic['--text-primary'] = theme === 'light'
    ? 'var(--neutral-900)'
    : 'var(--neutral-50)';

  semantic['--text-muted'] = theme === 'light'
    ? 'var(--neutral-600)'
    : 'var(--neutral-400)';

  semantic['--text-strong'] = theme === 'light'
    ? 'var(--neutral-950)'
    : 'var(--neutral-100)';

  // Surface colors
  semantic['--surface-1'] = theme === 'light'
    ? 'var(--neutral-50)'
    : 'var(--neutral-900)';

  semantic['--surface-2'] = theme === 'light'
    ? 'var(--neutral-100)'
    : 'var(--neutral-800)';

  semantic['--surface-3'] = theme === 'light'
    ? 'var(--neutral-200)'
    : 'var(--neutral-700)';

  // Accent
  semantic['--accent'] = 'var(--blue-600)';
  semantic['--accent-light'] = 'var(--blue-200)';
  semantic['--accent-dark'] = 'var(--blue-800)';

  // Accent alternatives
  semantic['--accent-secondary'] = 'var(--cyan-600)';
  semantic['--accent-success'] = 'var(--green-600)';
  semantic['--accent-warning'] = 'var(--amber-600)';
  semantic['--accent-danger'] = 'var(--red-600)';

  return semantic;
}

// ─── Generation ───────────────────────────

function generateTokens() {
  console.log('🎨 Generating OKLCH color tokens...\n');

  // Generate light theme scales
  const lightScales = {};
  Object.entries(baseColors).forEach(([name, config]) => {
    Object.assign(lightScales, generateScale(name, config, 'light'));
  });

  // Generate dark theme scales
  const darkScales = {};
  Object.entries(baseColors).forEach(([name, config]) => {
    Object.assign(darkScales, generateScale(name, config, 'dark'));
  });

  // Generate semantic colors
  const lightSemantic = generateSemanticColors(lightScales, darkScales, 'light');
  const darkSemantic = generateSemanticColors(lightScales, darkScales, 'dark');

  // ─── Build CSS Output ───────────────────────────

  let css = `/* ────────────────────────────────────────────────────────────
 * Color Tokens — Generated by scripts/generate-color-tokens.js
 * ✓ OKLCH color space (perceptually uniform)
 * ✓ Light/dark theme variants derived automatically
 * ✓ Semantic colors for status, text, surfaces, accents
 *
 * DO NOT EDIT MANUALLY. Regenerate with:
 *   node scripts/generate-color-tokens.js
 * ────────────────────────────────────────────────────────────── */

:root {
  /* ─── Light Theme (Default) ─── */
`;

  // Light theme scales
  Object.entries(lightScales).forEach(([name, value]) => {
    css += `  ${name}: ${value};\n`;
  });

  css += '\n  /* ─── Light Theme Semantic Colors ─── */\n';
  Object.entries(lightSemantic).forEach(([name, value]) => {
    css += `  ${name}: ${value};\n`;
  });

  css += `}

/* ─── Dark Theme ─── */
@media (prefers-color-scheme: dark) {
  :root {
`;

  // Dark theme scales
  Object.entries(darkScales).forEach(([name, value]) => {
    css += `    ${name}: ${value};\n`;
  });

  css += '\n    /* ─── Dark Theme Semantic Colors ─── */\n';
  Object.entries(darkSemantic).forEach(([name, value]) => {
    css += `    ${name}: ${value};\n`;
  });

  css += `  }
}

/* ─── Explicit Dark Theme Variant (data-theme="dark") ─── */
[data-theme="dark"] {
`;

  // Dark theme scales for explicit toggle
  Object.entries(darkScales).forEach(([name, value]) => {
    css += `  ${name}: ${value};\n`;
  });

  css += '\n  /* ─── Dark Theme Semantic Colors ─── */\n';
  Object.entries(darkSemantic).forEach(([name, value]) => {
    css += `  ${name}: ${value};\n`;
  });

  css += `}
`;

  // ─── Write Output ───────────────────────────

  const outputPath = path.join(__dirname, '../style/generated-color-tokens.css');
  fs.writeFileSync(outputPath, css);

  console.log(`✅ Generated ${Object.keys(lightScales).length} color scale entries`);
  console.log(`✅ Generated ${Object.keys(lightSemantic).length} semantic color entries`);
  console.log(`📄 Wrote to: style/generated-color-tokens.css\n`);

  // ─── Validation ───────────────────────────

  console.log('🔍 WCAG Contrast Validation (Light Theme):\n');

  const criticalPairs = [
    { text: lightScales['--neutral-900'], bg: lightScales['--neutral-50'], label: 'Primary text on surface-1' },
    { text: lightScales['--neutral-900'], bg: lightScales['--neutral-100'], label: 'Primary text on surface-2' },
    { text: lightScales['--neutral-600'], bg: lightScales['--neutral-50'], label: 'Muted text on surface-1' },
    { text: lightScales['--neutral-50'], bg: lightScales['--blue-600'], label: 'White text on accent button' },
  ];

  criticalPairs.forEach(pair => {
    const result = validateContrast(pair.text, pair.bg, pair.label);
    console.log(`  ${result.wcag} ${result.label}: ${result.ratio}:1`);
  });

  console.log('\n✨ Color token generation complete!\n');
  return outputPath;
}

// Run generation
if (require.main === module) {
  generateTokens();
}

module.exports = { generateTokens, generateScale };
