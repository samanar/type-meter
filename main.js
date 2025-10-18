// main.js
import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  screen,
  ipcMain,
} from "electron";
import path from "node:path";
import { uIOhook, UiohookKey } from "uiohook-napi";
import * as dataStore from "./store.js";

const isMac = process.platform === "darwin";
const isWaylandSession = process.env.XDG_SESSION_TYPE === "wayland";

let tray = null;
let popover = null; // small popover panel
let dashboard = null; // full window (optional)
let trackingPaused = false;
let keyboardHookActive = false;

function asset(p) {
  return path.join(process.cwd(), "assets", p);
}

function createTray() {
  console.log("Creating tray icon...");
  try {
    // On macOS, use Template icon for proper menu bar appearance
    const iconPath = isMac ? asset("trayTemplate.png") : asset("tray.png");
    console.log("Icon path:", iconPath);

    const icon = nativeImage.createFromPath(iconPath);

    // If template icon doesn't exist on Mac, fall back to regular icon
    if (isMac && icon.isEmpty()) {
      console.log("Template icon not found, using regular icon");
      const fallbackIcon = nativeImage.createFromPath(asset("tray.png"));
      if (!fallbackIcon.isEmpty()) {
        // Resize for macOS menu bar (typically 22x22 or 16x16)
        tray = new Tray(fallbackIcon.resize({ width: 22, height: 22 }));
      } else {
        console.error("No tray icon found!");
        return;
      }
    } else {
      tray = new Tray(icon);
    }

    tray.setToolTip("TypeMeter");
    console.log("Tray icon created successfully");

    tray.on("click", togglePopover); // left click → toggle popover
    tray.on("right-click", showContextMenu); // right click → menu
    updateTrayMenu(); // sets context menu for macOS too
  } catch (err) {
    console.error("Failed to create tray:", err);
  }
}

function showContextMenu() {
  tray.popUpContextMenu();
}

