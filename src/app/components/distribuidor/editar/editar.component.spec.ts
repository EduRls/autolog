import { FormBuilder } from '@angular/forms';
import { LoadingController, ModalController, ToastController } from '@ionic/angular';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';
import { UserAdminService } from 'src/app/services/auth/user-admin.service';
import { EditarComponent } from './editar.component';
import { of } from 'rxjs';

describe('EditarComponent', () => {
  it('edita sólo los datos comerciales del distribuidor', () => {
    const component = new EditarComponent(
      jasmine.createSpyObj<ModalController>('ModalController', ['dismiss', 'create']),
      jasmine.createSpyObj<DistribuidoresService>('DistribuidoresService', ['updateDistribuidor']),
      jasmine.createSpyObj<LoadingController>('LoadingController', ['create']),
      jasmine.createSpyObj<ToastController>('ToastController', ['create']),
      new FormBuilder(),
      jasmine.createSpyObj<UserAdminService>('UserAdminService', ['getUsuario', 'getUsuarioByDistribuidorId'])
    );
    component.operadorData = {
      id: 'distributor-1',
      nombre: 'Juan',
      identificador: 'VGBZ-01',
      ruta: '08',
      zona: 'gpe',
    };
    component.ngOnInit();
    expect(component.editarOperadorForm.controls['identificador'].enabled).toBeFalse();
  });

  it('no envía el identificador al guardar valores normalizados', async () => {
    const modal = jasmine.createSpyObj<ModalController>('ModalController', ['dismiss', 'create']);
    modal.dismiss.and.resolveTo(true);
    const service = jasmine.createSpyObj<DistribuidoresService>('DistribuidoresService', ['updateDistribuidor', 'getDistribuidores']);
    service.getDistribuidores.and.returnValue(of([]));
    service.updateDistribuidor.and.resolveTo();
    const loading = jasmine.createSpyObj<HTMLIonLoadingElement>('loading', ['present', 'dismiss']);
    loading.present.and.resolveTo();
    loading.dismiss.and.resolveTo(true);
    const loadingController = jasmine.createSpyObj<LoadingController>('LoadingController', ['create']);
    loadingController.create.and.resolveTo(loading);
    const toast = jasmine.createSpyObj<ToastController>('ToastController', ['create']);
    toast.create.and.resolveTo({ present: () => Promise.resolve() } as HTMLIonToastElement);
    const component = new EditarComponent(
      modal,
      service,
      loadingController,
      toast,
      new FormBuilder(),
      jasmine.createSpyObj<UserAdminService>('UserAdminService', ['getUsuario', 'getUsuarioByDistribuidorId'])
    );
    component.operadorData = {
      id: 'distributor-1', nombre: 'Juan', identificador: 'VGBZ-01', ruta: '08', zona: 'gpe',
    };
    component.ngOnInit();
    component.editarOperadorForm.patchValue({ identificador: 'vgbz-02', ruta: ' r-09 ' });

    await component.editarOperador();

    expect(service.updateDistribuidor).toHaveBeenCalledWith({
      id: 'distributor-1', nombre: 'JUAN', ruta: 'R-09', zona: 'gpe',
    });
    expect(modal.dismiss).toHaveBeenCalledWith({ changed: true });
    expect(component.editarOperadorForm.controls['identificador'].enabled).toBeFalse();
  });
});
