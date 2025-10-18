# scripts/

This folder contains reusable JavaScript modules for TypeMeter calculations and utilities.

## Files

### calculations.js

Contains reusable calculation functions for fun insights and statistics:

- `calculateEnergyBurned(totalKeys)` - Calculate calories burned and phone battery equivalent
- `calculateWorkoutEquivalent(keystrokes)` - Calculate force applied and piano equivalents
- `calculateTravelDistance(keystrokes)` - Calculate finger travel distance and keyboard laps
- `calculateFunInsights(stats, todayStats)` - Calculate all insights at once
- `formatNumber(value, fractionDigits)` - Format numbers with locale-specific formatting
- `FUN_CONSTANTS` - Constants used for calculations

## Usage

```javascript
import {
  calculateFunInsights,
  formatNumber
} from './scripts/calculations.js';

// Calculate insights for stats
const insights = calculateFunInsights(
  { totalKeys: 10000 },
  { total: 500 }
);

// Use individual functions
const energy = calculateEnergyBurned(10000);
const workout = calculateWorkoutEquivalent(500);
const travel = calculateTravelDistance(500);
```

## Benefits

- **Reusable**: Functions can be used across different pages (dashboard, popover, etc.)
- **Testable**: Pure functions that don't depend on DOM state
- **Maintainable**: Centralized calculation logic with clear constants
- **Modular**: Easy to extend with new calculation types
