import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import * as L from 'leaflet';
import { GeoLocationService } from 'src/app/services/geo/geo-location.service';
import { LeafletModule } from '@bluehalo/ngx-leaflet';

@Component({
  selector: 'app-modal-buscar-venta',
  templateUrl: './modal-buscar-venta.component.html',
  styleUrls: ['./modal-buscar-venta.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, LeafletModule]
})
export class ModalBuscarVentaComponent implements OnInit, AfterViewInit {

  @ViewChild('mapaLeaflet', { static: false }) mapaRef!: any;


  @Input() ventas: any[] = [];
  busquedaVenta: string = '';
  ventaEncontrada: any = null;

  mapaOptions: any;
  mapaLayers: L.Layer[] = [];
  nombreResuelto: string = 'Cargando dirección...';

  constructor(
    private modalCtrl: ModalController,
    private toastController: ToastController,
    private maps: GeoLocationService,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.inicializarMapaBase();
  }

  async ngAfterViewInit() {
    const loading = await this.loadingController.create({
      message: 'Cargando mapa...',
      duration: 2000
    });

    await loading.present();

    setTimeout(() => {
      window.dispatchEvent(new Event('resize')); // 🔹 Redibujamos el mapa
    }, 1000);


  }



  async cerrarModal() {
    await this.modalCtrl.dismiss(null);
  }

  async mostrarToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 1500,
      position: 'top',
      color: 'primary'
    });
    await toast.present();
  }

  async buscarVenta() {
    const termino = this.busquedaVenta.trim();
    if (!termino) {
      return this.mostrarToast('Por favor escribe un folio o ID.');
    }

    await this.mostrarToast(`Buscando: ${termino}`);
    this.buscarVentaPorFolioOCilindro(termino);
  }

  async buscarVentaPorFolioOCilindro(termino: string) {
    const lower = termino.toLowerCase();
    const normalizado = lower.startsWith('fol-') ? lower.slice(4) : lower;

    this.ventaEncontrada = this.ventas.find(v => {
      const folioLimpio = (v.FOLIO || '').toLowerCase().replace(/^fol-/, '');
      const idCilindro = (v.ID_CILINDRO || '').toLowerCase();
      return folioLimpio.includes(normalizado) || idCilindro.includes(normalizado);
    });

    if (!this.ventaEncontrada) {
      this.nombreResuelto = 'No encontrada';
      return this.mostrarToast('No se encontró ninguna venta.');
    }

    // 🔹 Obtener dirección legible
    this.nombreResuelto = await this.maps.obtenerNombreLugar(this.ventaEncontrada.DOMICILIO);

    // 🔹 Agregar marcador
    this.agregarMarcador(this.ventaEncontrada);
  }

  inicializarMapaBase() {
    this.mapaOptions = {
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '© OpenStreetMap contributors'
        })
      ],
      zoom: 13,
      center: L.latLng(22.768056, -102.533056)
    };

    // Forzar render por si es modal
    setTimeout(() => {
      const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
      if (mapElement) {
        mapElement.dispatchEvent(new Event('resize'));
      }
    }, 300);
  }

  agregarMarcador(venta: any) {
    const [lat, lon] = venta.DOMICILIO.split(',').map(coord => parseFloat(coord.trim()));

    const popup = `
      <strong>${venta.NOMBRE_VENDEDOR || venta.ID_VENDEDOR}</strong><br>
      ${this.nombreResuelto}<br>
      Precio: $${venta.PRECIO || 'N/A'}
    `;

    const marcador = L.marker([lat, lon], {
      icon: L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      })
    }).bindPopup(popup);

    this.mapaLayers = [marcador];

    // Actualizar centro y zoom al marcador
    this.mapaOptions = {
      ...this.mapaOptions,
      center: L.latLng(lat, lon),
      zoom: 15
    };
  }

  get zonaFormateada(): string {
    switch (this.ventaEncontrada?.ZONA) {
      case 'guada': return 'Guadalupe';
      case 'zaca': return 'Zacatecas';
      default: return 'Otro';
    }
  }
}
