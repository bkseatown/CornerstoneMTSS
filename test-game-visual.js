const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  
  await page.goto('http://127.0.0.1:4173/word-quest.html?play=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check CSS rendering
  const styles = await page.evaluate(() => {
    const gameboard = document.getElementById('game-board');
    const keyboard = document.getElementById('keyboard');
    const playShell = document.getElementById('play-shell');
    const body = document.body;
    
    const getStyle = (el) => {
      if (!el) return 'element not found';
      const cs = window.getComputedStyle(el);
      return {
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        position: cs.position,
        width: cs.width,
        height: cs.height,
        backgroundColor: cs.backgroundColor,
        color: cs.color
      };
    };
    
    return {
      gameboard: getStyle(gameboard),
      keyboard: getStyle(keyboard),
      playShell: getStyle(playShell),
      body: getStyle(body),
      tiles: {
        count: gameboard ? gameboard.querySelectorAll('.tile').length : 0,
        firstTileContent: gameboard ? gameboard.querySelector('.tile').innerHTML : 'no board'
      }
    };
  });
  
  console.log('=== CSS STYLES ===');
  console.log(JSON.stringify(styles, null, 2));
  
  // Take a screenshot
  await page.screenshot({ path: '/tmp/game-screenshot.png', fullPage: true });
  console.log('\n✓ Screenshot saved to /tmp/game-screenshot.png');
  
  await browser.close();
})();
