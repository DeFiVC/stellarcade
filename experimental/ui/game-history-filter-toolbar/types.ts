export type GameOutcome = 'all' | 'won' | 'lost' | 'pushed';

export type GameTypeOption = 'all' | 'coinflip' | 'dice' | 'minesweeper' | string;

export interface HistoryFilters {
  outcome: GameOutcome;
  gameType: GameTypeOption;
  minWager?: number | null;
  maxWager?: number | null;
  startDate?: string;
  endDate?: string;
}

export interface GameHistoryFilterToolbarProps {
  filters: HistoryFilters;
  onFilterChange: (filters: HistoryFilters) => void;
  onExportCsv?: () => void;
  gameTypeOptions?: Array<{ label: string; value: string }>;
  className?: string;
}
