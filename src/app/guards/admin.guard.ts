import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthorizationService } from '../services/auth/authorization.service';

export const adminGuard: CanActivateFn = async () => {
  const authorization = inject(AuthorizationService);
  const router = inject(Router);

  try {
    return await authorization.isCurrentUserAdmin()
      ? true
      : router.createUrlTree(['/home']);
  } catch {
    return router.createUrlTree(['/login']);
  }
};
