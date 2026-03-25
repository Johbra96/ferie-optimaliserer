# Ferie-optimaliserer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Norwegian holiday optimizer Angular app showing the most efficient way to place vacation days around public holidays.

**Architecture:** Single-page Angular 18 standalone app with no routing. Angular Signals hold selected period/year and derive computed results. A pure calculation service computes DealOption arrays from hardcoded holiday data. Five presentational components render the UI.

**Tech Stack:** Angular 18 (standalone), TailwindCSS, Angular Signals, Jasmine/Karma tests, Vercel static deploy.

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/app/models/types.ts` | Shared interfaces: DayEntry, DealOption, BaselinePeriod, PeriodResult, PeriodDefinition, Holiday |
| `src/app/data/holidays.data.ts` | Hardcoded Norwegian holidays 2026–2028 and period window definitions |
| `src/app/services/vacation-optimizer.service.ts` | Pure calculation: generate day array, compute streak, find best deals |
| `src/app/services/vacation-optimizer.service.spec.ts` | Service unit tests (no TestBed needed) |
| `src/app/components/period-selector/period-selector.component.ts` | Period pill-buttons + year toggle, emits selection changes |
| `src/app/components/period-selector/period-selector.component.html` | Template |
| `src/app/components/period-selector/period-selector.component.spec.ts` | Component tests |
| `src/app/components/hero-deal/hero-deal.component.ts` | Green hero card showing best deal |
| `src/app/components/hero-deal/hero-deal.component.html` | Template |
| `src/app/components/hero-deal/hero-deal.component.spec.ts` | Component tests |
| `src/app/components/day-strip/day-strip.component.ts` | Continuous color strip for streak days |
| `src/app/components/day-strip/day-strip.component.html` | Template |
| `src/app/components/day-strip/day-strip.component.spec.ts` | Component tests |
| `src/app/components/alternatives-list/alternatives-list.component.ts` | Ranked list of deal options + baseline |
| `src/app/components/alternatives-list/alternatives-list.component.html` | Template |
| `src/app/components/alternatives-list/alternatives-list.component.spec.ts` | Component tests |
| `src/app/app.component.ts` | Root: holds signals, wires computed results to child components |
| `src/app/app.component.html` | Page layout |
| `src/styles.css` | TailwindCSS directives |
| `tailwind.config.js` | Tailwind content paths |
| `vercel.json` | Vercel static build config |

---

## Task 1: Project Scaffold

**Files:**
- Create: Angular project in current directory
- Create: `tailwind.config.js`
- Modify: `src/styles.css`
- Create: `vercel.json`

- [ ] **Step 1: Scaffold Angular project**

Run from `/Users/johann/Desktop/Claude_projects/ferie-optimaliserer` (the directory must be empty):

```bash
ng new ferie-optimaliserer --directory . --routing=false --style=css --standalone --skip-git
```

If `ng` is not found globally: `npx -p @angular/cli ng new ferie-optimaliserer --directory . --routing=false --style=css --standalone --skip-git`

Expected: project files created, `package.json` present.

- [ ] **Step 2: Install TailwindCSS**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

Expected: `tailwind.config.js` created.

- [ ] **Step 3: Configure TailwindCSS content paths**

Replace contents of `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 4: Add Tailwind directives to styles.css**

Replace `src/styles.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Create vercel.json**

```json
{
  "buildCommand": "npm run build -- --configuration production",
  "outputDirectory": "dist/ferie-optimaliserer/browser",
  "installCommand": "npm install"
}
```

- [ ] **Step 6: Verify build works**

```bash
ng build --configuration production
```

Expected: no errors, output in `dist/ferie-optimaliserer/browser/`.

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Angular 18 app with TailwindCSS and Vercel config"
```

---

## Task 2: Types and Holiday Data

**Files:**
- Create: `src/app/models/types.ts`
- Create: `src/app/data/holidays.data.ts`

- [ ] **Step 1: Create types**

Create `src/app/models/types.ts`:

