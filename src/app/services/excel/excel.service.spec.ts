import { TestBed } from '@angular/core/testing';

import { ExcelService } from './excel.service';
import { GaslinkSale } from '../gaslink-sales/gaslink-sales.models';

describe('ExcelService', () => {
  let service: ExcelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExcelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('builds styled Resumen and Ventas sheets with typed values', () => {
    const sale = {
      id: 'a', folio: 'GL-1', fechaVenta: new Date('2026-08-14T12:00:00Z'), empresa: 'Empresa', vendedor: 'R 39', cliente: 'Cliente',
      formaPago: 'Contado', litros: 10.5, total: 200, origen: 'gaslink', sourceHash: 'a', duplicateIndex: 0,
      primeraSincronizacion: null, ultimaSincronizacion: null, fechaGeneracionArchivo: null
    } as GaslinkSale;
    const workbook = service.buildSalesWorkbook({ sales: [sale], summary: { count: 1, liters: 10.5, total: 200, average: 200 }, startDate: '2026-08-14', endDate: '2026-08-14', vendedor: 'R 39', folio: 'Todos' });
    expect(workbook.SheetNames).toEqual(['Resumen', 'Ventas']);
    const sheet = workbook.Sheets['Ventas'];
    expect(sheet['B4'].t).toBe('d'); expect(sheet['G4'].t).toBe('n'); expect(sheet['H4'].t).toBe('n');
    expect(sheet['A3'].s.fill.fgColor.rgb).toBe('101828'); expect(sheet['A3'].s.font.color.rgb).toBe('FFFFFF');
    expect(sheet['!autofilter'].ref).toBe('A3:H4'); expect(sheet['G5'].f).toBe('SUM(G4:G4)');
  });
});
