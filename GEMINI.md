# Lunar Slayer – Development Notes

## Spritesheet Layout

`Player_normalized.png` – uniform grid, 13 columns × 2 rows:

| Row | Character | Idle | Run  | Unused | Death |
|-----|-----------|------|------|--------|-------|
| 0   | Male      | 0–3  | 4–10 | 11     | 12    |
| 1   | Female    | 13–16| 17–22| 23–24  | 25    |

## Testbed Docs

- Animation testbed (`?testbed`): see `docs/animation-testbed.md`
- UI placement testbed (`?uitestbed`): see `docs/ui-testbed.md`

## Key Commands

- Normalize spritesheet: `python3 scripts/normalize_spritesheet.py public/Player.png public/Player_normalized.png`
- After normalizing, update `frameWidth`/`frameHeight` in `src/scenes/BootScene.js`
