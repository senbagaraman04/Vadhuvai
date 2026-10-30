import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CitizenSession } from '../services/citizen-session.service';

export const citizenSessionGuard: CanActivateFn = () =>
  inject(CitizenSession).verified() || inject(Router).createUrlTree(['/citizen/auth']);
