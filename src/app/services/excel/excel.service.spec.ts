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
    expect(sheet['C4'].t).toBe('d'); expect(sheet['H4'].t).toBe('n'); expect(sheet['I4'].t).toBe('n');
    expect(sheet['A3'].s.fill.fgColor.rgb).toBe('101828'); expect(sheet['A3'].s.font.color.rgb).toBe('FFFFFF');
    expect(sheet['!autofilter'].ref).toBe('A3:J4'); expect(sheet['H5'].f).toBe('SUM(H4:H4)'); expect(sheet['I5'].f).toBe('SUM(I4:I4)');
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
    expect(workbook.Sheets['14-08-2026']['G5'].v).toBe(200);
    expect(workbook.Sheets['15-08-2026']['G5'].v).toBe(300);
  });
  describe('clave web and map columns', () => {
    const sale = (id: string, overrides: Partial<GaslinkSale>): GaslinkSale => ({
      id, plantaId: 'u42LityLtz1l6HM2iCN4', folio: `GL-${id}`, fechaVenta: new Date('2026-08-14T18:00:00Z'), empresa: 'Empresa', vendedor: 'R 39', cliente: 'Cliente',
      formaPago: 'Efectivo', litros: 10, total: 100, origen: 'gaslink', sourceHash: id, duplicateIndex: 1,
      primeraSincronizacion: null, ultimaSincronizacion: null, fechaExtraccion: null, claveWeb: null, mapsUrl: null, ...overrides
    });
    const build = (sales: GaslinkSale[]) => service.buildSalesWorkbook({
      sales, summary: { count: sales.length, liters: 10 * sales.length, total: 100 * sales.length, average: 100 },
      startDate: '2026-08-14', endDate: '2026-08-14', vendedor: 'Todos', folio: 'Todos'
    }).Sheets['14-08-2026'];

    it('lists the headers with Clave web next to Folio and Mapa last', () => {
      const sheet = build([sale('1', {})]);
      const headers = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(column => sheet[`${column}3`].v);
      expect(headers).toEqual(['Folio', 'Clave web', 'Fecha', 'Empresa', 'Vendedor', 'Cliente', 'Forma de pago', 'Litros', 'Total (MXN)', 'Mapa']);
    });

    it('writes the clave web when present and Pendiente when missing', () => {
      const sheet = build([sale('1', { claveWeb: 'a1b2c3d4e5f6' }), sale('2', { claveWeb: null })]);
      expect(sheet['A4'].v).toBe('GL-1');
      expect(sheet['B4'].v).toBe('a1b2c3d4e5f6');
      expect(sheet['B5'].v).toBe('Pendiente');
    });

    it('links the map when there is a location and says Sin ubicación otherwise', () => {
      const url = 'https://www.google.com/maps?q=22.7709,-102.5832';
      const sheet = build([sale('1', { mapsUrl: url }), sale('2', { mapsUrl: null })]);
      expect(sheet['J4'].v).toBe('Mapa');
      expect(sheet['J4'].l.Target).toBe(url);
      expect(sheet['J5'].v).toBe('Sin ubicación');
      expect(sheet['J5'].l).toBeUndefined();
    });

    it('keeps the totals formulas aligned with the new Litros and Total columns', () => {
      const sheet = build([sale('1', {}), sale('2', {})]);
      expect(sheet['H6'].f).toBe('SUM(H4:H5)');
      expect(sheet['I6'].f).toBe('SUM(I4:I5)');
      expect(sheet['G6'].v).toBe(100);
    });
  });
});
