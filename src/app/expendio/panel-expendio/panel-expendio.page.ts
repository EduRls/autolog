import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexFill, ApexMarkers, ApexStroke, ApexTooltip, ApexXAxis, ApexYAxis } from 'ng-apexcharts';
import { AuthService } from 'src/app/services/auth/auth.service';
import {
  ExternalCollection,
  ExternalConsumption,
  ExternalDevice,
  ExternalDeviceDetail,
  ExternalHistoricalReading,
  ExternalReading,
  ExternalRecharge,
  ExternalTransmission
} from 'src/app/services/external-device-api/external-device-api.models';
import { ExternalDeviceApiError, ExternalDeviceApiService } from 'src/app/services/external-device-api/external-device-api.service';

type LoadState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';
type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  fill: ApexFill;
  markers: ApexMarkers;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  colors: string[];
};

interface PlotReading { timestamp: number; percentage: number; liters: number | null }
interface SectionError { message: string; status: number }

@Component({
  selector: 'app-panel-expendio',
  templateUrl: './panel-expendio.page.html',
  styleUrls: ['./panel-expendio.page.scss'],
  standalone: false
})
export class PanelExpendioPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;

  devices: ExternalDevice[] = [];
  filteredDevices: ExternalDevice[] = [];
  selectedImei = '';
  searchTerm = '';
  detail: ExternalDeviceDetail | null = null;
  consumptions: PlotReading[] = [];
  historical: PlotReading[] = [];
  recharges: PlotReading[] = [];
  lastSuccessfulUpdate: Date | null = null;
  historicalInit = '';
  historicalEnd = '';
  historicalValidation = '';
  activeSection: 'historical' | 'recharges' = 'historical';
  showAllLocations = false;
  locationProgress = { loaded: 0, total: 0 };
  rechargePage = 1;
  readonly rechargesPerPage = 10;

  devicesState: LoadState = 'idle';
  detailState: LoadState = 'idle';
  consumptionsState: LoadState = 'idle';
  historicalState: LoadState = 'idle';
  rechargesState: LoadState = 'idle';
  locationsState: LoadState = 'idle';

  errors: Record<'devices' | 'detail' | 'consumptions' | 'historical' | 'recharges' | 'locations', SectionError | null> = {
    devices: null, detail: null, consumptions: null, historical: null, recharges: null, locations: null
  };

  recentChart: Partial<ChartOptions> = {};
  historicalChart: Partial<ChartOptions> = {};
  rechargeChart: Partial<ChartOptions> = {};

  private map?: L.Map;
  private mapViewReady = false;
  private selectionController?: AbortController;
  private historicalController?: AbortController;
  private readonly detailCache = new Map<string, ExternalDeviceDetail>();
  private readonly consumptionCache = new Map<string, PlotReading[]>();
  private readonly rechargeCache = new Map<string, PlotReading[]>();
  private readonly rechargeLoaded = new Set<string>();
  private readonly inFlightDetails = new Map<string, Promise<ExternalDeviceDetail>>();
  private selectionVersion = 0;
  private resizeTimer?: ReturnType<typeof setTimeout>;
  private shellObserver?: MutationObserver;

  constructor(
    private readonly api: ExternalDeviceApiService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.setTodayHistoricalRange();
    void this.loadDevices();
  }

  ngAfterViewInit(): void {
    this.mapViewReady = true;
    this.renderMap();
    this.shellObserver = new MutationObserver(() => this.scheduleMapResize());
    this.shellObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  ngOnDestroy(): void {
    this.selectionController?.abort();
    this.historicalController?.abort();
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.shellObserver?.disconnect();
    this.map?.remove();
  }

  async loadDevices(manual = false): Promise<void> {
    this.devicesState = 'loading';
    this.errors.devices = null;
    try {
      const data = await this.api.getDevices();
      this.devices = this.extractCollection(data, 'devices')
        .filter(device => this.imeiOf(device) !== '')
        .sort((a, b) => Number(this.isActive(b)) - Number(this.isActive(a)) || this.deviceName(a).localeCompare(this.deviceName(b), 'es') || this.imeiOf(a).localeCompare(this.imeiOf(b)));
      this.applyDeviceFilter();
      this.devicesState = this.devices.length ? 'ready' : 'empty';
      if (!this.devices.length) {
        this.selectedImei = '';
        this.clearSelection();
        return;
      }
      const stillExists = this.devices.some(device => this.imeiOf(device) === this.selectedImei);
      if (!stillExists) this.selectedImei = this.imeiOf(this.devices.find(device => this.isActive(device)) ?? this.devices[0]);
      if (manual) await this.refreshSelected(false);
      else await this.selectDevice(this.selectedImei);
    } catch (error: unknown) {
      this.devicesState = 'error';
      this.errors.devices = this.toSectionError(error);
      await this.handleUnauthorized(error);
    }
  }

  applyDeviceFilter(): void {
    const term = this.searchTerm.trim().toLocaleLowerCase('es');
    this.filteredDevices = !term ? [...this.devices] : this.devices.filter(device =>
      `${this.deviceName(device)} ${this.imeiOf(device)}`.toLocaleLowerCase('es').includes(term)
    );
  }

  async selectDevice(imei: string): Promise<void> {
    if (!imei) return;
    this.selectedImei = imei;
    this.activeSection = 'historical';
    this.historicalController?.abort();
    this.historical = [];
    this.historicalState = 'idle';
    this.historicalValidation = '';
    this.showAllLocations = false;
    this.rechargePage = 1;
    await this.loadSelected(false);
  }

  async refreshAll(): Promise<void> { await this.loadDevices(true); }

  async refreshSelected(refreshList = false): Promise<void> {
    if (refreshList) { await this.loadDevices(true); return; }
    if (!this.selectedImei) return;
    this.detailCache.delete(this.selectedImei);
    this.consumptionCache.delete(this.selectedImei);
    this.rechargeCache.delete(this.selectedImei);
    this.rechargeLoaded.delete(this.selectedImei);
    await this.loadSelected(true);
  }

  private async loadSelected(_manual: boolean): Promise<void> {
    const imei = this.selectedImei;
    const version = ++this.selectionVersion;
    this.selectionController?.abort();
    this.selectionController = new AbortController();
    const signal = this.selectionController.signal;
    this.detailState = 'loading';
    this.consumptionsState = 'loading';
    this.errors.detail = null;
    this.errors.consumptions = null;

    const detailPromise = this.detailCache.has(imei)
      ? Promise.resolve(this.detailCache.get(imei) as ExternalDeviceDetail)
      : this.getDetailCached(imei, signal);
    const consumptionPromise = this.consumptionCache.has(imei)
      ? Promise.resolve(this.consumptionCache.get(imei) as PlotReading[])
      : this.api.getConsumptions(imei, signal).then(data => {
          const values = this.normalizeReadings(this.extractCollection(data, 'consumptions'));
          this.consumptionCache.set(imei, values);
          return values;
        });

    const [detailResult, consumptionResult] = await Promise.allSettled([detailPromise, consumptionPromise]);
    if (version !== this.selectionVersion || signal.aborted) return;

    if (detailResult.status === 'fulfilled') {
      this.detail = detailResult.value;
      this.detailState = 'ready';
      this.lastSuccessfulUpdate = new Date();
      this.renderMap();
    } else {
      this.detail = null;
      this.detailState = 'error';
      this.errors.detail = this.toSectionError(detailResult.reason);
      await this.handleUnauthorized(detailResult.reason);
    }
    if (consumptionResult.status === 'fulfilled') {
      this.consumptions = consumptionResult.value;
      this.consumptionsState = this.consumptions.length ? 'ready' : 'empty';
      this.recentChart = this.buildChart(this.consumptions, 'Nivel');
    } else {
      this.consumptions = [];
      this.consumptionsState = 'error';
      this.errors.consumptions = this.toSectionError(consumptionResult.reason);
      await this.handleUnauthorized(consumptionResult.reason);
    }
  }

  async consultHistorical(): Promise<void> {
    this.historicalValidation = '';
    const init = new Date(this.historicalInit).getTime();
    const end = new Date(this.historicalEnd).getTime();
    if (!this.historicalInit || !this.historicalEnd || !Number.isFinite(init) || !Number.isFinite(end)) {
      this.historicalValidation = 'Selecciona la fecha y hora inicial y final.';
      return;
    }
    if (init > end) {
      this.historicalValidation = 'La fecha inicial no puede ser posterior a la fecha final.';
      return;
    }
    this.historicalController?.abort();
    this.historicalController = new AbortController();
    this.historicalState = 'loading';
    this.errors.historical = null;
    try {
      const data = await this.api.getHistorical(this.selectedImei, init, end, this.historicalController.signal);
      this.historical = this.normalizeReadings(this.extractCollection(data, 'historical'));
      this.historicalState = this.historical.length ? 'ready' : 'empty';
      this.historicalChart = this.buildChart(this.historical, 'Nivel histórico', 'line');
    } catch (error: unknown) {
      if (this.isAbort(error)) return;
      this.historicalState = 'error';
      this.errors.historical = this.toSectionError(error);
      await this.handleUnauthorized(error);
    }
  }

  clearHistorical(): void {
    this.historicalController?.abort();
    this.historicalInit = '';
    this.historicalEnd = '';
    this.historicalValidation = '';
    this.historical = [];
    this.historicalState = 'idle';
  }

  openDatePicker(event: MouseEvent): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  }

  private setTodayHistoricalRange(): void {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    this.historicalInit = this.toLocalDateTimeInput(start);
    this.historicalEnd = this.toLocalDateTimeInput(now);
  }

  private toLocalDateTimeInput(date: Date): string {
    const pad = (value: number): string => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  async changeSection(value: string | number | undefined): Promise<void> {
    this.activeSection = value === 'recharges' ? 'recharges' : 'historical';
    if (this.activeSection === 'recharges') await this.loadRecharges();
  }

  async loadRecharges(force = false): Promise<void> {
    const imei = this.selectedImei;
    if (this.rechargesState === 'loading') return;
    if (!imei || (!force && this.rechargeLoaded.has(imei))) {
      this.recharges = this.rechargeCache.get(imei) ?? [];
      this.rechargesState = this.recharges.length ? 'ready' : 'empty';
      return;
    }
    this.rechargesState = 'loading';
    this.errors.recharges = null;
    try {
      const data = await this.api.getRecharges(imei);
      if (imei !== this.selectedImei) return;
      this.recharges = this.normalizeReadings(this.extractCollection(data, 'recharges'), true).sort((a, b) => b.timestamp - a.timestamp);
      this.rechargePage = 1;
      this.rechargeCache.set(imei, this.recharges);
      this.rechargeLoaded.add(imei);
      this.rechargesState = this.recharges.length ? 'ready' : 'empty';
      this.rechargeChart = this.buildChart([...this.recharges].reverse(), 'Recarga', 'bar');
    } catch (error: unknown) {
      this.rechargesState = 'error';
      this.errors.recharges = this.toSectionError(error);
      await this.handleUnauthorized(error);
    }
  }

  async toggleAllLocations(): Promise<void> {
    this.showAllLocations = !this.showAllLocations;
    if (!this.showAllLocations) { this.locationsState = 'idle'; this.renderMap(); return; }
    await this.loadAllLocations();
  }

  private async loadAllLocations(): Promise<void> {
    const missing = this.devices.filter(device => !this.detailCache.has(this.imeiOf(device)));
    this.locationProgress = { loaded: this.devices.length - missing.length, total: this.devices.length };
    this.locationsState = missing.length ? 'loading' : 'ready';
    this.errors.locations = null;
    let cursor = 0;
    const worker = async (): Promise<void> => {
      while (cursor < missing.length) {
        const device = missing[cursor++];
        try { await this.getDetailCached(this.imeiOf(device)); }
        catch (error: unknown) {
          if (error instanceof ExternalDeviceApiError && error.status === 401) throw error;
        } finally { this.locationProgress.loaded++; }
      }
    };
    try {
      await Promise.all(Array.from({ length: Math.min(3, missing.length) }, () => worker()));
      const valid = [...this.detailCache.values()].filter(detail => this.coordinates(detail) !== null);
      this.locationsState = valid.length ? 'ready' : 'empty';
      this.renderMap();
    } catch (error: unknown) {
      this.locationsState = 'error';
      this.errors.locations = this.toSectionError(error);
      await this.handleUnauthorized(error);
    }
  }

  private getDetailCached(imei: string, signal?: AbortSignal): Promise<ExternalDeviceDetail> {
    const cached = this.detailCache.get(imei);
    if (cached) return Promise.resolve(cached);
    const running = this.inFlightDetails.get(imei);
    if (running) return running;
    const promise = this.api.getDeviceDetail(imei, signal).then(detail => {
      this.detailCache.set(imei, detail);
      return detail;
    }).finally(() => this.inFlightDetails.delete(imei));
    this.inFlightDetails.set(imei, promise);
    return promise;
  }

  private renderMap(): void {
    if (!this.mapViewReady || !this.mapContainer) return;
    if (!this.map) {
      this.map = L.map(this.mapContainer.nativeElement, { zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
      }).addTo(this.map);
    }
    this.map.eachLayer(layer => { if (layer instanceof L.Marker) this.map?.removeLayer(layer); });
    const details = this.showAllLocations ? [...this.detailCache.values()] : (this.detail ? [this.detail] : []);
    const markers: L.Marker[] = [];
    details.forEach(detail => {
      const coordinates = this.coordinates(detail);
      if (!coordinates) return;
      const marker = L.marker(coordinates, { icon: this.markerIcon() })
        .bindPopup(`<strong>${this.escapeHtml(this.detailName(detail))}</strong><br>IMEI: ${this.escapeHtml(this.imeiOf(detail))}${this.address(detail) ? `<br>${this.escapeHtml(this.address(detail))}` : ''}${this.numeric(this.value(detail, 'levelPercentage')) !== null ? `<br>Nivel: ${this.formatNumber(this.numeric(this.value(detail, 'levelPercentage')))}%` : ''}`)
        .addTo(this.map as L.Map);
      markers.push(marker);
    });
    if (markers.length === 1) this.map.setView(markers[0].getLatLng(), 15);
    else if (markers.length > 1) this.map.fitBounds(L.featureGroup(markers).getBounds().pad(0.15));
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.scheduleMapResize();
  }

  private scheduleMapResize(): void {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => this.map?.invalidateSize(), 320);
  }

  onMapReady(): void { setTimeout(() => this.map?.invalidateSize(), 0); }

  deviceName(device: ExternalDevice): string { return this.text(device.alias) || this.text(device.unit) || this.text(device.name) || `IMEI ${this.imeiOf(device)}`; }
  detailName(detail: ExternalDeviceDetail): string { return this.text(detail.unit) || this.text(detail.name) || this.text(detail.alias) || `IMEI ${this.imeiOf(detail)}`; }
  imeiOf(device: ExternalDevice): string { return this.text(device.imei); }
  isActive(device: ExternalDevice): boolean { return this.boolean(device.active ?? device.isActive ?? device.device?.active ?? device.device?.isActive); }
  selectedDevice(): ExternalDevice | undefined { return this.devices.find(device => this.imeiOf(device) === this.selectedImei); }
  text(value: unknown): string { return value === null || value === undefined ? '' : String(value).trim(); }
  numeric(value: unknown): number | null { const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN; return Number.isFinite(number) ? number : null; }
  formatNumber(value: number | null, digits = 1): string { return value === null ? 'Sin información' : new Intl.NumberFormat('es-MX', { maximumFractionDigits: digits }).format(value); }
  formatDate(value: unknown): string { const timestamp = this.timestamp(value); return timestamp === null ? 'Sin información' : new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp); }
  value(detail: ExternalDeviceDetail | null, key: keyof ExternalTankLike): unknown { return detail?.[key as keyof ExternalDeviceDetail] ?? detail?.tank?.[key as keyof ExternalTankLike] ?? detail?.lastReading?.[key as keyof ExternalReading]; }
  transmissionValue(key: keyof ExternalTransmission): unknown { const tx = this.detail?.lastTransmission; return tx && typeof tx === 'object' ? tx[key] : undefined; }
  lastTransmissionDate(): unknown { const tx = this.detail?.lastTransmission; return tx && typeof tx === 'object' ? tx.timestamp ?? tx.date : tx; }
  levelStatus(): 'success' | 'warning' | 'danger' | 'neutral' {
    const level = this.numeric(this.value(this.detail, 'levelPercentage'));
    const alert = this.numeric(this.value(this.detail, 'percentageAlert'));
    if (level === null || alert === null) return 'neutral';
    if (level <= alert) return 'danger';
    if (level <= Math.min(100, alert + Math.max(5, alert * .2))) return 'warning';
    return 'success';
  }
  levelStatusText(): string { const status = this.levelStatus(); return status === 'danger' ? 'En nivel de alerta' : status === 'warning' ? 'Próximo al nivel de alerta' : status === 'success' ? 'Sobre el nivel de alerta' : 'Sin umbral disponible'; }
  levelHeight(): number { return Math.max(0, Math.min(100, this.numeric(this.value(this.detail, 'levelPercentage')) ?? 0)); }
  address(detail = this.detail): string {
    if (!detail) return '';
    const streetNumber = [this.text(detail.street), this.text(detail.externalNumber)].filter(Boolean).join(' ');
    const interior = this.text(detail.interiorNumber) ? `Int. ${this.text(detail.interiorNumber)}` : '';
    return [streetNumber, interior, this.text(detail.suburb), this.text(detail.postalCode) ? `C.P. ${this.text(detail.postalCode)}` : '', this.text(detail.township), this.text(detail.city), this.text(detail.state)].filter(Boolean).join(', ');
  }
  coordinates(detail = this.detail): L.LatLngTuple | null {
    if (!detail) return null;
    const latitude = this.numeric(detail.latitude);
    const longitude = this.numeric(detail.longitude);
    return latitude !== null && longitude !== null && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 ? [latitude, longitude] : null;
  }
  historicalVariation(): number | null { return this.historical.length ? this.historical[this.historical.length - 1].percentage - this.historical[0].percentage : null; }
  paginatedRecharges(): PlotReading[] {
    const start = (this.rechargePage - 1) * this.rechargesPerPage;
    return this.recharges.slice(start, start + this.rechargesPerPage);
  }
  rechargeTotalPages(): number { return Math.max(1, Math.ceil(this.recharges.length / this.rechargesPerPage)); }
  previousRechargePage(): void { if (this.rechargePage > 1) this.rechargePage--; }
  nextRechargePage(): void { if (this.rechargePage < this.rechargeTotalPages()) this.rechargePage++; }
  rechargePageStart(): number { return this.recharges.length ? (this.rechargePage - 1) * this.rechargesPerPage + 1 : 0; }
  rechargePageEnd(): number { return Math.min(this.rechargePage * this.rechargesPerPage, this.recharges.length); }
  yesterdayClose(): PlotReading | null {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const closingTime = new Date(yesterday);
    closingTime.setHours(19, 0, 0, 0);
    const readings = this.consumptions.filter(reading =>
      this.isSameLocalDay(reading.timestamp, yesterday) && reading.timestamp <= closingTime.getTime()
    );
    return readings.length ? readings[readings.length - 1] : null;
  }
  todayOpen(): PlotReading | null {
    const today = new Date();
    const openingTime = new Date(today);
    openingTime.setHours(7, 0, 0, 0);
    return this.consumptions.find(reading =>
      this.isSameLocalDay(reading.timestamp, today) && reading.timestamp >= openingTime.getTime()
    ) ?? null;
  }
  overnightVariation(): number | null {
    const close = this.yesterdayClose();
    const open = this.todayOpen();
    return close && open ? open.percentage - close.percentage : null;
  }

  private isSameLocalDay(timestamp: number, date: Date): boolean {
    const readingDate = new Date(timestamp);
    return readingDate.getFullYear() === date.getFullYear()
      && readingDate.getMonth() === date.getMonth()
      && readingDate.getDate() === date.getDate();
  }

  private normalizeReadings<T extends ExternalReading>(items: T[], recharge = false): PlotReading[] {
    return items.map(item => {
      const timestamp = this.timestamp(item.timestamp ?? item.date ?? item.createdAt);
      const rechargeItem = item as ExternalRecharge;
      const percentage = this.numeric(recharge
        ? rechargeItem.recharge_percentage ?? rechargeItem.percentageRecharged ?? rechargeItem.percentage ?? item.level_percentage ?? item.levelPercentage
        : item.level_percentage ?? item.levelPercentage);
      const liters = this.numeric(recharge
        ? rechargeItem.recharge_liters ?? rechargeItem.litersRecharged ?? item.liters ?? item.level_liters ?? item.levelLiters
        : item.level_liters ?? item.levelLiters ?? item.liters);
      return timestamp !== null && percentage !== null && percentage >= 0 && percentage <= 100 ? { timestamp, percentage, liters } : null;
    }).filter((item): item is PlotReading => item !== null).sort((a, b) => a.timestamp - b.timestamp);
  }

  private timestamp(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value < 10_000_000_000 ? value * 1000 : value;
    if (typeof value !== 'string' || !value.trim()) return null;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private buildChart(readings: PlotReading[], name: string, type: 'area' | 'line' | 'bar' = 'area'): Partial<ChartOptions> {
    const liters = new Map(readings.map(item => [item.timestamp, item.liters]));
    return {
      series: [{ name, data: readings.map(item => ({ x: item.timestamp, y: item.percentage })) }],
      chart: { type, height: type === 'bar' ? 230 : 310, toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false } },
      xaxis: { type: 'datetime', labels: { datetimeUTC: false, style: { colors: '#667085', fontFamily: 'Inter, Manrope, sans-serif' } } },
      yaxis: { min: 0, max: 100, tickAmount: 5, labels: { formatter: value => `${Math.round(value)}%`, style: { colors: '#667085' } } },
      stroke: { curve: 'smooth', width: 2.5 },
      fill: { type: 'solid', opacity: type === 'area' ? .1 : .75 },
      markers: { size: type === 'bar' ? 0 : 3, hover: { size: 5 } },
      dataLabels: { enabled: false },
      colors: ['#2563EB'],
      tooltip: { x: { format: 'dd MMM yyyy HH:mm' }, y: { formatter: (value, context) => { const timestamp = readings[context.dataPointIndex]?.timestamp; const literValue = timestamp === undefined ? null : liters.get(timestamp); return `${this.formatNumber(value)}%${literValue !== null && literValue !== undefined ? ` · ${this.formatNumber(literValue)} L` : ''}`; } } }
    };
  }

  private extractCollection<T>(value: ExternalCollection<T>, key: 'devices' | 'consumptions' | 'historical' | 'recharges'): T[] {
    if (Array.isArray(value)) return value;
    return value[key] ?? value.items ?? (key === 'historical' ? value.readings : undefined) ?? [];
  }

  private boolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    return typeof value === 'string' && ['true', '1', 'active', 'activo'].includes(value.toLowerCase());
  }
  private clearSelection(): void { this.detail = null; this.consumptions = []; this.detailState = 'idle'; this.consumptionsState = 'idle'; this.map?.eachLayer(layer => { if (layer instanceof L.Marker) this.map?.removeLayer(layer); }); }
  private toSectionError(error: unknown): SectionError { return error instanceof ExternalDeviceApiError ? { message: error.message, status: error.status } : { message: 'No fue posible consultar la información del expendio.', status: 0 }; }
  private isAbort(error: unknown): boolean { return error instanceof DOMException && error.name === 'AbortError'; }
  private async handleUnauthorized(error: unknown): Promise<void> { if (error instanceof ExternalDeviceApiError && error.status === 401) { await this.authService.logout(); await this.router.navigateByUrl('/login', { replaceUrl: true }); } }
  private markerIcon(): L.DivIcon { return L.divIcon({ className: 'expendio-map-marker', html: '<span aria-hidden="true"></span>', iconSize: [24, 32], iconAnchor: [12, 32], popupAnchor: [0, -30] }); }
  private escapeHtml(value: string): string { return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character); }
}

type ExternalTankLike = {
  capacity?: unknown;
  percentageAlert?: unknown;
  levelPercentage?: unknown;
  levelLiters?: unknown;
};
