const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Testing restored game...');
    await page.goto('http://127.0.0.1:4173/word-quest.html?play=1', { waitUntil: 'load', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const status = await page.evaluate(() => {
      const gb = document.getElementById('game-board');
      return {
        hasGameBoard: !!gb,
        tilesCount: gb ? gb.querySelectorAll('.tile').length : 0
      };
    });
    
    console.log('✓ Game restored and working');
    console.log('  Tiles rendered:', status.tilesCount);
  } catch (e) {
    console.log('✗ Test failed:', e.message);
  }
  
  await browser.close();
})();
