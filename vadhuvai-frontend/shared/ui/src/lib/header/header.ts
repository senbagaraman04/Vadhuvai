import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export type PortalLanguage = 'en' | 'ta';

@Component({
  selector: 'vadhuvai-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VadhuvaiHeader {
  readonly environmentLabel = input('Digital SRO Infrastructure');
  readonly language = input<PortalLanguage>('en');
  readonly languageChange = output<PortalLanguage>();
}
