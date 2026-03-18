#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'js', 'theme-registry.js');
const THEMES_PATH = path.join(ROOT, 'style', 'themes.css');

const LIGHTNESS_RAILS = Object.freeze({
  pageBg: { min: 10, max: 84 },
  pageBg2: { min: 7, max: 78 },
  panelBg: { min: 12, max: 92 }
});

const DELTA_RAILS = Object.freeze({
  pageToPanelMin: 4,
  pageToPanelMax: 52
});

const CONTRAST_FLOORS = Object.freeze({
  key: 4.5,
  brand: 4.5,
  text: 4.5,
  textMuted: 3.0
});

let failures = 0;

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseActiveThemeIds(registryJs) {
  const blockMatch = registryJs.match(/var\s+ACTIVE_THEME_IDS\s*=\s*Object\.freeze\(\s*\[([\s\S]*?)\]\s*\)/m);
  if (!blockMatch) return [];
  return [...blockMatch[1].matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]);
}

function extractThemeBlock(css, themeId) {
  const rx = new RegExp(`\\[data-theme=["']${escapeRegex(themeId)}["']\\]\\s*\\{([\\s\\S]*?)\\n\\}`, 'm');
  const m = css.match(rx);
  return m ? m[1] : null;
}

function extractToken(block, name) {
  const rx = new RegExp(`${escapeRegex(name)}\\s*:\\s*([^;]+);`);
  const m = block.match(rx);
  return m ? m[1].trim() : null;
}

function normalizeHex(value) {
  if (!value) return null;
  const raw = String(value).trim().toLowerCase();
  if (/^#([0-9a-f]{6})$/.test(raw)) return raw;
  if (/^#([0-9a-f]{3})$/.test(raw)) {
    const h = raw.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  return null;
}

function hslLightness(hex) {
  const c = normalizeHex(hex);
  if (!c) return null;
  const r = parseInt(c.slice(1, 3), 16) / 255;
  const g = parseInt(c.slice(3, 5), 16) / 255;
  const b = parseInt(c.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return ((max + min) / 2) * 100;
}

function srgbToLinear(ch) {
  return ch <= 0.03928 ? ch / 12.92 : ((ch + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const c = normalizeHex(hex);
  if (!c) return null;
  const r = srgbToLinear(parseInt(c.slice(1, 3), 16) / 255);
  const g = srgbToLinear(parseInt(c.slice(3, 5), 16) / 255);
  const b = srgbToLinear(parseInt(c.slice(5, 7), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  if (l1 == null || l2 == null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function checkLightness(themeId, token, value, rails) {
  const lightness = hslLightness(value);
  if (lightness == null) {
    fail(`[${themeId}] ${token} must be a hex color. Found: ${value || 'missing'}`);
    return null;
  }
  if (lightness < rails.min || lightness > rails.max) {
    fail(`[${themeId}] ${token} lightness ${lightness.toFixed(1)}% is out of range ${rails.min}%..${rails.max}%.`);
  } else {
    pass(`[${themeId}] ${token} lightness ${lightness.toFixed(1)}% is within ${rails.min}%..${rails.max}%.`);
  }
  return lightness;
}

function checkContrast(themeId, label, fg, bg, floor) {
  const ratio = contrastRatio(fg, bg);
  if (ratio == null) {
    fail(`[${themeId}] ${label} contrast cannot be evaluated (requires hex): fg=${fg || 'missing'} bg=${bg || 'missing'}`);
    return;
  }
  if (ratio < floor) {
    fail(`[${themeId}] ${label} contrast ${ratio.toFixed(2)} is below ${floor.toFixed(1)}.`);
  } else {
    pass(`[${themeId}] ${label} contrast ${ratio.toFixed(2)} meets ${floor.toFixed(1)}.`);
  }
}

function run() {
  const registry = read(REGISTRY_PATH);
  const css = read(THEMES_PATH);
  const themeIds = parseActiveThemeIds(registry);

  if (!themeIds.length) {
    fail('No active themes found in js/theme-registry.js ACTIVE_THEME_IDS.');
    process.exit(1);
  }

  pass(`Checking ${themeIds.length} active theme(s): ${themeIds.join(', ')}`);

  for (const themeId of themeIds) {
    const block = extractThemeBlock(css, themeId);
    if (!block) {
      fail(`Missing [data-theme="${themeId}"] block in style/themes.css.`);
      continue;
    }

    const pageBg = extractToken(block, '--page-bg');
    const pageBg2 = extractToken(block, '--page-bg2');
    const panelBg = extractToken(block, '--panel-bg');

    const pageL = checkLightness(themeId, '--page-bg', pageBg, LIGHTNESS_RAILS.pageBg);
    checkLightness(themeId, '--page-bg2', pageBg2, LIGHTNESS_RAILS.pageBg2);
    const panelL = checkLightness(themeId, '--panel-bg', panelBg, LIGHTNESS_RAILS.panelBg);

    if (pageL != null && panelL != null) {
      const delta = Math.abs(panelL - pageL);
      if (delta < DELTA_RAILS.pageToPanelMin || delta > DELTA_RAILS.pageToPanelMax) {
        fail(`[${themeId}] |panel-bg - page-bg| lightness delta ${delta.toFixed(1)}% is out of range ${DELTA_RAILS.pageToPanelMin}%..${DELTA_RAILS.pageToPanelMax}%.`);
      } else {
        pass(`[${themeId}] page/panel lightness delta ${delta.toFixed(1)}% is balanced.`);
      }
    }

    checkContrast(themeId, 'key text vs key bg', extractToken(block, '--key-text'), extractToken(block, '--key-bg'), CONTRAST_FLOORS.key);
    checkContrast(themeId, 'brand text vs brand bg', extractToken(block, '--brand-text'), extractToken(block, '--brand'), CONTRAST_FLOORS.brand);
    checkContrast(themeId, 'body text vs panel bg', extractToken(block, '--text'), extractToken(block, '--panel-bg'), CONTRAST_FLOORS.text);
    checkContrast(themeId, 'muted text vs panel bg', extractToken(block, '--text-muted'), extractToken(block, '--panel-bg'), CONTRAST_FLOORS.textMuted);
  }

  if (failures) {
    console.error(`\nTheme balance check failed with ${failures} issue(s).`);
    process.exit(1);
  }
  console.log('\nTheme balance check passed.');
}

run();
