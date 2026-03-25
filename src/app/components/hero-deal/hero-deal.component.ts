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
