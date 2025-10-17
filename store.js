// store.js - Data persistence for TypeMeter
import Store from "electron-store";

const store = new Store({
  defaults: {
    stats: {
      totalKeys: 0,
      backspaceKeys: 0,
      enterKeys: 0,
      deleteKeys: 0,
      spaceKeys: 0,
      timestamps: [], // timestamps for rate calculation
      dailyStats: {}, // { "2025-10-17": { total: 123, backspace: 10, ... } }
      lastReset: new Date().toISOString(),
    },
    preferences: {
      panelPosition: "auto", // "auto", "top", "bottom", "left", "right"
    },
  },
});

export function getStats() {
  return store.get("stats");
}

export function updateStats(updates) {
  const current = getStats();
  const newStats = { ...current, ...updates };
  store.set("stats", newStats);
  return newStats;
}

export function incrementKey(keyType = "total") {
  const stats = getStats();
  const today = getTodayKey();

  // Update overall stats
  switch (keyType) {
    case "backspace":
      stats.totalKeys++;
      stats.backspaceKeys++;
      break;
    case "enter":
      stats.totalKeys++;
      stats.enterKeys++;
      break;
    case "delete":
      stats.totalKeys++;
      stats.deleteKeys++;
      break;
    case "space":
      stats.totalKeys++;
      stats.spaceKeys++;
      break;
    default:
      stats.totalKeys++;
  }

  // Add timestamp for rate calculation
  stats.timestamps.push(Date.now());

  // Keep only last 5 minutes of timestamps for performance
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  stats.timestamps = stats.timestamps.filter((t) => t > fiveMinAgo);

  // Update daily stats
  if (!stats.dailyStats[today]) {
    stats.dailyStats[today] = {
      total: 0,
      backspace: 0,
      enter: 0,
      delete: 0,
      space: 0,
      startTime: Date.now(),
    };
  }

  stats.dailyStats[today].total++;
  if (keyType === "backspace") stats.dailyStats[today].backspace++;
  if (keyType === "enter") stats.dailyStats[today].enter++;
  if (keyType === "delete") stats.dailyStats[today].delete++;
  if (keyType === "space") stats.dailyStats[today].space++;

  store.set("stats", stats);
  return stats;
}

export function getKeysPerMinute() {
  const stats = getStats();
  const oneMinAgo = Date.now() - 60 * 1000;
  return stats.timestamps.filter((t) => t > oneMinAgo).length;
}

export function getTodayStats() {
  const stats = getStats();
  const today = getTodayKey();
  return (
    stats.dailyStats[today] || {
      total: 0,
      backspace: 0,
      enter: 0,
      delete: 0,
      space: 0,
    }
  );
}

export function resetStats() {
  store.set("stats", {
    totalKeys: 0,
    backspaceKeys: 0,
    enterKeys: 0,
    deleteKeys: 0,
    spaceKeys: 0,
    timestamps: [],
    dailyStats: {},
    lastReset: new Date().toISOString(),
  });
}

export function getDailyStats() {
  const stats = getStats();
  return stats.dailyStats || {};
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getPanelPosition() {
  return store.get("preferences.panelPosition", "auto");
}

export function setPanelPosition(position) {
  store.set("preferences.panelPosition", position);
}

export default {
  getStats,
  updateStats,
  incrementKey,
  getKeysPerMinute,
  getTodayStats,
  resetStats,
  getDailyStats,
  getPanelPosition,
  setPanelPosition,
};
