// renderer.js - Shared utilities for renderer processes
// This file can be imported by other renderer scripts if needed

export function formatNumber(num) {
  return num.toLocaleString();
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

export function calculateRate(timestamps, windowMs = 60000) {
  const cutoff = Date.now() - windowMs;
  return timestamps.filter((t) => t > cutoff).length;
}
