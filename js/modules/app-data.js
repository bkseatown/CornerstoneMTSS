/**
 * app-data.js
 * Data loading and loading recovery UI
 */

const loadingEl = document.getElementById('loading-screen');
const LOADING_WATCHDOG_MS = 18000;
var loadingRecoveryShown = false;

function buildCacheBustedUrl() {
  const nextUrl = new URL(location.href);
  nextUrl.searchParams.set('cb', String(Date.now()));
  return nextUrl.toString();
}

async function clearRuntimeCacheAndReload() {
  if (typeof window !== 'undefined') window.__WQ_LOADING_RECOVERY_RUNNING__ = true;
  try {
    if ('caches' in window) {
      const names = await caches.keys();
      const targets = names.filter((name) => String(name || '').startsWith('wq-'));
      if (targets.length) await Promise.all(targets.map((name) => caches.delete(name)));
    }
  } catch {}
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length) {
        await Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)));
      }
    }
  } catch {}
  try { sessionStorage.removeItem('wq_sw_controller_reloaded'); } catch {}
  location.replace(buildCacheBustedUrl());
}

function showLoadingRecovery(message) {
  if (!loadingEl || loadingRecoveryShown) return;
  loadingRecoveryShown = true;
  const label = loadingEl.querySelector('span');
  if (label) label.textContent = String(message || 'Still loading...');
  const panel = document.createElement('div');
  panel.className = 'loading-recovery-panel';

  const detail = document.createElement('p');
  detail.className = 'loading-recovery-text';
  detail.textContent = 'This tab may be on an older cached build.';
  panel.appendChild(detail);

  const actions = document.createElement('div');
  actions.className = 'loading-recovery-actions';

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'loading-recovery-btn loading-recovery-btn-primary';
  resetBtn.textContent = 'Reset App Cache';
  resetBtn.addEventListener('click', async () => {
    resetBtn.disabled = true;
    resetBtn.textContent = 'Resetting...';
    await clearRuntimeCacheAndReload();
  });
  actions.appendChild(resetBtn);

  const retryBtn = document.createElement('button');
  retryBtn.type = 'button';
  retryBtn.className = 'loading-recovery-btn';
  retryBtn.textContent = 'Reload';
  retryBtn.addEventListener('click', () => {
    location.replace(buildCacheBustedUrl());
  });
  actions.appendChild(retryBtn);
  panel.appendChild(actions);
  loadingEl.appendChild(panel);
}

async function loadData() {
  loadingEl?.classList.remove('hidden');
  const loadingWatchdog = setTimeout(() => {
    showLoadingRecovery('Still loading. You can repair this tab.');
  }, LOADING_WATCHDOG_MS);
  try {
    await WQData.load();
    clearTimeout(loadingWatchdog);
  } catch (error) {
    clearTimeout(loadingWatchdog);
    console.warn('[WordQuest] Data load failed:', error?.message || error);
    showLoadingRecovery('Load failed. Repair cache and retry.');
    throw error;
  }
  loadingEl?.classList.add('hidden');
}

function isDataLoaded() {
  return WQData?.isLoaded?.() || false;
}

export { loadData, isDataLoaded, showLoadingRecovery };