function updateTrayMenu() {
  const panelPos = dataStore.getPanelPosition();

  const menu = Menu.buildFromTemplate([
    {
      label: trackingPaused ? "Resume Tracking" : "Pause Tracking",
      type: "checkbox",
      checked: !trackingPaused,
      click: () => {
        trackingPaused = !trackingPaused;
        popover?.webContents.send("tracking:set", { paused: trackingPaused });
        dashboard?.webContents.send("tracking:set", { paused: trackingPaused });
        updateTrayMenu();
      },
    },
    { type: "separator" },
    {
      label: "Panel Position (Wayland)",
      submenu: [
        {
          label: "Auto Detect",
          type: "radio",
          checked: panelPos === "auto",
          click: () => {
            dataStore.setPanelPosition("auto");
            updateTrayMenu();
          },
        },
        {
          label: "Top",
          type: "radio",
          checked: panelPos === "top",
          click: () => {
            dataStore.setPanelPosition("top");
            updateTrayMenu();
          },
        },
        {
          label: "Bottom",
          type: "radio",
          checked: panelPos === "bottom",
          click: () => {
            dataStore.setPanelPosition("bottom");
            updateTrayMenu();
          },
        },
        {
          label: "Left",
          type: "radio",
          checked: panelPos === "left",
          click: () => {
            dataStore.setPanelPosition("left");
            updateTrayMenu();
          },
        },
        {
          label: "Right",
          type: "radio",
          checked: panelPos === "right",
          click: () => {
            dataStore.setPanelPosition("right");
            updateTrayMenu();
          },
        },
      ],
    },
    { type: "separator" },
    { label: "Open Dashboard", click: openDashboard },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
}

async function createPopover() {
  if (popover && !popover.isDestroyed()) return popover;

  popover = new BrowserWindow({
    width: 340,
    height: 580,
    frame: false,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    show: false,
    transparent: true,
    hasShadow: true,
    vibrancy: isMac ? "sidebar" : undefined, // nice macOS blur
    visualEffectState: isMac ? "active" : undefined,
    webPreferences: {
      preload: path.join(process.cwd(), "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await popover.loadFile("popover.html");

  // Auto-hide on blur/escape
  popover.on("blur", () => hidePopover());
  ipcMain.on("popover:close", hidePopover);

  return popover;
}

async function createDashboard() {
  if (dashboard && !dashboard.isDestroyed()) return dashboard;

  dashboard = new BrowserWindow({
    width: 980,
    height: 680,
    autoHideMenuBar: true,
    show: false,
    titleBarStyle: isMac ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(process.cwd(), "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await dashboard.loadFile("index.html");
  dashboard.on("close", (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      dashboard.hide();
    }
  });

  return dashboard;
}

function togglePopover() {
  if (!popover || popover.isDestroyed() || !popover.isVisible()) {
    showPopover();
  } else {
    hidePopover();
  }
}

async function showPopover() {
  const win = await createPopover();

  // Wait a bit for the window to be ready, then position and show
  await new Promise((resolve) => setTimeout(resolve, 10));
  positionPopover(win);

  // Show the window
  win.show();
  win.focus(); // focus so blur-to-close works consistently
}

function hidePopover() {
  if (popover && !popover.isDestroyed()) popover.hide();
}

async function openDashboard() {
  const w = await createDashboard();
  w.show();
  w.focus();
  hidePopover();
}

function positionPopover(win) {
  const { width: w, height: h } = win.getBounds();
  const cursorPos = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPos);
  const { workArea, bounds: screenBounds } = display;

  // Detect if we're on Wayland (workArea equals bounds = no panel info)
  const isWayland =
    workArea.x === screenBounds.x &&
    workArea.y === screenBounds.y &&
    workArea.width === screenBounds.width &&
    workArea.height === screenBounds.height;

  let trayBounds = tray.getBounds();

  // Fallback if tray.getBounds() returns zeros (common on Wayland/Linux)
  if (trayBounds.width === 0 || trayBounds.height === 0) {
    // Use cursor position as approximation
    trayBounds = {
      x: cursorPos.x - 11,
      y: cursorPos.y - 11,
      width: 22,
      height: 22,
    };
  }

  let x, y;

  if (isMac) {
    // On macOS the tray sits on the top bar. Center below the tray icon.
    x = Math.round(trayBounds.x + trayBounds.width / 2 - w / 2);
    y = Math.round(trayBounds.y + trayBounds.height + 4);
  } else if (isWayland) {
    // WAYLAND-SPECIFIC POSITIONING
    // Get user preference or auto-detect
    const userPanelPos = dataStore.getPanelPosition();

    const PANEL_SIZE = 40; // Typical panel height
    const centerX = screenBounds.x + screenBounds.width / 2;
    const centerY = screenBounds.y + screenBounds.height / 2;

    // Determine panel position
    let panelPosition;
    if (userPanelPos !== "auto") {
      // Use user's manual setting
      panelPosition = userPanelPos;
    } else {
      // Auto-detect based on cursor/tray location
      const nearTop = trayBounds.y < centerY / 2;
      const nearBottom = trayBounds.y > screenBounds.height - centerY / 2;
      const nearLeft = trayBounds.x < centerX / 2;
      const nearRight = trayBounds.x > screenBounds.width - centerX / 2;

      if (nearBottom) panelPosition = "bottom";
      else if (nearTop) panelPosition = "top";
      else if (nearLeft) panelPosition = "left";
      else if (nearRight) panelPosition = "right";
      else panelPosition = "bottom"; // default fallback
    }

    // Position based on detected/configured panel position
    x = Math.round(trayBounds.x + trayBounds.width / 2 - w / 2);

    switch (panelPosition) {
      case "top":
        x = Math.round(trayBounds.x + trayBounds.width / 2 - w / 2);
        y = Math.min(
          screenBounds.height - h - 8,
          trayBounds.y + trayBounds.height + 6
        );
        break;
      case "bottom":
        x = Math.round(trayBounds.x + trayBounds.width / 2 - w / 2);
        y = Math.max(8, trayBounds.y - h - 6);
        break;
      case "left":
        y = Math.round(trayBounds.y + trayBounds.height / 2 - h / 2);
        x = trayBounds.x + trayBounds.width + 6;
        break;
      case "right":
        y = Math.round(trayBounds.y + trayBounds.height / 2 - h / 2);
        x = trayBounds.x - w - 6;
        break;
    }

    // Ensure window stays on screen with padding
    x = Math.max(8, Math.min(x, screenBounds.width - w - 8));
    y = Math.max(8, Math.min(y, screenBounds.height - h - 8));
  } else {
    // X11/Windows - workArea is reliable
    const isBottom = trayBounds.y >= workArea.y + workArea.height - 100;
    const isTop = trayBounds.y <= workArea.y + 100;
    const isLeft = trayBounds.x <= workArea.x + 100;
    const isRight = trayBounds.x >= workArea.x + workArea.width - 100;

    x = Math.round(trayBounds.x + trayBounds.width / 2 - w / 2);

    if (isBottom) {
      y = trayBounds.y - h - 6;
    } else if (isTop) {
      y = trayBounds.y + trayBounds.height + 6;
    } else if (isLeft || isRight) {
      y = Math.round(trayBounds.y + trayBounds.height / 2 - h / 2);
      x = isRight ? trayBounds.x - w - 6 : trayBounds.x + trayBounds.width + 6;
    } else {
      y = trayBounds.y - h - 6;
    }

    x = Math.max(
      workArea.x + 4,
      Math.min(x, workArea.x + workArea.width - w - 4)
    );
    y = Math.max(
      workArea.y + 4,
      Math.min(y, workArea.y + workArea.height - h - 4)
    );
  }

  win.setPosition(x, y, false);
}

function singleInstanceGuard() {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return false;
  }
  app.on("second-instance", async () => {
    await showPopover();
  });
  return true;
}

// ========== KEYBOARD TRACKING ==========

function startKeyboardTracking() {
  if (keyboardHookActive) return;

  if (isWaylandSession) {
    console.log("⚠️  Wayland detected: Using window-focused keyboard tracking");
    console.log(
      "ℹ️  Keys will only be tracked when TypeMeter windows are focused"
    );
    keyboardHookActive = true;
    // On Wayland, we'll use window-level tracking (set up in window creation)
    return;
  }

  // X11/Windows/macOS: Use global hooks
  console.log("Starting global keyboard tracking...");
  try {
    uIOhook.on("keydown", (e) => {
      if (trackingPaused) return;

      // Determine key type
      let keyType = "normal";
      if (e.keycode === UiohookKey.Backspace) {
        keyType = "backspace";
      } else if (
        e.keycode === UiohookKey.Enter ||
        e.keycode === UiohookKey.Return
      ) {
        keyType = "enter";
      } else if (e.keycode === UiohookKey.Delete) {
        keyType = "delete";
      } else if (e.keycode === UiohookKey.Space) {
        keyType = "space";
      }

      handleKeyPress(keyType);
    });

    uIOhook.start();
    keyboardHookActive = true;
    console.log("✓ Global keyboard tracking started");

    if (isMac) {
      console.log("ℹ️  macOS: Make sure to grant accessibility permissions");
      console.log("   System Preferences → Security & Privacy → Accessibility");
    }
  } catch (err) {
    console.error("Failed to start keyboard tracking:", err);
    console.error(
      "The app will continue to run, but keyboard tracking is disabled"
    );

    if (isMac) {
      console.error(
        "macOS users: Check accessibility permissions in System Preferences"
      );
    }

    // Don't crash the app - continue with tray functionality
    keyboardHookActive = false;
  }
}

function handleKeyPress(keyType) {
  console.log(`Key pressed: ${(keyType, trackingPaused)}`);
  if (trackingPaused) return;

  // Update stats
  const stats = dataStore.incrementKey(keyType);
  const kpm = dataStore.getKeysPerMinute();
  const todayStats = dataStore.getTodayStats();
  const dailyStats = dataStore.getDailyStats();
  const lastWeekStats = dataStore.getLastNDaysStats(7);
  const kpmSeries = dataStore.getKeysPerMinuteSeries();

  // Broadcast to all windows
  const payload = {
    stats,
    kpm,
    todayStats,
    dailyStats,
    lastWeekStats,
    kpmSeries,
    paused: trackingPaused,
  };

  popover?.webContents.send("stats:update", payload);
  dashboard?.webContents.send("stats:update", payload);
}

function stopKeyboardTracking() {
  if (!keyboardHookActive) return;

  if (isWaylandSession) {
    keyboardHookActive = false;
    console.log("✓ Window-focused keyboard tracking stopped");
    return;
  }

  try {
    uIOhook.stop();
    keyboardHookActive = false;
    console.log("✓ Global keyboard tracking stopped");
  } catch (err) {
    console.error("Failed to stop keyboard tracking:", err);
  }
}

// ========== IPC HANDLERS ==========

ipcMain.on("key:pressed", (event, { keyType }) => {
  // Handle keyboard events from renderer (Wayland fallback)
  handleKeyPress(keyType);
});

ipcMain.on("stats:get", (event) => {
  const stats = dataStore.getStats();
  const kpm = dataStore.getKeysPerMinute();
  const todayStats = dataStore.getTodayStats();
  const dailyStats = dataStore.getDailyStats();
  const lastWeekStats = dataStore.getLastNDaysStats(7);
  const kpmSeries = dataStore.getKeysPerMinuteSeries();

  event.reply("stats:update", {
    stats,
    kpm,
    todayStats,
    dailyStats,
    lastWeekStats,
    kpmSeries,
    paused: trackingPaused,
    isWayland: isWaylandSession,
  });
});

ipcMain.on("stats:reset", () => {
  dataStore.resetStats();
  const stats = dataStore.getStats();
  const payload = {
    stats,
    kpm: 0,
    todayStats: dataStore.getTodayStats(),
    dailyStats: {},
    lastWeekStats: dataStore.getLastNDaysStats(7),
    kpmSeries: dataStore.getKeysPerMinuteSeries(),
    paused: trackingPaused,
  };

  popover?.webContents.send("stats:update", payload);
  dashboard?.webContents.send("stats:update", payload);
});

ipcMain.on("tracking:toggle", () => {
  trackingPaused = !trackingPaused;
  popover?.webContents.send("tracking:set", { paused: trackingPaused });
  dashboard?.webContents.send("tracking:set", { paused: trackingPaused });
  updateTrayMenu();
});

ipcMain.on("dashboard:open", () => {
  openDashboard();
});

ipcMain.on("dashboard:close", () => {
  if (dashboard && !dashboard.isDestroyed()) {
    dashboard.hide();
  }
});

// ========== APP LIFECYCLE ==========

app.whenReady().then(async () => {
  console.log("App is ready, platform:", process.platform);

  if (!singleInstanceGuard()) {
    console.log("Another instance is already running");
    return;
  }

  if (isMac) {
    console.log("macOS detected, hiding dock icon");
    app.dock.hide();
  }

  // Create tray first - this should always work
  createTray();

  // Then start keyboard tracking - this might fail on macOS without permissions
  // but the app should continue to work
  startKeyboardTracking();

  console.log("TypeMeter is running in the system tray");
});

app.on("window-all-closed", () => {
  // keep running in tray
});

app.on("before-quit", () => {
  stopKeyboardTracking();
});
