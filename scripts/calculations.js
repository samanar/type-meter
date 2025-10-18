// scripts/calculations.js - Reusable calculation functions for TypeMeter

// Constants for fun insights calculations
export const FUN_CONSTANTS = {
  CALORIES_PER_KEY: 0.0008, // kcal per keystroke (playful estimate)
  KCAL_TO_WH: 1.162,
  PHONE_BATTERY_WH: 15,
  FORCE_PER_KEY_KG: 0.06, // roughly 60 g of force per key
  KEY_TRAVEL_CM: 1.2, // estimated finger travel per key
  KEYBOARD_WIDTH_M: 0.28,
  GRAND_PIANO_KG: 265,
  WORDS_PER_PAGE: 275,
  WORDS_PER_NOVEL: 80000,
};

/**
 * Calculate energy burned from keystrokes
 * @param {number} totalKeys - Total number of keystrokes
 * @returns {object} - Object with calories, energyWh, and phonePercent
 */
export function calculateEnergyBurned(totalKeys) {
  const calories = totalKeys * FUN_CONSTANTS.CALORIES_PER_KEY;
  const energyWh = calories * FUN_CONSTANTS.KCAL_TO_WH;
  const phonePercent = Math.min(
    (energyWh / FUN_CONSTANTS.PHONE_BATTERY_WH) * 100,
    999
  );

  return {
    calories,
    energyWh,
    phonePercent,
  };
}

/**
 * Calculate workout equivalent from keystrokes
 * @param {number} keystrokes - Number of keystrokes
 * @returns {object} - Object with forceKg and equivalentPianos
 */
export function calculateWorkoutEquivalent(keystrokes) {
  const forceKg = keystrokes * FUN_CONSTANTS.FORCE_PER_KEY_KG;
  const equivalentPianos = forceKg / FUN_CONSTANTS.GRAND_PIANO_KG;

  return {
    forceKg,
    equivalentPianos,
  };
}

/**
 * Calculate travel distance from keystrokes
 * @param {number} keystrokes - Number of keystrokes
 * @returns {object} - Object with distanceMeters, keyboardLaps, and formatted values
 */
export function calculateTravelDistance(keystrokes) {
  const distanceMeters = (keystrokes * FUN_CONSTANTS.KEY_TRAVEL_CM) / 100;
  const keyboardLaps =
    FUN_CONSTANTS.KEYBOARD_WIDTH_M > 0
      ? distanceMeters / FUN_CONSTANTS.KEYBOARD_WIDTH_M
      : 0;

  // Format the distance value
  const travelValue =
    distanceMeters >= 1000
      ? `${formatNumber(distanceMeters / 1000, 2)} km`
      : `${formatNumber(distanceMeters, 1)} m`;

  return {
    distanceMeters,
    keyboardLaps,
    travelValue,
  };
}

/**
 * Calculate all fun insights for given statistics
 * @param {object} stats - Statistics object with totalKeys
 * @param {object} todayStats - Today's statistics with total
 * @returns {object} - Object with all calculated insights
 */
export function calculateFunInsights(stats = {}, todayStats = {}) {
  const totalKeys = stats?.totalKeys ?? 0;
  const todayTotal = todayStats?.total ?? 0;

  const energy = calculateEnergyBurned(totalKeys);
  const workout = calculateWorkoutEquivalent(todayTotal);
  const travel = calculateTravelDistance(todayTotal);
  const writing = calculateWritingProgress(stats, todayStats);

  return {
    energy,
    workout,
    travel,
    writing,
    totalKeys,
    todayTotal,
  };
}

/**
 * Format a number with specified decimal places
 * @param {number} value - Number to format
 * @param {number} fractionDigits - Number of decimal places
 * @returns {string} - Formatted number string
 */
export function formatNumber(value, fractionDigits = 0) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/**
 * Estimate writing progress based on space and enter key usage
 * @param {object} stats - Overall stats with spaceKeys and enterKeys
 * @param {object} todayStats - Today's stats with space and enter counts
 * @returns {object} - Object with word, page, and novel progress metrics
 */
export function calculateWritingProgress(stats = {}, todayStats = {}) {
  const totalSpaces = stats?.spaceKeys ?? 0;
  const totalEnters = stats?.enterKeys ?? 0;
  const todaySpaces = todayStats?.space ?? 0;
  const todayEnters = todayStats?.enter ?? 0;

  const totalWords = Math.max(totalSpaces + totalEnters, 0);
  const todayWords = Math.max(todaySpaces + todayEnters, 0);

  const pages = totalWords / FUN_CONSTANTS.WORDS_PER_PAGE;
  const todayPages = todayWords / FUN_CONSTANTS.WORDS_PER_PAGE;
  const novelProgress = totalWords / FUN_CONSTANTS.WORDS_PER_NOVEL;
  const novelPercent = Math.min(novelProgress * 100, 999);

  return {
    totalWords,
    todayWords,
    pages,
    todayPages,
    novelProgress,
    novelPercent,
  };
}
