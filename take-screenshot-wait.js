#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:8080/game-platform.html', { waitUntil: 'networkidle' });
    
    // Wait for shell to render
    console.log('Waiting for shell to render...');
    await page.waitForSelector('.cg-shell', { timeout: 10000 }).catch(() => {});
    
    // Wait for game cards to appear
    await page.waitForTimeout(3000);
    
    // Check if gallery is loaded
    const hasCards = await page.locator('.cg-game-card').count();
    console.log(`Found ${hasCards} game cards`);
    
    // Get body attributes
    const dataView = await page.getAttribute('body', 'data-shell-view');
    const dataTheme = await page.getAttribute('body', 'data-game-theme');
    console.log(`data-shell-view: ${dataView}`);
    console.log(`data-game-theme: ${dataTheme}`);
    
    await page.screenshot({ path: './screenshot-wait.png', fullPage: true });
    console.log('✅ Screenshot saved');
  } finally {
    await browser.close();
  }
})();
