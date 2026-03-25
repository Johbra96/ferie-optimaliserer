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
  templateUrl: './app.html',
})
export class App {
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
