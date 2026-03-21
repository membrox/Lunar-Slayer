# UI Placement Testbed

When adjusting positions or sizes of images/texts in the bottom nav or upgrade rows, **always use the UI Placement Testbed** first.

## Access

```
http://localhost:5173/?uitestbed
```

## Controls

- **Click** an element to select it
- **Drag** to reposition
- **Scroll Wheel**: scale horizontally
- **Shift + Scroll Wheel**: scale vertically
- **Arrow Keys**: nudge selected element by 1px
- **Tab**: cycle through elements
- **Esc**: deselect

## Buttons

- **💾 SAVE**: Persists all positions/scales to `localStorage` (key: `ui_placement_config`)
- **🔄 RESET**: Clears saved data and resets to default positions
- **📋 COPY JSON**: Copies current layout as JSON to clipboard for applying to `UIScene.js`

## Workflow

1. Open `?uitestbed`
2. Drag/scale elements to desired positions
3. Click **SAVE** to persist (survives page refresh)
4. Click **COPY JSON** and apply values to `UIScene.js`
5. Verify in the main game
