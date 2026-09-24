import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AsistenciaConfiguracionPage } from './configuracion/asistencia-configuracion.page';
import { AsistenciaPanelPage } from './panel/asistencia-panel.page';
import { AsistenciaRegistrosPage } from './registros/asistencia-registros.page';
import { AttendanceAdminService } from '../services/attendance/attendance-admin.service';

@Component({ selector: 'app-menu', standalone: true, template: '' })
class MenuStubComponent {}

describe('Páginas administrativas de Asistencia', () => {
  let attendance: jasmine.SpyObj<AttendanceAdminService>;

  async function createPage<T>(component: new (...args: never[]) => T): Promise<ComponentFixture<T>> {
    attendance = jasmine.createSpyObj<AttendanceAdminService>('AttendanceAdminService', ['getDashboard', 'listRecords']);
    attendance.getDashboard.and.resolveTo({
      date: '2026-09-08',
      metrics: { present: 0, checkIns: 0, checkOuts: 0, movements: 0 },
      recentActivity: [],
    });
    attendance.listRecords.and.resolveTo({ records: [], nextCursor: null, hasMore: false });
    await TestBed.configureTestingModule({
      declarations: [component],
      imports: [CommonModule, FormsModule, IonicModule.forRoot(), MenuStubComponent],
      providers: [
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigateByUrl']) },
        { provide: AttendanceAdminService, useValue: attendance },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra métricas en cero y empty state sin consultar Firestore', async () => {
    const fixture = await createPage(AsistenciaPanelPage);
    expect(fixture.componentInstance.metrics.every(metric => metric.value === 0)).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('No hay movimientos hoy.');
    expect(attendance.getDashboard).toHaveBeenCalled();
    fixture.destroy();
  });

  it('prepara filtros, columnas y empty state para los registros', async () => {
    const fixture = await createPage(AsistenciaRegistrosPage);
    expect(fixture.nativeElement.querySelector('#attendance-search').placeholder).toBe('Buscar por nombre o VGBZ');
    expect(fixture.nativeElement.textContent).toContain('No hay registros de asistencia disponibles.');
    expect(fixture.componentInstance.rows).toEqual([]);
    expect(attendance.listRecords).toHaveBeenCalled();
    fixture.componentInstance.state = 'data';
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    ['Distribuidor', 'Fecha', 'Entrada', 'Salida', 'Horas', 'Ubicación', 'Estado'].forEach(column => expect(text).toContain(column));
    fixture.destroy();
  });

  it('deja preparados los estados loading, error, empty y data', async () => {
    const fixture = await createPage(AsistenciaRegistrosPage);
    const page = fixture.componentInstance;
    for (const state of ['loading', 'error', 'empty', 'data'] as const) {
      page.state = state;
      fixture.detectChanges();
      expect(page.state).toBe(state);
    }
    fixture.destroy();
  });

  it('conecta las métricas y actividad reciente del dashboard', async () => {
    const fixture = await createPage(AsistenciaPanelPage);
    attendance.getDashboard.and.resolveTo({
      date: '2026-09-08',
      metrics: { present: 2, checkIns: 4, checkOuts: 2, movements: 6 },
      recentActivity: [{
        id: 'event-1', distributorId: 'd1', distributorName: 'Ana Pérez',
        identifier: 'VGBZ-0012', eventType: 'CHECK_IN',
        eventTime: '2026-09-08T14:03:00.000Z', pointName: 'Planta Centro',
      }],
    });
    await fixture.componentInstance.load();
    fixture.detectChanges();
    expect(fixture.componentInstance.metrics.map(metric => metric.value)).toEqual([2, 4, 2, 6]);
    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
    expect(fixture.nativeElement.textContent).toContain('Planta Centro');
    fixture.destroy();
  });

  it('consulta registros con filtros y cursor paginado', async () => {
    const fixture = await createPage(AsistenciaRegistrosPage);
    attendance.listRecords.and.resolveTo({
      records: [{
        id: 'day-1',
        distributor: { id: 'd1', name: 'Ana Pérez', identifier: 'VGBZ-0012' },
        date: '2026-09-08',
        checkInTime: '2026-09-08T14:03:00.000Z',
        checkOutTime: null,
        workedMinutes: 0,
        pointName: 'Planta Centro',
        status: 'OPEN',
      }],
      nextCursor: 'opaque-cursor',
      hasMore: true,
    });
    fixture.componentInstance.search = 'Ana';
    await fixture.componentInstance.applyFilters();
    fixture.detectChanges();
    expect(attendance.listRecords).toHaveBeenCalledWith(jasmine.objectContaining({
      cursor: null,
      search: 'Ana',
    }));
    expect(fixture.nativeElement.textContent).toContain('VGBZ-0012');
    await fixture.componentInstance.nextPage();
    expect(attendance.listRecords).toHaveBeenCalledWith(jasmine.objectContaining({
      cursor: 'opaque-cursor',
    }));
    fixture.destroy();
  });

  it('presenta reintento si falla la consulta administrativa', async () => {
    const fixture = await createPage(AsistenciaPanelPage);
    attendance.getDashboard.and.rejectWith(new Error('network'));
    await fixture.componentInstance.load();
    fixture.detectChanges();
    expect(fixture.componentInstance.state).toBe('error');
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
    fixture.destroy();
  });

  it('presenta Puntos autorizados como prioridad y habilita su configuración', async () => {
    const fixture = await createPage(AsistenciaConfiguracionPage);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Puntos autorizados');
    expect(text).toContain('Configurar puntos');
    expect(text).toContain('Próximamente');
    expect(fixture.nativeElement.querySelector('ion-button[disabled]')).toBeNull();
    fixture.destroy();
  });

  for (const completed of [false, true]) {
    it(`5.1 muestra KPIs y actividad con jornada ${completed ? 'completada' : 'abierta'}`, async () => {
      const fixture = await createPage(AsistenciaPanelPage);
      const entry = { id: 'in', distributorId: 'd', distributorName: 'Persona Prueba', identifier: 'VGBZ-TEST', eventType: 'CHECK_IN' as const, eventTime: '2026-09-08T20:42:46.033Z', pointName: 'Punto Prueba' };
      attendance.getDashboard.and.resolveTo({ date: '2026-09-08', metrics: { present: completed ? 0 : 1, checkIns: 1, checkOuts: completed ? 1 : 0, movements: completed ? 2 : 1 }, recentActivity: completed ? [entry, { ...entry, id: 'out', eventType: 'CHECK_OUT', eventTime: '2026-09-08T20:44:38.351Z' }] : [entry] });
      await fixture.componentInstance.load();
      fixture.detectChanges();
      expect(fixture.componentInstance.metrics.map(m => m.value)).toEqual(completed ? [0, 1, 1, 2] : [1, 1, 0, 1]);
      const text = fixture.nativeElement.textContent;
      for (const value of ['Persona Prueba', 'VGBZ-TEST', 'Punto Prueba', 'Entrada', '14:42', 'Movimientos']) expect(text).toContain(value);
      if (completed) { expect(text).toContain('Salida'); expect(text).toContain('14:44'); }
      expect(text).not.toContain('Pendientes');
      expect(text).not.toContain('No hay movimientos hoy.');
      fixture.destroy();
    });
  }

  it('5.1 carga registros existentes sin fecha ni filtros obligatorios', async () => {
    const fixture = await createPage(AsistenciaRegistrosPage);
    attendance.listRecords.and.resolveTo({ records: [{ id: 'day', distributor: { id: 'd', name: 'Persona Prueba', identifier: 'VGBZ-TEST' }, date: '2026-09-08', checkInTime: '2026-09-08T20:42:46.033Z', checkOutTime: '2026-09-08T20:44:38.351Z', workedMinutes: 1, pointName: 'Punto Prueba', status: 'COMPLETED' }], hasMore: false, nextCursor: null });
    await fixture.componentInstance.retry();
    fixture.detectChanges();
    expect(attendance.listRecords).toHaveBeenCalledWith({ pageSize: 20, cursor: null, search: '', dateFrom: '', dateTo: '', status: '' });
    expect(fixture.componentInstance.state).toBe('data');
    const text = fixture.nativeElement.textContent;
    for (const value of ['Persona Prueba', 'VGBZ-TEST', '14:42', '14:44', '0 h 01 min', 'Completo']) expect(text).toContain(value);
    expect(text).not.toContain('No hay registros de asistencia disponibles.');
    fixture.destroy();
  });

  it('5.1 envía fecha laboral y distribuidor sin conversión UTC', async () => {
    const fixture = await createPage(AsistenciaRegistrosPage);
    const page = fixture.componentInstance;
    page.dateFrom = '2026-09-08'; page.dateTo = '2026-09-08'; page.search = ' VGBZ-TEST '; page.status = 'COMPLETED';
    await page.applyFilters();
    expect(attendance.listRecords).toHaveBeenCalledWith(jasmine.objectContaining({ dateFrom: '2026-09-08', dateTo: '2026-09-08', search: 'VGBZ-TEST', status: 'COMPLETED', cursor: null }));
    fixture.destroy();
  });

  for (const code of ['permission-denied', 'failed-precondition', 'unavailable']) {
    it(`5.1 ${code} es ERROR y el botón Reintentar vuelve a consultar`, async () => {
      const fixture = await createPage(AsistenciaRegistrosPage);
      spyOn(console, 'error');
      attendance.listRecords.and.rejectWith({ code: `functions/${code}` });
      await fixture.componentInstance.retry();
      fixture.detectChanges();
      expect(fixture.componentInstance.state).toBe('error');
      expect(fixture.nativeElement.textContent).toContain('No fue posible cargar los registros.');
      expect(fixture.nativeElement.textContent).not.toContain('No hay registros de asistencia disponibles.');
      expect(console.error).toHaveBeenCalled();
      const before = attendance.listRecords.calls.count();
      attendance.listRecords.and.resolveTo({ records: [], nextCursor: null, hasMore: false });
      const retry = Array.from(fixture.nativeElement.querySelectorAll('ion-button')).find((el: Element) => el.textContent?.includes('Reintentar')) as HTMLElement;
      retry.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(attendance.listRecords.calls.count()).toBe(before + 1);
      expect(fixture.componentInstance.state).toBe('empty');
      fixture.destroy();
    });
  }

  it('5.1 oculta KPIs mientras carga, sin representar loading como cero', async () => {
    const fixture = await createPage(AsistenciaPanelPage);
    let resolve!: (value: Awaited<ReturnType<AttendanceAdminService['getDashboard']>>) => void;
    attendance.getDashboard.and.returnValue(new Promise(r => { resolve = r; }));
    const request = fixture.componentInstance.load();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.attendance-grid')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Cargando actividad');
    resolve({ date: '2026-09-08', metrics: { present: 0, checkIns: 0, checkOuts: 0, movements: 0 }, recentActivity: [] });
    await request;
    fixture.destroy();
  });
});
