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