```typescript
export type DayType = 'red' | 'green' | 'white';

export interface DayEntry {
  date: string;         // ISO: "2026-04-02"
  type: DayType;
  label: string;        // day number: "2"
  weekday: string;      // "Ma" | "Ti" | "On" | "To" | "Fr" | "Lø" | "Sø"
  holidayName?: string; // e.g. "Langfredag", only for red holiday days
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
```

- [ ] **Step 2: Create holiday data**

Create `src/app/data/holidays.data.ts`:

```typescript
import { Holiday, PeriodDefinition } from '../models/types';

export const HOLIDAYS: Holiday[] = [
  // 2026
  { date: '2026-01-01', names: ['Nyttårsdag'] },
  { date: '2026-04-02', names: ['Skjærtorsdag'] },
  { date: '2026-04-03', names: ['Langfredag'] },
  { date: '2026-04-05', names: ['1. påskedag'] },
  { date: '2026-04-06', names: ['2. påskedag'] },
  { date: '2026-05-01', names: ['Arbeidernes dag'] },
  { date: '2026-05-14', names: ['Kristi Himmelfartsdag'] },
  { date: '2026-05-17', names: ['Grunnlovsdagen'] },
  { date: '2026-05-24', names: ['1. pinsedag'] },
  { date: '2026-05-25', names: ['2. pinsedag'] },
  { date: '2026-12-25', names: ['1. juledag'] },
  { date: '2026-12-26', names: ['2. juledag'] },
  // 2027
  { date: '2027-01-01', names: ['Nyttårsdag'] },
  { date: '2027-03-25', names: ['Skjærtorsdag'] },
  { date: '2027-03-26', names: ['Langfredag'] },
  { date: '2027-03-28', names: ['1. påskedag'] },
  { date: '2027-03-29', names: ['2. påskedag'] },
  { date: '2027-05-01', names: ['Arbeidernes dag'] },
  { date: '2027-05-06', names: ['Kristi Himmelfartsdag'] },
  { date: '2027-05-16', names: ['1. pinsedag'] },
  { date: '2027-05-17', names: ['Grunnlovsdagen', '2. pinsedag'] },
  { date: '2027-12-25', names: ['1. juledag'] },
  { date: '2027-12-26', names: ['2. juledag'] },
  // 2028 (needed for Nyttår 2027 window)
  { date: '2028-01-01', names: ['Nyttårsdag'] },
];

export const PERIOD_DEFINITIONS: PeriodDefinition[] = [
  {
    id: 'påske',
    label: '🐣 Påske',
    windows: {
      2026: { start: '2026-03-28', end: '2026-04-12' },
      2027: { start: '2027-03-22', end: '2027-04-04' },
    },
  },
  {
    id: '1-mai',
    label: '🌹 1. mai',
    windows: {
      2026: { start: '2026-04-27', end: '2026-05-04' },
      2027: { start: '2027-04-27', end: '2027-05-04' },
    },
  },
  {
    id: 'kristi-himmelfartsdag',
    label: '☁️ Kristi H.',
    windows: {
      2026: { start: '2026-05-11', end: '2026-05-17' },
      2027: { start: '2027-05-03', end: '2027-05-09' },
    },
  },
  {
    id: '17-mai',
    label: '🇳🇴 17. mai',
    windows: {
      2026: { start: '2026-05-14', end: '2026-05-21' },
      2027: { start: '2027-05-14', end: '2027-05-21' },
    },
  },
  {
    id: 'pinse',
    label: '🕊️ Pinse',
    windows: {
      2026: { start: '2026-05-21', end: '2026-05-28' },
      2027: { start: '2027-05-13', end: '2027-05-20' },
    },
  },
  {
    id: 'jul',
    label: '🎄 Jul',
    windows: {
      2026: { start: '2026-12-23', end: '2026-12-28' },
      2027: { start: '2027-12-23', end: '2027-12-28' },
    },
  },
  {
    id: 'nyttår',
    label: '🎆 Nyttår',
    windows: {
      2026: { start: '2026-12-29', end: '2027-01-02' },
      2027: { start: '2027-12-29', end: '2028-01-02' },
    },
  },
];

export const AVAILABLE_YEARS = [2026, 2027];
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/models/types.ts src/app/data/holidays.data.ts
git commit -m "feat: add types and hardcoded Norwegian holiday data"
```

