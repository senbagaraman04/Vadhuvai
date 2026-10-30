import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StepState = 'completed' | 'active' | 'pending';

@Component({
  selector: 'vadhuvai-stepper',
  templateUrl: './stepper.html',
  styleUrl: './stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VadhuvaiStepper {
  readonly steps = input.required<readonly string[]>();
  readonly activeIndex = input(0);

  protected stateOf(index: number): StepState {
    const active = this.activeIndex();
    if (index < active) {
      return 'completed';
    }
    return index === active ? 'active' : 'pending';
  }

  protected numberOf(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}
