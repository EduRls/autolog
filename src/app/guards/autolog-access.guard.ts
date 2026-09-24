import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthorizationService } from '../services/auth/authorization.service';

export const autologAccessGuard: CanActivateFn = async () => {
  const authorization = inject(AuthorizationService);
  const router = inject(Router);
  try {
    if (!await authorization.hasAuthenticatedUser()) {
      return router.createUrlTree(['/login']);
    }
    return await authorization.canCurrentUserAccessAutolog()
      ? true
      : router.createUrlTree(['/reloj']);
  } catch {
    return router.createUrlTree(['/login']);
  }
};
