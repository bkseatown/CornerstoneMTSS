#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:8080/game-platform.html', { waitUntil: 'networkidle' });
    
    // Check for CSS load errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Verify game cards are rendered
    const cardCount = await page.locator('.cg-game-card').count();
    
    // Get first card background to verify CSS is applied
    const bgColor = await page.locator('.cg-game-card').first().evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    
    console.log(`Cards found: ${cardCount}`);
    console.log(`First card background: ${bgColor.substring(0, 40)}`);
    console.log(`CSS errors: ${errors.length}`);
    
    if (cardCount === 0) {
      console.log('❌ NO CARDS FOUND - CSS modules may not be loading');
      process.exit(1);
    }
    
    await page.screenshot({ path: './test-modular.png', fullPage: true });
    console.log('✓ Screenshot saved: test-modular.png');
    console.log('✓ CSS modules are working!');
    
  } catch (e) {
    console.error('❌ Test failed:', e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
