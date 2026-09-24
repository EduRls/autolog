import { GaslinkSale } from '../../services/gaslink-sales/gaslink-sales.models';
import { RegistroVentasPage, groupSales, groupSalesByDay, summarizeSales } from './registro-ventas.page';

const sale = (id: string, overrides: Partial<GaslinkSale> = {}): GaslinkSale => ({
  id, folio: 'GL-1', fechaVenta: new Date('2026-08-14T12:00:00Z'), empresa: 'Empresa', vendedor: 'R 39', cliente: 'Cliente',
  formaPago: 'Contado', litros: 10, total: 100, origen: 'gaslink', sourceHash: id, duplicateIndex: 0,
  primeraSincronizacion: null, ultimaSincronizacion: null, fechaGeneracionArchivo: null, ...overrides
});

describe('RegistroVentasPage analytics', () => {
  it('calculates cards from every document without deduplicating folios', () => {
    const summary = summarizeSales([sale('a'), sale('b', { litros: 20, total: 300 })]);
    expect(summary).toEqual({ count: 2, liters: 30, total: 400, average: 200 });
  });

  it('groups days in America/Mexico_City and orders them', () => {
    const grouped = groupSalesByDay([sale('late', { fechaVenta: new Date('2026-08-15T05:30:00Z') }), sale('next', { fechaVenta: new Date('2026-08-15T06:30:00Z') })]);
    expect(grouped.map(item => item.key)).toEqual(['2026-08-14', '2026-08-15']);
  });

  it('groups sellers and returns the top ten by amount', () => {
    const values = Array.from({ length: 12 }, (_, index) => sale(String(index), { vendedor: `V${index}`, total: index }));
    const grouped = groupSales(values, 'vendedor');
    expect(grouped.length).toBe(10); expect(grouped[0].label).toBe('V11');
  });

  it('groups payment methods with totals, liters and counts', () => {
    const grouped = groupSales([sale('a'), sale('b', { total: 50, litros: 5 })], 'formaPago');
    expect(grouped[0]).toEqual({ label: 'Contado', total: 150, liters: 15, count: 2 });
  });
});

describe('RegistroVentasPage filters and export', () => {
  let service: jasmine.SpyObj<any>;
  let excel: jasmine.SpyObj<any>;
  let page: RegistroVentasPage;
  const rows = [sale('a'), sale('b', { folio: 'GL-1', vendedor: 'EC BUTANO', litros: 20, total: 300 })];

  beforeEach(() => {
    service = jasmine.createSpyObj('GaslinkSalesService', ['getAnalytics']);
    excel = jasmine.createSpyObj('ExcelService', ['exportSalesReport']);
    service.getAnalytics.and.resolveTo(rows);
    excel.exportSalesReport.and.resolveTo({ message: 'Descargado' });
    page = new RegistroVentasPage(service, excel);
    page.selectPreset('today', false);
  });

  it('loads cards, charts, vendor options and table from synchronized filters', async () => {
    await page.applyFilters();
    expect(page.summary.count).toBe(2); expect(page.summary.total).toBe(400); expect(page.analyticsState).toBe('ready');
    expect(page.vendorOptions).toEqual(['EC BUTANO', 'R 39']);
    expect(page.sales).toEqual(rows); expect(service.getAnalytics).toHaveBeenCalledTimes(1);
    expect(page.dailyChart.series?.length).toBe(2); expect(page.paymentChart.series?.length).toBe(1);
  });

  it('applies an exact vendor while deriving options from all period records', async () => {
    page.draftFilters.vendedor = 'R 39'; await page.applyFilters();
    expect(page.appliedFilters.vendedor).toBe('R 39'); expect(page.analyticsSales.map(item => item.id)).toEqual(['a']);
    expect(page.summary.total).toBe(100); expect(service.getAnalytics.calls.mostRecent().args[0].vendedor).toBeNull();
  });

  it('uses Todos los vendedores as null and resets vendor when clearing', async () => {
    page.draftFilters.vendedor = 'R 39'; await page.applyFilters(); await page.clearFilters();
    expect(page.draftFilters.vendedor).toBe(''); expect(page.appliedFilters.vendedor).toBeNull(); expect(page.page).toBe(1);
  });

  it('keeps unapplied draft controls from changing applied results', async () => {
    await page.applyFilters(); const applied = page.appliedFilters;
    page.draftFilters.vendedor = 'EC BUTANO'; page.draftFilters.folio = 'OTHER';
    expect(page.appliedFilters).toBe(applied); expect(page.summary.count).toBe(2);
  });

  it('validates reversed dates without querying', async () => {
    service.getAnalytics.calls.reset(); page.draftFilters.startDate = '2026-08-15'; page.draftFilters.endDate = '2026-08-14'; await page.applyFilters();
    expect(page.validationMessage).toContain('no puede'); expect(service.getAnalytics).not.toHaveBeenCalled();
  });

  it('paginates the same analytic rows locally', async () => {
    const manyRows = Array.from({ length: 30 }, (_, index) => sale(String(index)));
    service.getAnalytics.and.resolveTo(manyRows); await page.applyFilters();
    expect(page.sales.length).toBe(25); expect(page.hasMore).toBeTrue();
    page.nextPage(); expect(page.page).toBe(2); expect(page.sales.length).toBe(5);
    page.previousPage(); expect(page.page).toBe(1); expect(page.sales[0].id).toBe('0');
  });

  it('shows empty chart state and a clear no-export message', async () => {
    service.getAnalytics.and.resolveTo([]); await page.applyFilters();
    expect(page.analyticsState).toBe('empty'); expect(page.canExport).toBeFalse(); await page.exportSales(); expect(page.exportMessage).toContain('No hay ventas');
  });

  it('exports the cached complete analytic set with the applied filters', async () => {
    page.draftFilters.vendedor = 'R 39'; await page.applyFilters(); await page.exportSales();
    const report = excel.exportSalesReport.calls.mostRecent().args[0];
    expect(report.sales.length).toBe(1); expect(report.vendedor).toBe('R 39'); expect(service.getAnalytics).toHaveBeenCalledTimes(1);
  });

  it('disables export during generation and recovers after failure', async () => {
    await page.applyFilters(); excel.exportSalesReport.and.callFake(async () => { expect(page.exporting).toBeTrue(); expect(page.canExport).toBeFalse(); throw new Error('failure'); });
    await page.exportSales(); expect(page.exporting).toBeFalse(); expect(page.canExport).toBeTrue(); expect(page.exportMessage).toContain('No fue posible');
  });
});
