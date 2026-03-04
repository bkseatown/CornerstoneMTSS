# Theme Balance Rules

This project uses a token guardrail system so pages remain stable in both light and dark conditions without drifting too dark or too light.

## Scope

- Applies to active themes listed in `js/theme-registry.js` (`ACTIVE_THEME_IDS`).
- Evaluates token-level color balance only (no layout or structural changes).

## Core Rules

1. Lightness rails
- `--page-bg`: 10% to 84% lightness
- `--page-bg2`: 7% to 78% lightness
- `--panel-bg`: 12% to 92% lightness

2. Surface separation
- `|lightness(--panel-bg) - lightness(--page-bg)|` must stay between 4% and 52%
- Prevents washed-out pages and overly harsh panel jumps

3. Contrast floors
- `--key-text` on `--key-bg`: >= 4.5
- `--brand-text` on `--brand`: >= 4.5
- `--text` on `--panel-bg`: >= 4.5
- `--text-muted` on `--panel-bg`: >= 3.0

4. Color format contract
- Guardrailed tokens must be hex values (`#RRGGBB` or `#RGB`)
- Prevents ambiguous parsing and ensures deterministic checks

## 60/30/10 Interpretation

- 60%: base surfaces (`--page-bg`, `--page-bg2`)
- 30%: structure surfaces (`--panel-bg`, `--plate-*`, `--key-*`)
- 10%: accents (`--brand`, `--accent`, focused highlights)

## Enforcement

- Run `npm run theme:balance:check`
- Script location: `scripts/check-theme-balance.js`
- The check fails the build for active theme violations
