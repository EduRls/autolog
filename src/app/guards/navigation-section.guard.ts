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
    if (await authorization.canCurrentUserAccessSection(section)) return true;
    const sgmOnly = await authorization.canCurrentUserAccessSection('sgm') &&
      !await authorization.canCurrentUserAccessSection('general');
    return router.createUrlTree([sgmOnly ? '/sgm' : '/home']);
  } catch {
    return router.createUrlTree(['/login']);
  }
};
