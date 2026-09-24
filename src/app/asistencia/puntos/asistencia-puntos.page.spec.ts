import { AlertController } from '@ionic/angular';
import { of } from 'rxjs';
import { AttendancePoint } from '../../models/attendance-point.model';
import { AttendancePointsService } from '../../services/attendance/attendance-points.service';
import { SidebarLayoutService } from '../../services/layout/sidebar-layout.service';
import { AsistenciaPuntosPage } from './asistencia-puntos.page';

describe('AsistenciaPuntosPage', () => {
  const point: AttendancePoint = {
    id: 'p1', nombre: 'Sucursal Centro', latitude: 22.76, longitude: -102.53,
    radioMetros: 150, activo: true, asignados: 1,
  };
  let service: jasmine.SpyObj<AttendancePointsService>;
  let page: AsistenciaPuntosPage;

  beforeEach(() => {
    service = jasmine.createSpyObj<AttendancePointsService>('AttendancePointsService', [
      'listPoints', 'listActiveDistributors', 'getAssignments', 'createPoint', 'updatePoint',
    ]);
    service.listPoints.and.resolveTo([point]);
    service.listActiveDistributors.and.resolveTo([
      { id: 'd1', nombre: 'Ángel Pérez', identificador: 'VGBZ-0001' },
      { id: 'd2', nombre: 'Laura', identificador: 'VGBZ-0002' },
    ]);
    service.getAssignments.and.resolveTo(['d1']);
    service.createPoint.and.resolveTo({ id: 'new' });
    service.updatePoint.and.resolveTo({ id: 'p1' });
    const alerts = jasmine.createSpyObj<AlertController>('AlertController', ['create']);
    page = new AsistenciaPuntosPage(service, alerts, { state$: of({ collapsed: false, mobileOpen: false, viewportWidth: 1366 }) } as SidebarLayoutService);
  });

  it('carga puntos y únicamente los distribuidores activos provistos por el servicio', async () => {
    await page.load();
    expect(page.state).toBe('data');
    expect(page.puntos).toEqual([point]);
    expect(page.distribuidores.length).toBe(2);
  });

  it('selecciona coordenadas y actualiza el radio inmediatamente', () => {
    const circle = jasmine.createSpyObj('Circle', ['setRadius']);
    Object.defineProperty(page, 'radiusCircle', { configurable: true, value: circle });
    page.newPoint();
    page.selectLocation(22.7680564, -102.5330564);
    page.updateRadius(300);
    expect(page.form.latitude).toBe(22.768056);
    expect(page.form.longitude).toBe(-102.533056);
    expect(page.form.radioMetros).toBe(300);
    expect(circle.setRadius).toHaveBeenCalledWith(300);
    expect(page.locationSelected).toBeTrue();
  });

  it('filtra distribuidores por nombre o VGBZ ignorando acentos', async () => {
    await page.load();
    page.distributorSearch = 'angel';
    expect(page.filteredDistributors.map(item => item.id)).toEqual(['d1']);
    page.distributorSearch = '0002';
    expect(page.filteredDistributors.map(item => item.id)).toEqual(['d2']);
  });

  it('crea un punto con asignaciones múltiples y sin objetos Leaflet', async () => {
    page.newPoint();
    page.form = { nombre: 'Planta', descripcion: '', latitude: 22, longitude: -102, radioMetros: 150, activo: true, distribuidorIds: [] };
    page.toggleDistributor('d1', true);
    page.toggleDistributor('d2', true);
    await page.save();
    expect(service.createPoint).toHaveBeenCalledWith(jasmine.objectContaining({ distribuidorIds: ['d1', 'd2'] }));
  });

  it('edita un punto conservando sus asignaciones y estado', async () => {
    await page.editPoint(point);
    expect(page.selectedIds.has('d1')).toBeTrue();
    page.form.nombre = 'Sucursal actualizada';
    await page.save();
    expect(service.updatePoint).toHaveBeenCalledWith('p1', jasmine.objectContaining({ nombre: 'Sucursal actualizada', distribuidorIds: ['d1'] }));
  });

  it('rechaza guardado sin ubicación o con radio fuera del límite', () => {
    page.newPoint();
    page.form.nombre = 'Sin ubicación';
    expect(page.validForm).toBeFalse();
    page.selectLocation(22, -102);
    page.updateRadius(5001);
    expect(page.validForm).toBeFalse();
  });

  it('Reintentar vuelve a consultar después de un error', async () => {
    service.listPoints.and.rejectWith(new Error('controlled'));
    await page.load();
    expect(page.state).toBe('error');
    service.listPoints.and.resolveTo([point]);
    await page.load();
    expect(page.state).toBe('data');
    expect(service.listPoints).toHaveBeenCalledTimes(2);
  });

  it('desactivar conserva el punto y sus asignaciones', async () => {
    const internal = page as unknown as { changeActive(item: AttendancePoint): Promise<void> };
    await internal.changeActive(point);
    expect(service.updatePoint).toHaveBeenCalledWith('p1', jasmine.objectContaining({
      activo: false,
      distribuidorIds: ['d1'],
    }));
    expect(service.getAssignments).toHaveBeenCalledWith('p1');
  });
});
