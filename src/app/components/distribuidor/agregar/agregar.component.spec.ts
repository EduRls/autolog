import { FormBuilder } from '@angular/forms';
import { LoadingController, ModalController, ToastController } from '@ionic/angular';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';
import { AgregarComponent } from './agregar.component';

const scope = {
  initialize: () => Promise.resolve(), snapshot: () => ({plants: []}),
  isGlobal: () => false, getActivePlantId: () => 'p1', getPrincipalPlantId: () => 'p1',
} as never;

describe('AgregarComponent', () => {
  it('crea el formulario comercial con identificador asignado por servidor', () => {
    const component = new AgregarComponent(
      new FormBuilder(),
      jasmine.createSpyObj<ModalController>('ModalController', ['dismiss']),
      jasmine.createSpyObj<ToastController>('ToastController', ['create']),
      jasmine.createSpyObj<LoadingController>('LoadingController', ['create']),
      jasmine.createSpyObj<DistribuidoresService>('DistribuidoresService', ['addDistribuidor']),
      scope
    );
    component.ngOnInit();
    expect(component.operadorNuevo.contains('identificador')).toBeFalse();
  });

  it('normaliza y guarda un distribuidor válido', async () => {
    const modal = jasmine.createSpyObj<ModalController>('ModalController', ['dismiss']);
    modal.dismiss.and.resolveTo(true);
    const toast = jasmine.createSpyObj<ToastController>('ToastController', ['create']);
    toast.create.and.resolveTo({ present: () => Promise.resolve() } as HTMLIonToastElement);
    const loading = jasmine.createSpyObj<HTMLIonLoadingElement>('loading', ['present', 'dismiss']);
    loading.present.and.resolveTo();
    loading.dismiss.and.resolveTo(true);
    const loadingController = jasmine.createSpyObj<LoadingController>('LoadingController', ['create']);
    loadingController.create.and.resolveTo(loading);
    const service = jasmine.createSpyObj<DistribuidoresService>('DistribuidoresService', ['addDistribuidor', 'getDistribuidores']);
    service.addDistribuidor.and.resolveTo({ id: 'new', identificador: 'VGBZ-0100' });
    const component = new AgregarComponent(new FormBuilder(), modal, toast, loadingController, service, scope);
    component.ngOnInit();
    component.operadorNuevo.setValue({ nombre: '  juan pérez ', ruta: ' r-01 ', zona: 'GPE', plantaId: 'p1' });

    await component.agregar();

    expect(service.addDistribuidor).toHaveBeenCalledWith({
      idempotencyKey: component.idempotencyKey, nombre: 'JUAN PÉREZ', ruta: 'R-01', zona: 'gpe', plantaId: 'p1',
    });
    expect(modal.dismiss).toHaveBeenCalledWith({ changed: true });
    expect(component.saving).toBeFalse();
  });
});
