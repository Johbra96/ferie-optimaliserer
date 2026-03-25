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
