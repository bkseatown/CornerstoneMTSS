#!/usr/bin/env node
const { chromium } = require('playwright');

async function testTheme(theme) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto('http://127.0.0.1:8080/game-platform.html', { waitUntil: 'networkidle' });
    
    // Set theme
    await page.evaluate((t) => {
      document.body.setAttribute('data-game-theme', t);
      localStorage.setItem('cs.game.theme', t);
    }, theme === 'default' ? '' : theme);
    
    if (theme !== 'default') {
      await page.evaluate((t) => {
        if (t) document.body.setAttribute('data-game-theme', t);
        else document.body.removeAttribute('data-game-theme');
      }, theme === 'default' ? '' : theme);
    }
    
    await page.waitForTimeout(500);
    
    const bgColor = await page.locator('.cg-game-card').first().evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    const textColor = await page.locator('.cg-game-card h3').first().evaluate(el => 
      window.getComputedStyle(el).color
    );
    
    await page.screenshot({ path: `./screenshot-theme-${theme}.png`, fullPage: true });
    console.log(`${theme}: bg=${bgColor.substring(0, 30)} text=${textColor.substring(0, 30)}`);
  } finally {
    await browser.close();
  }
}

(async () => {
  const themes = ['default', 'ocean', 'seahawks', 'starbucks'];
  for (const theme of themes) {
    await testTheme(theme);
  }
})();
