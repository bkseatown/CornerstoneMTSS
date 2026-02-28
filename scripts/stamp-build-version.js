/**
 * stamp-build-version.js
 * Writes version.json with a cacheBuster that changes per build.
 *
 * Why: sw-runtime.js fetches ./version.json (no-store) and uses cacheBuster/sha/v
 * to decide when to clear caches + prompt clients to update.
 *
 * Works locally and in GitHub Actions.
 *
 * Usage:
 *   node scripts/stamp-build-version.js
 *   node scripts/stamp-build-version.js --sha abc123 --out version.json
 */

const fs = require('fs');
const path = require('path');

function argValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

function nowIso() {
  return new Date().toISOString();
}

function safeShortSha(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  return s.slice(0, 12);
}

function bestEffortSha() {
  // Prefer explicit --sha, then GitHub Actions env, then fallback timestamp.
  const cli = argValue('--sha');
  if (cli) return safeShortSha(cli);

  const envSha = process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || '';
  const short = safeShortSha(envSha);

  return short;
}

function makeCacheBuster(shortSha) {
  // Must change each deploy. If sha exists: "sha-<short>-<epoch>"
  // else timestamp-only.
  const epoch = Date.now();
  if (shortSha) return `sha-${shortSha}-${epoch}`;
  return `ts-${epoch}`;
}

function main() {
  const outRel = argValue('--out') || 'version.json';
  const outPath = path.resolve(process.cwd(), outRel);

  const sha = bestEffortSha();
  const payload = {
    name: 'Cornerstone MTSS',
    // sw-runtime.js looks for cacheBuster OR sha OR v. Keep all for clarity.
    sha: sha || '',
    v: nowIso(),
    cacheBuster: makeCacheBuster(sha),
  };

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  process.stdout.write(`[stamp-build-version] wrote ${outRel} (cacheBuster=${payload.cacheBuster})\n`);
}

main();
