import { Injectable } from '@angular/core';
import { HOLIDAYS, PERIOD_DEFINITIONS } from '../data/holidays.data';
import { DayEntry, DealOption, BaselinePeriod, PeriodResult, NorwegianWeekday } from '../models/types';

@Injectable({ providedIn: 'root' })
export class VacationOptimizerService {

  private readonly WEEKDAYS: NorwegianWeekday[] = ['Sø', 'Ma', 'Ti', 'On', 'To', 'Fr', 'Lø'];

  calculate(periodId: string, year: number): PeriodResult {
    const periodDef = PERIOD_DEFINITIONS.find(p => p.id === periodId);
    if (!periodDef) throw new Error(`Unknown period: ${periodId}`);
    const window = periodDef.windows[year];
    if (!window) throw new Error(`No window for ${periodId} ${year}`);

    const days = this.generateWindowDays(window.start, window.end);
    const baseline = this.computeBaseline(days);
    const deals = this.computeDeals(days);
    return { baseline, deals };
  }

  generateWindowDays(start: string, end: string): DayEntry[] {
    const holidayMap = new Map(HOLIDAYS.map(h => [h.date, h.names]));
    const days: DayEntry[] = [];

    const toLocalDate = (iso: string): Date => {
      const [y, m, d] = iso.split('-').map(Number);
      return new Date(y, m - 1, d);
    };
    const toIso = (d: Date): string =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const endDate = toLocalDate(end);
    for (const d = toLocalDate(start); d <= endDate; d.setDate(d.getDate() + 1)) {
      const iso = toIso(d);
      const dow = d.getDay();
      const names = holidayMap.get(iso);
      const isHoliday = !!names;
      const isWeekend = dow === 0 || dow === 6;

      days.push({
        date: iso,
        type: isHoliday || isWeekend ? 'red' : 'white',
        label: String(d.getDate()),
        weekday: this.WEEKDAYS[dow],
        ...(isHoliday ? { holidayName: names![0] } : {}),
      });
    }
    return days;
  }

  longestStreak(days: DayEntry[], greenIndices: Set<number>): { start: number; end: number; length: number } {
    let best = { start: -1, end: -1, length: 0 };
    let curStart = 0;
    let curLen = 0;

    for (let i = 0; i < days.length; i++) {
      const effective = greenIndices.has(i) ? 'green' : days[i].type;
      if (effective !== 'white') {
        if (curLen === 0) curStart = i;
        curLen++;
        if (curLen > best.length) best = { start: curStart, end: i, length: curLen };
      } else {
        curLen = 0;
      }
    }
    return best;
  }

  private computeBaseline(days: DayEntry[]): BaselinePeriod {
    const streak = this.longestStreak(days, new Set());
    return { consecutiveDays: streak.length, days, streakStart: streak.start, streakEnd: streak.end };
  }

  private computeDeals(days: DayEntry[]): DealOption[] {
    const workdayIndices = days.map((_, i) => i).filter(i => days[i].type === 'white');
    const bestPerCount = new Map<number, DealOption>();

    // Complexity: O(C(n,k)) per k, where n = workday count per window.
    // Current windows have ≤10 workdays, so worst-case is C(10,5)=252 iterations. Safe.
    for (let k = 1; k <= Math.min(10, workdayIndices.length); k++) {
      for (const combo of this.combinations(workdayIndices, k)) {
        const greenSet = new Set(combo);
        const streak = this.longestStreak(days, greenSet);
        const efficiency = Math.round((streak.length / k) * 10) / 10;
        const deal: DealOption = {
          vacationDaysUsed: k,
          consecutiveDays: streak.length,
          efficiency,
          days: days.map((d, i) => greenSet.has(i) ? { ...d, type: 'green' as const } : d),
          streakStart: streak.start,
          streakEnd: streak.end,
        };
        const existing = bestPerCount.get(k);
        if (!existing || deal.consecutiveDays > existing.consecutiveDays) {
          bestPerCount.set(k, deal);
        }
      }
    }

    // Deduplicate first (done above via bestPerCount), then sort
    return Array.from(bestPerCount.values()).sort((a, b) => {
      if (b.efficiency !== a.efficiency) return b.efficiency - a.efficiency;
      if (b.consecutiveDays !== a.consecutiveDays) return b.consecutiveDays - a.consecutiveDays;
      return a.vacationDaysUsed - b.vacationDaysUsed;
    });
  }

  combinations(arr: number[], k: number): number[][] {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    const [first, ...rest] = arr;
    return [
      ...this.combinations(rest, k - 1).map(c => [first, ...c]),
      ...this.combinations(rest, k),
    ];
  }
}
