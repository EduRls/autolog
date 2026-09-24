import { Functions } from '@angular/fire/functions';
import { of } from 'rxjs';
import { Firestore } from '@angular/fire/firestore';
import { DistribuidoresService } from './distribuidores.service';

describe('DistribuidoresService', () => {
  it('puede construirse con la instancia compartida de Firestore', () => {
    const service = new DistribuidoresService({} as Firestore, {} as Functions, {} as never);
    expect(service).toBeTruthy();
  });
  it('devuelve únicamente distribuidores activos para operadores', async () => {
    const service = new DistribuidoresService({} as Firestore, {} as Functions, {} as never);
    const base = { nombre: 'Uno', identificador: 'VGBZ-01', ruta: '1', zona: 'gpe' };
    spyOn(service, 'getDistribuidores').and.returnValue(of([
      { ...base, id: 'active' }, { ...base, id: 'disabled', activo: false }, { ...base, id: 'legacy', estado: 'BAJA' },
    ]));
    expect((await service.getActivos()).map(item => item.id)).toEqual(['active']);
  });
});
