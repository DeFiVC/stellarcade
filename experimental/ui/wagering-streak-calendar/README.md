# Wagering Streak Calendar

An experimental GitHub-style activity heatmap calendar component for visualizing daily wagering activity, matches played, volume, and active streaks.

## Features
- **Rolling Grid View**: Interactive monthly calendar with leap year handling and clean month navigation.
- **Color Intensity Tiers**:
  - `tier-0`: 0 rounds / dark gray
  - `tier-1`: 1-3 rounds / light green
  - `tier-2`: 4-10 rounds / neon green
  - `tier-3`: 11+ rounds / gold
- **Streak Badges**: Displays current active streak and all-time longest streak counter badges.
- **Tooltip Summaries**: Hover inspection showing exact match count, date, and net volume.
- **Accessibility**: Full ARIA grid/gridcell support and readable labels.

## Installation / Usage

```tsx
import { WageringStreakCalendar } from './WageringStreakCalendar';
import type { DayActivityRecord } from './types';

const sampleData: DayActivityRecord[] = [
  { date: '2026-09-01', matchesPlayed: 3, netVolume: 120 },
  { date: '2026-09-02', matchesPlayed: 14, netVolume: 850 },
];

export function ActivityView() {
  return (
    <WageringStreakCalendar
      activityData={sampleData}
      currentStreak={5}
      longestStreak={14}
      onSelectDay={(day) => console.log('Selected day:', day)}
    />
  );
}
```

## Running Tests

```bash
npm test
```
