const { test, expect } = require('@playwright/test');

function esc(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe('Navigation integrity', () => {
  test('global nav links resolve to canonical pages without same-origin 4xx/5xx', async ({ page, baseURL }) => {
    const origin = new URL(baseURL || 'http://127.0.0.1:4173').origin;
    const failedResponses = [];

    page.on('response', (response) => {
      const url = response.url();
      if (!url.startsWith(origin)) return;
      const status = response.status();
      if (status >= 400) {
        failedResponses.push({ status, url });
      }
    });

    const links = [
      { label: 'Home', path: '/index.html' },
      { label: 'Teacher Dashboard', path: '/teacher-dashboard.html' },
      { label: 'Word Quest', path: '/word-quest.html' },
      { label: 'Reading Lab', path: '/reading-lab.html' },
      { label: 'Sentence Studio', path: '/sentence-surgery.html' },
      { label: 'Decoding Diagnostic', path: '/activities/decoding-diagnostic.html' },
      { label: 'Writing Studio', path: '/writing-studio.html' },
      { label: 'Numeracy', path: '/numeracy.html' },
      { label: 'Admin Dashboard', path: '/admin-dashboard.html' }
    ];

    await page.goto('/teacher-dashboard.html', { waitUntil: 'domcontentloaded' });

    for (const item of links) {
      await page.getByRole('link', { name: item.label }).first().click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(new RegExp(esc(item.path)));
      await page.goto('/teacher-dashboard.html', { waitUntil: 'domcontentloaded' });
    }

    const realFailures = failedResponses.filter((row) => !/\/favicon\.ico(?:\?|$)/.test(row.url));
    expect(
      realFailures,
      `same-origin request failures detected:\n${JSON.stringify(realFailures, null, 2)}`
    ).toEqual([]);
  });
});

