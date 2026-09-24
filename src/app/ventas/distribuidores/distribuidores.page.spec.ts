import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';
import { AuthorizationService } from 'src/app/services/auth/authorization.service';
import { UserAdminService } from 'src/app/services/auth/user-admin.service';
import { PersonalExpedienteService } from 'src/app/services/personal/personal-expediente.service';
import { DistribuidoresPage } from './distribuidores.page';
import { of } from 'rxjs';

const scope = {
  initialize: () => Promise.resolve(), snapshot: () => ({profile: {rol: 'admin'}}),
  state$: of({}), isReadOnly: () => false,
} as never;

describe('DistribuidoresPage', () => {
  it('expone acciones laborales sin cambiar el dominio comercial', () => {
    const component = new DistribuidoresPage(
      jasmine.createSpyObj<DistribuidoresService>('DistribuidoresService', ['getDistribuidores']),
      jasmine.createSpyObj<ModalController>('ModalController', ['create']),
      jasmine.createSpyObj<AlertController>('AlertController', ['create']),
      jasmine.createSpyObj<ToastController>('ToastController', ['create']),
      jasmine.createSpyObj<UserAdminService>('UserAdminService', ['getUsuario', 'getUsuarioByDistribuidorId']),
      jasmine.createSpyObj<AuthorizationService>('AuthorizationService', ['isCurrentUserAdmin']),
      jasmine.createSpyObj<Router>('Router', ['navigate']),
      jasmine.createSpyObj<PersonalExpedienteService>('PersonalExpedienteService', ['getDistribuidorDocumentCoverage']),
      scope
    );
    expect(component.accessLabel({
      id: 'distributor-1', nombre: 'Juan', identificador: 'VGBZ-01',
      ruta: '08', zona: 'gpe', usuarioUid: null,
    })).toBe('Sin cuenta');
  });

  it('resume estados y documentos faltantes de distribuidores activos', () => {
    const component = new DistribuidoresPage(
      jasmine.createSpyObj<DistribuidoresService>('DistribuidoresService', ['getDistribuidores']),
      jasmine.createSpyObj<ModalController>('ModalController', ['create']),
      jasmine.createSpyObj<AlertController>('AlertController', ['create']),
      jasmine.createSpyObj<ToastController>('ToastController', ['create']),
      jasmine.createSpyObj<UserAdminService>('UserAdminService', ['getUsuario', 'getUsuarioByDistribuidorId']),
      jasmine.createSpyObj<AuthorizationService>('AuthorizationService', ['isCurrentUserAdmin']),
      jasmine.createSpyObj<Router>('Router', ['navigate']),
      jasmine.createSpyObj<PersonalExpedienteService>('PersonalExpedienteService', ['getDistribuidorDocumentCoverage']),
      scope
    );
    component.distribuidores = [
      { id: 'active-1', nombre: 'Uno', identificador: 'D-1', ruta: '1', zona: 'zac', activo: true },
      { id: 'active-2', nombre: 'Dos', identificador: 'D-2', ruta: '2', zona: 'gpe', activo: true },
      { id: 'inactive-1', nombre: 'Tres', identificador: 'D-3', ruta: '3', zona: 'zac', activo: false },
    ];
    component.documentCoverageByDistributorId = { 'active-1': ['CONTRATO'] };
    component.documentInsightsState = 'ready';

    expect(component.activeCount).toBe(2);
    expect(component.inactiveCount).toBe(1);
    expect(component.incompleteFileCount).toBe(2);
    expect(component.topMissingDocuments[0].missingCount).toBe(2);
  });
});
