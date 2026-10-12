import { resolveActivePlantId } from './plant-scope.service';

describe('resolveActivePlantId', () => {
  const plants = [{ id: 'guadalupe' }, { id: 'zacatecas' }];
  const global = { accesoTodasPlantas: true, plantaIdPrincipal: null, plantasLectura: [] as string[] };
  const limited = { accesoTodasPlantas: false, plantaIdPrincipal: 'guadalupe', plantasLectura: ['zacatecas'] };

  it('keeps the saved plant only when it is still visible', () => {
    expect(resolveActivePlantId(global, plants, 'zacatecas')).toEqual({ activePlantId: 'zacatecas', savedIsValid: true });
    expect(resolveActivePlantId(global, plants, 'planta-borrada')).toEqual({ activePlantId: null, savedIsValid: false });
  });

  it('falls back to all plants (null) for a global operator without a saved plant', () => {
    expect(resolveActivePlantId(global, plants, null)).toEqual({ activePlantId: null, savedIsValid: false });
  });

  it('limits a scoped user to the assigned plants and falls back to the principal one', () => {
    expect(resolveActivePlantId(limited, plants, 'zacatecas').activePlantId).toBe('zacatecas');
    expect(resolveActivePlantId(limited, [...plants, { id: 'fresnillo' }], 'fresnillo').activePlantId).toBe('guadalupe');
    expect(resolveActivePlantId(limited, plants, null).activePlantId).toBe('guadalupe');
  });
});
