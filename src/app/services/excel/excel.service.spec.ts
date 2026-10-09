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

  it('builds styled Resumen and one dated sales sheet with typed values', () => {
    const sale = {
      id: 'a', plantaId: 'u42LityLtz1l6HM2iCN4', folio: 'GL-1', fechaVenta: new Date('2026-08-14T12:00:00Z'), empresa: 'Empresa', vendedor: 'R 39', cliente: 'Cliente',
      formaPago: 'Contado', litros: 10.5, total: 200, origen: 'gaslink', sourceHash: 'a', duplicateIndex: 0,
      primeraSincronizacion: null, ultimaSincronizacion: null, fechaExtraccion: null, claveWeb: null, mapsUrl: null
    } as GaslinkSale;
    const workbook = service.buildSalesWorkbook({ sales: [sale], summary: { count: 1, liters: 10.5, total: 200, average: 200 }, startDate: '2026-08-14', endDate: '2026-08-14', vendedor: 'R 39', folio: 'Todos' });
    expect(workbook.SheetNames).toEqual(['Resumen', '14-08-2026']);
    const sheet = workbook.Sheets['14-08-2026'];
    expect(sheet['B4'].t).toBe('d'); expect(sheet['G4'].t).toBe('n'); expect(sheet['H4'].t).toBe('n');
    expect(sheet['A3'].s.fill.fgColor.rgb).toBe('101828'); expect(sheet['A3'].s.font.color.rgb).toBe('FFFFFF');
    expect(sheet['!autofilter'].ref).toBe('A3:H4'); expect(sheet['G5'].f).toBe('SUM(G4:G4)');
  });

  it('separates sales into chronological sheets using the Mexico City day', () => {
    const sale = (id: string, fechaVenta: string, total: number): GaslinkSale => ({
      id, plantaId: 'u42LityLtz1l6HM2iCN4', folio: `GL-${id}`, fechaVenta: new Date(fechaVenta), empresa: 'Empresa', vendedor: 'R 39', cliente: 'Cliente',
      formaPago: 'Contado', litros: 10, total, origen: 'gaslink', sourceHash: id, duplicateIndex: 0,
      primeraSincronizacion: null, ultimaSincronizacion: null, fechaExtraccion: null, claveWeb: null, mapsUrl: null
    });
    const workbook = service.buildSalesWorkbook({
      sales: [sale('2', '2026-08-15T06:30:00Z', 300), sale('1', '2026-08-14T18:00:00Z', 200)],
      summary: { count: 2, liters: 20, total: 500, average: 250 },
      startDate: '2026-08-14', endDate: '2026-08-15', vendedor: 'R 39', folio: 'Todos'
    });
    expect(workbook.SheetNames).toEqual(['Resumen', '14-08-2026', '15-08-2026']);
    expect(workbook.Sheets['14-08-2026']['A4'].v).toBe('GL-1');
    expect(workbook.Sheets['15-08-2026']['A4'].v).toBe('GL-2');
    expect(workbook.Sheets['14-08-2026']['F5'].v).toBe(200);
    expect(workbook.Sheets['15-08-2026']['F5'].v).toBe(300);
  });
});
