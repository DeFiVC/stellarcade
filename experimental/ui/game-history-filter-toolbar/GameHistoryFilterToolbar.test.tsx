import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameHistoryFilterToolbar, DEFAULT_FILTERS } from './GameHistoryFilterToolbar';
import type { HistoryFilters } from './types';

describe('GameHistoryFilterToolbar', () => {
  it('renders default controls correctly', () => {
    const handleFilterChange = vi.fn();
    render(
      <GameHistoryFilterToolbar
        filters={DEFAULT_FILTERS}
        onFilterChange={handleFilterChange}
      />
    );

    expect(screen.getByTestId('outcome-pill-all')).toBeDefined();
    expect(screen.getByTestId('outcome-pill-won')).toBeDefined();
    expect(screen.getByTestId('game-type-select')).toHaveValue('all');
  });

  it('changing outcome filter updates filter object', () => {
    const handleFilterChange = vi.fn();
    render(
      <GameHistoryFilterToolbar
        filters={DEFAULT_FILTERS}
        onFilterChange={handleFilterChange}
      />
    );

    const wonPill = screen.getByTestId('outcome-pill-won');
    fireEvent.click(wonPill);

    expect(handleFilterChange).toHaveBeenCalledTimes(1);
    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'won' })
    );
  });

  it('changing game type dropdown triggers onFilterChange', () => {
    const handleFilterChange = vi.fn();
    render(
      <GameHistoryFilterToolbar
        filters={DEFAULT_FILTERS}
        onFilterChange={handleFilterChange}
      />
    );

    const select = screen.getByTestId('game-type-select');
    fireEvent.change(select, { target: { value: 'dice' } });

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ gameType: 'dice' })
    );
  });

  it('changing min/max wager numeric inputs triggers onFilterChange', () => {
    const handleFilterChange = vi.fn();
    render(
      <GameHistoryFilterToolbar
        filters={DEFAULT_FILTERS}
        onFilterChange={handleFilterChange}
      />
    );

    const minInput = screen.getByTestId('min-wager-input');
    fireEvent.change(minInput, { target: { value: '25' } });
    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ minWager: 25 })
    );

    const maxInput = screen.getByTestId('max-wager-input');
    fireEvent.change(maxInput, { target: { value: '100' } });
    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ maxWager: 100 })
    );
  });

  it('clear all button resets filters to defaults', () => {
    const handleFilterChange = vi.fn();
    const activeFilters: HistoryFilters = {
      outcome: 'won',
      gameType: 'coinflip',
      minWager: 10,
      maxWager: 50,
      startDate: '2026-09-01',
      endDate: '2026-09-29',
    };

    render(
      <GameHistoryFilterToolbar
        filters={activeFilters}
        onFilterChange={handleFilterChange}
      />
    );

    expect(screen.getByTestId('active-chips-container')).toBeDefined();
    const clearAllButton = screen.getByTestId('clear-all-button');
    fireEvent.click(clearAllButton);

    expect(handleFilterChange).toHaveBeenCalledTimes(1);
    expect(handleFilterChange).toHaveBeenCalledWith(DEFAULT_FILTERS);
  });

  it('export button triggers onExportCsv callback', () => {
    const handleFilterChange = vi.fn();
    const handleExportCsv = vi.fn();

    render(
      <GameHistoryFilterToolbar
        filters={DEFAULT_FILTERS}
        onFilterChange={handleFilterChange}
        onExportCsv={handleExportCsv}
      />
    );

    const exportBtn = screen.getByTestId('export-csv-button');
    fireEvent.click(exportBtn);

    expect(handleExportCsv).toHaveBeenCalledTimes(1);
  });
});
