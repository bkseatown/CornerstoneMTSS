const { chromium } = require('playwright');

async function debugStyles() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:8080/game-platform.html?t=' + Date.now());
    await page.waitForTimeout(2000);

    // Get computed styles of first game card
    const styles = await page.evaluate(() => {
      const card = document.querySelector('.cg-game-card');
      if (!card) return { error: 'No card found' };
      
      const computed = window.getComputedStyle(card);
      const bodyStyles = window.getComputedStyle(document.body);
      
      return {
        cardBackground: computed.backgroundColor,
        cardClass: card.className,
        bodyTheme: document.body.getAttribute('data-game-theme'),
        rootVars: {
          '--cg-panel-strong': getComputedStyle(document.documentElement).getPropertyValue('--cg-panel-strong').trim(),
          '--cg-panel': getComputedStyle(document.documentElement).getPropertyValue('--cg-panel').trim(),
        }
      };
    });

    console.log(JSON.stringify(styles, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugStyles();
