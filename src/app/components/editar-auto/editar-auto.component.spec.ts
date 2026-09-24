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
    component.auto = {id: 'unidad-1', operador: 'Anterior'};
    component.ngOnInit();
    await Promise.resolve();
  });
  it('usa el ID documental y el nombre del distribuidor seleccionado', () => {
    component.editarAuto.controls['operadorId'].setValue('dist-1');
    component.seleccionarOperador('dist-1');
    expect(component.editarAuto.value.operadorId).toBe('dist-1');
    expect(component.editarAuto.value.operador).toBe('ANA');
  });
  it('requiere seleccionar una identidad de operador', () => {
    component.editarAuto.controls['operadorId'].setValue(null);
    expect(component.editarAuto.controls['operadorId'].invalid).toBeTrue();
  });
});
