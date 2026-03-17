#!/usr/bin/env node
const { chromium } = require('playwright');
const path = require('path');

async function takeZoomedScreenshot() {
  const url = process.argv[2] || 'http://localhost:8080/game-platform.html';
  const outputPath = process.argv[3] || './screenshot-zoomed.png';
  const theme = process.argv[4] || 'default';

  console.log(`🎬 Taking zoomed screenshot of: ${url}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Set viewport to higher resolution
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Switch theme if needed
    if (theme !== 'default') {
      await page.evaluate((themeId) => {
        document.body.setAttribute('data-game-theme', themeId);
        localStorage.setItem('cs.game.theme', themeId);
      }, theme);
      await page.waitForTimeout(1000);
    }

    // Scroll to game cards section
    await page.evaluate(() => {
      const cardSection = document.querySelector('.cg-game-grid') || document.querySelector('[class*="card"]');
      if (cardSection) {
        cardSection.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    });

    await page.waitForTimeout(500);

    // Take full page screenshot
    const fullPath = path.resolve(outputPath);
    await page.screenshot({ path: fullPath, fullPage: true });

    console.log(`✅ Screenshot saved to: ${fullPath}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

takeZoomedScreenshot();
