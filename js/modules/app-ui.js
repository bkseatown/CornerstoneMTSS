/**
 * app-ui.js
 * UI initialization and service worker runtime registration
 */

const APP_SEMVER = '1.0.0';
const REFRESH_BANNER_LAST_ACTION_KEY = 'wq_refresh_banner_last_action_v1';
const SW_RUNTIME_VERSION = '20260302-v1';

function resolveSwRuntimeVersion() {
  try {
    const payload = window.CS_BUILD || window.__BUILD__ || window.__CS_BUILD__ || {};
    const buildId = String(payload.buildId || payload.stamp || payload.version || '').trim();
    if (buildId) return buildId;
  } catch {}
  try {
    const qp = String(new URLSearchParams(window.location.search || '').get('v') || '').trim();
    if (qp) return qp;
  } catch {}
  return SW_RUNTIME_VERSION;
}

const SW_RUNTIME_RESOLVED_VERSION = resolveSwRuntimeVersion();
const SW_RUNTIME_URL = `./sw-runtime.js?v=${encodeURIComponent(SW_RUNTIME_RESOLVED_VERSION)}`;
var swUpdateToastEl = null;

function showSwUpdateToast(onUpdateNow) {
  if (swUpdateToastEl) return;
  const toast = document.createElement('div');
  toast.className = 'cs-sw-update-toast';
  toast.innerHTML = '<span>Update available.</span><button type="button">Update now</button>';
  Object.assign(toast.style, {
    position: 'fixed',
    right: '12px',
    bottom: '12px',
    zIndex: '9999',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '12px',
    background: 'rgba(12,18,30,0.9)',
    border: '1px solid rgba(255,255,255,0.16)',
    color: 'rgba(255,255,255,0.92)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.32)'
  });
  const btn = toast.querySelector('button');
  if (btn) {
    Object.assign(btn.style, {
      borderRadius: '999px',
      border: '1px solid rgba(160,220,255,0.4)',
      background: 'rgba(90,170,255,0.25)',
      color: 'rgba(245,250,255,0.95)',
      fontWeight: '700',
      padding: '5px 10px',
      cursor: 'pointer'
    });
    btn.addEventListener('click', () => {
      try { onUpdateNow?.(); } catch {}
      toast.remove();
      swUpdateToastEl = null;
    });
  }
  document.body.appendChild(toast);
  swUpdateToastEl = toast;
}

function isOfflineRuntimeEnabled() {
  // Runtime service worker is intentionally disabled to avoid stale-cache
  // route hijacks on GitHub Pages deployments.
  return false;
}

async function unregisterOfflineRuntime() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((reg) => reg.unregister().catch(() => false)));
  } catch (_e) {
    // no-op
  }
}

async function registerOfflineRuntime(demoMode) {
  if (demoMode) return;
  if (!('serviceWorker' in navigator)) return;
  if (!isOfflineRuntimeEnabled()) {
    await unregisterOfflineRuntime();
    return;
  }
  if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    return;
  }
  try {
    const runtimeCheck = await fetch(SW_RUNTIME_URL, { cache: 'no-store' });
    if (!runtimeCheck.ok) {
      console.info('[WordQuest] Service worker runtime unavailable; skipping registration.');
      return;
    }
    let shouldAttachReloadListener = true;
    try {
      shouldAttachReloadListener = sessionStorage.getItem('wq_sw_controller_reloaded') !== '1';
    } catch {
      shouldAttachReloadListener = true;
    }
    if (shouldAttachReloadListener) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        let alreadyReloaded = false;
        try {
          alreadyReloaded = sessionStorage.getItem('wq_sw_controller_reloaded') === '1';
        } catch {
          alreadyReloaded = false;
        }
        if (alreadyReloaded) return;
        try {
          sessionStorage.setItem('wq_sw_controller_reloaded', '1');
        } catch {}
        location.reload();
      }, { once: true });
    }
    const registration = await navigator.serviceWorker.register(SW_RUNTIME_URL, {
      scope: './',
      updateViaCache: 'none'
    });
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          showSwUpdateToast(() => installing.postMessage({ type: 'WQ_SKIP_WAITING' }));
        }
      });
    });
    if (registration.waiting) {
      showSwUpdateToast(() => registration.waiting?.postMessage({ type: 'WQ_SKIP_WAITING' }));
    }
    registration.update().catch(() => {});
  } catch (error) {
    console.warn('[WordQuest] Service worker registration skipped:', error?.message || error);
  }
}

async function initUI(demoMode) {
  WQUI.init();
  await registerOfflineRuntime(demoMode);
}

export { initUI, showSwUpdateToast, resolveSwRuntimeVersion, isOfflineRuntimeEnabled };