---

## Task 3: VacationOptimizerService (TDD)

**Files:**
- Create: `src/app/services/vacation-optimizer.service.ts`
- Create: `src/app/services/vacation-optimizer.service.spec.ts`

- [ ] **Step 1: Write failing tests first**

Create `src/app/services/vacation-optimizer.service.spec.ts`:

```typescript
import { VacationOptimizerService } from './vacation-optimizer.service';
import { DayEntry } from '../models/types';

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
      const deal3 = result.deals.find(d => d.vacationDaysUsed === 3);
      expect(deal3?.consecutiveDays).toBe(10);
    });

    it('baseline has no green days', () => {
      const result = service.calculate('påske', 2026);
      expect(result.baseline.days.every(d => d.type !== 'green')).toBeTrue();
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
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
ng test --no-watch --browsers=ChromeHeadless 2>&1 | tail -20
```

Expected: failures like "Cannot find module './vacation-optimizer.service'".

- [ ] **Step 3: Implement VacationOptimizerService**

Create `src/app/services/vacation-optimizer.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HOLIDAYS, PERIOD_DEFINITIONS } from '../data/holidays.data';
import { DayEntry, DealOption, BaselinePeriod, PeriodResult } from '../models/types';

@Injectable({ providedIn: 'root' })
export class VacationOptimizerService {

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
    const WEEKDAYS = ['Sø', 'Ma', 'Ti', 'On', 'To', 'Fr', 'Lø'];
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
        weekday: WEEKDAYS[dow],
        ...(isHoliday ? { holidayName: names![0] } : {}),
      });
    }
    return days;
  }

  longestStreak(days: DayEntry[], greenIndices: Set<number>): { start: number; end: number; length: number } {
    let best = { start: 0, end: -1, length: 0 };
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
ng test --no-watch --browsers=ChromeHeadless 2>&1 | tail -20
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/services/vacation-optimizer.service.ts src/app/services/vacation-optimizer.service.spec.ts
git commit -m "feat: implement VacationOptimizerService with full test coverage"
```

---

## Task 4: PeriodSelectorComponent

**Files:**
- Create: `src/app/components/period-selector/period-selector.component.ts`
- Create: `src/app/components/period-selector/period-selector.component.html`
- Create: `src/app/components/period-selector/period-selector.component.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/components/period-selector/period-selector.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PeriodSelectorComponent } from './period-selector.component';
import { PERIOD_DEFINITIONS, AVAILABLE_YEARS } from '../../data/holidays.data';
import { By } from '@angular/platform-browser';

describe('PeriodSelectorComponent', () => {
  let fixture: ComponentFixture<PeriodSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeriodSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PeriodSelectorComponent);
    fixture.componentRef.setInput('periods', PERIOD_DEFINITIONS);
    fixture.componentRef.setInput('years', AVAILABLE_YEARS);
    fixture.componentRef.setInput('selectedPeriodId', 'påske');
    fixture.componentRef.setInput('selectedYear', 2026);
    fixture.detectChanges();
  });

  it('renders a button for each period', () => {
    const buttons = fixture.debugElement.queryAll(By.css('[data-testid="period-btn"]'));
    expect(buttons.length).toBe(PERIOD_DEFINITIONS.length);
  });

  it('renders year toggle buttons', () => {
    const buttons = fixture.debugElement.queryAll(By.css('[data-testid="year-btn"]'));
    expect(buttons.length).toBe(AVAILABLE_YEARS.length);
  });

  it('emits periodChange when a period button is clicked', () => {
    const spy = jasmine.createSpy('periodChange');
    fixture.componentInstance.periodChange.subscribe(spy);
    const btn = fixture.debugElement.queryAll(By.css('[data-testid="period-btn"]'))[1];
    btn.nativeElement.click();
    expect(spy).toHaveBeenCalledWith(PERIOD_DEFINITIONS[1].id);
  });

  it('emits yearChange when a year button is clicked', () => {
    const spy = jasmine.createSpy('yearChange');
    fixture.componentInstance.yearChange.subscribe(spy);
    const btn = fixture.debugElement.queryAll(By.css('[data-testid="year-btn"]'))[1];
    btn.nativeElement.click();
    expect(spy).toHaveBeenCalledWith(AVAILABLE_YEARS[1]);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
ng test --no-watch --browsers=ChromeHeadless --include="**/period-selector*" 2>&1 | tail -20
```

