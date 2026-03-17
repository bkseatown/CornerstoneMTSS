#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const logs = [];
  
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    logs.push(`[ERROR] ${err.message}`);
  });
  
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:8080/game-platform.html', { waitUntil: 'networkidle' });
    
    // Wait a bit
    await page.waitForTimeout(5000);
    
    console.log('=== Console Logs ===');
    logs.forEach(log => console.log(log));
    
    // Check if shell is in DOM
    const shellHtml = await page.locator('#cg-shell').innerHTML();
    console.log(`\n=== Shell HTML (first 200 chars) ===`);
    console.log(shellHtml.substring(0, 200));
    
  } finally {
    await browser.close();
  }
})();
