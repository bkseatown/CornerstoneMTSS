/**
 * Performance Monitoring Module
 *
 * Tracks Core Web Vitals and performance metrics
 * Compares against budgets defined in config/performance-budget.json
 * Sends data for analytics and alerting
 *
 * Core Web Vitals:
 * - LCP (Largest Contentful Paint) - loading performance
 * - FID (First Input Delay) - interactivity
 * - CLS (Cumulative Layout Shift) - visual stability
 *
 * @module js/performance-monitor
 */

/**
 * Performance monitoring configuration
 */
const config = {
  enabled: true,
  reportingUrl: null, // Set to analytics endpoint for production
  thresholds: {
    lcp: 2500,      // 2.5 seconds (good)
    fid: 100,       // 100ms (good)
    cls: 0.1,       // 0.1 (good)
    fcp: 1200,      // First Contentful Paint
    ttfb: 600       // Time to First Byte
  },
  storage: true    // Store metrics in localStorage
};

/**
 * Metrics collector
 */
const metrics = {
  lcp: null,       // Largest Contentful Paint
  fid: null,       // First Input Delay
  cls: null,       // Cumulative Layout Shift
  fcp: null,       // First Contentful Paint
  ttfb: null,      // Time to First Byte
  navigationStart: performance.now(),
  measurements: []
};

// ============================================================================
// Web Vitals Collection
// ============================================================================

/**
 * Observe Largest Contentful Paint (LCP)
 * Measures loading performance
 */
function observeLCP() {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('[performance-monitor] LCP observation not available:', e.message);
  }
}

/**
 * Observe First Input Delay (FID)
 * Measures interactivity / responsiveness
 */
function observeFID() {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.processingDuration > 0) {
          metrics.fid = entry.processingDuration;
          recordMeasurement('FID', metrics.fid, 'ms');
        }
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    console.warn('[performance-monitor] FID observation not available:', e.message);
  }
}

/**
 * Observe Cumulative Layout Shift (CLS)
 * Measures visual stability
 */
function observeCLS() {
  try {
    let clsValue = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          metrics.cls = clsValue;
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('[performance-monitor] CLS observation not available:', e.message);
  }
}

/**
 * Measure First Contentful Paint (FCP)
 * Time when first content paints
 */
function measureFCP() {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        metrics.fcp = entries[0].startTime;
        recordMeasurement('FCP', metrics.fcp, 'ms');
      }
    });

    observer.observe({ entryTypes: ['paint'] });
  } catch (e) {
    console.warn('[performance-monitor] FCP measurement not available:', e.message);
  }
}

/**
 * Measure Time to First Byte (TTFB)
 * Time until first response byte received
 */
function measureTTFB() {
  try {
    if (performance.timing) {
      const ttfb = performance.timing.responseStart - performance.timing.navigationStart;
      metrics.ttfb = Math.max(0, ttfb);
      recordMeasurement('TTFB', metrics.ttfb, 'ms');
    }
  } catch (e) {
    console.warn('[performance-monitor] TTFB measurement not available:', e.message);
  }
}

// ============================================================================
// Measurement & Analysis
// ============================================================================

/**
 * Record a measurement
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @param {string} unit - Unit (ms, kb, etc)
 */
function recordMeasurement(name, value, unit = 'ms') {
  const measurement = {
    timestamp: new Date().toISOString(),
    name,
    value,
    unit,
    status: getMetricStatus(name, value)
  };

  metrics.measurements.push(measurement);
}

/**
 * Get metric status (good, needs improvement, poor)
 * Based on Web Vitals thresholds
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @returns {string} Status: 'good' | 'needs-improvement' | 'poor'
 */
function getMetricStatus(name, value) {
  // Good, needs improvement, poor thresholds (Google Web Vitals)
  const thresholds = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 600, poor: 1200 }
  };

  const threshold = thresholds[name];
  if (!threshold) return 'unknown';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Compare metrics against budgets
 * @returns {Object} Budget comparison results
 */
function checkBudgets() {
  const budgets = config.thresholds;
  const results = {};

  Object.entries(metrics).forEach(([key, value]) => {
    if (key.startsWith('_') || !value || typeof value !== 'number') return;

    const budget = budgets[key];
    if (!budget) return;

    results[key] = {
      value,
      budget,
      exceeded: value > budget,
      ratio: (value / budget * 100).toFixed(1) + '%'
    };
  });

  return results;
}

