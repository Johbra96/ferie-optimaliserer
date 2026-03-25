import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
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
    const spy = vi.fn();
    fixture.componentInstance.periodChange.subscribe(spy);
    const btn = fixture.debugElement.queryAll(By.css('[data-testid="period-btn"]'))[1];
    btn.nativeElement.click();
    expect(spy).toHaveBeenCalledWith(PERIOD_DEFINITIONS[1].id);
  });

  it('emits yearChange when a year button is clicked', () => {
    const spy = vi.fn();
    fixture.componentInstance.yearChange.subscribe(spy);
    const btn = fixture.debugElement.queryAll(By.css('[data-testid="year-btn"]'))[1];
    btn.nativeElement.click();
    expect(spy).toHaveBeenCalledWith(AVAILABLE_YEARS[1]);
  });
});
