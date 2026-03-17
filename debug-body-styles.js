const { chromium } = require('playwright');

async function debug() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:8080/game-platform.html?t=' + Date.now());
    await page.waitForTimeout(2000);

    const info = await page.evaluate(() => {
      const card = document.querySelector('.cg-game-card');
      const body = document.body;
      const html = document.documentElement;
      
      return {
        // Check computed styles directly on elements
        cardBg: window.getComputedStyle(card).backgroundColor,
        bodyPanelStrong: window.getComputedStyle(body).getPropertyValue('--cg-panel-strong'),
        htmlPanelStrong: window.getComputedStyle(html).getPropertyValue('--cg-panel-strong'),
        
        // Check if stylesheet is loaded
        sheets: Array.from(document.styleSheets).map(s => s.href ? s.href.split('/').pop() : 'inline'),
        
        // Check raw variable value
        rootComputedPanel: getComputedStyle(document.documentElement).getPropertyValue('--cg-panel'),
      };
    });

    console.log(JSON.stringify(info, null, 2));

  } finally {
    await browser.close();
  }
}

debug();
