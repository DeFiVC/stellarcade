export interface DayActivityRecord {
  date: string; // YYYY-MM-DD
  matchesPlayed: number;
  netVolume?: number;
  wins?: number;
  losses?: number;
}

export type StreakTier = 'tier-0' | 'tier-1' | 'tier-2' | 'tier-3';

export interface WageringStreakCalendarProps {
  activityData: DayActivityRecord[];
  currentStreak: number;
  longestStreak: number;
  onSelectDay?: (day: DayActivityRecord) => void;
  initialDate?: Date;
  className?: string;
}