- [ ] **Step 3: Create component**

Create `src/app/components/period-selector/period-selector.component.ts`:

```typescript
import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { PeriodDefinition } from '../../models/types';

@Component({
  selector: 'app-period-selector',
  standalone: true,
  imports: [NgClass],
  templateUrl: './period-selector.component.html',
})
export class PeriodSelectorComponent {
  periods = input.required<PeriodDefinition[]>();
  years = input.required<number[]>();
  selectedPeriodId = input.required<string>();
  selectedYear = input.required<number>();

  periodChange = output<string>();
  yearChange = output<number>();
}
```

Create `src/app/components/period-selector/period-selector.component.html`:

```html
<div class="space-y-3">
  <!-- Year toggle -->
  <div class="flex gap-2">
    @for (year of years(); track year) {
      <button
        data-testid="year-btn"
        (click)="yearChange.emit(year)"
        [ngClass]="selectedYear() === year
          ? 'bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-semibold'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-1.5 rounded-full text-sm font-medium'"
      >{{ year }}</button>
    }
  </div>

  <!-- Period pills -->
  <div class="flex gap-2 overflow-x-auto snap-x pb-1 scrollbar-hide">
    @for (period of periods(); track period.id) {
      <button
        data-testid="period-btn"
        (click)="periodChange.emit(period.id)"
        [ngClass]="selectedPeriodId() === period.id
          ? 'bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap snap-start flex-shrink-0'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap snap-start flex-shrink-0'"
      >{{ period.label }}</button>
    }
  </div>
</div>
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
ng test --no-watch --browsers=ChromeHeadless 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/components/period-selector/
git commit -m "feat: add PeriodSelectorComponent"
```

---

## Task 5: HeroDealComponent

**Files:**
- Create: `src/app/components/hero-deal/hero-deal.component.ts`
- Create: `src/app/components/hero-deal/hero-deal.component.html`
- Create: `src/app/components/hero-deal/hero-deal.component.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/components/hero-deal/hero-deal.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeroDealComponent } from './hero-deal.component';
import { DealOption } from '../../models/types';

const mockDeal: DealOption = {
  vacationDaysUsed: 1,
  consecutiveDays: 6,
  efficiency: 6.0,
  days: [],
  streakStart: 0,
  streakEnd: 5,
};

describe('HeroDealComponent', () => {
  let fixture: ComponentFixture<HeroDealComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroDealComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HeroDealComponent);
    fixture.componentRef.setInput('deal', mockDeal);
    fixture.detectChanges();
  });

  it('displays vacation days used', () => {
    expect(fixture.nativeElement.textContent).toContain('1 feriedag');
  });

  it('displays consecutive days', () => {
    expect(fixture.nativeElement.textContent).toContain('6 dager fri');
  });

  it('displays efficiency', () => {
    expect(fixture.nativeElement.textContent).toContain('6×');
  });

  it('uses plural form for multiple vacation days', () => {
    fixture.componentRef.setInput('deal', { ...mockDeal, vacationDaysUsed: 3 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('3 feriedager');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
ng test --no-watch --browsers=ChromeHeadless --include="**/hero-deal*" 2>&1 | tail -20
```

- [ ] **Step 3: Create component**

Create `src/app/components/hero-deal/hero-deal.component.ts`:

```typescript
import { Component, computed, input } from '@angular/core';
import { DealOption } from '../../models/types';

@Component({
  selector: 'app-hero-deal',
  standalone: true,
  templateUrl: './hero-deal.component.html',
})
export class HeroDealComponent {
  deal = input.required<DealOption>();

  label = computed(() => {
    const d = this.deal();
    const days = d.vacationDaysUsed === 1 ? 'feriedag' : 'feriedager';
    return `Ta ${d.vacationDaysUsed} ${days} → ${d.consecutiveDays} dager fri`;
  });
}
```

Create `src/app/components/hero-deal/hero-deal.component.html`:

