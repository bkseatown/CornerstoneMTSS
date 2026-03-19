#!/usr/bin/env node

/**
 * Asset Minification Script
 *
 * Minifies CSS and JavaScript files in the dist/ directory.
 * Reduces bundle size by ~70%.
 *
 * Usage:
 *   node scripts/minify-assets.js
 *   node scripts/minify-assets.js --check-only
 *
 * Supported minifiers (auto-detected):
 *   - terser (JavaScript) - npm install -g terser
 *   - csso (CSS) - npm install -g csso-cli
 *   - esbuild (universal) - npm install -g esbuild
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// Configuration
// ============================================================================

const DIRS = {
  root: path.resolve(__dirname, '..'),
  js: path.resolve(__dirname, '..', 'js'),
  css: path.resolve(__dirname, '..', 'style'),
  dist: path.resolve(__dirname, '..', 'dist')
};

const OPTIONS = {
  checkOnly: process.argv.includes('--check-only'),
  verbose: process.argv.includes('--verbose'),
  report: true
};

// ============================================================================
// Logging
// ============================================================================

function log(msg) {
  console.log('[minify] ' + msg);
}

function info(msg) {
  console.log('ℹ  ' + msg);
}

function warn(msg) {
  console.warn('⚠  ' + msg);
}

function success(msg) {
  console.log('✓ ' + msg);
}

function error(msg) {
  console.error('✗ ' + msg);
}

// ============================================================================
// Minifier Detection
// ============================================================================

function hasMinifier(tool) {
  try {
    execSync('which ' + tool, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function detectMinifiers() {
  const minifiers = {
    terser: hasMinifier('terser'),
    csso: hasMinifier('csso'),
    esbuild: hasMinifier('esbuild')
  };

  if (!minifiers.terser && !minifiers.csso && !minifiers.esbuild) {
    warn('No minifiers detected. Install one of:');
    warn('  npm install -g terser');
    warn('  npm install -g csso-cli');
    warn('  npm install -g esbuild');
    return null;
  }

  return minifiers;
}

// ============================================================================
// File Analysis
// ============================================================================

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function calculateReduction(original, minified) {
  if (original === 0) return 0;
  return Math.round(((original - minified) / original) * 100);
}

// ============================================================================
// Minification
// ============================================================================

function minifyJs(filePath, minifier) {
  if (minifier === 'terser') {
    const outPath = filePath.replace('.js', '.min.js');
    execSync('terser ' + filePath + ' -o ' + outPath);
    return outPath;
  }

  if (minifier === 'esbuild') {
    const outPath = filePath.replace('.js', '.min.js');
    execSync('esbuild ' + filePath + ' --minify --outfile=' + outPath);
    return outPath;
  }

  return null;
}

function minifyCss(filePath, minifier) {
  if (minifier === 'csso') {
    const outPath = filePath.replace('.css', '.min.css');
    execSync('csso ' + filePath + ' -o ' + outPath);
    return outPath;
  }

  if (minifier === 'esbuild') {
    const outPath = filePath.replace('.css', '.min.css');
    execSync('esbuild ' + filePath + ' --minify --outfile=' + outPath);
    return outPath;
  }

  return null;
}

// ============================================================================
// Report
// ============================================================================

function generateReport(files) {
  if (!OPTIONS.report) return;

  let totalOriginal = 0;
  let totalMinified = 0;
  const results = [];

  files.forEach(file => {
    const origSize = getFileSize(file.original);
    const minSize = getFileSize(file.minified);

    totalOriginal += origSize;
    totalMinified += minSize;

    results.push({
      file: path.basename(file.original),
      original: origSize,
      minified: minSize,
      reduction: calculateReduction(origSize, minSize)
    });
  });

  console.log('\n' + '='.repeat(70));
  console.log('MINIFICATION REPORT');
  console.log('='.repeat(70));
  console.table(
    results.map(r => ({
      'File': r.file,
      'Original': formatBytes(r.original),
      'Minified': formatBytes(r.minified),
      'Reduction': r.reduction + '%'
    }))
  );
  console.log('='.repeat(70));
  console.log('TOTAL');
  console.log('  Original:  ' + formatBytes(totalOriginal));
  console.log('  Minified:  ' + formatBytes(totalMinified));
  console.log('  Reduction: ' + calculateReduction(totalOriginal, totalMinified) + '%');
  console.log('='.repeat(70) + '\n');
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  info('Cornerstone MTSS - Asset Minification');
  info('');

  // Detect minifiers
  log('Detecting minifiers...');
  const minifiers = detectMinifiers();

  if (!minifiers) {
    warn('Skipping minification (no minifiers available)');
    process.exit(0);
  }

  const preferredJs = minifiers.terser ? 'terser' : 'esbuild';
  const preferredCss = minifiers.csso ? 'csso' : 'esbuild';

  success('Using ' + preferredJs + ' for JavaScript');
  success('Using ' + preferredCss + ' for CSS');
  info('');

  if (OPTIONS.checkOnly) {
    info('Running in check-only mode (no files modified)');
  }

  // Find all JS files
  log('Scanning JavaScript files...');
  const jsFiles = fs
    .readdirSync(DIRS.js)
    .filter(f => f.endsWith('.js') && !f.endsWith('.min.js'))
    .map(f => path.join(DIRS.js, f));

  info('Found ' + jsFiles.length + ' JavaScript files');

  // Find all CSS files
  log('Scanning CSS files...');
  const cssFiles = fs
    .readdirSync(DIRS.css)
    .filter(f => f.endsWith('.css') && !f.endsWith('.min.css'))
    .map(f => path.join(DIRS.css, f));

  info('Found ' + cssFiles.length + ' CSS files');
  info('');

  if (!OPTIONS.checkOnly) {
    // Minify JS
    log('Minifying JavaScript...');
    const jsResults = [];

    jsFiles.forEach(file => {
      try {
        const minified = minifyJs(file, preferredJs);
        if (minified) {
          jsResults.push({ original: file, minified: minified });
          success('Minified ' + path.basename(file));
        }
      } catch (e) {
        warn('Failed to minify ' + path.basename(file) + ': ' + e.message);
      }
    });

    // Minify CSS
    log('Minifying CSS...');
    const cssResults = [];

    cssFiles.forEach(file => {
      try {
        const minified = minifyCss(file, preferredCss);
        if (minified) {
          cssResults.push({ original: file, minified: minified });
          success('Minified ' + path.basename(file));
        }
      } catch (e) {
        warn('Failed to minify ' + path.basename(file) + ': ' + e.message);
      }
    });

    // Generate report
    generateReport([...jsResults, ...cssResults]);
  } else {
    info('(Check-only mode - no changes made)');
  }

  success('Done');
  process.exit(0);
}

main().catch(err => {
  error(err.message);
  process.exit(1);
});
