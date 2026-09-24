import { ModalController, ToastController } from '@ionic/angular';
import { UserAdminService } from '../../services/auth/user-admin.service';
import { AgregarUsuarioComponent } from './agregar-usuario.component';
import { of } from 'rxjs';

describe('AgregarUsuarioComponent', () => {
  for (const rol of ['admin', 'capturista'] as const) it(`crea ${rol}: la cuenta por el servicio backend y limpia la contraseña`, async () => {
    const users = jasmine.createSpyObj<UserAdminService>('UserAdminService', ['createUser']);
    users.createUser.and.resolveTo({ uid: 'uid-new', email: 'admin@example.com', activo: true });
    const modal = jasmine.createSpyObj<ModalController>('ModalController', ['dismiss']);
    modal.dismiss.and.resolveTo(true);
    const toast = jasmine.createSpyObj<ToastController>('ToastController', ['create']);
    toast.create.and.resolveTo({ present: async () => undefined } as HTMLIonToastElement);
    const component = new AgregarUsuarioComponent(users, modal, toast, {list: () => of([])} as never);
    component.ngOnInit();
    component.registroForm.setValue({
      email: 'admin@example.com', password: 'secret1', usuario: 'Admin', rol,
      plantaIdPrincipal: '', plantasLectura: [],
      seccionesMenu: rol === 'admin'
        ? ['general', 'sales', 'fleet', 'station', 'attendance', 'administration']
        : ['general', 'sales', 'fleet', 'station', 'attendance'],
    });

    await component.registerUser();

    expect(users.createUser).toHaveBeenCalledOnceWith(jasmine.objectContaining({ password: 'secret1', rol, tipoPersonal: 'SISTEMA', distribuidorId: null, accesoAutolog: true, accesoAsistencia: false, seccionesMenu: jasmine.arrayContaining(['general', 'fleet']) }));
    expect(component.registroForm.controls.password.value).toBe('');
    expect(modal.dismiss).toHaveBeenCalledWith({ changed: true, uid: 'uid-new' });
  });

  it('permite configurar Expendio y Asistencia de forma independiente', () => {
    const component = new AgregarUsuarioComponent(
      jasmine.createSpyObj<UserAdminService>('UserAdminService', ['createUser']),
      jasmine.createSpyObj<ModalController>('ModalController', ['dismiss']),
      jasmine.createSpyObj<ToastController>('ToastController', ['create']),
      {list: () => of([])} as never
    );
    component.ngOnInit();
    component.registroForm.controls.rol.setValue('capturista');

    component.toggleSection('station', {target: {checked: false}} as unknown as Event);
    component.toggleSection('attendance', {target: {checked: false}} as unknown as Event);

    expect(component.registroForm.controls.seccionesMenu.value).not.toContain('station');
    expect(component.registroForm.controls.seccionesMenu.value).not.toContain('attendance');
    expect(component.registroForm.controls.seccionesMenu.value).toContain('general');
  });
});
