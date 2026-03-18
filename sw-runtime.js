/* Cornerstone runtime service worker
 * Freshness-first mode:
 * - no route or asset caching
 * - clears legacy app caches
 * - unregisters itself on activation
 */

const CACHE_PREFIX_RE = /^(wq-|cs-cache-|wordquest-|cornerstone-)/i;

async function clearLegacyCaches() {
  const names = await caches.keys();
  const targets = names.filter((name) => CACHE_PREFIX_RE.test(String(name || '')));
  if (targets.length) {
    await Promise.all(targets.map((name) => caches.delete(name)));
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await clearLegacyCaches();
    await self.clients.claim();
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    clients.forEach((client) => {
      client.postMessage({ type: 'CS_SW_DISABLED' });
    });
    await self.registration.unregister();
  })());
});

self.addEventListener('message', (event) => {
  if (event?.data === 'SKIP_WAITING' || event?.data?.type === 'WQ_SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', () => {
  // Freshness-first: never intercept fetches.
});
