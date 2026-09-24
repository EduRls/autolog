import { Firestore, QueryDocumentSnapshot } from '@angular/fire/firestore';
import { Functions } from '@angular/fire/functions';
import { UserAdminService } from './user-admin.service';
import { UsuarioAutologDocument, normalizeUsuarioAutolog, isAdministrativeAccount } from '../../models/usuario-autolog.model';

describe('Administrative users: legacy policy', () => {
  const base: UsuarioAutologDocument = {email: 'test@example.test', usuario: 'Legacy', rol: 'admin'};
  for (const rol of ['admin', 'capturista'] as const) it(`accepts minimal legacy ${rol}`, () => {
    const user = normalizeUsuarioAutolog('legacy', {...base, rol});
    expect(isAdministrativeAccount(user)).toBeTrue();
    expect(user.activo).toBeTrue();
    expect(user.accesoAutolog).toBeTrue();
    expect(user.accesoAsistencia).toBeFalse();
    expect(user.tipoPersonal).toBe('SISTEMA');
  });
  for (const extra of [
    {rol: 'empleado' as const},
    {tipoPersonal: 'DISTRIBUIDOR' as const},
    {distribuidorId: 'd1'},
    {accesoAutolog: false},
    {accesoAsistencia: true},
  ]) it(`excludes incompatible account ${JSON.stringify(extra)}`, () => {
    expect(isAdministrativeAccount(normalizeUsuarioAutolog('u', {...base, ...extra}))).toBeFalse();
  });
  it('does not infer AUTOLOG for incomplete worker profiles', () => {
    expect(normalizeUsuarioAutolog('w', {...base, rol: 'empleado'}).accesoAutolog).toBeFalse();
  });
  it('keeps disabled administrative accounts visible for administration', () => {
    expect(isAdministrativeAccount(normalizeUsuarioAutolog('u', {...base, activo: false}))).toBeTrue();
  });
});

describe('UserAdminService paginated directory', () => {
  type Snapshot = QueryDocumentSnapshot<UsuarioAutologDocument>;
  let service: UserAdminService;
  let read: jasmine.Spy;
  beforeEach(() => {
    service = new UserAdminService({} as Functions, {} as Firestore);
    read = spyOn<any>(service, 'readCandidates');
  });
  it('fills pages across excluded batches without missing or duplicating eligible users', async () => {
    const eligible = [0, 24, 51, 70, 74];
    const docs = Array.from({length: 75}, (_, index) => ({id: String(index).padStart(3, '0'), data: () => ({rol: 'admin', usuario: 'Same name', email: 'test@example.test', accesoAutolog: eligible.includes(index)})} as Snapshot));
    read.and.callFake(async (cursor: Snapshot | null, size: number) => docs.slice(cursor ? Number(cursor.id) + 1 : 0, (cursor ? Number(cursor.id) + 1 : 0) + size));
    const a = await service.getPage(null, 2);
    const b = await service.getPage(a.nextCursor, 2);
    const c = await service.getPage(b.nextCursor, 2);
    expect([...a.usuarios, ...b.usuarios, ...c.usuarios].map(u => Number(u.id))).toEqual(eligible);
    expect(a.hasNext).toBeTrue(); expect(b.hasNext).toBeTrue(); expect(c.hasNext).toBeFalse();
    expect(read.calls.allArgs().every(args => args[1] === 25)).toBeTrue();
    const previous = await service.getPage(null, 2);
    expect(previous.usuarios.map(u => u.id)).toEqual(a.usuarios.map(u => u.id));
  });
  it('returns a real empty state when no candidates remain', async () => {
    read.and.resolveTo([]);
    expect(await service.getPage(null)).toEqual({usuarios: [], nextCursor: null, hasNext: false});
  });
  it('logs Firebase details without replacing the original exception', async () => {
    const error = {code: 'permission-denied', message: 'Denied by test rules'};
    read.and.rejectWith(error);
    const log = spyOn(console, 'error');
    await expectAsync(service.getPage(null)).toBeRejectedWith(error);
    expect(log).toHaveBeenCalledWith('[UserAdminService.getPage]', jasmine.objectContaining({code: 'permission-denied', operation: 'listAdministrativeUsers', query: jasmine.objectContaining({orderBy: '__name__ ASC'})}));
  });
});
