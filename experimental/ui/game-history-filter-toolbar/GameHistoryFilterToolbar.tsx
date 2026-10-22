import React from 'react';
import type { GameHistoryFilterToolbarProps, HistoryFilters, GameOutcome } from './types';

const DEFAULT_GAME_TYPES = [
  { label: 'All Games', value: 'all' },
  { label: 'Coinflip', value: 'coinflip' },
  { label: 'Dice', value: 'dice' },
  { label: 'Minesweeper', value: 'minesweeper' },
];

const OUTCOME_OPTIONS: Array<{ label: string; value: GameOutcome }> = [
  { label: 'All', value: 'all' },
  { label: 'Wins Only', value: 'won' },
  { label: 'Losses Only', value: 'lost' },
  { label: 'Pushed', value: 'pushed' },
];

export const DEFAULT_FILTERS: HistoryFilters = {
  outcome: 'all',
  gameType: 'all',
  minWager: null,
  maxWager: null,
  startDate: '',
  endDate: '',
};

export const GameHistoryFilterToolbar: React.FC<GameHistoryFilterToolbarProps> = ({
  filters,
  onFilterChange,
  onExportCsv,
  gameTypeOptions = DEFAULT_GAME_TYPES,
  className = '',
}) => {
  const handleOutcomeChange = (outcome: GameOutcome) => {
    onFilterChange({ ...filters, outcome });
  };

  const handleGameTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, gameType: e.target.value });
  };

  const handleMinWagerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === '' ? null : Number(e.target.value);
    onFilterChange({ ...filters, minWager: val });
  };

  const handleMaxWagerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === '' ? null : Number(e.target.value);
    onFilterChange({ ...filters, maxWager: val });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, startDate: e.target.value });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, endDate: e.target.value });
  };

  const handleClearAll = () => {
    onFilterChange({ ...DEFAULT_FILTERS });
  };

  // Determine active filter chips
  const activeChips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  if (filters.outcome !== 'all') {
    const outcomeLabel = OUTCOME_OPTIONS.find((o) => o.value === filters.outcome)?.label || filters.outcome;
    activeChips.push({
      key: 'outcome',
      label: `Outcome: ${outcomeLabel}`,
      onRemove: () => onFilterChange({ ...filters, outcome: 'all' }),
    });
  }

  if (filters.gameType !== 'all') {
    const typeLabel = gameTypeOptions.find((g) => g.value === filters.gameType)?.label || filters.gameType;
    activeChips.push({
      key: 'gameType',
      label: `Game: ${typeLabel}`,
      onRemove: () => onFilterChange({ ...filters, gameType: 'all' }),
    });
  }

  if (filters.minWager !== null && filters.minWager !== undefined) {
    activeChips.push({
      key: 'minWager',
      label: `Min: ${filters.minWager} XLM`,
      onRemove: () => onFilterChange({ ...filters, minWager: null }),
    });
  }

  if (filters.maxWager !== null && filters.maxWager !== undefined) {
    activeChips.push({
      key: 'maxWager',
      label: `Max: ${filters.maxWager} XLM`,
      onRemove: () => onFilterChange({ ...filters, maxWager: null }),
    });
  }

  if (filters.startDate) {
    activeChips.push({
      key: 'startDate',
      label: `From: ${filters.startDate}`,
      onRemove: () => onFilterChange({ ...filters, startDate: '' }),
    });
  }

  if (filters.endDate) {
    activeChips.push({
      key: 'endDate',
      label: `To: ${filters.endDate}`,
      onRemove: () => onFilterChange({ ...filters, endDate: '' }),
    });
  }

  return (
    <div
      className={`game-history-filter-toolbar ${className}`}
      style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '16px',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Top Filter Controls Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Outcome Segmented Buttons */}
        <div
          role="group"
          aria-label="Outcome Filter"
          style={{
            display: 'inline-flex',
            background: '#1e293b',
            borderRadius: '8px',
            padding: '4px',
            gap: '2px',
          }}
        >
          {OUTCOME_OPTIONS.map((opt) => {
            const isSelected = filters.outcome === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                data-testid={`outcome-pill-${opt.value}`}
                onClick={() => handleOutcomeChange(opt.value)}
                style={{
                  background: isSelected ? '#3b82f6' : 'transparent',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Game Type Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="game-type-select" style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Game:
          </label>
          <select
            id="game-type-select"
            data-testid="game-type-select"
            value={filters.gameType}
            onChange={handleGameTypeChange}
            style={{
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {gameTypeOptions.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Wager Numeric Range Inputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label htmlFor="min-wager-input" style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Wager:
          </label>
          <input
            id="min-wager-input"
            data-testid="min-wager-input"
            type="number"
            placeholder="Min"
            value={filters.minWager ?? ''}
            onChange={handleMinWagerChange}
            min={0}
            style={{
              width: '70px',
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 8px',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
          <span style={{ color: '#64748b' }}>-</span>
          <input
            id="max-wager-input"
            data-testid="max-wager-input"
            type="number"
            placeholder="Max"
            value={filters.maxWager ?? ''}
            onChange={handleMaxWagerChange}
            min={0}
            style={{
              width: '70px',
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 8px',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Date Range Pickers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label htmlFor="start-date-input" style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Dates:
          </label>
          <input
            id="start-date-input"
            data-testid="start-date-input"
            type="date"
            value={filters.startDate || ''}
            onChange={handleStartDateChange}
            style={{
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
          <span style={{ color: '#64748b' }}>to</span>
          <input
            id="end-date-input"
            data-testid="end-date-input"
            type="date"
            value={filters.endDate || ''}
            onChange={handleEndDateChange}
            style={{
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Action Button: Export CSV */}
        {onExportCsv && (
          <button
            type="button"
            data-testid="export-csv-button"
            onClick={onExportCsv}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            }}
          >
            <span>📥</span> Export CSV
          </button>
        )}
      </div>

      {/* Active Filter Chips and Clear All */}
      {activeChips.length > 0 && (
        <div
          data-testid="active-chips-container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #1e293b',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
            Active Filters:
          </span>

          {activeChips.map((chip) => (
            <span
              key={chip.key}
              data-testid={`filter-chip-${chip.key}`}
              style={{
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #0284c7',
                borderRadius: '9999px',
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {chip.label}
              <button
                type="button"
                aria-label={`Remove filter ${chip.key}`}
                onClick={chip.onRemove}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.85rem',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}

          <button
            type="button"
            data-testid="clear-all-button"
            onClick={handleClearAll}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              textDecoration: 'underline',
              marginLeft: '4px',
            }}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};
