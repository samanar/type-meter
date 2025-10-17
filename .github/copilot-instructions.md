# TypeMeter - AI Coding Guidelines

## Architecture Overview

TypeMeter is an Electron desktop app with strict main/renderer process separation:

- **Main Process** (`main.js`): App lifecycle, global keyboard hooks, window management, IPC handlers
- **Renderer Processes**: Dashboard (`index.html`) and popover (`popover.html`) windows
- **Preload Script** (`preload.js`): Secure IPC bridge using `contextBridge.exposeInMainWorld()`
- **Data Layer** (`store.js`): Persistent storage via `electron-store` with daily stats and preferences

## Key Patterns & Conventions

### IPC Communication

Use specific event names for cross-process communication:

```javascript
// Main → Renderer (stats updates)
ipcMain.send("stats:update", { todayStats, kpm, paused, isWayland });

// Renderer → Main (actions)
ipcRenderer.send("tracking:toggle"); // No response expected
ipcRenderer.send("stats:get"); // Triggers stats:update event
```

### Wayland Compatibility

Always check `isWaylandSession` before implementing keyboard tracking:

```javascript
const isWaylandSession = process.env.XDG_SESSION_TYPE === "wayland";
if (isWaylandSession) {
  // Window-focused tracking only
  window.addEventListener("keydown", handleKeyPress);
} else {
  // Global hooks with uiohook-napi
  uIOhook.on("keydown", handleKeyPress);
}
```

### Window Management

Windows are created on-demand and reused:

- Popover: Small stats overlay, positioned relative to tray
- Dashboard: Full analytics window
- Both use `preload.js` for IPC access

### UI Theming

Consistent dark theme using CSS variables:

```css
:root {
  --bg: rgba(12, 18, 32, 0.86);
  --card: #0f1627;
  --text: #e6eaf2;
  --accent: #38c8ff;
}
```

### Content Security Policy

HTML files must include CSP headers allowing inline styles/scripts:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'unsafe-inline'"
/>
```

## Development Workflow

### Running & Debugging

```bash
npm start          # Launch app
npm run dev        # Same as start (development mode)
npm run make       # Package with electron-forge (requires @electron/forge)
```

### Key Files to Reference

- `main.js`: Entry point, keyboard tracking logic, IPC handlers
- `store.js`: Data persistence and stats calculations
- `preload.js`: IPC API exposed to renderers
- `popover.html`: Quick stats window with real-time updates
- `index.html`: Full dashboard with historical data

### Testing Considerations

- Manual testing required due to system-level keyboard hooks
- Test on both X11/Windows (global tracking) and Wayland (focused tracking)
- Verify tray icon, popover positioning, and IPC communication
- Check data persistence across app restarts

## Common Pitfalls

- Don't access DOM from main process - use IPC
- Preload scripts must use CommonJS (`require`) not ES modules
- Wayland prevents global keyboard monitoring - always provide fallback
- Window positioning calculations differ between desktop environments</content>
  <parameter name="filePath">/home/samanar/Projects/type-meter/.github/copilot-instructions.md
