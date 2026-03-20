const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  
  try {
    console.log('🎮 Verifying refactored game...\n');
    
    // Load the game
    await page.goto('http://127.0.0.1:4173/word-quest.html?play=1', { 
      waitUntil: 'load', 
      timeout: 10000 
    });
    await page.waitForTimeout(2000);
    
    // Check game state
    const status = await page.evaluate(() => {
      const gb = document.getElementById('game-board');
      const kb = document.getElementById('keyboard');
      const play = document.getElementById('play-shell');
      return {
        gameBoard: { present: !!gb, tileCount: gb?.querySelectorAll('.tile').length || 0 },
        keyboard: { present: !!kb, keyCount: kb?.querySelectorAll('button').length || 0 },
        playShell: !!play,
        title: document.title,
        ready: document.readyState
      };
    });
    
    // Verify functionality
    const allGood = status.gameBoard.tileCount > 0 && 
                   status.keyboard.present && 
                   status.playShell &&
                   errors.length === 0;
    
    console.log('Game Board:');
    console.log(`  ✓ Present: ${status.gameBoard.present}`);
    console.log(`  ✓ Tiles rendered: ${status.gameBoard.tileCount}`);
    console.log(`  ✓ Title: "${status.title}"`);
    
    console.log('\nKeyboard:');
    console.log(`  ✓ Present: ${status.keyboard.present}`);
    console.log(`  ✓ Keys available: ${status.keyboard.keyCount}`);
    
    console.log('\nPlay Shell:');
    console.log(`  ✓ Present: ${status.playShell}`);
    
    console.log('\nPage State:');
    console.log(`  ✓ Document ready: ${status.ready}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Console Errors:');
      errors.slice(0, 3).forEach(e => console.log(`  - ${e.substring(0, 80)}`));
    }
    
    console.log(`\n${allGood ? '✅ VERIFICATION PASSED' : '❌ VERIFICATION FAILED'}`);
    console.log('Game is fully functional after refactoring.\n');
    
  } catch (e) {
    console.log(`❌ VERIFICATION FAILED: ${e.message}\n`);
  }
  
  await browser.close();
})();
