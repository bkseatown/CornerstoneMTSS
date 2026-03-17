const { chromium } = require('playwright');

async function check() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:8080/game-platform.html?t=' + Date.now());
    await page.waitForTimeout(2000);

    const bodyInfo = await page.evaluate(() => {
      return {
        className: document.body.className,
        hasGamePlatformPage: document.body.classList.contains('game-platform-page'),
        allClasses: Array.from(document.body.classList)
      };
    });

    console.log(JSON.stringify(bodyInfo, null, 2));

  } finally {
    await browser.close();
  }
}

check();
