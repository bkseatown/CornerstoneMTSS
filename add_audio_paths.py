#!/usr/bin/env python3
"""
add_audio_paths.py — Word Quest
================================
Injects audio file paths into app_ready_database_FINAL.json.

Save this file anywhere. Run it like:

  python3 add_audio_paths.py \
    --json  /Users/robertwilliamknaus/Desktop/WordQuest/3_App_Build/app_ready_database_FINAL.json \
    --audio /Users/robertwilliamknaus/Desktop/WordQuest/assets/audio \
    --out   /Users/robertwilliamknaus/Desktop/WordQuest/3_App_Build/app_ready_database_with_audio.json

Audio folder layout expected (flat, by type):
  assets/audio/words/{word}.mp3
  assets/audio/defs/{word}.mp3
  assets/audio/sentences/{word}.mp3
  assets/audio/fun/{word}.mp3
  assets/audio/syllables/{word}.mp3
"""

import json, os, sys, argparse
from pathlib import Path

AUDIO_TYPES = {
    "word":      "words",
    "def":       "defs",
    "sentence":  "sentences",
    "fun":       "fun",
    "syllables": "syllables",
}

def find_audio(audio_root, folder, word):
    for name in [word.lower(), word.upper(), word]:
        p = audio_root / folder / f"{name}.mp3"
        if p.exists():
            return str(p)
    return None

def process(json_path, audio_root, out_path):
    print(f"\n📂 Reading: {json_path}")
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    entries = data if isinstance(data, list) else list(data.values())
    total = len(entries)
    stats  = {t: 0 for t in AUDIO_TYPES}
    missing = {t: [] for t in AUDIO_TYPES}

    for entry in entries:
        word = (entry.get("word") or entry.get("display_word") or "").strip().lower()
        if not word:
            continue
        audio_obj = entry.get("audio") or {}
        for key, folder in AUDIO_TYPES.items():
            if audio_obj.get(key):
                stats[key] += 1
                continue
            path = find_audio(audio_root, folder, word)
            if path:
                audio_obj[key] = path
                stats[key] += 1
            else:
                missing[key].append(word)
        entry["audio"] = audio_obj

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Written: {out_path}\n")
    print(f"📊 Coverage ({total} entries):")
    for key in AUDIO_TYPES:
        pct = stats[key] / total * 100 if total else 0
        bar = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
        print(f"  {key:<12} {bar}  {stats[key]:>5}/{total}  ({pct:.1f}%)")

    for key, words in missing.items():
        if not words:
            continue
        print(f"\n⚠️  Missing '{key}' audio: {len(words)} words")
        if len(words) <= 15:
            for w in words: print(f"    {w}")
        else:
            for w in words[:10]: print(f"    {w}")
            print(f"    … and {len(words)-10} more")
            miss_file = out_path.parent / f"missing_{key}.txt"
            miss_file.write_text("\n".join(words))
            print(f"    Full list → {miss_file}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json",  required=True, help="Path to app_ready_database_FINAL.json")
    ap.add_argument("--audio", required=True, help="Path to assets/audio root folder")
    ap.add_argument("--out",   default=None,  help="Output path (default: input_with_audio.json)")
    args = ap.parse_args()

    json_path  = Path(args.json)
    audio_root = Path(args.audio)
    out_path   = Path(args.out) if args.out else json_path.with_name(json_path.stem + "_with_audio.json")

    if not json_path.exists():
        print(f"❌ JSON not found: {json_path}"); sys.exit(1)
    if not audio_root.exists():
        print(f"❌ Audio folder not found: {audio_root}")
        print(f"   Expected subfolders: {list(AUDIO_TYPES.values())}"); sys.exit(1)

    # Show what audio subfolders actually exist
    print("\n🔍 Audio subfolders found:")
    for folder in AUDIO_TYPES.values():
        p = audio_root / folder
        count = len(list(p.glob("*.mp3"))) if p.exists() else 0
        status = f"✓ {count} mp3s" if p.exists() else "✗ NOT FOUND"
        print(f"   {folder:<12} {status}")

    process(json_path, audio_root, out_path)

if __name__ == "__main__":
    main()
