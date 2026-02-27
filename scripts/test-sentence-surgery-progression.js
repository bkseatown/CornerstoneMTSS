#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

async function run() {
  let playwright;
  try {
    playwright = require('playwright');
  } catch {
    throw new Error('Playwright is required. Run: npm install --no-save playwright');
  }

  const root = process.cwd();
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(String(req.url || '/').split('?')[0]);
    const rawPath = urlPath === '/' ? '/sentence-surgery.html' : urlPath;
    const safePath = path.normalize(rawPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = path.join(root, safePath);
    if (!filePath.startsWith(root)) {
      res.statusCode = 403;
      res.end('forbidden');
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end('not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const type = ext === '.html'
        ? 'text/html'
        : ext === '.js'
          ? 'application/javascript'
          : ext === '.css'
            ? 'text/css'
            : 'application/octet-stream';
      res.setHeader('content-type', type);
      res.end(data);
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/sentence-surgery.html?debug=1`;

  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    await page.getByRole('button', { name: 'Add Why' }).click();
    await page.waitForSelector('.ss-blank[data-blank-id="why1"]', { state: 'visible', timeout: 5000 });
    const focusedWhy = await page.evaluate(() => {
      const el = document.activeElement;
      return !!el && el.classList && el.classList.contains('ss-blank') && el.getAttribute('data-blank-id') === 'why1';
    });
    if (!focusedWhy) throw new Error('Why blank did not receive focus.');

    await page.locator('.ss-blank[data-blank-id="why1"]').type('it heard a crash');

    await page.getByRole('button', { name: 'Add Detail' }).click();
    await page.waitForSelector('.ss-blank[data-blank-id="detailAdj"]', { state: 'visible', timeout: 5000 });
    const detailBeforeDog = await page.evaluate(() => {
      const sentence = document.getElementById('ssSentence');
      const blank = sentence.querySelector('.ss-blank[data-blank-id="detailAdj"]');
      if (!blank) return false;
      const next = blank.nextSibling;
      return !!next && String(next.textContent || '').toLowerCase().includes(' dog');
    });
    if (!detailBeforeDog) throw new Error('Detail blank is not rendered before noun token.');

    await page.locator('.ss-blank[data-blank-id="detailAdj"]').type('tired');

    await page.getByRole('button', { name: 'Done' }).click();
    await page.waitForTimeout(2200);
    await page.waitForSelector('#ssCompleteActions:not(.hidden)', { state: 'visible', timeout: 5000 });

    const screenshotPath = path.join(root, 'reports', 'sentence-surgery-progression.png');
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log('PASS test-sentence-surgery-progression');
    console.log(`screenshot=${screenshotPath}`);
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((error) => {
  console.error(`FAIL test-sentence-surgery-progression: ${error.message || error}`);
  process.exitCode = 1;
});
