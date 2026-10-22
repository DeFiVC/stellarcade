import React, { useState, useMemo } from 'react';
import type { DayActivityRecord, WageringStreakCalendarProps, StreakTier } from './types';

export const getStreakTier = (matchesPlayed: number): StreakTier => {
  if (matchesPlayed <= 0) return 'tier-0';
  if (matchesPlayed <= 3) return 'tier-1';
  if (matchesPlayed <= 10) return 'tier-2';
  return 'tier-3';
};

const TIER_COLORS: Record<StreakTier, { bg: string; border: string; label: string }> = {
  'tier-0': { bg: '#1e293b', border: '#334155', label: '0 matches' },
  'tier-1': { bg: '#15803d', border: '#22c55e', label: '1-3 matches' },
  'tier-2': { bg: '#22c55e', border: '#4ade80', label: '4-10 matches' },
  'tier-3': { bg: '#eab308', border: '#fde047', label: '11+ matches' },
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const WageringStreakCalendar: React.FC<WageringStreakCalendarProps> = ({
  activityData,
  currentStreak,
  longestStreak,
  onSelectDay,
  initialDate,
  className = '',
}) => {
  const [currentYear, setCurrentYear] = useState<number>(() => (initialDate ? initialDate.getFullYear() : new Date().getFullYear()));
  const [currentMonth, setCurrentMonth] = useState<number>(() => (initialDate ? initialDate.getMonth() : new Date().getMonth()));
  const [hoveredDay, setHoveredDay] = useState<DayActivityRecord | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Map activity data by date string YYYY-MM-DD
  const activityMap = useMemo(() => {
    const map = new Map<string, DayActivityRecord>();
    activityData.forEach(item => {
      map.set(item.date, item);
    });
    return map;
  }, [activityData]);

  // Days in month, handling leap years
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // First day of month (0 = Sun, 1 = Mon, etc.)
  const firstDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const calendarDays = useMemo(() => {
    const days: Array<{
      dateStr: string;
      dayNumber: number;
      record: DayActivityRecord;
      tier: StreakTier;
    }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

      const existingRecord = activityMap.get(dateStr);
      const record: DayActivityRecord = existingRecord || {
        date: dateStr,
        matchesPlayed: 0,
        netVolume: 0,
      };

      days.push({
        dateStr,
        dayNumber: day,
        record,
        tier: getStreakTier(record.matchesPlayed),
      });
    }

    return days;
  }, [currentYear, currentMonth, daysInMonth, activityMap]);

  return (
    <div
      className={`wagering-streak-calendar ${className}`}
      style={{
        background: '#0f172a',
        color: '#f8fafc',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #1e293b',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        maxWidth: '520px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header & Badges */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Wagering Activity</h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Daily match streak & volume heatmap
          </p>
        </div>

        {/* Streak Badges */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div
            data-testid="current-streak-badge"
            style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid #22c55e',
              borderRadius: '8px',
              padding: '4px 10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.65rem', color: '#86efac', textTransform: 'uppercase', fontWeight: 700 }}>
              Current Streak
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#4ade80' }}>
              {currentStreak}d 🔥
            </div>
          </div>

          <div
            data-testid="longest-streak-badge"
            style={{
              background: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid #eab308',
              borderRadius: '8px',
              padding: '4px 10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.65rem', color: '#fde047', textTransform: 'uppercase', fontWeight: 700 }}>
              Best Streak
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#facc15' }}>
              {longestStreak}d 🏆
            </div>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '8px',
        }}
      >
        <button
          type="button"
          onClick={handlePrevMonth}
          aria-label="Previous month"
          style={{
            background: '#1e293b',
            border: 'none',
            color: '#94a3b8',
            borderRadius: '6px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          &lt; Prev
        </button>

        <span
          data-testid="calendar-month-year"
          style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f1f5f9' }}
        >
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          aria-label="Next month"
          style={{
            background: '#1e293b',
            border: 'none',
            color: '#94a3b8',
            borderRadius: '6px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          Next &gt;
        </button>
      </div>

      {/* Weekday headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
          marginBottom: '6px',
          textAlign: 'center',
        }}
      >
        {WEEKDAY_NAMES.map((name) => (
          <div key={name} style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
            {name}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div
        role="grid"
        aria-label={`Activity calendar for ${MONTH_NAMES[currentMonth]} ${currentYear}`}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
        }}
      >
        {/* Leading empty cells for month offset */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} style={{ height: '36px' }} />
        ))}

        {/* Day Cells */}
        {calendarDays.map(({ dateStr, dayNumber, record, tier }) => {
          const tierStyle = TIER_COLORS[tier];
          return (
            <button
              key={dateStr}
              type="button"
              role="gridcell"
              data-testid={`day-cell-${dateStr}`}
              className={`streak-cell ${tier}`}
              aria-label={`${dateStr}: ${record.matchesPlayed} matches played, net volume ${record.netVolume ?? 0}`}
              onClick={() => onSelectDay?.(record)}
              onMouseEnter={(e) => {
                setHoveredDay(record);
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
              }}
              onMouseLeave={() => {
                setHoveredDay(null);
                setTooltipPos(null);
              }}
              style={{
                height: '36px',
                background: tierStyle.bg,
                border: `1px solid ${tierStyle.border}`,
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: tier === 'tier-0' ? '#94a3b8' : '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 0.15s ease, filter 0.15s ease',
              }}
            >
              <span>{dayNumber}</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '6px',
          fontSize: '0.75rem',
          color: '#94a3b8',
        }}
      >
        <span>Less</span>
        {(Object.keys(TIER_COLORS) as StreakTier[]).map((tierKey) => (
          <span
            key={tierKey}
            title={TIER_COLORS[tierKey].label}
            style={{
              width: '12px',
              height: '12px',
              background: TIER_COLORS[tierKey].bg,
              border: `1px solid ${TIER_COLORS[tierKey].border}`,
              borderRadius: '2px',
              display: 'inline-block',
            }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredDay && tooltipPos && (
        <div
          data-testid="activity-tooltip"
          role="tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div style={{ fontWeight: 700, color: '#38bdf8' }}>{hoveredDay.date}</div>
          <div>Matches: <strong>{hoveredDay.matchesPlayed}</strong></div>
          <div>Net Volume: <strong>{hoveredDay.netVolume ?? 0} XLM</strong></div>
        </div>
      )}
    </div>
  );
};
