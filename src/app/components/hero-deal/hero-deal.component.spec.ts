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
    expect(fixture.nativeElement.textContent).toContain('6');
  });

  it('uses plural form for multiple vacation days', () => {
    fixture.componentRef.setInput('deal', { ...mockDeal, vacationDaysUsed: 3 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('3 feriedager');
  });
});
