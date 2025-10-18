# TypeMeter

A lightweight Electron-based keyboard tracker that monitors your typing activity system-wide.

## Features

✨ **Global Keyboard Tracking** - Tracks all keystrokes system-wide, not just when the app is focused

📊 **Real-time Statistics** - See your typing stats update in real-time

📈 **Detailed Analytics** - View breakdown by key types (Backspace, Enter, Delete, Space, etc.)

📅 **Daily History** - Track your typing activity over time

⏸️ **Pause/Resume** - Easily pause tracking when you need privacy

🎨 **Modern UI** - Beautiful, dark-themed interface with smooth animations

## Screenshots

### Tray Icon & Popover

Click the tray icon to see a quick overview of your typing statistics.

### Dashboard

Open the full dashboard for detailed analytics and daily history.

## Installation

1. Clone this repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the app:

   ```bash
   npm start
   ```

## Keyboard Shortcuts

- **Escape** - Close popover (when popover is open)

## Statistics Tracked

- **Total Keys** - All keystrokes
- **Backspace** - Backspace key presses
- **Enter** - Enter/Return key presses
- **Delete** - Delete key presses
- **Space** - Space bar presses
- **Keys Per Minute** - Typing rate (last 60 seconds)
- **Daily Stats** - Per-day breakdown with history

## Privacy

- All data is stored locally on your computer
- No data is sent to any server
- Tracking can be paused at any time
- Statistics can be reset completely

## Dependencies

- **Electron** - Desktop app framework
- **uiohook-napi** - Global keyboard event monitoring
- **electron-store** - Persistent data storage

## System Requirements

- Node.js 18 or higher
- Works on Linux, Windows, and macOS

## Known Issues

### Linux

- You may see a warning: `XkbGetKeyboard failed to locate a valid keyboard!`
  - This is a harmless warning and doesn't affect functionality
  - The app will still track keyboard events correctly

## Development

### Project Structure

```
type-meter/
├── main.js          # Main process (app initialization, keyboard tracking)
├── preload.js       # Preload script (IPC bridge)
├── store.js         # Data persistence layer
├── renderer.js      # Shared renderer utilities
├── index.html       # Dashboard window
├── popover.html     # Quick stats popover
└── assets/          # App icons and resources
```

### Building for Production

To package the app for distribution:

```bash
npm install --save-dev @electron/forge
npx electron-forge import
npm run make
```

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Built with Electron
- Keyboard monitoring powered by uiohook-napi
- Icons from your assets folder

---

**Note**: This app runs in the system tray and continues running even when all windows are closed. Use the tray menu to quit the application.


## In memory of @sajadadineh

Though you’ve gone offline for now, your spirit still runs in the background processes of this project.