```html
<div class="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white shadow-lg">
  <div class="text-xs uppercase tracking-widest opacity-75 mb-1">Beste deal</div>
  <div class="text-3xl font-bold leading-tight mb-2">{{ label() }}</div>
  <div class="text-sm opacity-90 font-medium">Effektivitet {{ deal().efficiency }}×</div>
</div>
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
ng test --no-watch --browsers=ChromeHeadless 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/components/hero-deal/
git commit -m "feat: add HeroDealComponent"
```

---

## Task 6: DayStripComponent

**Files:**
- Create: `src/app/components/day-strip/day-strip.component.ts`
- Create: `src/app/components/day-strip/day-strip.component.html`
- Create: `src/app/components/day-strip/day-strip.component.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/components/day-strip/day-strip.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DayStripComponent } from './day-strip.component';
import { DealOption, DayEntry } from '../../models/types';

const makeDays = (types: Array<'red' | 'green' | 'white'>): DayEntry[] =>
  types.map((type, i) => ({
    date: `2026-04-${String(i + 1).padStart(2, '0')}`,
    type,
    label: String(i + 1),
    weekday: 'Ma',
  }));

// 3 red, 1 green, 2 red — streak is all 6, start=0, end=5
const mockDeal: DealOption = {
  vacationDaysUsed: 1,
  consecutiveDays: 6,
  efficiency: 6.0,
  days: makeDays(['red', 'red', 'red', 'green', 'red', 'red']),
  streakStart: 0,
  streakEnd: 5,
};

describe('DayStripComponent', () => {
  let fixture: ComponentFixture<DayStripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DayStripComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DayStripComponent);
    fixture.componentRef.setInput('deal', mockDeal);
    fixture.detectChanges();
  });

  it('renders one segment per streak day', () => {
    const segments = fixture.nativeElement.querySelectorAll('[data-testid="day-segment"]');
    expect(segments.length).toBe(6);
  });

  it('shows total consecutive days count', () => {
    expect(fixture.nativeElement.textContent).toContain('6');
  });

  it('renders legend for red and green', () => {
    expect(fixture.nativeElement.textContent).toContain('fri uansett');
    expect(fixture.nativeElement.textContent).toContain('feriedag du tar');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
ng test --no-watch --browsers=ChromeHeadless --include="**/day-strip*" 2>&1 | tail -20
```

- [ ] **Step 3: Create component**

Create `src/app/components/day-strip/day-strip.component.ts`:

```typescript
import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { DealOption } from '../../models/types';

@Component({
  selector: 'app-day-strip',
  standalone: true,
  imports: [NgClass],
  templateUrl: './day-strip.component.html',
})
export class DayStripComponent {
  deal = input.required<DealOption>();

  streakDays = computed(() => {
    const d = this.deal();
    return d.days.slice(d.streakStart, d.streakEnd + 1);
  });
}
```

Create `src/app/components/day-strip/day-strip.component.html`:

```html
<div class="space-y-3">
  <!-- Color strip -->
  <div class="flex rounded-xl overflow-hidden gap-px">
    @for (day of streakDays(); track day.date) {
      <div
        data-testid="day-segment"
        class="flex-1 py-3 flex flex-col items-center text-xs font-bold min-w-0"
        [ngClass]="day.type === 'green'
          ? 'bg-green-300 text-green-900'
          : 'bg-red-200 text-red-900'"
      >
        <span>{{ day.weekday }}</span>
        <span>{{ day.label }}</span>
      </div>
    }
  </div>

  <!-- Stretch label -->
  <div class="text-center text-sm text-gray-500 font-medium">
    ← {{ deal().consecutiveDays }} sammenhengende fridager →
  </div>

  <!-- Legend -->
  <div class="flex gap-4 justify-center text-xs text-gray-500">
    <span class="flex items-center gap-1.5">
      <span class="w-3 h-3 rounded-sm bg-red-200 inline-block"></span>
      fri uansett
    </span>
    <span class="flex items-center gap-1.5">
      <span class="w-3 h-3 rounded-sm bg-green-300 inline-block"></span>
      feriedag du tar
    </span>
  </div>
</div>
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
ng test --no-watch --browsers=ChromeHeadless 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/components/day-strip/
git commit -m "feat: add DayStripComponent"
```

