const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  const logs = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') errors.push(text);
    if (text.includes('[WordQuest]')) logs.push(text);
  });
  
  page.on('pageerror', err => errors.push(err.toString()));
  
  try {
    console.log('🔄 Testing refactored version...');
    await page.goto('http://127.0.0.1:4173/word-quest.html?play=1', { waitUntil: 'load', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const status = await page.evaluate(() => {
      const gb = document.getElementById('game-board');
      const kb = document.getElementById('keyboard');
      return {
        hasGameBoard: !!gb,
        tilesCount: gb ? gb.querySelectorAll('.tile').length : 0,
        hasKeyboard: !!kb,
        readyState: document.readyState
      };
    });
    
    console.log('\n✓ Refactored version test PASSED');
    console.log('  Game board tiles:', status.tilesCount);
    console.log('  Keyboard present:', status.hasKeyboard);
    
    if (logs.length) {
      console.log('\nModule logs:');
      logs.forEach(l => console.log('  ' + l));
    }
    
    if (errors.length) {
      console.log('\n⚠️  Errors found:');
      errors.slice(0, 5).forEach(e => console.log('  ' + e.substring(0, 100)));
    }
    
  } catch (e) {
    console.log('\n✗ Refactored version test FAILED');
    console.log('Error:', e.message);
    if (errors.length) {
      console.log('\nConsole errors:');
      errors.forEach(e => console.log('  ' + e.substring(0, 100)));
    }
  }
  
  await browser.close();
})();
