import { Component, OnInit, isDevMode } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexGrid, ApexLegend, ApexPlotOptions, ApexStroke, ApexTooltip, ApexXAxis, ApexYAxis } from 'ng-apexcharts';
import { ExcelService, SalesExcelReport } from '../../services/excel/excel.service';
import { GaslinkSale, GaslinkSalesFilters, GaslinkSalesSummary } from '../../services/gaslink-sales/gaslink-sales.models';
import { GaslinkSalesService } from '../../services/gaslink-sales/gaslink-sales.service';
import { PeriodPreset, SALES_TIME_ZONE, customRange, formatLiters, formatMxn, formatSaleDate, presetRange } from './registro-ventas.utils';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';
type DraftFilters = { startDate: string; endDate: string; folio: string; vendedor: string };
type AxisChartOptions = { series: ApexAxisChartSeries; chart: ApexChart; xaxis: ApexXAxis; yaxis: ApexYAxis | ApexYAxis[]; stroke: ApexStroke; dataLabels: ApexDataLabels; tooltip: ApexTooltip; grid: ApexGrid; plotOptions: ApexPlotOptions; colors: string[]; legend: ApexLegend };
type DonutChartOptions = { series: number[]; chart: ApexChart; labels: string[]; colors: string[]; legend: ApexLegend; dataLabels: ApexDataLabels; tooltip: ApexTooltip; plotOptions: ApexPlotOptions; stroke: ApexStroke };
export interface DailySalesPoint { key: string; label: string; total: number; liters: number; count: number }
export interface GroupedSalesPoint { label: string; total: number; liters: number; count: number }

