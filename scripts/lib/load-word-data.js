"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const WORDS_FILE = path.join(ROOT, "data", "words.json");

function loadWordData() {
  if (!fs.existsSync(WORDS_FILE)) {
    throw new Error(`Missing data file: ${WORDS_FILE}`);
  }
  const raw = JSON.parse(fs.readFileSync(WORDS_FILE, "utf8"));
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("data/words.json must contain an object keyed by word");
  }
  return raw;
}

module.exports = {
  WORDS_FILE,
  loadWordData
};
