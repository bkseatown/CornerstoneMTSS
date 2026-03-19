const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const messages = [];
  page.on('console', msg => messages.push(msg.text()));
  
  try {
    await page.goto('https://bkseatown.github.io/CornerstoneMTSS/word-quest.html?play=1', { 
      waitUntil: 'networkidle',
      timeout: 10000
    });
    await page.waitForTimeout(2000);
    
    const status = await page.evaluate(() => {
      const gameboard = document.getElementById('game-board');
      return {
        hasGameBoard: !!gameboard,
        tileCount: gameboard ? gameboard.querySelectorAll('.tile').length : 0,
        dataHomeMode: document.documentElement.getAttribute('data-home-mode')
      };
    });
    
    console.log('✓ Live site loaded successfully');
    console.log(JSON.stringify(status, null, 2));
    console.log('Console messages:', messages.slice(0, 5));
  } catch (e) {
    console.log('✗ Live site error:', e.message);
  }
  
  await browser.close();
})();
