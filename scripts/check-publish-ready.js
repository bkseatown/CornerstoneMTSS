#!/usr/bin/env node
"use strict";

var cp = require("child_process");

function run(cmd, opts) {
  return cp.execSync(cmd, Object.assign({ encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }, opts || {})).trim();
}

function safeRun(cmd) {
  try {
    return run(cmd);
  } catch (_err) {
    return "";
  }
}

function fail(msg) {
  console.error("[publish:check] " + msg);
  process.exit(1);
}

var inRepo = safeRun("git rev-parse --is-inside-work-tree");
if (inRepo !== "true") fail("Not in a git repository. Run from your project folder.");

// Refresh origin/main view if network is available; do not hard-fail if offline.
safeRun("git fetch origin main --quiet");

var branch = safeRun("git branch --show-current");
var status = safeRun("git status --porcelain");
var head = safeRun("git rev-parse --short HEAD");
var originMain = safeRun("git rev-parse --short origin/main");
var counts = safeRun("git rev-list --left-right --count origin/main...HEAD");

var behind = 0;
var ahead = 0;
if (counts) {
  var parts = counts.split(/\s+/);
  behind = Number(parts[0] || 0);
  ahead = Number(parts[1] || 0);
}

var isMain = branch === "main";
var isClean = status.length === 0;
var isSynced = behind === 0 && ahead === 0;

console.log("Publish Readiness");
console.log("  branch: " + (branch || "(unknown)"));
console.log("  clean: " + (isClean ? "yes" : "no"));
console.log("  head: " + (head || "(unknown)"));
console.log("  origin/main: " + (originMain || "(unknown)"));
console.log("  ahead: " + ahead + " | behind: " + behind);

if (isMain && isClean && isSynced) {
  console.log("[publish:check] READY: main is clean and fully synced.");
  process.exit(0);
}

console.log("[publish:check] NOT READY.");

if (!isMain) {
  console.log("  Fix: git checkout main");
}
if (!isClean) {
  console.log("  Fix: commit or stash pending changes first.");
  console.log("  Tip: git status --short");
}
if (!isSynced) {
  if (ahead > 0) {
    console.log("  Fix: git push origin " + branch);
  }
  if (behind > 0) {
    console.log("  Fix: git pull --rebase origin " + branch);
  }
}

process.exit(1);
