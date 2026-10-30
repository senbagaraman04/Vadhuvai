import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { VadhuvaiStatusBadge, VadhuvaiStepper } from '@vadhuvai/shared/ui';
import { MaritalStatus, PartyDetails } from '@vadhuvai/shared/util-models';
import { CITIZEN_STEPS } from '../../data/citizen-steps';
import { SRO_OFFICES } from '../../data/sro-offices';
import { ApplicationStore } from '../../services/application-store.service';
import { todayIsoDate } from '../../utils/date';
import {
  formErrorOf,
  notAfterToday,
  notBeforeToday,
} from '../../utils/form-validation';

type PartyKey = 'groom' | 'bride';

interface PartyField {
  name: keyof PartyDetails;
  label: string;
  kind: 'text' | 'date' | 'mobile' | 'textarea' | 'select';
}

@Component({
  selector: 'app-application-page',
  imports: [DatePipe, ReactiveFormsModule, VadhuvaiStepper, VadhuvaiStatusBadge],
  templateUrl: './application.html',
  styleUrl: './application.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);
  protected readonly store = inject(ApplicationStore);

  protected readonly steps = CITIZEN_STEPS;
  protected readonly today = todayIsoDate();
  protected readonly errorOf = formErrorOf;
  protected readonly sroOffices = SRO_OFFICES;
  protected readonly partyKeys: readonly PartyKey[] = ['groom', 'bride'];
  protected readonly partyTitles: Record<PartyKey, string> = {
    groom: 'Groom details',
    bride: 'Bride details',
  };

  protected readonly partyFields: readonly PartyField[] = [
    { name: 'fullName', label: 'Full name (as per ID)', kind: 'text' },
    { name: 'dateOfBirth', label: 'Date of birth', kind: 'date' },
    { name: 'mobileNumber', label: 'Mobile number', kind: 'mobile' },
    { name: 'maritalStatus', label: 'Marital status', kind: 'select' },
    { name: 'address', label: 'Permanent address', kind: 'textarea' },
  ];

  protected readonly maritalOptions: readonly {
    value: MaritalStatus;
    label: string;
  }[] = [
    { value: 'UNMARRIED', label: 'Unmarried' },
    { value: 'DIVORCED', label: 'Divorced' },
    { value: 'WIDOWED', label: 'Widowed' },
  ];

  protected readonly form = this.fb.group({
    groom: this.partyGroup(this.store.groom()),
    bride: this.partyGroup(this.store.bride()),
    ceremony: this.fb.group({
      marriageDate: [
        this.store.ceremony().marriageDate,
        [Validators.required, notBeforeToday],
      ],
      venue: [
        this.store.ceremony().venue,
        [Validators.required, Validators.maxLength(200)],
      ],
      sroDistrict: [this.store.ceremony().sroDistrict, Validators.required],
    }),
  });

  protected readonly ceremony = this.form.controls.ceremony;

  protected control(
    party: PartyKey,
    name: keyof PartyDetails,
  ): AbstractControl {
    return this.form.controls[party].controls[name];
  }

  protected saveDraft(): void {
    this.store.saveDraft(this.form.getRawValue());
  }

  protected proceed(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.store.submitApplication(this.form.getRawValue());
    void this.router.navigateByUrl('/citizen/documents');
  }

  private partyGroup(party: PartyDetails) {
    return this.fb.group({
      fullName: [
        party.fullName,
        [Validators.required, Validators.maxLength(120)],
      ],
      dateOfBirth: [party.dateOfBirth, [Validators.required, notAfterToday]],
      mobileNumber: [
        party.mobileNumber,
        [Validators.required, Validators.pattern(/^\d{10}$/)],
      ],
      address: [
        party.address,
        [Validators.required, Validators.maxLength(300)],
      ],
      maritalStatus: [party.maritalStatus, Validators.required],
    });
  }
}
