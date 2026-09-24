import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { UserAdminService } from '../../services/auth/user-admin.service';
import { EditarUsuarioComponent } from './editar-usuario.component';
import { of } from 'rxjs';

describe('EditarUsuarioComponent', () => {
  it('expone solamente campos administrativos', () => {
    const component = new EditarUsuarioComponent(
      jasmine.createSpyObj<ModalController>('ModalController', ['dismiss']),
      jasmine.createSpyObj<UserAdminService>('UserAdminService', ['updateUser', 'disableUser']),
      jasmine.createSpyObj<ToastController>('ToastController', ['create']),
      jasmine.createSpyObj<AlertController>('AlertController', ['create']),
      {list: () => of([])} as never
    );
    component.usuarioData = {
      id: 'uid-1', uid: 'uid-1', email: 'admin@example.com', usuario: 'Admin',
      rol: 'admin', activo: true, tipoPersonal: 'SISTEMA',
      distribuidorId: null,
      accesoAutolog: true, accesoAsistencia: false,
      plantaIdPrincipal: null, plantasLectura: [], accesoTodasPlantas: true,
      seccionesMenu: ['general', 'sales', 'fleet', 'station', 'attendance', 'administration'],
    };
    component.ngOnInit();
    expect(Object.keys(component.editarForm.controls)).toEqual([
      'email', 'usuario', 'rol', 'activo', 'plantaIdPrincipal', 'plantasLectura', 'seccionesMenu'
    ]);
  });

  it('muestra a Planta todos los módulos operativos, excepto Administración', () => {
    const component = new EditarUsuarioComponent(
      jasmine.createSpyObj<ModalController>('ModalController', ['dismiss']),
      jasmine.createSpyObj<UserAdminService>('UserAdminService', ['updateUser', 'disableUser']),
      jasmine.createSpyObj<ToastController>('ToastController', ['create']),
      jasmine.createSpyObj<AlertController>('AlertController', ['create']),
      {list: () => of([])} as never
    );
    component.usuarioData = {
      id: 'uid-plant', uid: 'uid-plant', email: 'plant@example.com', usuario: 'Plant',
      rol: 'planta', activo: true, tipoPersonal: 'SISTEMA', distribuidorId: null,
      accesoAutolog: true, accesoAsistencia: false, plantaIdPrincipal: 'p1',
      plantasLectura: [], accesoTodasPlantas: false, seccionesMenu: ['general', 'fleet'],
    };
    component.ngOnInit();

    expect(component.permissionGroups.map(group => group.id)).toEqual([
      'general', 'sales', 'fleet', 'station', 'attendance'
    ]);
  });
});
