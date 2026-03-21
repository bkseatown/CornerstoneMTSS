#!/usr/bin/env node

/**
 * Minify CSS files
 * Phase 1 Performance Optimization: CSS minification
 *
 * Expected savings: 15-20 KB
 */

const fs = require('fs');
const path = require('path');

// CSS minification utility
function minifyCSS(css) {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove newlines and multiple spaces
    .replace(/\n\s*/g, '')
    .replace(/\s+/g, ' ')
    // Remove spaces around special characters
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    // Remove space before important
    .replace(/;\s*}/g, '}')
    // Optimize color values
    .replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3\b/gi, '#$1$2$3')
    // Remove trailing semicolons
    .replace(/;}/g, '}')
    .trim();
}

// Desktop directory
const srcDir = '/Users/robertwilliamknaus/Desktop/Cornerstone MTSS';
const cssFiles = [
  'landing-auth.css',
  'specialist-hub.css',
  'teacher-hub-main.css',
  'teacher-hub-responsive.css',
  'teacher-hub-sidebar.css',
  'student-profile.css',
  'my-students.css',
];

function minifyFile(filename) {
  const srcPath = path.join(srcDir, filename);
  const minPath = path.join(srcDir, filename.replace('.css', '.min.css'));

  if (!fs.existsSync(srcPath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return null;
  }

  const css = fs.readFileSync(srcPath, 'utf8');
  const originalSize = Buffer.byteLength(css, 'utf8');

  try {
    const minified = minifyCSS(css);
    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    const savings = originalSize - minifiedSize;
    const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

    // Write minified file
    fs.writeFileSync(minPath, minified);

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

function main() {
  console.log('\n🎨 CSS Minification\n');
  console.log('Minifying CSS files for performance optimization...\n');

  const results = [];
  let totalOriginal = 0;
  let totalMinified = 0;

  for (const file of cssFiles) {
    const result = minifyFile(file);
    if (result) {
      results.push(result);
      totalOriginal += result.originalSize;
      totalMinified += result.minifiedSize;
    }
  }

  if (results.length === 0) {
    console.log('❌ No CSS files found');
    process.exit(1);
  }

  // Display results
  console.log('CSS Minification Results:');
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

  console.log(`\n✅ CSS minification complete!`);
  console.log(`   Total savings: ${(totalSavings / 1024).toFixed(1)} KB`);
  console.log(`   Bundle size reduction: ${totalSavingsPercent}%\n`);
}

main().catch(console.error);
