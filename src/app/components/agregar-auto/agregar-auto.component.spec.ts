import { FormBuilder } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';
import { AgregarAutoComponent } from './agregar-auto.component';

describe('AgregarAutoComponent: operador distribuidor', () => {
  let component: AgregarAutoComponent;
  beforeEach(async () => {
    const distributors = jasmine.createSpyObj<DistribuidoresService>('distributors', ['getActivos']);
    distributors.getActivos.and.resolveTo([{id: 'dist-1', nombre: 'ANA', identificador: 'VGBZ-0001', ruta: '1', zona: 'gpe', plantaIdPrincipal: 'p1'}]);
    const scope = {
      initialize: () => Promise.resolve(), snapshot: () => ({plants: []}),
      isGlobal: () => false, getActivePlantId: () => 'p1', getPrincipalPlantId: () => 'p1',
    } as never;
    component = new AgregarAutoComponent({} as ModalController, {} as LoadingController, {} as FirebaseService, {} as ToastController, new FormBuilder(), distributors, scope);

    component.ngOnInit();
    await (component as unknown as {initializeScope(): Promise<void>}).initializeScope();
  });
  it('usa el ID documental y el nombre del distribuidor seleccionado', () => {
    component.autoNuevo.controls['operadorId'].setValue('dist-1');
    component.seleccionarOperador('dist-1');
    expect(component.autoNuevo.value.operadorId).toBe('dist-1');
    expect(component.autoNuevo.value.operador).toBe('ANA');
  });
  it('requiere seleccionar una identidad de operador', () => {
    component.autoNuevo.controls['operadorId'].setValue(null);
    expect(component.autoNuevo.controls['operadorId'].invalid).toBeTrue();
  });
});
