# Lunar Slayer – Development Notes

## Animation Testing Workflow

When you add or modify spritesheet animations, follow this process to detect and fix drift:

### 1. Normalize the Spritesheet

Run the normalization script whenever `Player.png` (or any spritesheet) changes:

```bash
python3 scripts/normalize_spritesheet.py public/Player.png public/Player_normalized.png
```

This script:
- Detects each frame's pixel bounding box per row
- Creates a uniform-grid spritesheet where each frame is **bottom-centered** in its cell
- Outputs the correct `frameWidth` and `frameHeight` to use in Phaser

### 2. Open the Animation Testbed

```
http://localhost:5173/?testbed
```

### 3. Step Through Each Animation Frame-by-Frame

- **Arrow Left / Right**: Step backward / forward one frame
- **Arrow Up / Down**: Switch to previous / next animation
- **Space**: Toggle auto-play / pause
- **Buttons**: Use the on-screen buttons for the same controls

### 4. Check for Drift

- A **red vertical center line** marks the screen center
- A **green frame outline** shows the Phaser frame boundary
- The character's body should stay centered on the red line across all frames
- If it drifts, the spritesheet needs re-normalization or the `frameWidth` / `frameHeight` is wrong

### 5. Update BootScene

After normalizing, update `src/scenes/BootScene.js`:
- Set `frameWidth` and `frameHeight` to match the script output
- Update frame index ranges for each animation
- Both male and female use a single `'player_sheet'` texture key

## Spritesheet Layout

`Player_normalized.png` – uniform grid, 13 columns × 2 rows:

| Row | Character | Idle    | Run     | Unused  | Death |
|-----|-----------|---------|---------|---------|-------|
| 0   | Male      | 0–3     | 4–10    | 11      | 12    |
| 1   | Female    | 13–16   | 17–22   | 23–24   | 25    |

## UI Placement Testbed

When adjusting positions or sizes of images/texts in the bottom nav or upgrade rows, **always use the UI Placement Testbed** first.

### Access

```
http://localhost:5173/?uitestbed
```

### Controls

- **Click** an element to select it
- **Drag** to reposition
- **Scroll Wheel**: scale horizontally
- **Shift + Scroll Wheel**: scale vertically
- **Arrow Keys**: nudge selected element by 1px
- **Tab**: cycle through elements
- **Esc**: deselect

### Buttons

- **💾 SAVE**: Persists all positions/scales to `localStorage` (key: `ui_placement_config`)
- **🔄 RESET**: Clears saved data and resets to default positions
- **📋 COPY JSON**: Copies current layout as JSON to clipboard for applying to `UIScene.js`

### Workflow

1. Open `?uitestbed`
2. Drag/scale elements to desired positions
3. Click **SAVE** to persist (survives page refresh)
4. Click **COPY JSON** and apply values to `UIScene.js`
5. Verify in the main game

