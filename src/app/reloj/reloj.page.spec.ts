import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AutologWorkerProfile } from '../models/attendance.model';
import { AttendanceService } from '../services/attendance/attendance.service';
import { AuthService } from '../services/auth/auth.service';
import { RelojPage } from './reloj.page';

describe('RelojPage', () => {
  const profile: AutologWorkerProfile = {
    uid: 'uid-1',
    usuario: {
      email: 'ana@example.com',
      rol: 'empleado',
      accesoAutolog: false,
      accesoAsistencia: true,
    },
    personal: {
      tipo: 'DISTRIBUIDOR',
      id: 'distributor-1',
      nombreCompleto: 'Ana López',
    },
  };

  let attendance: jasmine.SpyObj<AttendanceService>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let component: RelojPage;

  beforeEach(() => {
    attendance = jasmine.createSpyObj<AttendanceService>(
      'AttendanceService',
      ['getMyProfile', 'getMyAttendance', 'registerAttendance']
    );
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    const toast = jasmine.createSpyObj<ToastController>('ToastController', ['create']);
    toast.create.and.resolveTo({ present: async () => undefined } as HTMLIonToastElement);
    component = new RelojPage(attendance, auth, router, toast);
  });

  it('restaura perfil e historial en paralelo', async () => {
    attendance.getMyProfile.and.resolveTo(profile);
    attendance.getMyAttendance.and.resolveTo([]);
    await component.load();
    expect(component.profile).toEqual(profile);
    expect(component.state).toBe('ready');
  });

  it('bloquea doble tap y refresca el historial', async () => {
    component.profile = profile;
    component.state = 'ready';
    attendance.getMyAttendance.and.resolveTo([]);
    spyOn(
      component as unknown as { getLocationIfAvailable(): Promise<undefined> },
      'getLocationIfAvailable'
    ).and.resolveTo(undefined);
    let complete!: (value: {
      asistenciaId: string;
      tipo: 'ENTRADA';
      fechaLocal: string;
      registradoEn: string;
      duplicado: boolean;
    }) => void;
    attendance.registerAttendance.and.returnValue(new Promise(resolve => complete = resolve));

    const first = component.register();
    const second = component.register();
    await Promise.resolve();
    expect(attendance.registerAttendance).toHaveBeenCalledTimes(1);
    complete({
      asistenciaId: 'attendance-1',
      tipo: 'ENTRADA',
      fechaLocal: '2026-09-03',
      registradoEn: '2026-09-03T13:00:00.000Z',
      duplicado: false,
    });
    await Promise.all([first, second]);
    expect(component.submitting).toBeFalse();
    expect(attendance.getMyAttendance).toHaveBeenCalled();
  });

  it('conserva la clave idempotente al reintentar un error de red', async () => {
    component.profile = profile;
    component.state = 'ready';
    spyOn(
      component as unknown as { getLocationIfAvailable(): Promise<undefined> },
      'getLocationIfAvailable'
    ).and.resolveTo(undefined);
    attendance.registerAttendance.and.rejectWith({ code: 'functions/unavailable' });
    await component.register();
    const firstKey = attendance.registerAttendance.calls.argsFor(0)[0];
    attendance.registerAttendance.and.resolveTo({
      asistenciaId: 'attendance-1',
      tipo: 'ENTRADA',
      fechaLocal: '2026-09-03',
      registradoEn: '2026-09-03T13:00:00.000Z',
      duplicado: false,
    });
    attendance.getMyAttendance.and.resolveTo([]);
    await component.register();
    expect(attendance.registerAttendance.calls.argsFor(1)[0]).toBe(firstKey);
  });

  it('muestra estado de error cuando no puede cargar el perfil', async () => {
    attendance.getMyProfile.and.rejectWith({ code: 'functions/not-found' });
    attendance.getMyAttendance.and.resolveTo([]);
    await component.load();
    expect(component.state).toBe('error');
  });

  it('cierra sesión y vuelve al login del reloj', async () => {
    auth.logout.and.resolveTo();
    router.navigateByUrl.and.resolveTo(true);
    await component.logout();
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      '/reloj/login',
      { replaceUrl: true }
    );
  });
});
