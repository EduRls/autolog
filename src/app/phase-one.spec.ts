import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Router, UrlTree } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { ModalController, ToastController, LoadingController } from '@ionic/angular';
import { AgregarUsuarioComponent } from './components/agregar-usuario/agregar-usuario.component';
import { AccesoDistribuidorComponent } from './components/distribuidor/acceso/acceso-distribuidor.component';
import { AgregarAutoComponent } from './components/agregar-auto/agregar-auto.component';
import { EditarAutoComponent } from './components/editar-auto/editar-auto.component';
import { UserAdminService } from './services/auth/user-admin.service';
import { AuthorizationService } from './services/auth/authorization.service';
import { FirebaseService } from './services/firebase/firebase.service';
import { DistribuidoresService } from './services/admVentas/distribuidores/distribuidores.service';
import { autologAccessGuard } from './guards/autolog-access.guard';
import { ExpedientePersonalComponent } from './components/personal/expediente-personal/expediente-personal.component';
import { PersonalExpedienteService } from './services/personal/personal-expediente.service';
import { buildPersonalDocumentStoragePath, getDocumentoPersonalEstado } from './services/personal/personal-document.utils';
import { Timestamp } from '@angular/fire/firestore';
import { of } from 'rxjs';

describe('Fase 1: cuentas y personal operativo', () => {
  const modal = () => jasmine.createSpyObj<ModalController>('modal', ['dismiss']);
  const toast = () => {
    const value = jasmine.createSpyObj<ToastController>('toast', ['create']);
    value.create.and.resolveTo({present: async () => undefined} as HTMLIonToastElement);
    return value;
  };
  it('el formulario administrativo rechaza el rol de trabajador', () => {
    const component = new AgregarUsuarioComponent(
      {} as UserAdminService, modal(), toast(), {list: () => of([])} as never
    );
    component.ngOnInit();
    component.registroForm.controls.rol.setValue('empleado' as never);
    expect(component.registroForm.controls.rol.invalid).toBeTrue();
    expect(Object.keys(component.registroForm.controls)).toEqual([
      'email', 'password', 'usuario', 'rol', 'plantaIdPrincipal', 'plantasLectura', 'seccionesMenu'
    ]);
  });
  it('el acceso del distribuidor fija sus permisos sin selectores administrativos', async () => {
    const users = jasmine.createSpyObj<UserAdminService>('users', ['createUser']);
    users.createUser.and.resolveTo({uid: 'new', email: 'worker@example.com', activo: true});
    const component = new AccesoDistribuidorComponent(users, modal(), toast());
    component.distribuidorId = 'd1';
    component.ngOnInit();
    component.form.patchValue({email: 'worker@example.com', usuario: 'Uno', password: 'temporary1'});
    await component.save();
    expect(users.createUser).toHaveBeenCalledWith(jasmine.objectContaining({rol: 'empleado', tipoPersonal: 'DISTRIBUIDOR', distribuidorId: 'd1', accesoAutolog: false, accesoAsistencia: true}));
    expect(component.form.controls.password.value).toBe('');
  });
  it('una cuenta de distribuidor no supera el guard AUTOLOG', async () => {
    const authorization = new AuthorizationService({} as Auth, {} as Firestore);
    spyOn(authorization, 'hasAuthenticatedUser').and.resolveTo(true);
    spyOn<any>(authorization, 'getCurrentProfile').and.resolveTo({rol: 'empleado', activo: true, tipoPersonal: 'DISTRIBUIDOR', accesoAutolog: false});
    const redirect = {} as UrlTree;
    const router = jasmine.createSpyObj<Router>('router', ['createUrlTree']);
    router.createUrlTree.and.returnValue(redirect);
    TestBed.configureTestingModule({providers: [{provide: AuthorizationService, useValue: authorization}, {provide: Router, useValue: router}]});
    expect(await TestBed.runInInjectionContext(() => autologAccessGuard({} as never, {} as never))).toBe(redirect);
    expect(await authorization.isCurrentUserAdmin()).toBeFalse();
  });
  for (const editing of [false, true]) it(`selecciona distribuidor como operador: edición=${editing}`, async () => {
    const distributors = jasmine.createSpyObj<DistribuidoresService>('distributors', ['getActivos']);
    distributors.getActivos.and.resolveTo([{id: 'dist-1', nombre: 'JUAN', identificador: 'VGBZ-0001', ruta: '1', zona: 'gpe', plantaIdPrincipal: 'p1'}]);
    const args = [modal(), {} as LoadingController, {} as FirebaseService, toast(), new FormBuilder(), distributors] as const;
    const scope = {
      initialize: () => Promise.resolve(), snapshot: () => ({plants: []}),
      isGlobal: () => false, getActivePlantId: () => 'p1', getPrincipalPlantId: () => 'p1',
    } as never;
    const component = editing ? new EditarAutoComponent(...args) : new AgregarAutoComponent(...args, scope);
    if (component instanceof EditarAutoComponent) component.auto = {id: 'auto-1', operador: 'Anterior'};
    component.ngOnInit();
    if (component instanceof AgregarAutoComponent) {
      await (component as unknown as {initializeScope(): Promise<void>}).initializeScope();
    } else {
      await Promise.resolve();
    }
    const form = component instanceof EditarAutoComponent ? component.editarAuto : component.autoNuevo;
    form.controls['operadorId'].setValue('dist-1');
    component.seleccionarOperador('dist-1');
    expect(form.value.operadorId).toBe('dist-1');
    expect(form.value.operador).toBe('JUAN');
  });
  it('conserva la ruta documental y el expediente del distribuidor', async () => {
    const service = jasmine.createSpyObj<PersonalExpedienteService>('expediente', ['getDocumentos']);
    service.getDocumentos.and.resolveTo([]);
    const component = new ExpedientePersonalComponent(service, modal(), {} as never, toast());
    component.distribuidor = {id: 'dist-1', nombre: 'JUAN', identificador: 'VGBZ-001', ruta: '1', zona: 'gpe'};
    await component.loadDocumentos();
    expect(service.getDocumentos).toHaveBeenCalledWith(jasmine.objectContaining({personalId: 'dist-1', tipoPersonal: 'DISTRIBUIDOR'}));
    expect(buildPersonalDocumentStoragePath(component.target, 'doc-1', 'Contrato.pdf')).toBe('personal/distribuidores/dist-1/expediente/doc-1/contrato.pdf');
    expect(getDocumentoPersonalEstado({esVersionActual: false, estadoManual: null, fechaVencimiento: Timestamp.now()})).toBe('NO_APLICA');
  });
});
