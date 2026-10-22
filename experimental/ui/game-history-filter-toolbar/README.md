# Game History Filter Toolbar

An experimental modular history filtering toolbar component to filter game records by outcome, wager range, game type, and date range, with active chip tags and CSV export trigger.

## Features
- **Segmented Outcome Filter**: Quick toggle between All, Wins Only, Losses Only, and Pushed.
- **Game Type Selector**: Filter by specific game modes (Coinflip, Dice, Minesweeper, etc.).
- **Wager Range Inputs**: Min and Max wager range numeric filters.
- **Date Range Pickers**: Start and end date filters.
- **Active Filter Chips**: Visual indicators of currently active filter criteria with one-click removal and "Clear All".
- **CSV Export Action**: Trigger handler for exporting filtered results.

## Usage

```tsx
import { useState } from 'react';
import { GameHistoryFilterToolbar, DEFAULT_FILTERS } from './GameHistoryFilterToolbar';
import type { HistoryFilters } from './types';

export function GameHistorySection() {
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_FILTERS);

  return (
    <GameHistoryFilterToolbar
      filters={filters}
      onFilterChange={setFilters}
      onExportCsv={() => console.log('Exporting CSV with filters:', filters)}
    />
  );
}
```

## Running Tests

```bash
npm test
```
