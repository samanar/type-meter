// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("typemeter", {
  // tracking state from tray menu
  onTracking: (cb) =>
    ipcRenderer.on("tracking:set", (_e, payload) => cb(payload)),

  // stats updates
  onStatsUpdate: (cb) =>
    ipcRenderer.on("stats:update", (_e, payload) => cb(payload)),

  getStats: () => ipcRenderer.send("stats:get"),

  resetStats: () => ipcRenderer.send("stats:reset"),

  toggleTracking: () => ipcRenderer.send("tracking:toggle"),

  openDashboard: () => ipcRenderer.send("dashboard:open"),

  // keyboard tracking (Wayland fallback)
  sendKeyPress: (keyType) => ipcRenderer.send("key:pressed", { keyType }),

  // window controls
  closePopover: () => ipcRenderer.send("popover:close"),

  closeDashboard: () => ipcRenderer.send("dashboard:close"),
});
