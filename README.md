# TypeMeter

A lightweight Electron-based keyboard tracker that monitors your typing activity system-wide.

## Features

✨ **Global Keyboard Tracking** - Tracks all keystrokes system-wide, not just when the app is focused

📊 **Real-time Statistics** - See your typing stats update in real-time

📈 **Detailed Analytics** - View breakdown by key types (Backspace, Enter, Delete, Space, etc.)

📅 **Daily History** - Track your typing activity over time

⏸️ **Pause/Resume** - Easily pause tracking when you need privacy

🎨 **Modern UI** - Beautiful, dark-themed interface with smooth animations

💾 **Persistent Storage** - All statistics are saved automatically

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

## Usage

### Tray Menu
- **Left Click** - Toggle the quick stats popover
- **Right Click** - Open context menu with options:
  - Pause/Resume Tracking
  - Open Dashboard
  - Quit

### Popover Window
- Shows today's total keystrokes
- Displays keys per minute (last 60 seconds)
- Quick access to pause/resume
- Button to open full dashboard

### Dashboard
- Comprehensive statistics view
- Today's breakdown by key type
- All-time totals
- Daily history
- Reset statistics option

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

## Data Storage

Statistics are stored in your system's app data directory:
- **Linux**: `~/.config/type-meter/`
- **Windows**: `%APPDATA%/type-meter/`
- **macOS**: `~/Library/Application Support/type-meter/`

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

### Permissions
- On some systems, you may need to grant accessibility permissions for global keyboard monitoring
- **macOS**: System Preferences → Security & Privacy → Accessibility
- **Linux**: May require running with appropriate permissions

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

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Built with Electron
- Keyboard monitoring powered by uiohook-napi
- Icons from your assets folder

---

**Note**: This app runs in the system tray and continues running even when all windows are closed. Use the tray menu to quit the application.
