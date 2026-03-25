export type DayType = 'red' | 'green' | 'white';
export type NorwegianWeekday = 'Ma' | 'Ti' | 'On' | 'To' | 'Fr' | 'Lø' | 'Sø';

export interface DayEntry {
  date: string;                // ISO: "2026-04-02"
  type: DayType;
  label: string;               // day number: "2"
  weekday: NorwegianWeekday;
  holidayName?: string;        // first name from Holiday.names, only set when type === 'red' and it's a holiday (not just a weekend)
}

export interface DealOption {
  vacationDaysUsed: number;
  consecutiveDays: number;
  efficiency: number;       // consecutiveDays / vacationDaysUsed, rounded to 1 decimal
  days: DayEntry[];         // ALL days in the period window (with green days merged in)
  streakStart: number;      // index in days[] where longest streak starts
  streakEnd: number;        // index in days[] where longest streak ends (inclusive)
}

export interface BaselinePeriod {
  consecutiveDays: number;
  days: DayEntry[];
  streakStart: number;
  streakEnd: number;
}

export interface PeriodResult {
  baseline: BaselinePeriod;
  deals: DealOption[];
}

export interface Holiday {
  date: string;
  names: string[];  // array because some dates have multiple names (e.g. 17. mai 2027)
}

export interface PeriodWindow {
  start: string;  // ISO date
  end: string;    // ISO date
}

export interface PeriodDefinition {
  id: string;
  label: string;
  windows: Record<number, PeriodWindow>;
}
