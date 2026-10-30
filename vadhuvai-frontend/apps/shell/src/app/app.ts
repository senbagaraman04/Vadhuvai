import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PortalLanguage, VadhuvaiFooter, VadhuvaiHeader } from '@vadhuvai/shared/ui';

@Component({
  imports: [RouterModule, VadhuvaiHeader, VadhuvaiFooter],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly language = signal<PortalLanguage>('en');
}
