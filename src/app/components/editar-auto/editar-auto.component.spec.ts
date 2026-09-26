import { FormBuilder } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';
import { EditarAutoComponent } from './editar-auto.component';

describe('EditarAutoComponent: operador distribuidor', () => {
  let component: EditarAutoComponent;
  beforeEach(async () => {
    const distributors = jasmine.createSpyObj<DistribuidoresService>('distributors', ['getActivos']);
    distributors.getActivos.and.resolveTo([{id: 'dist-1', nombre: 'ANA', identificador: 'VGBZ-0001', ruta: '1', zona: 'gpe'}]);
    component = new EditarAutoComponent({} as ModalController, {} as LoadingController, {} as FirebaseService, {} as ToastController, new FormBuilder(), distributors);
    component.auto = {id: 'unidad-1', operador: 'Anterior', operadorId: 'dist-anterior'};
    component.ngOnInit();
    await Promise.resolve();
  });
  it('usa IDs y nombres de uno o más distribuidores seleccionados', () => {
    component.toggleOperador('dist-anterior', false);
    component.toggleOperador('dist-1', true);
    expect(component.editarAuto.value.operadorId).toBe('dist-1');
    expect(component.editarAuto.value.operador).toBe('ANA');
    expect(component.editarAuto.value.operadorIds).toEqual(['dist-1']);
    expect(component.editarAuto.value.operadores).toEqual(['ANA']);
  });
  it('requiere seleccionar al menos un distribuidor', () => {
    component.editarAuto.controls['operadorIds'].setValue([]);
    expect(component.editarAuto.controls['operadorIds'].invalid).toBeTrue();
  });
  it('calcula el próximo servicio con el kilometraje actual más 10,000', () => {
    component.editarAuto.controls['km_actual'].setValue(87000);
    component.establecerProximoServicio();
    expect(component.editarAuto.controls['km_proximo_servicio'].value).toBe(97000);
  });
});
