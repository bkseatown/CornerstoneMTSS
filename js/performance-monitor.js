/**
 * performance-monitor.js
 * Advanced Monitoring & Analytics: Real User Monitoring (RUM)
 *
 * Tracks Core Web Vitals and performance metrics
 * Enables real-time performance visibility
 */

(function PerformanceMonitor() {
  'use strict';

  const metrics = {
    lcp: null,
    inp: null,
    cls: null,
    ttfb: null,
    fcp: null,
    resourceCount: 0,
    moduleLoadTimes: {},
    userInteractions: 0,
    errorCount: 0,
  };

  function observeLCP() {
    if (!('PerformanceObserver' in window)) return;
    try {
      const observer = new PerformanceObserver((list) => {
        const lastEntry = list.getEntries()[list.getEntries().length - 1];
        metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        console.log(`[Monitor] LCP: ${metrics.lcp.toFixed(0)}ms`);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('[Monitor] LCP error:', e.message);
    }
  }

  function observeCLS() {
    if (!('PerformanceObserver' in window)) return;
    metrics.cls = 0;
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) metrics.cls += entry.value;
        });
        console.log(`[Monitor] CLS: ${metrics.cls.toFixed(3)}`);
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('[Monitor] CLS error:', e.message);
    }
  }

  function observeNavigationTiming() {
    if (!window.performance) return;
    const perfTiming = window.performance.timing;
    metrics.ttfb = perfTiming.responseStart - perfTiming.navigationStart;
    metrics.fcp = window.performance.getEntriesByName('first-contentful-paint')[0]?.startTime || null;
    console.log(`[Monitor] TTFB: ${metrics.ttfb}ms, FCP: ${metrics.fcp?.toFixed(0)}ms`);
  }

  function observeResourceTiming() {
    if (!window.performance || !window.performance.getEntriesByType) return;
    const resources = window.performance.getEntriesByType('resource');
    metrics.resourceCount = resources.length;
    console.log(`[Monitor] Resources: ${metrics.resourceCount}`);
  }

  function trackModuleLoad(moduleName, loadTime) {
    metrics.moduleLoadTimes[moduleName] = loadTime;
    console.log(`[Monitor] Module: ${moduleName} (${loadTime.toFixed(1)}ms)`);
  }

  function getCoreWebVitals() {
    return {
      LCP: metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : 'pending',
      CLS: metrics.cls !== null ? metrics.cls.toFixed(3) : 'pending',
      TTFB: metrics.ttfb ? `${metrics.ttfb}ms` : 'pending',
    };
  }

  function getMetrics() {
    return {
      coreWebVitals: getCoreWebVitals(),
      resources: metrics.resourceCount,
      modules: metrics.moduleLoadTimes,
      errors: metrics.errorCount,
    };
  }

  function sendMetrics(endpoint) {
    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      url: window.location.href,
      metrics: getMetrics(),
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, payload);
    }
  }

  function init() {
    console.log('[Monitor] Performance monitoring initialized');
    observeLCP();
    observeCLS();
    observeNavigationTiming();
    observeResourceTiming();
    window.addEventListener('beforeunload', () => {
      sendMetrics(window.location.origin + '/api/metrics');
    });
  }

  window.PerformanceMonitor = {
    init,
    trackModuleLoad,
    getMetrics,
    getCoreWebVitals,
    sendMetrics,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
