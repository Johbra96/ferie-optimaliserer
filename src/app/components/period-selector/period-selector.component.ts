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
