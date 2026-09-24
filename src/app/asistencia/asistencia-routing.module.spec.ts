import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { APP_ROUTES } from '../app-routing.module';
import { adminGuard } from '../guards/admin.guard';
import { autologAccessGuard } from '../guards/autolog-access.guard';
import { AuthorizationService } from '../services/auth/authorization.service';
import { ASISTENCIA_ROUTES } from './asistencia-routing.module';

describe('Routing y permisos de Asistencia', () => {
  const childRoute = (path: string) => ASISTENCIA_ROUTES.find(route => route.path === path)!;

  it('carga el módulo de forma lazy y protege toda la sección con acceso AUTOLOG', () => {
    const route = APP_ROUTES.find(candidate => candidate.path === 'asistencia')!;
    expect(route.loadChildren).toBeDefined();
    expect(route.canActivate).toContain(autologAccessGuard);
  });

  it('permite Panel y Registros a admin y capturista', async () => {
    expect(childRoute('').canActivate).toBeUndefined();
    expect(childRoute('registros').canActivate).toBeUndefined();
    for (const role of ['admin', 'capturista']) {
      const authorization = jasmine.createSpyObj<AuthorizationService>('AuthorizationService', ['hasAuthenticatedUser', 'canCurrentUserAccessAutolog']);
      authorization.hasAuthenticatedUser.and.resolveTo(true);
      authorization.canCurrentUserAccessAutolog.and.resolveTo(true);
      TestBed.configureTestingModule({ providers: [
        { provide: AuthorizationService, useValue: authorization },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['createUrlTree']) },
      ] });
      const result = await TestBed.runInInjectionContext(() => autologAccessGuard({} as never, {} as never));
      expect(result).withContext(role).toBeTrue();
      TestBed.resetTestingModule();
    }
  });

  it('permite Configuración al administrador', async () => {
    expect(childRoute('configuracion').canActivate).toContain(adminGuard);
    const authorization = jasmine.createSpyObj<AuthorizationService>('AuthorizationService', ['isCurrentUserAdmin']);
    authorization.isCurrentUserAdmin.and.resolveTo(true);
    TestBed.configureTestingModule({ providers: [
      { provide: AuthorizationService, useValue: authorization },
      { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['createUrlTree']) },
    ] });
    expect(await TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never))).toBeTrue();
  });

  it('protege Puntos autorizados exclusivamente con adminGuard', () => {
    expect(childRoute('configuracion/puntos').canActivate).toContain(adminGuard);
  });

  it('rechaza Configuración para capturista', async () => {
    const authorization = jasmine.createSpyObj<AuthorizationService>('AuthorizationService', ['isCurrentUserAdmin']);
    authorization.isCurrentUserAdmin.and.resolveTo(false);
    const denied = {} as UrlTree;
    const router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue(denied);
    TestBed.configureTestingModule({ providers: [
      { provide: AuthorizationService, useValue: authorization },
      { provide: Router, useValue: router },
    ] });
    expect(await TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never))).toBe(denied);
  });
});
