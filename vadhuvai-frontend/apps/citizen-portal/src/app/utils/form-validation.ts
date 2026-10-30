import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { todayIsoDate } from './date';

/** Rejects dates after today. Expects ISO `YYYY-MM-DD` strings. */
export const notAfterToday: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null =>
  control.value && control.value > todayIsoDate()
    ? { notAfterToday: true }
    : null;

/** Rejects dates before today. Expects ISO `YYYY-MM-DD` strings. */
export const notBeforeToday: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null =>
  control.value && control.value < todayIsoDate()
    ? { notBeforeToday: true }
    : null;

export function formErrorOf(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }
  if (control.hasError('notAfterToday')) {
    return 'Date cannot be in the future.';
  }
  if (control.hasError('notBeforeToday')) {
    return 'Date cannot be in the past.';
  }
  if (control.hasError('pattern')) {
    return 'Enter a valid 10-digit mobile number.';
  }
  if (control.hasError('maxlength')) {
    return 'The entered value is too long.';
  }
  return 'This field is required.';
}
