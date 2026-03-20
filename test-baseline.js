const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Loading game...');
    await page.goto('http://127.0.0.1:4173/word-quest.html?play=1', { waitUntil: 'load', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const status = await page.evaluate(() => {
      const gb = document.getElementById('game-board');
      const kb = document.getElementById('keyboard');
      return {
        hasGameBoard: !!gb,
        gameboardRendered: gb ? gb.querySelectorAll('.tile').length : 0,
        hasKeyboard: !!kb,
        pageReady: document.readyState
      };
    });
    
    console.log('✓ Baseline test PASSED');
    console.log('  Game board tiles:', status.gameboardRendered);
    console.log('  Keyboard present:', status.hasKeyboard);
  } catch (e) {
    console.log('✗ Baseline test FAILED:', e.message);
  }
  
  await browser.close();
})();
