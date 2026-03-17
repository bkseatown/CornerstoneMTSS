#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto('http://127.0.0.1:8080/game-platform.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Get the first game card
    const card = await page.locator('.cg-game-card').first();
    if (!card) {
      console.log('No game card found');
      return;
    }
    
    // Get computed styles
    const bg = await card.evaluate(el => window.getComputedStyle(el).backgroundColor);
    const backgroundImage = await card.evaluate(el => window.getComputedStyle(el).backgroundImage);
    const color = await card.evaluate(el => window.getComputedStyle(el).color);
    
    console.log(`Background color: ${bg}`);
    console.log(`Background image: ${backgroundImage}`);
    console.log(`Text color: ${color}`);
    
    // Check body attributes
    const shellView = await page.getAttribute('body', 'data-shell-view');
    console.log(`\nBody data-shell-view: ${shellView}`);
    
    // Check the actual CSS content
    const cssContent = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      const gameShellSheet = styleSheets.find(sheet => sheet.href?.includes('game-shell.css'));
      if (!gameShellSheet) return 'Game shell sheet not found';
      
      const rules = Array.from(gameShellSheet.cssRules || []);
      const galleryRules = rules.filter(r => r.selectorText?.includes('gallery'));
      
      return galleryRules.slice(0, 3).map(r => `${r.selectorText}: ${r.style.cssText}`).join('\n');
    });
    
    console.log(`\nCSS Rules:${cssContent}`);
    
  } finally {
    await browser.close();
  }
})();
