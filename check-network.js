#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const failures = [];
  
  page.on('response', response => {
    if (response.status() === 404) {
      failures.push(response.url());
    }
  });
  
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:8080/game-platform.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log(`=== 404 Errors (${failures.length}) ===`);
    failures.slice(0, 10).forEach(url => {
      console.log(url);
    });
    
  } finally {
    await browser.close();
  }
})();
