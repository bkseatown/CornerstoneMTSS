#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const TRACKS_DIR = path.join(ROOT, 'assets', 'music', 'tracks');
const CATALOG_FILE = path.join(ROOT, 'data', 'music-catalog.json');
const LEDGER_FILE = path.join(ROOT, 'data', 'music-license-ledger.json');
const SUPPORTED_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']);

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function walkFiles(dir, found = []) {
  if (!fs.existsSync(dir)) return found;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const nextPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(nextPath, found);
      return;
    }
    found.push(nextPath);
  });
  return found;
}

function slugToTitle(slug) {
  return String(slug || '')
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function sanitizeToken(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseModes(rawModes) {
  const list = String(rawModes || '')
    .split('+')
    .map((item) => sanitizeToken(item))
    .filter(Boolean)
    .filter((mode) => mode !== 'off');
  return Array.from(new Set(list.length ? list : ['focus']));
}

function parseTrackMetadata(absPath) {
  const ext = path.extname(absPath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) return null;
  const relPath = path.relative(ROOT, absPath).split(path.sep).join('/');
  const src = `/${relPath}`;
  const filename = path.basename(absPath, ext);
  const [slugPart = 'track', ...metaParts] = filename.split('__');
  const slug = sanitizeToken(slugPart) || 'track';
  const idHash = crypto.createHash('md5').update(src).digest('hex').slice(0, 8);
  const id = `${slug}-${idHash}`;
  const base = {
    id,
    title: slugToTitle(slug),
    src,
    format: ext.slice(1),
    modes: ['focus'],
    collection: path.basename(path.dirname(absPath)),
    sourceType: 'file-drop',
    gain: 1
  };

  metaParts.forEach((part) => {
    if (part.startsWith('modes-')) {
      base.modes = parseModes(part.slice('modes-'.length));
      return;
    }
    if (part.startsWith('bpm-')) {
      const bpm = Number.parseInt(part.slice('bpm-'.length), 10);
      if (Number.isFinite(bpm) && bpm > 20 && bpm < 260) base.bpm = bpm;
      return;
    }
    if (part.startsWith('energy-')) {
      const energy = sanitizeToken(part.slice('energy-'.length));
      if (energy) base.energy = energy;
      return;
    }
    if (part.startsWith('artist-')) {
      const artist = part.slice('artist-'.length).replace(/[+_]+/g, ' ').trim();
      if (artist) base.artist = artist;
      return;
    }
    if (part.startsWith('gain-')) {
      const gain = Number.parseFloat(part.slice('gain-'.length));
      if (Number.isFinite(gain) && gain >= 0 && gain <= 1.6) base.gain = Number(gain.toFixed(2));
      return;
    }
    if (part.startsWith('license-')) {
      const licenseRef = sanitizeToken(part.slice('license-'.length));
      if (licenseRef) base.licenseRef = licenseRef;
    }
  });

  if (!base.licenseRef) {
    base.licenseRef = src.includes('/focus-flow/')
      ? 'original-focus-flow-pack'
      : `pending-${id}`;
  }
  return base;
}

function mergeWithExisting(parsedTracks, existingCatalog) {
  const existingBySrc = new Map(
    (Array.isArray(existingCatalog?.tracks) ? existingCatalog.tracks : [])
      .map((track) => [String(track?.src || ''), track])
      .filter(([src]) => src)
  );

  return parsedTracks.map((track) => {
    const prior = existingBySrc.get(track.src) || {};
    return {
      id: String(prior.id || track.id),
      title: String(prior.title || track.title),
      src: track.src,
      format: String(prior.format || track.format),
      modes: Array.from(new Set(
        (Array.isArray(prior.modes) && prior.modes.length ? prior.modes : track.modes)
          .map((mode) => sanitizeToken(mode))
          .filter(Boolean)
      )),
      bpm: Number.isFinite(prior.bpm) ? prior.bpm : track.bpm,
      energy: String(prior.energy || track.energy || '').trim() || undefined,
      gain: Number.isFinite(prior.gain) ? prior.gain : track.gain,
      collection: String(prior.collection || track.collection || '').trim() || undefined,
      sourceType: String(prior.sourceType || track.sourceType || 'file-drop'),
      artist: String(prior.artist || track.artist || '').trim() || undefined,
      licenseRef: String(prior.licenseRef || track.licenseRef)
    };
  }).map((track) => {
    const cleaned = { ...track };
    if (!cleaned.bpm) delete cleaned.bpm;
    if (!cleaned.energy) delete cleaned.energy;
    if (!cleaned.collection) delete cleaned.collection;
    if (!cleaned.artist) delete cleaned.artist;
    if (!Number.isFinite(cleaned.gain)) cleaned.gain = 1;
    return cleaned;
  });
}

function buildModeIndex(tracks) {
  const index = {};
  tracks.forEach((track) => {
    track.modes.forEach((mode) => {
      if (!index[mode]) index[mode] = [];
      index[mode].push(track.id);
    });
  });
  Object.keys(index).forEach((mode) => {
    index[mode] = Array.from(new Set(index[mode])).sort();
  });
  return index;
}

function syncLedger(tracks, existingLedger) {
  const existingEntries = Array.isArray(existingLedger?.entries) ? existingLedger.entries : [];
  const byRef = new Map(existingEntries.map((entry) => [String(entry?.licenseRef || ''), entry]).filter(([key]) => key));
  const tracksByRef = new Map();

  tracks.forEach((track) => {
    const ref = String(track.licenseRef || '').trim();
    if (!ref) return;
    if (!tracksByRef.has(ref)) tracksByRef.set(ref, []);
    tracksByRef.get(ref).push(track);
  });

  tracksByRef.forEach((refTracks, licenseRef) => {
    const prior = byRef.get(licenseRef) || {};
    if (licenseRef === 'original-focus-flow-pack' && !byRef.has(licenseRef)) {
      byRef.set(licenseRef, {
        licenseRef,
        title: 'Focus Flow Pack',
        artist: 'WordQuest Team',
        source: 'In-house generated loops',
        licenseType: 'Original composition (in-house)',
        status: 'approved',
        proofUrl: '',
        notes: 'Generated by scripts/generate-focus-flow-pack.js.'
      });
      return;
    }
    if (!byRef.has(licenseRef)) {
      byRef.set(licenseRef, {
        licenseRef,
        title: refTracks[0]?.title || 'Unlabeled Track',
        artist: refTracks[0]?.artist || '',
        source: 'Add source link',
        licenseType: 'REVIEW NEEDED',
        status: 'pending',
        proofUrl: '',
        notes: 'Fill this row before public classroom release.'
      });
      return;
    }
    byRef.set(licenseRef, {
      ...prior,
      licenseRef
    });
  });

  const entries = Array.from(byRef.values())
    .filter((entry) => {
      const key = String(entry?.licenseRef || '').trim();
      return key && tracksByRef.has(key);
    })
    .map((entry) => {
      const related = tracksByRef.get(entry.licenseRef) || [];
      return {
        ...entry,
        tracks: related.map((track) => track.src).sort()
      };
    })
    .sort((a, b) => String(a.licenseRef).localeCompare(String(b.licenseRef)));

  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    entries
  };
}

function main() {
  const files = walkFiles(TRACKS_DIR);
  const parsedTracks = files
    .map(parseTrackMetadata)
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title));

  const existingCatalog = readJson(CATALOG_FILE, {});
  const mergedTracks = mergeWithExisting(parsedTracks, existingCatalog);
  const modeIndex = buildModeIndex(mergedTracks);
  const catalog = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    trackCount: mergedTracks.length,
    modeIndex,
    tracks: mergedTracks
  };

  const existingLedger = readJson(LEDGER_FILE, {});
  const ledger = syncLedger(mergedTracks, existingLedger);

  writeJson(CATALOG_FILE, catalog);
  writeJson(LEDGER_FILE, ledger);
  console.log(`Synced music catalog: ${catalog.trackCount} track(s), ${Object.keys(modeIndex).length} mode bucket(s).`);
  console.log(`Synced license ledger: ${ledger.entries.length} active license entr${ledger.entries.length === 1 ? 'y' : 'ies'}.`);
}

main();
