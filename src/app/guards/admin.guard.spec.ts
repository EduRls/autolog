import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthorizationService } from '../services/auth/authorization.service';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  it('rechaza a un usuario sin permisos administrativos', async () => {
    const authorization = jasmine.createSpyObj<AuthorizationService>('AuthorizationService', ['isCurrentUserAdmin']);
    authorization.isCurrentUserAdmin.and.resolveTo(false);
    const redirect = {} as UrlTree;
    const router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue(redirect);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthorizationService, useValue: authorization },
        { provide: Router, useValue: router },
      ],
    });

    const result = await TestBed.runInInjectionContext(() => adminGuard(
      {} as Parameters<typeof adminGuard>[0],
      {} as Parameters<typeof adminGuard>[1]
    ));

    expect(result).toBe(redirect);
    expect(router.createUrlTree).toHaveBeenCalledOnceWith(['/home']);
  });
});