---

## Task 7: AlternativesListComponent

**Files:**
- Create: `src/app/components/alternatives-list/alternatives-list.component.ts`
- Create: `src/app/components/alternatives-list/alternatives-list.component.html`
- Create: `src/app/components/alternatives-list/alternatives-list.component.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/components/alternatives-list/alternatives-list.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlternativesListComponent } from './alternatives-list.component';
import { DealOption, BaselinePeriod } from '../../models/types';

const mockBaseline: BaselinePeriod = {
  consecutiveDays: 2,
  days: [],
  streakStart: 0,
  streakEnd: 1,
};

const mockDeals: DealOption[] = [
  { vacationDaysUsed: 2, consecutiveDays: 7, efficiency: 3.5, days: [], streakStart: 0, streakEnd: 6 },
  { vacationDaysUsed: 3, consecutiveDays: 10, efficiency: 3.3, days: [], streakStart: 0, streakEnd: 9 },
];

describe('AlternativesListComponent', () => {
  let fixture: ComponentFixture<AlternativesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlternativesListComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(AlternativesListComponent);
    fixture.componentRef.setInput('deals', mockDeals);
    fixture.componentRef.setInput('baseline', mockBaseline);
    fixture.detectChanges();
  });

  it('shows baseline info', () => {
    expect(fixture.nativeElement.textContent).toContain('2 dager fri');
  });

  it('renders one row per deal', () => {
    const rows = fixture.nativeElement.querySelectorAll('[data-testid="deal-row"]');
    expect(rows.length).toBe(mockDeals.length);
  });

  it('shows efficiency badge for each deal', () => {
    expect(fixture.nativeElement.textContent).toContain('3.5×');
    expect(fixture.nativeElement.textContent).toContain('3.3×');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
ng test --no-watch --browsers=ChromeHeadless --include="**/alternatives-list*" 2>&1 | tail -20
```

- [ ] **Step 3: Create component**

Create `src/app/components/alternatives-list/alternatives-list.component.ts`:

```typescript
import { Component, input } from '@angular/core';
import { DealOption, BaselinePeriod } from '../../models/types';

@Component({
  selector: 'app-alternatives-list',
  standalone: true,
  templateUrl: './alternatives-list.component.html',
})
export class AlternativesListComponent {
  deals = input.required<DealOption[]>();
  baseline = input.required<BaselinePeriod>();
}
```

Create `src/app/components/alternatives-list/alternatives-list.component.html`:

```html
<div class="space-y-3">
  <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-widest">Andre alternativer</h3>

  <!-- Baseline row -->
  <div class="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
    Uten feriedager: <span class="font-semibold text-gray-700">{{ baseline().consecutiveDays }} dager fri</span>
  </div>

  <!-- Deal rows -->
  @for (deal of deals(); track deal.vacationDaysUsed) {
    <div
      data-testid="deal-row"
      class="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between"
    >
      <span class="text-sm text-gray-700">
        {{ deal.vacationDaysUsed }} dag{{ deal.vacationDaysUsed > 1 ? 'er' : '' }}
        → {{ deal.consecutiveDays }} dager fri
      </span>
      <span class="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
        {{ deal.efficiency }}×
      </span>
    </div>
  }
</div>
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
ng test --no-watch --browsers=ChromeHeadless 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/components/alternatives-list/
git commit -m "feat: add AlternativesListComponent"
```

---

## Task 8: AppComponent Wiring

**Files:**
- Modify: `src/app/app.component.ts`
- Modify: `src/app/app.component.html`

- [ ] **Step 1: Replace AppComponent**

Replace `src/app/app.component.ts`:

