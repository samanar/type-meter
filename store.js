// store.js - Data persistence for TypeMeter
import Store from "electron-store";

const MAX_STORED_DAYS = 90;

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

function createDailyEntry() {
  return {
    total: 0,
    backspace: 0,
    enter: 0,
    delete: 0,
    space: 0,
    startTime: Date.now(),
  };
}

function getDateKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function trimOldDailyStats(stats, keepDays = MAX_STORED_DAYS) {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (keepDays - 1));

  Object.keys(stats.dailyStats || {}).forEach((key) => {
    const entryDate = new Date(`${key}T00:00:00`);
    if (Number.isNaN(entryDate.getTime()) || entryDate < cutoff) {
      delete stats.dailyStats[key];
    }
  });
}

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
    stats.dailyStats[today] = createDailyEntry();
  }

  stats.dailyStats[today].total++;
  if (keyType === "backspace") stats.dailyStats[today].backspace++;
  if (keyType === "enter") stats.dailyStats[today].enter++;
  if (keyType === "delete") stats.dailyStats[today].delete++;
  if (keyType === "space") stats.dailyStats[today].space++;

  trimOldDailyStats(stats);
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

export function getLastNDaysStats(days = 7) {
  const stats = getStats();
  const safeDays = Math.max(1, Math.floor(days));
  const today = new Date();
  const results = [];

  for (let i = safeDays - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - i);
    const key = getDateKey(date);
    const stored = stats.dailyStats?.[key];
    results.push({
      date: key,
      total: stored?.total ?? 0,
      backspace: stored?.backspace ?? 0,
      enter: stored?.enter ?? 0,
      delete: stored?.delete ?? 0,
      space: stored?.space ?? 0,
    });
  }

  return results;
}

function getTodayKey() {
  return getDateKey(new Date());
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
  getLastNDaysStats,
  getPanelPosition,
  setPanelPosition,
};
