import { isAdministrativeAccount, normalizeUsuarioAutolog } from './usuario-autolog.model';

describe('UsuarioAutolog multiplanta compatibility', () => {
  it('keeps legacy admin and capturista profiles global', () => {
    for (const rol of ['admin', 'capturista'] as const) {
      const user = normalizeUsuarioAutolog(rol, { email: `${rol}@test.mx`, usuario: rol, rol });
      expect(user.accesoTodasPlantas).toBeTrue();
      expect(user.accesoAutolog).toBeTrue();
      expect(user.plantaIdPrincipal).toBeNull();
      expect(user.seccionesMenu).toContain('general');
    }
  });

  it('normalizes the principal and unique read-only plants for a plant user', () => {
    const user = normalizeUsuarioAutolog('plant-user', {
      email: 'plant@test.mx', usuario: 'Plant', rol: 'planta',
      tipoPersonal: 'SISTEMA', accesoAutolog: true, accesoAsistencia: false,
      plantaIdPrincipal: ' principal ', plantasLectura: ['read', ' read ', ''],
      accesoTodasPlantas: false,
    });
    expect(user.plantaIdPrincipal).toBe('principal');
    expect(user.plantasLectura).toEqual(['read']);
    expect(user.accesoTodasPlantas).toBeFalse();
    expect(user.seccionesMenu).toEqual(['general', 'fleet']);
    expect(isAdministrativeAccount(user)).toBeTrue();
  });

  it('allows a plant user to receive any non-administrative menu section', () => {
    const user = normalizeUsuarioAutolog('plant-user', {
      email: 'plant@test.mx', usuario: 'Plant', rol: 'planta',
      tipoPersonal: 'SISTEMA', accesoAutolog: true, accesoAsistencia: false,
      plantaIdPrincipal: 'principal', plantasLectura: [], accesoTodasPlantas: false,
      seccionesMenu: ['general', 'sales', 'fleet', 'station', 'attendance', 'administration'],
    });
    expect(user.seccionesMenu).toEqual(['general', 'sales', 'fleet', 'station', 'attendance']);
  });

  it('does not infer AUTOLOG access for an employee', () => {
    const user = normalizeUsuarioAutolog('employee', {
      email: 'employee@test.mx', usuario: 'Employee', rol: 'empleado',
      tipoPersonal: 'DISTRIBUIDOR', distribuidorId: 'd1',
    });
    expect(user.accesoAutolog).toBeFalse();
    expect(user.accesoTodasPlantas).toBeFalse();
    expect(user.seccionesMenu).toEqual([]);
    expect(isAdministrativeAccount(user)).toBeFalse();
  });
});