```typescript
import { Component, computed, signal } from '@angular/core';
import { VacationOptimizerService } from './services/vacation-optimizer.service';
import { PeriodSelectorComponent } from './components/period-selector/period-selector.component';
import { HeroDealComponent } from './components/hero-deal/hero-deal.component';
import { DayStripComponent } from './components/day-strip/day-strip.component';
import { AlternativesListComponent } from './components/alternatives-list/alternatives-list.component';
import { AVAILABLE_YEARS, PERIOD_DEFINITIONS } from './data/holidays.data';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PeriodSelectorComponent, HeroDealComponent, DayStripComponent, AlternativesListComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly periods = PERIOD_DEFINITIONS;
  readonly years = AVAILABLE_YEARS;

  selectedPeriodId = signal('påske');
  selectedYear = signal(2026);

  constructor(private optimizer: VacationOptimizerService) {}

  result = computed(() => this.optimizer.calculate(this.selectedPeriodId(), this.selectedYear()));
  heroDeal = computed(() => this.result().deals[0] ?? null);
  otherDeals = computed(() => this.result().deals.slice(1));
  baseline = computed(() => this.result().baseline);
}
```

- [ ] **Step 2: Replace AppComponent template**

Replace `src/app/app.component.html` (remove all existing content):

```html
<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
    <h1 class="text-xl font-bold text-gray-900">🌴 Ferieoptimaliserer</h1>
  </header>

  <main class="max-w-2xl mx-auto px-4 py-6 space-y-5">
    <!-- Period + year selector -->
    <app-period-selector
      [periods]="periods"
      [years]="years"
      [selectedPeriodId]="selectedPeriodId()"
      [selectedYear]="selectedYear()"
      (periodChange)="selectedPeriodId.set($event)"
      (yearChange)="selectedYear.set($event)"
    />

    @if (heroDeal()) {
      <!-- Hero deal -->
      <app-hero-deal [deal]="heroDeal()!" />

      <!-- Day strip -->
      <app-day-strip [deal]="heroDeal()!" />

      <!-- Other options -->
      <app-alternatives-list [deals]="otherDeals()" [baseline]="baseline()" />
    } @else {
      <p class="text-gray-400 text-center py-12">Ingen kombinasjoner funnet for denne perioden.</p>
    }
  </main>
</div>
```

- [ ] **Step 3: Run dev server and verify manually**

```bash
ng serve
```

Open http://localhost:4200. Verify:
- Period pills and year toggle render
- Selecting "🐣 Påske" + 2026 shows hero deal: "Ta 1 feriedag → 6 dager fri" with 6.0×
- The day strip shows 6 colored segments (5 red + 1 green)
- Alternatives list shows other options with efficiency badges
- Switching to 2027 updates all content
- Mobile emulation: pills scroll horizontally

- [ ] **Step 4: Run full test suite**

```bash
ng test --no-watch --browsers=ChromeHeadless 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/app.component.ts src/app/app.component.html
git commit -m "feat: wire AppComponent with signals and computed results"
```

---

## Task 9: Production Build and Vercel Deploy

**Files:**
- `vercel.json` (already created in Task 1)

- [ ] **Step 1: Production build**

```bash
ng build --configuration production
```

Expected: no errors, `dist/ferie-optimaliserer/browser/` contains `index.html` and bundled JS/CSS.

- [ ] **Step 2: Smoke-test the build locally**

```bash
npx serve dist/ferie-optimaliserer/browser
```

Open http://localhost:3000. Verify the app loads and works without dev server.

- [ ] **Step 3: Push to GitHub and deploy to Vercel**

```bash
# Create GitHub repo first (via gh CLI or github.com)
gh repo create ferie-optimaliserer --public --source=. --remote=origin --push
```

Then in Vercel dashboard: import the repo. Vercel auto-detects the `vercel.json` config. First deploy happens automatically.

Alternatively, deploy directly via CLI (log in first if needed):
```bash
npx vercel login   # only needed first time
npx vercel --prod
```

Expected: Vercel URL displayed. App loads correctly at the URL.

- [ ] **Step 4: Verify Påske 2026 result on deployed app**

Navigate to the Vercel URL. Select "🐣 Påske" and year 2026.

Expected:
- Hero card shows "Ta 1 feriedag → 6 dager fri" (efficiency 6.0×)
- Day strip shows the stretch from Skjærtorsdag (2. apr) through the green feriedag (7. apr) — 6 segments
- Alternatives list includes "3 dager → 10 dager (3.3×)" option

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: verify Vercel deploy"
```
