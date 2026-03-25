import { VacationOptimizerService } from './vacation-optimizer.service';
import { DayEntry, DealOption } from '../models/types';

describe('VacationOptimizerService', () => {
  let service: VacationOptimizerService;

  beforeEach(() => {
    service = new VacationOptimizerService();
  });

  // ─── combinations ──────────────────────────────────────────────────────────

  describe('combinations', () => {
    it('returns [[]] for k=0', () => {
      expect(service.combinations([1, 2, 3], 0)).toEqual([[]]);
    });

    it('returns single-element arrays for k=1', () => {
      expect(service.combinations([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    });

    it('returns all pairs for k=2', () => {
      expect(service.combinations([1, 2, 3], 2)).toEqual([[1, 2], [1, 3], [2, 3]]);
    });

    it('returns empty for k > arr length', () => {
      expect(service.combinations([1], 2)).toEqual([]);
    });
  });

  // ─── longestStreak ─────────────────────────────────────────────────────────

  describe('longestStreak', () => {
    const makeDay = (type: 'red' | 'white', label: string): DayEntry => ({
      date: `2026-01-${label.padStart(2, '0')}`,
      type,
      label,
      weekday: 'Ma',
    });

    it('counts consecutive red days', () => {
      const days = [makeDay('red', '1'), makeDay('red', '2'), makeDay('red', '3')];
      const result = service.longestStreak(days, new Set());
      expect(result.length).toBe(3);
      expect(result.start).toBe(0);
      expect(result.end).toBe(2);
    });

    it('resets at white days', () => {
      const days = [
        makeDay('red', '1'),
        makeDay('white', '2'),  // breaks
        makeDay('red', '3'),
        makeDay('red', '4'),
      ];
      const result = service.longestStreak(days, new Set());
      expect(result.length).toBe(2);
      expect(result.start).toBe(2);
    });

    it('treats green indices as part of streak', () => {
      const days = [makeDay('red', '1'), makeDay('white', '2'), makeDay('red', '3')];
      const result = service.longestStreak(days, new Set([1]));
      expect(result.length).toBe(3);
    });

    it('returns length 0 for all-white window', () => {
      const days = [makeDay('white', '1'), makeDay('white', '2')];
      expect(service.longestStreak(days, new Set()).length).toBe(0);
    });

    it('returns start -1 end -1 for all-white window', () => {
      const days = [makeDay('white', '1'), makeDay('white', '2')];
      const result = service.longestStreak(days, new Set());
      expect(result.length).toBe(0);
      expect(result.start).toBe(-1);
      expect(result.end).toBe(-1);
    });
  });

  // ─── generateWindowDays ────────────────────────────────────────────────────

  describe('generateWindowDays', () => {
    it('generates correct number of days', () => {
      const days = service.generateWindowDays('2026-04-02', '2026-04-06');
      expect(days.length).toBe(5);
    });

    it('marks Skjærtorsdag (2026-04-02) as red with holidayName', () => {
      const days = service.generateWindowDays('2026-04-02', '2026-04-02');
      expect(days[0].type).toBe('red');
      expect(days[0].holidayName).toBe('Skjærtorsdag');
    });

    it('marks weekends as red without holidayName', () => {
      // 2026-04-04 is Saturday
      const days = service.generateWindowDays('2026-04-04', '2026-04-04');
      expect(days[0].type).toBe('red');
      expect(days[0].holidayName).toBeUndefined();
    });

    it('marks regular workday as white', () => {
      // 2026-04-07 is Tuesday after Easter — regular workday
      const days = service.generateWindowDays('2026-04-07', '2026-04-07');
      expect(days[0].type).toBe('white');
    });

    it('formats weekday labels correctly', () => {
      // 2026-04-06 is Monday (2. påskedag)
      const days = service.generateWindowDays('2026-04-06', '2026-04-06');
      expect(days[0].weekday).toBe('Ma');
    });
  });

  // ─── calculate (Påske 2026) ─────────────────────────────────────────────────

  describe('calculate – Påske 2026', () => {
    it('hero deal is 1 vacation day → 6 consecutive days (efficiency 6.0)', () => {
      const result = service.calculate('påske', 2026);
      expect(result.deals.length).toBeGreaterThan(0);
      expect(result.deals[0].vacationDaysUsed).toBe(1);
      expect(result.deals[0].consecutiveDays).toBe(6);
      expect(result.deals[0].efficiency).toBe(6.0);
    });

    it('includes a 3-vacation-day option with 10 consecutive days', () => {
      const result = service.calculate('påske', 2026);
      const deal3 = result.deals.find((d: DealOption) => d.vacationDaysUsed === 3);
      expect(deal3?.consecutiveDays).toBe(10);
    });

    it('baseline has no green days', () => {
      const result = service.calculate('påske', 2026);
      expect(result.baseline.days.every((d: DayEntry) => d.type !== 'green')).toBe(true);
    });

    it('deals are sorted by efficiency descending', () => {
      const result = service.calculate('påske', 2026);
      for (let i = 1; i < result.deals.length; i++) {
        expect(result.deals[i].efficiency).toBeLessThanOrEqual(result.deals[i - 1].efficiency);
      }
    });

    it('streakStart and streakEnd are valid indices', () => {
      const result = service.calculate('påske', 2026);
      const deal = result.deals[0];
      expect(deal.streakStart).toBeGreaterThanOrEqual(0);
      expect(deal.streakEnd).toBeLessThan(deal.days.length);
      expect(deal.streakEnd).toBeGreaterThanOrEqual(deal.streakStart);
    });
  });

  describe('calculate – error paths', () => {
    it('throws for unknown periodId', () => {
      expect(() => service.calculate('unknown', 2026)).toThrowError('Unknown period: unknown');
    });

    it('throws for unsupported year', () => {
      expect(() => service.calculate('påske', 2099)).toThrowError('No window for påske 2099');
    });
  });
});
