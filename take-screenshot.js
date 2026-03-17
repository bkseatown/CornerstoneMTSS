#!/usr/bin/env node
/**
 * Screenshot tool using Playwright
 * Usage: node take-screenshot.js [url] [output-path] [theme]
 *
 * Examples:
 *   node take-screenshot.js http://localhost:8080/game-platform.html ./screenshot.png default
 *   node take-screenshot.js http://localhost:8080/game-platform.html ./screenshot.png seahawks
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function takeScreenshot() {
  const url = process.argv[2] || 'http://localhost:8080/game-platform.html';
  const outputPath = process.argv[3] || './screenshot.png';
  const theme = process.argv[4] || 'default';

  console.log(`🎬 Taking screenshot of: ${url}`);
  console.log(`💾 Output: ${outputPath}`);
  console.log(`🎨 Theme: ${theme}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Set viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to page
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for content to render
    await page.waitForTimeout(2000);

    // If theme is not default, switch it
    if (theme !== 'default') {
      await page.evaluate((themeId) => {
        document.body.setAttribute('data-game-theme', themeId);
        localStorage.setItem('cs.game.theme', themeId);
      }, theme);

      // Wait for theme to apply
      await page.waitForTimeout(1000);
    }

    // Take screenshot
    const fullPath = path.resolve(outputPath);
    await page.screenshot({ path: fullPath, fullPage: false });

    console.log(`✅ Screenshot saved to: ${fullPath}`);
    console.log(`📏 Viewport: 1440x900`);

  } catch (error) {
    console.error('❌ Error taking screenshot:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
