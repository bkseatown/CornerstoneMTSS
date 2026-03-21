#!/usr/bin/env node

/**
 * Minify specialist-hub modules
 * Phase 1 Performance Optimization: JavaScript minification
 *
 * Expected savings: 30-40 KB
 */

const fs = require('fs');
const path = require('path');
const Terser = require('terser');

// Desktop directory where source files are
const srcDir = '/Users/robertwilliamknaus/Desktop/Cornerstone MTSS';
const modules = [
  'specialist-hub-curriculum-data.js',
  'specialist-hub-ui.js',
  'specialist-hub-curriculum.js',
  'specialist-hub-quick-reference.js',
  'specialist-hub-search.js',
  'specialist-hub-google-workspace.js',
  'specialist-hub-badges.js',
  'specialist-hub-storage.js',
  'specialist-hub-cost-dashboard.js',
];

async function minifyModule(filename) {
  const srcPath = path.join(srcDir, filename);
  const minPath = path.join(srcDir, filename.replace('.js', '.min.js'));

  if (!fs.existsSync(srcPath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return null;
  }

  const code = fs.readFileSync(srcPath, 'utf8');
  const originalSize = Buffer.byteLength(code, 'utf8');

  try {
    const result = await Terser.minify(code, {
      compress: {
        passes: 2,
        unused: true,
        dead_code: true,
      },
      mangle: true,
      format: {
        comments: false,
      },
    });

    if (result.error) {
      console.log(`❌ Error minifying ${filename}: ${result.error.message}`);
      return null;
    }

    const minifiedCode = result.code;
    const minifiedSize = Buffer.byteLength(minifiedCode, 'utf8');
    const savings = originalSize - minifiedSize;
    const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

    // Write minified file
    fs.writeFileSync(minPath, minifiedCode);

    return {
      filename,
      originalSize,
      minifiedSize,
      savings,
      savingsPercent,
    };
  } catch (err) {
    console.log(`❌ Error processing ${filename}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('\n🚀 Specialist Hub Module Minification\n');
  console.log('Minifying JavaScript modules for performance optimization...\n');

  const results = [];
  let totalOriginal = 0;
  let totalMinified = 0;

  for (const module of modules) {
    const result = await minifyModule(module);
    if (result) {
      results.push(result);
      totalOriginal += result.originalSize;
      totalMinified += result.minifiedSize;
    }
  }

  if (results.length === 0) {
    console.log('❌ No modules found or minified');
    process.exit(1);
  }

  // Display results
  console.log('Module Minification Results:');
  console.log('─'.repeat(80));
  console.log('File                                Original    Minified    Savings     %');
  console.log('─'.repeat(80));

  results.forEach((r) => {
    const filename = r.filename.padEnd(35);
    const orig = `${(r.originalSize / 1024).toFixed(1)} KB`.padStart(10);
    const mini = `${(r.minifiedSize / 1024).toFixed(1)} KB`.padStart(10);
    const save = `${(r.savings / 1024).toFixed(1)} KB`.padStart(10);
    const pct = r.savingsPercent.padStart(5) + '%';
    console.log(`${filename} ${orig} ${mini} ${save} ${pct}`);
  });

  console.log('─'.repeat(80));
  const totalSavings = totalOriginal - totalMinified;
  const totalSavingsPercent = ((totalSavings / totalOriginal) * 100).toFixed(1);
  console.log(`${'TOTAL'.padEnd(35)} ${(totalOriginal / 1024).toFixed(1).padStart(9)} KB ${(totalMinified / 1024).toFixed(1).padStart(9)} KB ${(totalSavings / 1024).toFixed(1).padStart(9)} KB ${totalSavingsPercent.padStart(5)}%`);
  console.log('─'.repeat(80));

  console.log(`\n✅ Minification complete!`);
  console.log(`   Total savings: ${(totalSavings / 1024).toFixed(1)} KB`);
  console.log(`   Bundle size reduction: ${totalSavingsPercent}%\n`);
}

main().catch(console.error);
