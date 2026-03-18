#!/usr/bin/env python3
import subprocess, sys, os
from pathlib import Path

ALLOW_FLAG = Path("ALLOW_UI_STRUCTURE_CHANGES")

# Files that are allowed to change freely (theme surface area)
ALLOWLIST_PREFIXES = [
    "style/themes.css",
    "js/styleTokens.js",
    "README.md",
    "CONTRIBUTING.md",
    "STYLE_EDITING_RULES.md",
]

# Protected files (changing them often causes regressions)
PROTECTED_PREFIXES = [
    "style/components.css",
    "style/modes.css",
    "index.html",
    "js/",
]

def get_changed_files():
    # In CI we diff against the base branch; locally this can be used with staged changes if desired.
    base = os.environ.get("GUARDRAIL_BASE", "")
    if base:
        cmd = ["bash","-lc", f"git diff --name-only {base}...HEAD"]
    else:
        cmd = ["bash","-lc", "git diff --name-only --cached || git diff --name-only"]
    out = subprocess.check_output(cmd, text=True).strip()
    return [line.strip() for line in out.splitlines() if line.strip()]

def is_allowed(path: str) -> bool:
    return any(path == p or path.startswith(p.rstrip("/")) for p in ALLOWLIST_PREFIXES)

def is_protected(path: str) -> bool:
    return any(path == p or path.startswith(p.rstrip("/")) for p in PROTECTED_PREFIXES)

def main():
    changed = get_changed_files()
    if not changed:
        print("UI guardrails: no changes detected.")
        return 0

    if ALLOW_FLAG.exists():
        print("UI guardrails: ALLOW_UI_STRUCTURE_CHANGES present; skipping enforcement.")
        return 0

    violations = []
    for f in changed:
        if is_allowed(f):
            continue
        if is_protected(f):
            violations.append(f)

    if violations:
        print("❌ UI guardrails blocked this change.")
        print("Protected files changed without ALLOW_UI_STRUCTURE_CHANGES flag:")
        for v in violations:
            print(" -", v)
        print("\nIf this is intentional, add an empty file named ALLOW_UI_STRUCTURE_CHANGES at repo root for this PR/commit.")
        return 1

    print("✅ UI guardrails passed.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
