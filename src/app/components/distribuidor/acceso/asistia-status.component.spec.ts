import { TestBed } from '@angular/core/testing';
import { AlertController } from '@ionic/angular';
import { AsistiaStatusComponent } from './asistia-status.component';
import { AsistiaAdminStatus, AsistiaOnboardingAdminService } from '../../../services/attendance/asistia-onboarding-admin.service';

describe('Estado ASISTIA Fase 6', () => {
  let service: jasmine.SpyObj<AsistiaOnboardingAdminService>;
  let alerts: jasmine.SpyObj<AlertController>;
  const ready: AsistiaAdminStatus = {
    onboarding: { completed: true, generalPoliciesAccepted: true, biometricMode: 'PRESENCE_ONLY' },
    device: { linked: true, platform: 'android', linkedAt: '2026-09-08T20:00:00Z' },
    faceVerification: { presenceConfigured: true, biometricEnrollmentStatus: 'NOT_APPLICABLE' }, canResetDevice: true,
  };
  beforeEach(async () => {
    service = jasmine.createSpyObj('AsistiaOnboardingAdminService', ['getStatus', 'resetDevice']);
    service.getStatus.and.resolveTo(ready); service.resetDevice.and.resolveTo();
    alerts = jasmine.createSpyObj('AlertController', ['create']);
    await TestBed.configureTestingModule({ imports: [AsistiaStatusComponent], providers: [
      { provide: AsistiaOnboardingAdminService, useValue: service }, { provide: AlertController, useValue: alerts },
    ] }).compileComponents();
  });
  async function view(status = ready) {
    service.getStatus.and.resolveTo(status);
    const fixture = TestBed.createComponent(AsistiaStatusComponent);
    fixture.componentInstance.distribuidorId = 'worker';
    await fixture.componentInstance.load(); fixture.detectChanges();
    return fixture;
  }
  it('muestra políticas dispositivo y presencia', async () => {
    const fixture = await view(); const text = fixture.nativeElement.textContent;
    expect(text).toContain('Aceptadas'); expect(text).toContain('Vinculado'); expect(text).toContain('Configurada'); expect(text).toContain('Listo para presencia facial');
  });
  it('muestra configuración pendiente', async () => {
    const fixture = await view({ ...ready, onboarding: { ...ready.onboarding, completed: false, generalPoliciesAccepted: false }, device: { linked: false, platform: null, linkedAt: null } });
    expect(fixture.nativeElement.textContent).toContain('No vinculado'); expect(fixture.nativeElement.textContent).toContain('Pendientes');
  });
  it('no anuncia enrolamiento biométrico para opt-in', async () => {
    const fixture = await view({ ...ready, onboarding: { ...ready.onboarding, biometricMode: 'BIOMETRIC_OPT_IN' } });
    expect(fixture.nativeElement.textContent).toContain('pendiente de proveedor'); expect(fixture.nativeElement.textContent).toContain('no verificada');
  });
  it('capturista no ve ni ejecuta reset', async () => {
    const fixture = await view({ ...ready, canResetDevice: false });
    expect(fixture.nativeElement.textContent).not.toContain('Desvincular dispositivo');
    await fixture.componentInstance.confirmReset(); expect(alerts.create).not.toHaveBeenCalled(); expect(service.resetDevice).not.toHaveBeenCalled();
  });
  it('cancelar confirmación no modifica dispositivo', async () => {
    const fixture = await view();
    alerts.create.and.resolveTo({ present: async () => {}, onDidDismiss: async () => ({ role: 'cancel' }) } as HTMLIonAlertElement);
    await fixture.componentInstance.confirmReset(); expect(service.resetDevice).not.toHaveBeenCalled();
  });
  it('admin confirmado restablece y actualiza estado', async () => {
    const fixture = await view();
    alerts.create.and.resolveTo({ present: async () => {}, onDidDismiss: async () => ({ role: 'confirm' }) } as HTMLIonAlertElement);
    await fixture.componentInstance.confirmReset(); expect(service.resetDevice).toHaveBeenCalledOnceWith('worker'); expect(service.getStatus).toHaveBeenCalledTimes(2);
  });
  it('error no se muestra como no vinculado', async () => {
    const fixture = await view(); service.getStatus.and.rejectWith(new Error('unavailable'));
    await fixture.componentInstance.load(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar'); expect(fixture.nativeElement.textContent).not.toContain('No vinculado');
  });
  it('no muestra identificadores de instalación', async () => {
    const fixture = await view(); expect(fixture.nativeElement.textContent).not.toContain('installation'); expect(fixture.nativeElement.textContent).not.toContain('embedding');
  });
});
