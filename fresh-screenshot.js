const { chromium } = require('playwright');
const path = require('path');

async function freshScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Disable caching
    await page.context().clearCookies();
    
    // Set high DPI viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate with no-cache
    await page.goto('http://localhost:8080/game-platform.html?cache=none&t=' + Date.now(), { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(2000);

    // Take screenshot
    const filepath = path.resolve('/tmp/screenshot-fresh.png');
    await page.screenshot({ path: filepath, fullPage: true });
    console.log('✅ Screenshot: ' + filepath);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

freshScreenshot();
