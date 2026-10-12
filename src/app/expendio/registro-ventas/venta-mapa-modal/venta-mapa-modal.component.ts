import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import * as L from 'leaflet';
import { GaslinkSale } from '../../../services/gaslink-sales/gaslink-sales.models';
import { formatLiters, formatMxn, formatSaleDay, formatSaleTime } from '../registro-ventas.utils';

/** Modal pequeño con la ubicación de una venta (mapa Leaflet) y sus datos principales. */
@Component({
  selector: 'app-venta-mapa-modal',
  templateUrl: './venta-mapa-modal.component.html',
  styleUrls: ['./venta-mapa-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class VentaMapaModalComponent implements AfterViewInit, OnDestroy {
  @Input() sale!: GaslinkSale;
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  copied = false;
  readonly formatDay = formatSaleDay;
  readonly formatTime = formatSaleTime;
  readonly formatLiters = formatLiters;
  readonly formatMxn = formatMxn;

  private map?: L.Map;
  private resizeObserver?: ResizeObserver;
  private copiedTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly modalController: ModalController) {}

  get coordinates(): string {
    const point = this.sale?.ubicacion;
    return point ? `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}` : '';
  }

  ngAfterViewInit(): void {
    const point = this.sale?.ubicacion;
    if (!point) return;
    const center = L.latLng(point.latitude, point.longitude);
    this.map = L.map(this.mapContainer.nativeElement, { center, zoom: 16, scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    L.marker(center, {
      icon: L.divIcon({ className: 'sale-map-marker', html: '<span aria-hidden="true"></span>', iconSize: [26, 34], iconAnchor: [13, 34] }),
      keyboard: false
    }).addTo(this.map);
    // El modal se anima al abrirse: Leaflet necesita recalcular su tamaño cuando termina.
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
    this.resizeObserver.observe(this.mapContainer.nativeElement);
    setTimeout(() => this.map?.invalidateSize(), 300);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    this.map?.remove();
  }

  async copyCoordinates(): Promise<void> {
    if (!this.coordinates) return;
    try {
      await navigator.clipboard.writeText(this.coordinates);
      this.copied = true;
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => { this.copied = false; }, 1800);
    } catch {
      this.copied = false;
    }
  }

  close(): Promise<boolean> {
    return this.modalController.dismiss();
  }
}
