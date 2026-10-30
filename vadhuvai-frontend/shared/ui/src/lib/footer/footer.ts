import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'vadhuvai-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VadhuvaiFooter {
  readonly disclaimer = input(
    'Registrations are processed under applicable marriage registration law and are subject to verification by the concerned Sub-Registrar Office.',
  );
  readonly privacyPolicyHref = input('#privacy-policy');
  readonly contactEmail = input('helpdesk@vadhuvai.example');
  readonly contactPhone = input('+91 00000 00000');
}
