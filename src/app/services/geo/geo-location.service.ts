import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GeoLocationService {

  private apiKey = 'pk.bdbdc4ac188dd13c192fc1cec4279b13';
  private map: any;

  constructor(private http: HttpClient) { }

  inicializarMapa(mapContainerId: string) {
    setTimeout(() => {
      if (this.map) {
        this.map.remove(); // 🔹 Eliminamos el mapa si ya existe para evitar errores
      }

      this.map = L.map(mapContainerId, {
        center: [22.768056, -102.533056], // 🔹 Zacatecas como centro
        zoom: 13
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // 🔹 Esperamos un poco antes de forzar el redibujado
      setTimeout(() => {
        this.map.invalidateSize(); // 🔥 Forzamos que Leaflet re-renderice los tiles
      }, 1000);
    }, 500);
  }


  // Crea marcadores a partir de un array de direcciones
  async agregarMarcadores(ventas: any[]): Promise<L.Layer[]> {
    const capas: L.Layer[] = [];

    const colores = ['red', 'blue', 'green', 'orange', 'yellow', 'grey', 'black'];
    const vendedorAColor = new Map<string, string>();
    let colorIndex = 0;

    for (const venta of ventas) {
      const dir = venta.DOMICILIO;
      const [lat, lon] = dir.split(',').map(coord => parseFloat(coord.trim()));

      if (!isNaN(lat) && !isNaN(lon)) {
        const id = venta.ID_VENDEDOR;
        const nombre = venta.NOMBRE_VENDEDOR || id;

        // Asignar color por ID si no se ha hecho
        if (!vendedorAColor.has(id)) {
          vendedorAColor.set(id, colores[colorIndex % colores.length]);
          colorIndex++;
        }

        const color = vendedorAColor.get(id);

        const fecha = new Date(venta.FECHA_VENTA.seconds * 1000).toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        const marcador = L.marker([lat, lon], {
          icon: L.icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
            shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
            iconSize: [20, 30],
            iconAnchor: [10, 30],
            popupAnchor: [1, -28]
          }),
        }).bindPopup(`<b>${nombre}</b><br>Hora de venta: ${fecha}<br> ID: ${id}`);

        capas.push(marcador);
      }
    }

    return capas;
  }




  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async obtenerNombreLugar(domicilio: string): Promise<string> {
    const [lat, lon] = domicilio.split(',').map(coord => parseFloat(coord.trim()));
    const url = `https://us1.locationiq.com/v1/reverse.php?key=${this.apiKey}&lat=${lat}&lon=${lon}&format=json`;

    // Esperamos 2 segundos antes de hacer la solicitud
    await this.delay(400);

    try {
      const data: any = await this.http.get(url).toPromise();

      if (data && data.address) {
        const numeroCalle = data.address.house_number || data.address.building || '';
        const calle = data.address.road || '';
        const ciudad = data.address.city || data.address.town || data.address.village || '';
        const pais = data.address.country || '';

        const partesDireccion = [];
        if (numeroCalle) partesDireccion.push(`Núm. ${numeroCalle}`);
        if (calle) partesDireccion.push(calle);
        if (ciudad) partesDireccion.push(ciudad);
        if (pais) partesDireccion.push(pais);

        const direccionFinal = partesDireccion.filter(Boolean).join(', ');
        return direccionFinal || 'Ubicación desconocida';
      }

      return 'Ubicación desconocida';
    } catch (error) {
      console.error('Error obteniendo nombre del lugar:', error);
      return 'Error al obtener dirección';
    }
  }




}
