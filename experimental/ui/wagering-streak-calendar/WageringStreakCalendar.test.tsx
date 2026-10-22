import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WageringStreakCalendar, getStreakTier } from './WageringStreakCalendar';
import type { DayActivityRecord } from './types';

describe('WageringStreakCalendar', () => {
  const mockActivityData: DayActivityRecord[] = [
    { date: '2026-09-01', matchesPlayed: 0, netVolume: 0 },
    { date: '2026-09-02', matchesPlayed: 2, netVolume: 50 },
    { date: '2026-09-03', matchesPlayed: 7, netVolume: 200 },
    { date: '2026-09-04', matchesPlayed: 15, netVolume: 1200 },
  ];

  it('maps activity levels to correct color intensity classes/tiers', () => {
    expect(getStreakTier(0)).toBe('tier-0');
    expect(getStreakTier(1)).toBe('tier-1');
    expect(getStreakTier(3)).toBe('tier-1');
    expect(getStreakTier(4)).toBe('tier-2');
    expect(getStreakTier(10)).toBe('tier-2');
    expect(getStreakTier(11)).toBe('tier-3');
    expect(getStreakTier(25)).toBe('tier-3');
  });

  it('renders correctly with given activity data and streaks', () => {
    render(
      <WageringStreakCalendar
        activityData={mockActivityData}
        currentStreak={4}
        longestStreak={12}
        initialDate={new Date('2026-09-15')}
      />
    );

    expect(screen.getByTestId('current-streak-badge')).toHaveTextContent('4d 🔥');
    expect(screen.getByTestId('longest-streak-badge')).toHaveTextContent('12d 🏆');
    expect(screen.getByTestId('calendar-month-year')).toHaveTextContent('September 2026');

    // Day 2 should be tier-1
    const day2Cell = screen.getByTestId('day-cell-2026-09-02');
    expect(day2Cell).toHaveClass('tier-1');

    // Day 3 should be tier-2
    const day3Cell = screen.getByTestId('day-cell-2026-09-03');
    expect(day3Cell).toHaveClass('tier-2');

    // Day 4 should be tier-3
    const day4Cell = screen.getByTestId('day-cell-2026-09-04');
    expect(day4Cell).toHaveClass('tier-3');
  });

  it('clicking a day cell fires onSelectDay callback with day record', () => {
    const handleSelectDay = vi.fn();
    render(
      <WageringStreakCalendar
        activityData={mockActivityData}
        currentStreak={3}
        longestStreak={5}
        initialDate={new Date('2026-09-15')}
        onSelectDay={handleSelectDay}
      />
    );

    const day3Cell = screen.getByTestId('day-cell-2026-09-03');
    fireEvent.click(day3Cell);

    expect(handleSelectDay).toHaveBeenCalledTimes(1);
    expect(handleSelectDay).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-09-03',
        matchesPlayed: 7,
        netVolume: 200,
      })
    );
  });

  it('empty activity history renders default inactive grid with tier-0 cells', () => {
    render(
      <WageringStreakCalendar
        activityData={[]}
        currentStreak={0}
        longestStreak={0}
        initialDate={new Date('2026-09-15')}
      />
    );

    const day1Cell = screen.getByTestId('day-cell-2026-09-01');
    expect(day1Cell).toHaveClass('tier-0');
    expect(day1Cell).toHaveAttribute('aria-label', expect.stringContaining('0 matches played'));
  });

  it('handles month navigation cleanly', () => {
    render(
      <WageringStreakCalendar
        activityData={[]}
        currentStreak={1}
        longestStreak={2}
        initialDate={new Date('2026-09-15')}
      />
    );

    expect(screen.getByTestId('calendar-month-year')).toHaveTextContent('September 2026');

    const prevButton = screen.getByLabelText('Previous month');
    fireEvent.click(prevButton);
    expect(screen.getByTestId('calendar-month-year')).toHaveTextContent('August 2026');

    const nextButton = screen.getByLabelText('Next month');
    fireEvent.click(nextButton);
    expect(screen.getByTestId('calendar-month-year')).toHaveTextContent('September 2026');
  });

  it('handles leap years correctly for February 2024 and 2025', () => {
    const { unmount } = render(
      <WageringStreakCalendar
        activityData={[]}
        currentStreak={0}
        longestStreak={0}
        initialDate={new Date('2024-02-10')}
      />
    );
    expect(screen.getByTestId('day-cell-2024-02-29')).toBeDefined();
    unmount();

    render(
      <WageringStreakCalendar
        activityData={[]}
        currentStreak={0}
        longestStreak={0}
        initialDate={new Date('2025-02-10')}
      />
    );
    expect(screen.queryByTestId('day-cell-2025-02-29')).toBeNull();
  });
});
