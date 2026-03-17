const { chromium } = require('playwright');

async function inspect() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:8080/game-platform.html?t=' + Date.now());
    await page.waitForTimeout(2000);

    const cardInfo = await page.evaluate(() => {
      const card = document.querySelector('.cg-game-card');
      
      return {
        innerHTML: card.innerHTML.substring(0, 200),
        allAttrs: Object.fromEntries([...card.attributes].map(a => [a.name, a.value])),
        inlineStyle: card.getAttribute('style'),
        classList: Array.from(card.classList),
        outerHTML: card.outerHTML.substring(0, 300),
        // Try to find what's actually visible
        computedAll: {
          background: getComputedStyle(card).background,
          backgroundColor: getComputedStyle(card).backgroundColor,
          backgroundImage: getComputedStyle(card).backgroundImage,
          opacity: getComputedStyle(card).opacity,
        }
      };
    });

    console.log(JSON.stringify(cardInfo, null, 2));

  } finally {
    await browser.close();
  }
}

inspect();
