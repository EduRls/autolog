import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { AttendanceService } from '../services/attendance/attendance.service';
import { AuthService } from '../services/auth/auth.service';
import { RelojLoginPage } from './reloj-login.page';

describe('RelojLoginPage', () => {
  let auth: jasmine.SpyObj<AuthService> & { user$: Subject<unknown> };
  let attendance: jasmine.SpyObj<AttendanceService>;
  let router: jasmine.SpyObj<Router>;
  let component: RelojLoginPage;

  beforeEach(() => {
    auth = Object.assign(
      jasmine.createSpyObj<AuthService>(
        'AuthService',
        ['loginWithEmailPassword', 'logout', 'sendPasswordReset']
      ),
      { user$: new Subject<unknown>() }
    );
    attendance = jasmine.createSpyObj<AttendanceService>('AttendanceService', ['getMyProfile']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    const toast = jasmine.createSpyObj<ToastController>('ToastController', ['create']);
    toast.create.and.resolveTo({ present: async () => undefined } as HTMLIonToastElement);
    component = new RelojLoginPage(auth, attendance, router, toast);
    component.ngOnInit();
  });

  afterEach(() => component.ngOnDestroy());

  it('inicia sesión, valida el perfil y limpia la contraseña', async () => {
    component.loginForm.setValue({ email: 'ana@example.com', password: 'temporary' });
    auth.loginWithEmailPassword.and.resolveTo({} as never);
    attendance.getMyProfile.and.resolveTo({} as never);
    router.navigateByUrl.and.resolveTo(true);
    await component.login();
    expect(auth.loginWithEmailPassword).toHaveBeenCalled();
    expect(attendance.getMyProfile).toHaveBeenCalled();
    expect(component.loginForm.controls.password.value).toBe('');
  });

  it('usa Firebase para recuperación de contraseña', async () => {
    component.loginForm.controls.email.setValue('ana@example.com');
    auth.sendPasswordReset.and.resolveTo();
    await component.recoverPassword();
    expect(auth.sendPasswordReset).toHaveBeenCalledOnceWith('ana@example.com');
  });

  it('restaura una sesión observada sólo después de validar el perfil', async () => {
    attendance.getMyProfile.and.resolveTo({} as never);
    router.navigateByUrl.and.resolveTo(true);
    auth.user$.next({ uid: 'uid-1' });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(attendance.getMyProfile).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      '/reloj',
      { replaceUrl: true }
    );
  });

  it('cierra la sesión cuando el perfil no autoriza asistencia', async () => {
    component.loginForm.setValue({ email: 'ana@example.com', password: 'temporary' });
    auth.loginWithEmailPassword.and.resolveTo({} as never);
    attendance.getMyProfile.and.rejectWith({ code: 'functions/permission-denied' });
    auth.logout.and.resolveTo();
    await component.login();
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
