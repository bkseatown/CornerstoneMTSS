#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto('http://127.0.0.1:8080/game-platform.html', { waitUntil: 'networkidle' });
    
    // Wait for content to render
    await page.waitForTimeout(2000);
    
    const cardCount = await page.locator('.cg-game-card').count();
    const dataShellView = await page.getAttribute('body', 'data-shell-view');
    const dataTheme = await page.getAttribute('body', 'data-game-theme');
    
    console.log(`Found ${cardCount} game cards`);
    console.log(`data-shell-view: ${dataShellView}`);
    console.log(`data-game-theme: ${dataTheme}`);
    
    await page.screenshot({ path: './screenshot-full.png', fullPage: true });
    console.log('✅ Screenshot saved');
  } finally {
    await browser.close();
  }
})();
