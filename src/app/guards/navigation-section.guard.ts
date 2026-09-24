import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { NavigationSectionId } from '../components/menu/navigation.config';
import { AuthorizationService } from '../services/auth/authorization.service';

export const navigationSectionGuard: CanActivateFn = async route => {
  const authorization = inject(AuthorizationService);
  const router = inject(Router);
  const section = route.data['navigationSection'] as NavigationSectionId | undefined;
  if (!section) return router.createUrlTree(['/home']);
  try {
    return await authorization.canCurrentUserAccessSection(section)
      ? true
      : router.createUrlTree(['/home']);
  } catch {
    return router.createUrlTree(['/login']);
  }
};
