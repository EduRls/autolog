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
  it('usa IDs y nombres de uno o más distribuidores seleccionados', () => {
    component.agregarOperadorSeleccionado('dist-1');
    expect(component.autoNuevo.value.operadorId).toBe('dist-1');
    expect(component.autoNuevo.value.operador).toBe('ANA');
    expect(component.autoNuevo.value.operadorIds).toEqual(['dist-1']);
    expect(component.autoNuevo.value.operadores).toEqual(['ANA']);
    expect(component.operadorPorAgregar).toBe('');
    expect(component.operadoresSeleccionados.map(item => item.id)).toEqual(['dist-1']);
  });
  it('requiere seleccionar al menos un distribuidor', () => {
    component.autoNuevo.controls['operadorIds'].setValue([]);
    expect(component.autoNuevo.controls['operadorIds'].invalid).toBeTrue();
  });
  it('calcula el próximo servicio con el kilometraje actual más 10,000', () => {
    component.autoNuevo.controls['km_actual'].setValue(42500);
    component.establecerProximoServicio();
    expect(component.autoNuevo.controls['km_proximo_servicio'].value).toBe(52500);
  });
});
