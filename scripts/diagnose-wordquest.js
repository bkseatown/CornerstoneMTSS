#!/usr/bin/env node

/**
 * diagnose-wordquest.js
 * Diagnose why Word Quest keyboard/gameboard aren't appearing
 */

const http = require('http');
const { URL } = require('url');

async function fetchHtml(urlString) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, html: data });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function diagnose() {
  console.log('🔍 Word Quest Diagnostic Tool\n');
  console.log('='.repeat(60));

  try {
    // Check if server is running
    console.log('\n1️⃣  Checking server...');
    const response = await fetchHtml('http://localhost:8888/word-quest.html');

    if (response.status !== 200) {
      console.error(`❌ Server returned: ${response.status}`);
      return;
    }
    console.log('✅ Server running on localhost:8888');

    const html = response.html;

    // Check for keyboard div
    console.log('\n2️⃣  Checking HTML elements...');
    const hasKeyboard = html.includes('<div id="keyboard">');
    const hasBoardContainer = html.includes('id="board"') || html.includes('class="board"') || html.includes('gameboard');
    const hasPlayShell = html.includes('id="play-shell"');
    const hasHero = html.includes('id="hero-v2"');

    console.log(`  ✅ Keyboard div:     ${hasKeyboard ? 'YES' : 'NO'}`);
    console.log(`  ✅ Gameboard:        ${hasBoardContainer ? 'YES' : 'NO'}`);
    console.log(`  ✅ Play shell:       ${hasPlayShell ? 'YES' : 'NO'}`);
    console.log(`  ✅ Hero section:     ${hasHero ? 'YES' : 'NO'}`);

    // Count script tags
    console.log('\n3️⃣  Checking scripts...');
    const scriptMatches = html.match(/<script[^>]*src="([^"]+)"/g) || [];
    console.log(`  📝 Total scripts: ${scriptMatches.length}`);

    // Count critical scripts
    const hasGameJs = html.includes('src="js/game.js');
    const hasAppShell = html.includes('src="js/app-shell-runtime.js');
    const hasAudio = html.includes('src="js/audio.js');
    const hasMusic = html.includes('src="js/app-music-runtime.js');

    console.log(`  ✅ game.js:          ${hasGameJs ? 'YES' : 'NO'}`);
    console.log(`  ✅ app-shell:        ${hasAppShell ? 'YES' : 'NO'}`);
    console.log(`  ✅ audio.js:         ${hasAudio ? 'YES' : 'NO'}`);
    console.log(`  ✅ app-music:        ${hasMusic ? 'YES' : 'NO'}`);

    // Check CSS
    console.log('\n4️⃣  Checking CSS...');
    const cssMatches = html.match(/<link[^>]*href="([^"]+\.css)"/g) || [];
    console.log(`  📝 Total CSS files: ${cssMatches.length}`);

    const hasCoreCSS = html.includes('href="style/tokens.css') || html.includes('href="style/components.css');
    const hasGameCSS = html.includes('href="style/wordquest-isolation.css');

    console.log(`  ✅ Core CSS:         ${hasCoreCSS ? 'YES' : 'NO'}`);
    console.log(`  ✅ Game CSS:         ${hasGameCSS ? 'YES' : 'NO'}`);

    // Check for inline styles
    console.log('\n5️⃣  Checking rendering guards...');
    const hasLoadingScreen = html.includes('id="loading-screen"');
    const hasFirstPaintGuard = html.includes('display: none !important');
    const hasDataHomeModePlay = html.includes('data-home-mode="play"');

    console.log(`  ✅ Loading screen:   ${hasLoadingScreen ? 'YES' : 'NO'}`);
    console.log(`  ✅ First-paint guard: ${hasFirstPaintGuard ? 'YES' : 'NO'}`);
    console.log(`  ✅ Home mode attr:   ${html.includes('data-home-mode') ? 'YES' : 'NO'}`);

    // Check URLs that might be missing
    console.log('\n6️⃣  Checking for missing resources...');
    const suspiciousScripts = scriptMatches.filter(s =>
      !s.includes('v=') && !s.includes('20260') && !s.includes('timestamp')
    );

    if (suspiciousScripts.length > 0) {
      console.log(`  ⚠️  Scripts without versioning:`);
      suspiciousScripts.slice(0, 5).forEach(s => {
        console.log(`    - ${s.match(/src="([^"]+)"/)[1]}`);
      });
    } else {
      console.log(`  ✅ All scripts have version stamps`);
    }

    // Recommendations
    console.log('\n7️⃣  Troubleshooting Steps...\n');

    if (!hasKeyboard) {
      console.log('❌ CRITICAL: Keyboard div not found in HTML');
      console.log('   → word-quest.html may be corrupted');
      console.log('   → Try downloading the file again\n');
    }

    if (!hasAppShell || !hasGameJs) {
      console.log('❌ CRITICAL: Required scripts missing');
      console.log('   → Check if all .js files are present in /js directory');
      console.log('   → Try clearing browser cache (Ctrl+Shift+R)\n');
    }

    if (html.length < 10000) {
      console.log('❌ WARNING: HTML file is suspiciously small');
      console.log('   → File may not have fully downloaded');
      console.log('   → Try refreshing the page\n');
    } else {
      console.log(`✅ HTML file size: ${(html.length / 1024).toFixed(1)} KB (expected size OK)\n`);
    }

    // Next steps
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Next Steps:');
    console.log('1. Open http://localhost:8888/word-quest.html?play=1');
    console.log('2. Open DevTools (F12)');
    console.log('3. Check Console tab for errors');
    console.log('4. Check Network tab for 404 responses');
    console.log('5. Try disabling browser extensions');
    console.log('6. Check if JavaScript is enabled');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure server is running:');
    console.log('  npx http-server . -p 8888 -c-1');
  }
}

diagnose();
