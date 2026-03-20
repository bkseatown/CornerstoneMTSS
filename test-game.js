const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Collect console messages
  const messages = [];
  page.on('console', msg => {
    messages.push({ type: msg.type(), text: msg.text() });
  });
  
  // Collect page errors
  page.on('pageerror', error => {
    messages.push({ type: 'error', text: error.toString() });
  });
  
  // Navigate to the game
  console.log('Loading game...');
  try {
    await page.goto('http://127.0.0.1:4173/word-quest.html?play=1', { waitUntil: 'networkidle' });
  } catch (e) {
    console.log('Navigation error:', e.message);
  }
  
  // Wait a moment for any JS execution
  await page.waitForTimeout(2000);
  
  // Check what's rendered
  const bodyContent = await page.evaluate(() => {
    const gameboard = document.getElementById('game-board');
    const keyboard = document.getElementById('keyboard');
    const hero = document.getElementById('hero-v2');
    const content = document.body.innerText.substring(0, 500);
    return {
      hasGameBoard: !!gameboard,
      hasKeyboard: !!keyboard,
      hasHero: !!hero,
      gameboardHtml: gameboard ? gameboard.innerHTML.substring(0, 500) : 'not found',
      gameboardStyle: gameboard ? window.getComputedStyle(gameboard).display : 'N/A',
      dataHomeMode: document.documentElement.getAttribute('data-home-mode'),
      windowLocation: window.location.href,
      bodyText: content.substring(0, 200)
    };
  });
  
  console.log('=== GAME BOARD CHECK ===');
  console.log(JSON.stringify(bodyContent, null, 2));
  
  console.log('\n=== CONSOLE MESSAGES ===');
  messages.slice(0, 30).forEach(msg => console.log(`[${msg.type}] ${msg.text}`));
  
  await browser.close();
})();