const finite = (value: number | null): number => typeof value === 'number' && Number.isFinite(value) ? value : 0;
const mexicoDayKey = (date: Date): string => new Intl.DateTimeFormat('en-CA', { timeZone: SALES_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

export function summarizeSales(sales: GaslinkSale[]): GaslinkSalesSummary {
  const total = sales.reduce((sum, sale) => sum + finite(sale.total), 0);
  const liters = sales.reduce((sum, sale) => sum + finite(sale.litros), 0);
  return { count: sales.length, liters, total, average: sales.length ? total / sales.length : 0 };
}

export function groupSalesByDay(sales: GaslinkSale[]): DailySalesPoint[] {
  const groups = new Map<string, DailySalesPoint>();
  sales.forEach(sale => {
    if (!sale.fechaVenta) return;
    const key = mexicoDayKey(sale.fechaVenta);
    const current = groups.get(key) ?? { key, label: key.split('-').reverse().join('/'), total: 0, liters: 0, count: 0 };
    current.total += finite(sale.total); current.liters += finite(sale.litros); current.count++;
    groups.set(key, current);
  });
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function groupSales(sales: GaslinkSale[], field: 'vendedor' | 'formaPago'): GroupedSalesPoint[] {
  const groups = new Map<string, GroupedSalesPoint>();
  sales.forEach(sale => {
    const label = sale[field]?.trim();
    if (!label) return;
    const current = groups.get(label) ?? { label, total: 0, liters: 0, count: 0 };
    current.total += finite(sale.total); current.liters += finite(sale.litros); current.count++;
    groups.set(label, current);
  });
  const ordered = [...groups.values()].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, 'es-MX'));
  return field === 'vendedor' ? ordered.slice(0, 10) : ordered;
}

@Component({ selector: 'app-registro-ventas', templateUrl: './registro-ventas.page.html', styleUrls: ['./registro-ventas.page.scss'] })
export class RegistroVentasPage implements OnInit {
  sales: GaslinkSale[] = [];
  analyticsSales: GaslinkSale[] = [];
  summary: GaslinkSalesSummary = { count: 0, liters: 0, total: 0, average: 0 };
  vendorOptions: string[] = [];
  state: LoadState = 'loading';
  analyticsState: LoadState = 'loading';
  exporting = false;
  exportMessage = '';
  preset: PeriodPreset = 'all';
  draftFilters: DraftFilters = { startDate: '', endDate: '', folio: '', vendedor: '' };
  appliedFilters!: GaslinkSalesFilters;
  validationMessage = '';
  pageSize = 25;
  page = 1;
  hasMore = false;
  dailyChart: Partial<AxisChartOptions> = {};
  vendorChart: Partial<AxisChartOptions> = {};
  paymentChart: Partial<DonutChartOptions> = {};
  vendorGroupCount = 0;
  dailyPointCount = 0;
  vendorPointCount = 0;
  paymentPointCount = 0;
  appliedDateRange = { startDate: '', endDate: '' };
  readonly formatDate = formatSaleDate;
  readonly formatLiters = formatLiters;
  readonly formatMxn = formatMxn;
  readonly integer = new Intl.NumberFormat('es-MX');

  constructor(private readonly salesService: GaslinkSalesService, private readonly excelService: ExcelService) {}
  ngOnInit(): void { this.selectPreset('all', false); void this.applyFilters(); }

  selectPreset(preset: PeriodPreset, apply = true): void {
    this.preset = preset; this.validationMessage = '';
    if (preset !== 'custom') {
      const range = presetRange(preset);
      this.draftFilters.startDate = range.startDate; this.draftFilters.endDate = range.endDate;
      if (apply) void this.applyFilters();
    }
  }

  async applyFilters(): Promise<void> {
    const range = customRange(this.draftFilters.startDate, this.draftFilters.endDate);
    if (!range) {
      this.validationMessage = this.draftFilters.endDate < this.draftFilters.startDate ? 'La fecha final no puede ser anterior a la fecha inicial.' : 'Selecciona una fecha inicial y final válidas.';
      return;
    }
    this.validationMessage = ''; this.exportMessage = '';
    this.appliedFilters = { startDate: range.start, endDate: range.end, folio: this.draftFilters.folio.trim() || null, vendedor: this.draftFilters.vendedor || null };
    this.appliedDateRange = { startDate: this.draftFilters.startDate, endDate: this.draftFilters.endDate };
    this.resetPagination(); await this.loadAnalytics(); this.updateTablePage();
  }

  async clearFilters(): Promise<void> {
    this.preset = 'all'; this.draftFilters.folio = ''; this.draftFilters.vendedor = '';
    this.selectPreset('all', false); await this.applyFilters();
  }
  openDatePicker(event: MouseEvent): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    this.preset = 'custom';
    try { input.showPicker(); } catch { input.focus(); }
  }
  async retry(): Promise<void> { await this.loadAnalytics(); this.updateTablePage(); }

  async exportSales(): Promise<void> {
    this.exportMessage = '';
    if (this.analyticsState === 'loading' || this.exporting) return;
    if (!this.analyticsSales.length) { this.exportMessage = 'No hay ventas para exportar con los filtros seleccionados.'; return; }
    this.exporting = true;
    try {
      const vendorSuffix = this.appliedFilters.vendedor ? `_${this.safeFilePart(this.appliedFilters.vendedor)}` : '';
      const report: SalesExcelReport = { sales: this.analyticsSales, summary: this.summary, startDate: this.appliedDateRange.startDate, endDate: this.appliedDateRange.endDate, vendedor: this.appliedFilters.vendedor ?? 'Todos los vendedores', folio: this.appliedFilters.folio ?? 'Todos' };
      const result = await this.excelService.exportSalesReport(report, `ventas_gaslink_${this.appliedDateRange.startDate}_${this.appliedDateRange.endDate}${vendorSuffix}`);
      this.exportMessage = result.message;
    } catch { this.exportMessage = 'No fue posible exportar las ventas. Intenta nuevamente.'; }
    finally { this.exporting = false; }
  }

  nextPage(): void { if (!this.hasMore) return; this.page++; this.updateTablePage(); }
  previousPage(): void { if (this.page <= 1) return; this.page--; this.updateTablePage(); }
  changePageSize(): void { this.resetPagination(); this.updateTablePage(); }
  trackById(_index: number, sale: GaslinkSale): string { return sale.id; }
  get canExport(): boolean { return this.analyticsState !== 'loading' && !this.exporting && this.analyticsSales.length > 0; }
  private resetPagination(): void { this.page = 1; }

  private async loadAnalytics(): Promise<void> {
    this.analyticsState = 'loading'; this.state = 'loading'; this.sales = []; this.analyticsSales = []; this.summary = { count: 0, liters: 0, total: 0, average: 0 }; this.clearCharts();
    try {
      const periodSales = await this.salesService.getAnalytics({ ...this.appliedFilters, vendedor: null });
      this.vendorOptions = [...new Set(periodSales.map(sale => sale.vendedor?.trim()).filter((value): value is string => !!value))].sort((a, b) => a.localeCompare(b, 'es-MX'));
      this.analyticsSales = this.appliedFilters.vendedor ? periodSales.filter(sale => sale.vendedor === this.appliedFilters.vendedor) : periodSales;
      this.warnInvalidNumbers(this.analyticsSales); this.summary = summarizeSales(this.analyticsSales);
      this.analyticsState = this.analyticsSales.length ? 'ready' : 'empty'; this.buildCharts();
      if (!this.analyticsSales.length) this.exportMessage = 'No hay ventas para exportar con los filtros seleccionados.';
    } catch (error: unknown) {
      this.analyticsState = 'error';
      this.exportMessage = error instanceof Error && error.message === 'ANALYTICS_LIMIT_EXCEEDED' ? 'El periodo seleccionado contiene más de 10,000 ventas. Reduce el rango para generar el análisis.' : 'No fue posible calcular el análisis de ventas.';
    }
  }

  private updateTablePage(): void {
    if (this.analyticsState === 'error') { this.sales = []; this.hasMore = false; this.state = 'error'; return; }
    const start = (this.page - 1) * this.pageSize;
    this.sales = this.analyticsSales.slice(start, start + this.pageSize);
    this.hasMore = start + this.pageSize < this.analyticsSales.length;
    this.state = this.analyticsSales.length ? 'ready' : 'empty';
  }

  private buildCharts(): void {
    const daily = groupSalesByDay(this.analyticsSales); const vendors = groupSales(this.analyticsSales, 'vendedor'); const payments = groupSales(this.analyticsSales, 'formaPago');
    this.dailyPointCount = daily.length; this.vendorPointCount = vendors.length; this.paymentPointCount = payments.length;
    this.vendorGroupCount = new Set(this.analyticsSales.map(sale => sale.vendedor).filter(Boolean)).size;
    const currency = (value: number): string => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact', maximumFractionDigits: 1 }).format(value);
    this.dailyChart = {
      series: [{ name: 'Importe', type: 'column', data: daily.map(point => point.total) }, { name: 'Litros', type: 'line', data: daily.map(point => point.liters) }], chart: { type: 'line', height: 320, toolbar: { show: false } }, colors: ['#2563EB', '#16A66A'],
      xaxis: { categories: daily.map(point => point.label), labels: { rotate: daily.length > 14 ? -45 : 0 } }, yaxis: [{ labels: { formatter: currency }, title: { text: 'Importe MXN' } }, { opposite: true, labels: { formatter: value => `${this.integer.format(value)} L` }, title: { text: 'Litros' } }],
      stroke: { width: [0, 3], curve: 'smooth' }, dataLabels: { enabled: false }, grid: { borderColor: '#E5EAF1' }, plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } }, legend: { position: 'top', horizontalAlign: 'right' },
      tooltip: { shared: true, custom: ({ dataPointIndex }) => { const point = daily[dataPointIndex]; return point ? `<div class="chart-tooltip"><strong>${this.escapeHtml(point.label)}</strong><span>Importe: ${formatMxn(point.total)}</span><span>Litros: ${formatLiters(point.liters)}</span><span>Ventas: ${point.count}</span></div>` : ''; } }
    };
    this.vendorChart = {
      series: [{ name: 'Importe', data: vendors.map(point => point.total) }], chart: { type: 'bar', height: Math.max(280, vendors.length * 36), toolbar: { show: false } }, colors: ['#2563EB'], xaxis: { categories: vendors.map(point => point.label), labels: { formatter: value => currency(Number(value)) } }, yaxis: { labels: { maxWidth: 150 } },
      stroke: { width: 0 }, dataLabels: { enabled: false }, grid: { borderColor: '#E5EAF1' }, plotOptions: { bar: { horizontal: true, borderRadius: 4 } }, legend: { show: false }, tooltip: { custom: ({ dataPointIndex }) => { const point = vendors[dataPointIndex]; return point ? `<div class="chart-tooltip"><strong>${this.escapeHtml(point.label)}</strong><span>Importe: ${formatMxn(point.total)}</span><span>Litros: ${formatLiters(point.liters)}</span><span>Ventas: ${point.count}</span></div>` : ''; } }
    };
    this.paymentChart = {
      series: payments.map(point => point.total), labels: payments.map(point => point.label), chart: { type: 'donut', height: 320, toolbar: { show: false } }, colors: ['#2563EB', '#16A66A', '#D99000', '#667085', '#60A5FA', '#98A2B3'], stroke: { colors: ['#FFFFFF'], width: 2 }, legend: { position: 'bottom', fontSize: '12px' }, dataLabels: { enabled: false },
      plotOptions: { pie: { donut: { size: '68%', labels: { show: true, total: { show: true, label: 'Total', formatter: () => currency(this.summary.total) } } } } }, tooltip: { y: { formatter: (value, context) => `${formatMxn(value)} · ${this.summary.total ? (value / this.summary.total * 100).toFixed(1) : '0.0'}% · ${payments[context.seriesIndex]?.count ?? 0} ventas` } }
    };
  }

  private clearCharts(): void { this.dailyChart = {}; this.vendorChart = {}; this.paymentChart = {}; this.dailyPointCount = 0; this.vendorPointCount = 0; this.paymentPointCount = 0; }
  private safeFilePart(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 50) || 'VENDEDOR'; }
  private escapeHtml(value: string): string { return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character); }
  private warnInvalidNumbers(sales: GaslinkSale[]): void {
    if (!isDevMode()) return;
    sales.filter(sale => (sale.litros !== null && !Number.isFinite(sale.litros)) || (sale.total !== null && !Number.isFinite(sale.total))).forEach(sale => console.warn('Venta GasLink con valor numérico no finito:', sale.id));
  }
}
