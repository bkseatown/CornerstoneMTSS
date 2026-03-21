/**
 * app-build-maintenance.js
 * Share-link and live-build maintenance helpers.
 */

function createBuildMaintenanceModule(deps) {
  const {
    copyTextToClipboard = async () => {},
    demoMode = false,
    fetchImpl = (...args) => fetch(...args),
    locationRef = location,
    localStorageRef = null,
    navigatorRef = navigator,
    resolveBuildLabel = () => '',
    sessionStorageRef = null,
    setTimeoutRef = setTimeout,
    showToast = () => {},
    windowRef = window
  } = deps || {};

  function buildStableShareLinkUrl() {
    const url = new URL(windowRef.location.href);
    url.searchParams.delete('cb');
    return url.toString();
  }

  async function copyReviewLink() {
    await copyTextToClipboard(
      buildStableShareLinkUrl(),
      'Share link copied. This link always points to the latest deployed version.',
      'Could not copy share link on this device.'
    );
  }

  async function runAutoCacheRepairForBuild() {
    if (demoMode) return;
    const cacheRepairBuildKey = 'wq_v2_cache_repair_build_v1';
    const buildLabel = resolveBuildLabel();
    if (!buildLabel) return;
    let priorBuild = '';
    try {
      priorBuild = String(localStorageRef?.getItem(cacheRepairBuildKey) || '');
      localStorageRef?.setItem?.(cacheRepairBuildKey, buildLabel);
    } catch {
      priorBuild = '';
    }
    if (priorBuild === buildLabel) return;
    if (!('caches' in windowRef)) return;
    try {
      const names = await windowRef.caches.keys();
      const targets = names.filter((name) => String(name || '').startsWith('wq-'));
      if (targets.length) await Promise.all(targets.map((name) => windowRef.caches.delete(name)));
    } catch {}
    if ('serviceWorker' in navigatorRef) {
      try {
        const registrations = await navigatorRef.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.update().catch(() => {})));
      } catch {}
    }
  }

  async function runRemoteBuildConsistencyCheck() {
    if (demoMode) return;
    if (new URLSearchParams(locationRef.search || '').get('audit') === '1') return;
    const buildRemoteCheckKey = 'wq_v2_build_remote_check_v1';
    const currentBuild = resolveBuildLabel();
    if (!currentBuild) return;

    const checkMarker = `${locationRef.pathname}::${currentBuild}`;
    try {
      if (sessionStorageRef?.getItem(buildRemoteCheckKey) === checkMarker) return;
      sessionStorageRef?.setItem?.(buildRemoteCheckKey, checkMarker);
    } catch {}

    try {
      const probeUrl = `./index.html?cb=build-check-${Date.now()}`;
      const response = await fetchImpl(probeUrl, { cache: 'no-store' });
      if (!response.ok) return;
      const html = await response.text();
      const match = html.match(/js\/app\.js\?v=([^"'&#]+)/i);
      const deployedBuild = match?.[1] ? decodeURIComponent(match[1]).trim() : '';
      if (!deployedBuild || deployedBuild === currentBuild) return;

      if ('caches' in windowRef) {
        try {
          const names = await windowRef.caches.keys();
          const targets = names.filter((name) => String(name || '').startsWith('wq-'));
          if (targets.length) await Promise.all(targets.map((name) => windowRef.caches.delete(name)));
        } catch {}
      }

      if ('serviceWorker' in navigatorRef) {
        try {
          const registrations = await navigatorRef.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(async (registration) => {
            registration.waiting?.postMessage({ type: 'WQ_SKIP_WAITING' });
            await registration.update().catch(() => {});
          }));
        } catch {}
      }

      const reloadKey = 'wq_v2_build_sync_once_v1';
      let alreadyReloaded = false;
      try {
        alreadyReloaded = sessionStorageRef?.getItem(reloadKey) === deployedBuild;
      } catch {}
      if (alreadyReloaded) return;
      try {
        sessionStorageRef?.setItem?.(reloadKey, deployedBuild);
      } catch {}

      showToast('Update available. Refreshing...');
      const params = new URLSearchParams(locationRef.search || '');
      params.set('cb', `build-sync-${deployedBuild}-${Date.now()}`);
      const nextUrl = `${locationRef.pathname}${params.toString() ? `?${params.toString()}` : ''}${locationRef.hash || ''}`;
      setTimeoutRef(() => locationRef.replace(nextUrl), 380);
    } catch {}
  }

  function installBuildConsistencyHeartbeat() {
    if (demoMode) return;
    const heartbeatMs = 5 * 60 * 1000;
    setInterval(() => { void runRemoteBuildConsistencyCheck(); }, heartbeatMs);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void runRemoteBuildConsistencyCheck();
      }
    });
  }

  return {
    buildStableShareLinkUrl,
    copyReviewLink,
    installBuildConsistencyHeartbeat,
    runAutoCacheRepairForBuild,
    runRemoteBuildConsistencyCheck
  };
}

window.createBuildMaintenanceModule = createBuildMaintenanceModule;
