import { TestBed } from '@angular/core/testing';
import { Landing } from './landing';

describe('Landing', () => {
  it('renders the announcement and supplied logo', async () => {
    await TestBed.configureTestingModule({ imports: [Landing] }).compileComponents();
    const fixture = TestBed.createComponent(Landing);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain('A new chapter');
    expect(page.querySelector('img')?.getAttribute('src')).toBe('/vadhuvai_logo.png');
    expect(page.textContent).toContain('The platform is not yet available.');
  });
});