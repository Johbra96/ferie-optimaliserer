import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DayStripComponent } from './day-strip.component';
import { DealOption, DayEntry } from '../../models/types';

const makeDays = (types: Array<'red' | 'green' | 'white'>): DayEntry[] =>
  types.map((type, i) => ({
    date: `2026-04-${String(i + 1).padStart(2, '0')}`,
    type,
    label: String(i + 1),
    weekday: 'Ma' as const,
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
