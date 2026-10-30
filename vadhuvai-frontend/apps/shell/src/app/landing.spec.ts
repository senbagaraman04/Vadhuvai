import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Landing } from './landing';

describe('Landing', () => {
  it('renders login links and the supplied logo without construction notices', async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Landing);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain('A new chapter');
    expect(page.querySelector('img')?.getAttribute('src')).toBe('/vadhuvai_logo.png');
    expect(page.querySelector('a[href="/citizen/auth"]')?.textContent).toContain('Citizen Login');
    expect(page.querySelector('a[href="/sro"]')?.textContent).toContain('SRO Login');
    expect(page.textContent).not.toContain('Coming soon');
    expect(page.textContent).not.toContain('Under construction');
    expect(page.textContent).not.toContain("We're still at work.");
    expect(page.textContent).not.toContain('The platform is not yet available.');
  });
});