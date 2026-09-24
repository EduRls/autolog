import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { DistribuidoresService } from '../../../services/admVentas/distribuidores/distribuidores.service';
import { DistribuidorExpedientePage } from './distribuidor-expediente.page';

describe('DistribuidorExpedientePage', () => {
  it('carga el distribuidor de la ruta para administrar su expediente', async () => {
    const route = {
      snapshot: { paramMap: convertToParamMap({ id: 'distributor-1' }) },
    } as ActivatedRoute;
    const service = jasmine.createSpyObj<DistribuidoresService>('DistribuidoresService', ['getDistribuidorById']);
    service.getDistribuidorById.and.returnValue(of({
      id: 'distributor-1', nombre: 'Distribuidor Uno', identificador: 'D-1', ruta: '1', zona: 'zac',
    }));
    const component = new DistribuidorExpedientePage(
      route,
      jasmine.createSpyObj<Router>('Router', ['navigate']),
      service
    );

    await component.loadDistribuidor();

    expect(component.state).toBe('ready');
    expect(component.distribuidor?.id).toBe('distributor-1');
  });
});
