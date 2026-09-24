import { Timestamp } from '@angular/fire/firestore';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { UsuarioAutolog } from '../models/usuario-autolog.model';
import { UserAdminService } from '../services/auth/user-admin.service';
import { UsuariosPage } from './usuarios.page';

describe('UsuariosPage', () => {
  it('desactiva Authentication/Firestore mediante el callable y recarga una sola consulta', async () => {
    const service = jasmine.createSpyObj<UserAdminService>('UserAdminService', ['getPage', 'disableUser']);
    service.getPage.and.resolveTo({ usuarios: [], nextCursor: null, hasNext: false });
    service.disableUser.and.resolveTo({ uid: 'uid-2', email: 'user@example.com', activo: false });
    const modal = jasmine.createSpyObj<ModalController>('ModalController', ['create']);
    const alert = jasmine.createSpyObj<AlertController>('AlertController', ['create']);
    const toast = jasmine.createSpyObj<ToastController>('ToastController', ['create']);
    toast.create.and.resolveTo({ present: async () => undefined } as HTMLIonToastElement);
    const component = new UsuariosPage(service, modal, alert, toast);
    const usuario: UsuarioAutolog = {
      id: 'uid-2', uid: 'uid-2', email: 'user@example.com', usuario: 'Usuario',
      rol: 'capturista', activo: true, tipoPersonal: 'SISTEMA',
      distribuidorId: null, accesoAutolog: true,
      accesoAsistencia: false,
      plantaIdPrincipal: null, plantasLectura: [], accesoTodasPlantas: true,
      seccionesMenu: ['general', 'sales', 'fleet', 'station', 'attendance'],
      createdAt: Timestamp.fromMillis(1_000), updatedAt: Timestamp.fromMillis(1_000),
    };
    const privateApi = component as unknown as { desactivarUsuario(value: UsuarioAutolog): Promise<void> };

    await privateApi.desactivarUsuario(usuario);

    expect(service.disableUser).toHaveBeenCalledOnceWith('uid-2');
    expect(service.getPage).toHaveBeenCalledTimes(1);
  });
});


describe('UsuariosPage recovery and navigation', () => {
  it('retries the failed initial load and preserves legacy results', async () => {
    const users = jasmine.createSpyObj<UserAdminService>('users', ['getPage']);
    const component = new UsuariosPage(users, {} as ModalController, {} as AlertController, {} as ToastController);
    users.getPage.and.rejectWith({code: 'unavailable'});
    await component.loadInitialPage();
    expect(component.state).toBe('error');
    users.getPage.and.resolveTo({usuarios: [{id: 'legacy'} as UsuarioAutolog], nextCursor: null, hasNext: false});
    await component.loadInitialPage();
    expect(component.state).toBe('ready');
    expect(users.getPage).toHaveBeenCalledTimes(2);
  });
  it('does not advance the page number on a failed next request', async () => {
    const users = jasmine.createSpyObj<UserAdminService>('users', ['getPage']);
    users.getPage.and.resolveTo({usuarios: [{id: 'one'} as UsuarioAutolog], nextCursor: {id: 'cursor'} as never, hasNext: true});
    const component = new UsuariosPage(users, {} as ModalController, {} as AlertController, {} as ToastController);
    await component.loadInitialPage();
    users.getPage.and.rejectWith({code: 'unavailable'});
    await component.nextPage();
    expect(component.pageNumber).toBe(1);
    expect(component.state).toBe('error');
  });
});