/**
 * Generate performance report
 * @returns {Object} Comprehensive performance report
 */
function getPerformanceReport() {
  return {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    metrics: {
      lcp: metrics.lcp,
      fid: metrics.fid,
      cls: metrics.cls,
      fcp: metrics.fcp,
      ttfb: metrics.ttfb
    },
    budgets: checkBudgets(),
    measurements: metrics.measurements,
    pageLoadTime: performance.now()
  };
}

/**
 * Log performance summary
 */
function logPerformanceSummary() {
  const report = getPerformanceReport();

  console.group('[performance-monitor] Web Vitals Summary');
  console.log('LCP (Largest Contentful Paint):', report.metrics.lcp?.toFixed(0), 'ms', getStatus(report.metrics.lcp, 2500));
  console.log('FID (First Input Delay):', report.metrics.fid?.toFixed(0), 'ms', getStatus(report.metrics.fid, 100));
  console.log('CLS (Cumulative Layout Shift):', report.metrics.cls?.toFixed(3), getStatus(report.metrics.cls, 0.1));
  console.log('FCP (First Contentful Paint):', report.metrics.fcp?.toFixed(0), 'ms');
  console.log('TTFB (Time to First Byte):', report.metrics.ttfb?.toFixed(0), 'ms');
  console.log('Page Load Time:', report.pageLoadTime.toFixed(0), 'ms');
  console.groupEnd();
}

/**
 * Get status badge
 * @private
 */
function getStatus(value, threshold) {
  if (value === null || value === undefined) return '⏳ Pending';
  return value <= threshold ? '✅ Good' : '⚠️ Needs Improvement';
}

/**
 * Send metrics to analytics server
 * @param {string} [url] - Analytics endpoint URL
 */
async function sendMetrics(url) {
  if (!url && !config.reportingUrl) return;

  const endpoint = url || config.reportingUrl;
  const report = getPerformanceReport();

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });

    console.log('[performance-monitor] Metrics sent to analytics');
  } catch (e) {
    console.warn('[performance-monitor] Failed to send metrics:', e.message);
  }
}

/**
 * Store metrics in localStorage for later analysis
 */
function storeMetrics() {
  if (!config.storage) return;

  try {
    const stored = localStorage.getItem('performance-metrics') || '[]';
    const metrics_list = JSON.parse(stored);
    metrics_list.push(getPerformanceReport());

    // Keep last 100 reports
    const trimmed = metrics_list.slice(-100);
    localStorage.setItem('performance-metrics', JSON.stringify(trimmed));
  } catch (e) {
    console.warn('[performance-monitor] Failed to store metrics:', e.message);
  }
}

/**
 * Get stored metrics
 * @returns {Array} Previously stored performance reports
 */
function getStoredMetrics() {
  try {
    const stored = localStorage.getItem('performance-metrics');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Clear stored metrics
 */
function clearStoredMetrics() {
  try {
    localStorage.removeItem('performance-metrics');
    console.log('[performance-monitor] Cleared stored metrics');
  } catch (e) {
    console.warn('[performance-monitor] Failed to clear metrics:', e.message);
  }
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize performance monitoring
 * Call this on page load
 */
export function initializePerformanceMonitoring() {
  if (!config.enabled) return;

  console.log('[performance-monitor] Initializing');

  // Start observing
  observeLCP();
  observeFID();
  observeCLS();
  measureFCP();
  measureTTFB();

  // Log summary when page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(logPerformanceSummary, 1000);
      setTimeout(storeMetrics, 1000);
    });
  } else {
    setTimeout(logPerformanceSummary, 1000);
    setTimeout(storeMetrics, 1000);
  }

  // Also log on page unload
  window.addEventListener('beforeunload', storeMetrics);
}

// ============================================================================
// Public API
// ============================================================================

export {
  getPerformanceReport,
  logPerformanceSummary,
  checkBudgets,
  sendMetrics,
  storeMetrics,
  getStoredMetrics,
  clearStoredMetrics,
  config as performanceConfig
};

export default {
  initializePerformanceMonitoring,
  getPerformanceReport,
  logPerformanceSummary,
  checkBudgets,
  sendMetrics,
  storeMetrics,
  getStoredMetrics,
  clearStoredMetrics
};
