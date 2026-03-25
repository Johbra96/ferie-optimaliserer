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
