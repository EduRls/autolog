import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PlantScopeService } from '../services/plants/plant-scope.service';

export const globalOperatorGuard: CanActivateFn = async () => {
  const scope = inject(PlantScopeService);
  const router = inject(Router);
  try {
    await scope.initialize(true);
    return scope.isGlobal() ? true : router.createUrlTree(['/home']);
  } catch {
    return router.createUrlTree(['/login']);
  }
};
