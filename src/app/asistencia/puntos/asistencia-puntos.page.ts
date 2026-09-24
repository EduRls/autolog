import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AlertController } from '@ionic/angular';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import {
  ATTENDANCE_POINT_RADIUS_DEFAULT,
  ATTENDANCE_POINT_RADIUS_MAX,
  ATTENDANCE_POINT_RADIUS_MIN,
  AttendancePoint,
  AttendancePointDistributor,
  AttendancePointInput,
} from '../../models/attendance-point.model';
import { AttendancePointsService } from '../../services/attendance/attendance-points.service';
import { SidebarLayoutService } from '../../services/layout/sidebar-layout.service';

type PageState = 'loading' | 'empty' | 'error' | 'data';

@Component({
  selector: 'app-asistencia-puntos',
  templateUrl: './asistencia-puntos.page.html',
  styleUrls: ['../asistencia.shared.scss', './asistencia-puntos.page.scss'],
})
export class AsistenciaPuntosPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;
  readonly radiusMin = ATTENDANCE_POINT_RADIUS_MIN;
  readonly radiusMax = ATTENDANCE_POINT_RADIUS_MAX;
  state: PageState = 'loading';
  puntos: AttendancePoint[] = [];
  distribuidores: AttendancePointDistributor[] = [];
  selectedIds = new Set<string>();
  selectedPoint: AttendancePoint | null = null;
  editorOpen = false;
  saving = false;
  distributorSearch = '';
  form: AttendancePointInput = this.emptyForm();

  private map?: L.Map;
  private marker?: L.Marker;
  private radiusCircle?: L.Circle;
  private resizeObserver?: ResizeObserver;
  private layoutSubscription?: Subscription;

  constructor(
    private readonly pointsService: AttendancePointsService,
    private readonly alertController: AlertController,
    private readonly sidebarLayout: SidebarLayoutService,
  ) {}

  get filteredDistributors(): AttendancePointDistributor[] {
    const query = this.normalize(this.distributorSearch);
    if (!query) return this.distribuidores;
    return this.distribuidores.filter(item => this.normalize(`${item.identificador} ${item.nombre}`).includes(query));
  }

  get locationSelected(): boolean { return Number.isFinite(this.form.latitude) && Number.isFinite(this.form.longitude); }

  async ngOnInit(): Promise<void> { await this.load(); }

  ngAfterViewInit(): void {
    this.layoutSubscription = this.sidebarLayout.state$.subscribe(() => this.map?.invalidateSize());
  }

  ngOnDestroy(): void {
    this.layoutSubscription?.unsubscribe();
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  async load(): Promise<void> {
    this.state = 'loading';
    try {
      const [puntos, distribuidores] = await Promise.all([
        this.pointsService.listPoints(),
        this.pointsService.listActiveDistributors(),
      ]);
      this.puntos = puntos;
      this.distribuidores = distribuidores;
      this.state = puntos.length ? 'data' : 'empty';
    } catch (error) {
      console.error('[AsistenciaPuntosPage.load]', error);
      this.state = 'error';
    }
  }

  newPoint(): void {
    this.selectedPoint = null;
    this.selectedIds.clear();
    this.form = this.emptyForm();
    this.editorOpen = true;
    this.openMap();
  }

  async editPoint(point: AttendancePoint): Promise<void> {
    this.selectedPoint = point;
    this.form = {
      nombre: point.nombre, descripcion: point.descripcion || '', latitude: point.latitude,
      longitude: point.longitude, radioMetros: point.radioMetros, activo: point.activo, distribuidorIds: [],
    };
    this.editorOpen = true;
    this.selectedIds = new Set(await this.pointsService.getAssignments(point.id));
    this.openMap();
  }

  cancel(): void { this.editorOpen = false; }

  selectLocation(latitude: number, longitude: number): void {
    this.form.latitude = Number(latitude.toFixed(6));
    this.form.longitude = Number(longitude.toFixed(6));
    this.renderLocation();
  }

  updateRadius(value: number | string): void {
    this.form.radioMetros = Number(value);
    this.radiusCircle?.setRadius(this.form.radioMetros);
  }

  toggleDistributor(id: string, selected: boolean): void {
    if (selected) this.selectedIds.add(id); else this.selectedIds.delete(id);
  }

  async save(): Promise<void> {
    if (!this.validForm || this.saving) return;
    this.saving = true;
    const input = { ...this.form, distribuidorIds: [...this.selectedIds] };
    try {
      if (this.selectedPoint) await this.pointsService.updatePoint(this.selectedPoint.id, input);
      else await this.pointsService.createPoint(input);
      this.editorOpen = false;
      await this.load();
    } finally { this.saving = false; }
  }

  async toggleActive(point: AttendancePoint): Promise<void> {
    const action = point.activo ? 'desactivar' : 'activar';
    const alert = await this.alertController.create({
      header: `${action[0].toUpperCase()}${action.slice(1)} punto`,
      message: `¿Deseas ${action} “${point.nombre}”?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: action === 'activar' ? 'Activar' : 'Desactivar', role: 'confirm', handler: () => void this.changeActive(point) },
      ],
    });
    await alert.present();
  }

  get validForm(): boolean {
    return Boolean(this.form.nombre.trim()) && this.locationSelected &&
      Number.isInteger(this.form.radioMetros) && this.form.radioMetros >= this.radiusMin && this.form.radioMetros <= this.radiusMax;
  }

  private async changeActive(point: AttendancePoint): Promise<void> {
    const assignments = await this.pointsService.getAssignments(point.id);
    await this.pointsService.updatePoint(point.id, {
      nombre: point.nombre, descripcion: point.descripcion || '', latitude: point.latitude,
      longitude: point.longitude, radioMetros: point.radioMetros, activo: !point.activo, distribuidorIds: assignments,
    });
    await this.load();
  }

  private openMap(): void {
    requestAnimationFrame(() => {
      if (!this.map && this.mapContainer) {
        this.map = L.map(this.mapContainer.nativeElement, { center: [22.768056, -102.533056], zoom: 13 });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(this.map);
        this.map.on('click', event => this.selectLocation(event.latlng.lat, event.latlng.lng));
        this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
        this.resizeObserver.observe(this.mapContainer.nativeElement);
      }
      this.map?.invalidateSize();
      this.renderLocation();
    });
  }

  private renderLocation(): void {
    if (!this.map || !this.locationSelected) return;
    const coordinates = L.latLng(this.form.latitude, this.form.longitude);
    this.marker?.remove();
    this.radiusCircle?.remove();
    this.marker = L.marker(coordinates, { draggable: true, icon: this.markerIcon() }).addTo(this.map);
    this.marker.on('dragend', event => {
      const location = (event.target as L.Marker).getLatLng();
      this.selectLocation(location.lat, location.lng);
    });
    this.radiusCircle = L.circle(coordinates, { radius: this.form.radioMetros, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: .16, weight: 2 }).addTo(this.map);
    this.map.setView(coordinates, Math.max(this.map.getZoom(), 16));
  }

  private markerIcon(): L.DivIcon {
    return L.divIcon({ className: 'attendance-map-marker', html: '<span aria-hidden="true"></span>', iconSize: [26, 34], iconAnchor: [13, 34] });
  }

  private emptyForm(): AttendancePointInput {
    return { nombre: '', descripcion: '', latitude: Number.NaN, longitude: Number.NaN, radioMetros: ATTENDANCE_POINT_RADIUS_DEFAULT, activo: true, distribuidorIds: [] };
  }

  private normalize(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
}
