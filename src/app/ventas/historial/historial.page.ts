import { Component, OnInit } from '@angular/core';
import { VentasService } from 'src/app/services/admVentas/ventas/ventas.service';
import { IncidentesService } from 'src/app/services/admVentas/incidentes/incidentes.service';
import {
  ApexChart,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexDataLabels,
  ApexLegend,
  ApexTitleSubtitle,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexAxisChartSeries
} from "ng-apexcharts";
import { FirebaseService } from 'src/app/services/firebase/firebase.service';
import { GeoLocationService } from 'src/app/services/geo/geo-location.service';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { GenerarReporteComponent } from 'src/app/components/generar-reporte/generar-reporte.component';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ModalBuscarVentaComponent } from 'src/app/components/modal-buscar-venta/modal-buscar-venta.component';
import { firstValueFrom } from 'rxjs';

export type ChartOptions = {
  series: ApexNonAxisChartSeries | ApexAxisChartSeries;
  chart: ApexChart;
  labels?: any;
  responsive?: ApexResponsive[];
  dataLabels?: ApexDataLabels;
  legend?: ApexLegend;
  title?: ApexTitleSubtitle;
  xaxis?: ApexXAxis;
  yaxis?: ApexYAxis;
  stroke?: ApexStroke;
};

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage implements OnInit {
  public periodoSeleccionado: string = 'primer';
  public busquedaProveedor: string = '';
  public ventasFiltradas: any[] = [];
  public incidentesFiltrados: any[] = [];
  lugares: { [coordenadas: string]: string } = {};



  public chartMejoresProveedores: Partial<ChartOptions> = {
    series: [],
    chart: { type: "pie", height: 300, width: "580%" },
    labels: [],
    legend: { position: "bottom" },
    dataLabels: { enabled: true },
    title: { text: "Mejor Proveedor (Más Ventas)", align: "center" }
  };

  public chartIncidentesProveedores: Partial<ChartOptions> = {
    series: [],
    chart: { type: "pie", height: 600, width: "155%" },
    labels: [],
    legend: { position: "bottom" },
    dataLabels: { enabled: true },
    title: { text: "Proveedor con más incidentes", align: "center" }
  };

  public chartTiposIncidentes: Partial<ChartOptions> = {
    series: [],
    chart: { type: "bar", height: 600, width: "100%" },
    title: { text: "Número de Incidentes por Tipo", align: "center" },
    xaxis: { categories: [] },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 1 }
  };

  public chartActividadVentas: Partial<ChartOptions>;
  public chartActividadIncidentes: Partial<ChartOptions>;


  ventas: any[] = [];
  ventasOriginales: any[] = [];
  incidentes: any[] = [];
  incidentesOriginales: any[] = [];

  // Paginación
  public paginaActualIncidentes: number = 1;
  public incidentesPorPagina: number = 5;
  public incidentesPaginados: any[] = [];

  public paginaActualVentas: number = 1;
  public ventasPorPagina: number = 5;
  public ventasPaginadas: any[] = [];

  public distribuidores: any[] = []

  // Ubicaciones
  ubicacionSeleccionada: 'todo' | 'guada' | 'zaca' = 'todo';


  constructor(
    private ventasService: VentasService,
    private incidentesService: IncidentesService,
    private firebase: FirebaseService,
    private maps: GeoLocationService,
    private modalController: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.firebase.getDistribuidores().subscribe({
      next: (data) => this.distribuidores = data
    });
    this.getVentas();
    this.getIncidentes();
  }

  async getVentas() {
    this.ventasService.getVentas().subscribe({
      next: (data) => {
        console.log(data)
        this.ventas = data
          .filter(venta => this.filtrarPorPeriodo(venta.FECHA_VENTA))
          .map(venta => {
            let zona = 'otra';
            if (venta.DOMICILIO) {
              const [lat, lon] = venta.DOMICILIO.split(',').map(coord => parseFloat(coord.trim()));
              if (!isNaN(lat) && !isNaN(lon)) {
                zona = this.clasificarZonaPorCoordenadas(lat, lon);
              }
            }

            // Obtener nombre del vendedor
            const dist = this.distribuidores.find(d => d.identificador === venta.ID_VENDEDOR);
            const nombreVendedor = dist ? dist.nombre : 'Desconocido';

            return {
              ...venta,
              NOMBRE_VENDEDOR: nombreVendedor,
              ZONA: zona,
              TIMESTAMP: venta.FECHA_VENTA,
              FECHA_VENTA: this.formatTimestamp(venta.FECHA_VENTA)
            };
          });

        this.filtrarPorProveedor();
        this.generarGraficoProveedores();
        this.generarGraficoActividadVentas();
      },
      error: (error) => {
        console.error('Error al obtener las ventas:', error);
      }
    });
  }

  clasificarZonaPorCoordenadas(lat: number, lon: number): 'guada' | 'zaca' | 'otra' {
    const zonaGuadalupe = {
      latMin: 22.7235,
      latMax: 22.7860,
      lonMin: -102.5468,
      lonMax: -102.4353
    };

    const zonaZacatecas = {
      latMin: 22.7478,
      latMax: 22.8145,
      lonMin: -102.6071,
      lonMax: -102.5012
    };

    if (
      lat >= zonaGuadalupe.latMin &&
      lat <= zonaGuadalupe.latMax &&
      lon >= zonaGuadalupe.lonMin &&
      lon <= zonaGuadalupe.lonMax
    ) return 'guada';

    if (
      lat >= zonaZacatecas.latMin &&
      lat <= zonaZacatecas.latMax &&
      lon >= zonaZacatecas.lonMin &&
      lon <= zonaZacatecas.lonMax
    ) return 'zaca';

    return 'otra';
  }



  obtenerNombreLugar(domicilio: string): string {
    if (!domicilio) return 'Sin ubicación';

    // Si ya lo tenemos resuelto
    if (this.lugares[domicilio]) return this.lugares[domicilio];

    // Si es la primera vez que lo pedimos
    const [lat, lon] = domicilio.split(',').map(coord => parseFloat(coord.trim()));
    if (isNaN(lat) || isNaN(lon)) {
      this.lugares[domicilio] = 'Coordenadas inválidas';
      return 'Coordenadas inválidas';
    }

    // Llamamos al servicio async pero guardamos un placeholder temporal
    this.lugares[domicilio] = 'Resolviendo...';
    this.maps.obtenerNombreLugar(domicilio).then(nombre => {
      this.lugares[domicilio] = nombre || 'Sin datos';
    });

    return this.lugares[domicilio];
  }

async getIncidentes() {
  this.incidentesService.getVentas().subscribe({
    next: (data) => {
      this.incidentes = data
        .filter(incidente => this.filtrarPorPeriodo(incidente.FECHA_VENTA))
        .map(incidente => {
          // 1. Zona geográfica
          let zona = 'otra';
          if (incidente.DOMICILIO) {
            const [lat, lon] = incidente.DOMICILIO.split(',').map(coord => parseFloat(coord.trim()));
            if (!isNaN(lat) && !isNaN(lon)) {
              zona = this.clasificarZonaPorCoordenadas(lat, lon);
            }
          }

          // 2. Nombre del vendedor
          const dist = this.distribuidores.find(d => d.identificador === incidente.ID_VENDEDOR);
          const nombreVendedor = dist?.nombre || 'Desconocido';

          // 3. Formato de tiempo
          const timestamp = incidente.FECHA_VENTA;
          const fechaLegible = this.formatTimestamp(incidente.FECHA_VENTA);

          // 4. Tipo de incidente desde campo `error`, si existe
          const tipoIncidente = incidente.error?.trim() || this.determinarTipoIncidente(incidente);

          return {
            ...incidente,
            ZONA: zona,
            NOMBRE_VENDEDOR: nombreVendedor,
            TIMESTAMP: timestamp,
            FECHA_VENTA: fechaLegible,
            tipoIncidente
          };
        });

      // Procesamiento secundario para tablas y gráficas
      this.filtrarPorProveedor();
      this.generarGraficoIncidentes();
      this.generarGraficoTiposIncidentes();
      this.generarGraficoActividadIncidentes();
      this.actualizarDatos();
    },
    error: (error) => {
      console.error('Error al obtener los incidentes:', error);
    }
  });
}



  obtenerNombreVendedor(id: string): string {
    const dist = this.distribuidores.find(d => d.identificador === id);
    return dist ? dist.nombre : id; // Si no lo encuentra, que devuelva el ID
  }


  determinarTipoIncidente(incidente: any): string {
    if (!incidente.ID_CILINDRO) return "Falta ID de Cilindro";
    if (!incidente.ID_VENDEDOR) return "Falta ID de Vendedor";
    if (!incidente.DOMICILIO) return "Domicilio vacío";
    return "Datos incompletos";
  }

  formatTimestamp(timestamp: any): string {
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    return 'Fecha no disponible';
  }
  filtrarPorProveedor() {
    let ventasBase = [...this.ventas];
    let incidentesBase = [...this.incidentes];

    if (this.ubicacionSeleccionada !== 'todo') {
      ventasBase = ventasBase.filter(v => v.ZONA === this.ubicacionSeleccionada);
      incidentesBase = incidentesBase.filter(i => i.ZONA === this.ubicacionSeleccionada);
    }

    if (!this.busquedaProveedor.trim()) {
      this.ventasFiltradas = ventasBase;
      this.incidentesFiltrados = incidentesBase;
    } else {
      const filtro = this.busquedaProveedor.toLowerCase();
      this.ventasFiltradas = ventasBase.filter(venta =>
        venta.ID_VENDEDOR.toLowerCase().includes(filtro) ||
        venta.NOMBRE_VENDEDOR?.toLowerCase().includes(filtro)
      );

      this.incidentesFiltrados = incidentesBase.filter(incidente =>
        incidente.ID_VENDEDOR.toLowerCase().includes(filtro) ||
        incidente.NOMBRE_VENDEDOR?.toLowerCase().includes(filtro)
      );
    }

    this.actualizarPaginacionVentas();
    this.actualizarPaginacionIncidentes();

    // 🔄 Actualizamos gráficos
    this.generarGraficoProveedores();
    this.generarGraficoActividadVentas();
    this.generarGraficoIncidentes();
    this.generarGraficoTiposIncidentes();
    this.generarGraficoActividadIncidentes();
  }



  parsearFecha(fechaStr: any): Date {
    if (!fechaStr || typeof fechaStr !== 'string') return new Date();

    const meses = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };
    const regex = /(\d+) de (\w+) de (\d+),/;
    const match = fechaStr.match(regex);
    if (match) {
      const dia = parseInt(match[1], 10);
      const mes = meses[match[2].toLowerCase()];
      const anio = parseInt(match[3], 10);
      return new Date(anio, mes, dia);
    }
    return new Date(); // Retorna la fecha actual si no puede parsear
  }

  filtrarPorPeriodo(fechaStr: any): boolean {
    const fecha = new Date(fechaStr.seconds * 1000); // Convertir Timestamp
    const mes = fecha.getMonth() + 1; // Meses en JavaScript van de 0 a 11
    if (this.periodoSeleccionado === 'primer') {
      return mes >= 1 && mes <= 6;
    } else {
      return mes >= 7 && mes <= 12;
    }
  }

  get hayDatosTiposIncidentes(): boolean {
    const serie = this.chartTiposIncidentes?.series?.[0];
    if (typeof serie === 'object' && 'data' in serie && Array.isArray((serie as any).data)) {
      const data = (serie as any).data;
      return data.length > 0 && data.some((d: number) => d > 0);
    }
    return false;
  }



  actualizarPaginacionIncidentes() {
    const inicio = (this.paginaActualIncidentes - 1) * this.incidentesPorPagina;
    const fin = inicio + this.incidentesPorPagina;
    this.incidentesPaginados = this.incidentesFiltrados.slice(inicio, fin);
  }

  async actualizarPaginacionVentas() {
    const inicio = (this.paginaActualVentas - 1) * this.ventasPorPagina;
    const fin = inicio + this.ventasPorPagina;
    this.ventasPaginadas = this.ventasFiltradas.slice(inicio, fin);

    for (const venta of this.ventasPaginadas) {
      if (!venta.NOMBRE_LUGAR && venta.DOMICILIO) {
        try {
          await new Promise(resolve => setTimeout(resolve, 300)); // 🔹 Delay preventivo
          const nombre = await this.maps.obtenerNombreLugar(venta.DOMICILIO);
          venta.NOMBRE_LUGAR = nombre || 'Ubicación no disponible';
        } catch (err) {
          venta.NOMBRE_LUGAR = 'Error al obtener ubicación';
          console.error('Error al resolver dirección:', err);
        }
      }
    }
  }



  paginaAnteriorIncidentes() {
    if (this.paginaActualIncidentes > 1) {
      this.paginaActualIncidentes--;
      this.actualizarPaginacionIncidentes();
    }
  }

  paginaSiguienteIncidentes() {
    if (this.paginaActualIncidentes < this.getTotalPaginasIncidentes()) {
      this.paginaActualIncidentes++;
      this.actualizarPaginacionIncidentes();
    }
  }

  paginaAnteriorVentas() {
    if (this.paginaActualVentas > 1) {
      this.paginaActualVentas--;
      this.actualizarPaginacionVentas();
    }
  }

  paginaSiguienteVentas() {
    if (this.paginaActualVentas < this.getTotalPaginasVentas()) {
      this.paginaActualVentas++;
      this.actualizarPaginacionVentas();
    }
  }

  getTotalPaginasIncidentes(): number {
    return Math.ceil(this.incidentesFiltrados.length / this.incidentesPorPagina);
  }
  // Hoa

  getTotalPaginasVentas(): number {
    return Math.ceil(this.ventasFiltradas.length / this.ventasPorPagina);
  }


  cambiarPeriodo(periodo: string) {
    this.periodoSeleccionado = periodo;
    this.getVentas();
    this.getIncidentes();
  }

  // Graficos
  generarGraficoProveedores() {
    // Agrupar las ventas por proveedor
    const ventasPorProveedor = this.ventasFiltradas.reduce((acc, venta) => {
      const proveedor = this.obtenerNombreVendedor(venta.ID_VENDEDOR) || 'Desconocido';
      acc[proveedor] = (acc[proveedor] || 0) + 1;
      return acc;
    }, {});

    // Ordenar por mayor número de ventas y tomar los top 5
    const topProveedores = Object.entries(ventasPorProveedor)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5);

    // Configurar el gráfico Pie
    this.chartMejoresProveedores = {
      series: topProveedores.map((item: any) => item[1]),
      chart: {
        type: "pie",
        height: 500,
        width: "100%"
      },
      labels: topProveedores.map((item: any) => item[0]),
      legend: { position: "bottom" },
      dataLabels: {
        enabled: true
      },
      title: {
        text: "Mejor Proveedor (Más Ventas)",
        align: "center"
      }
    };
  }

generarGraficoIncidentes() {
  const incidentesPorProveedor: { [key: string]: number } = {};

  this.incidentes.forEach((incidente) => {
    const id = incidente.ID_VENDEDOR || 'Sin ID';
    const distribuidor = this.distribuidores.find(d => d.identificador === id);
    const nombre = distribuidor ? distribuidor.nombre : 'Desconocido';

    incidentesPorProveedor[nombre] = (incidentesPorProveedor[nombre] || 0) + 1;
  });

  const topIncidentes = Object.entries(incidentesPorProveedor)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  this.chartIncidentesProveedores = {
    series: topIncidentes.map((item) => item[1]),
    chart: { type: "pie", height: 500, width: "100%" },
    labels: topIncidentes.map((item) => item[0]),
    legend: { position: "bottom" },
    dataLabels: { enabled: true },
    title: { text: "Proveedor con más incidentes", align: "center" }
  };
}


generarGraficoTiposIncidentes() {
  const tiposIncidentes = this.incidentes.reduce((acc, incidente) => {
    // Nuevo: Priorizar el campo `error`
    let tipo = incidente.error?.trim();

    // Si no hay error definido, aplicar lógica de respaldo
    if (!tipo) {
      if (!incidente.ID_CILINDRO) tipo = "Falta ID de Cilindro";
      else if (!incidente.ID_VENDEDOR) tipo = "Falta ID de Vendedor";
      else if (!incidente.DOMICILIO) tipo = "Domicilio vacío";
      else tipo = "Datos incompletos";
    }

    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  this.chartTiposIncidentes = {
    series: [{ name: "Incidentes", data: Object.values(tiposIncidentes) as number[] }],
    chart: { type: "bar", height: 345, width: "100%" },
    xaxis: { categories: Object.keys(tiposIncidentes) },
    title: { text: "Número de Incidentes por Tipo", align: "center" },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 1 }
  };
}

  async actualizarDatos() {
    this.generarGraficoProveedores();
    this.generarGraficoActividadVentas();
    this.generarGraficoIncidentes();
    this.generarGraficoTiposIncidentes();
    this.generarGraficoActividadIncidentes();
  }


  generarGraficoActividadVentas() {
    if (this.ventasFiltradas.length === 0) return;
    const ventasPorMes = Array(12).fill(0);

    this.ventasFiltradas.forEach(venta => {
      const fechaVenta = new Date(venta.TIMESTAMP.seconds * 1000); // ✅ Usar TIMESTAMP
      const mes = fechaVenta.getMonth();
      ventasPorMes[mes]++;
    });

    this.chartActividadVentas = {
      series: [{ name: "Ventas", data: ventasPorMes }],
      chart: { type: "bar", height: 300 },
      xaxis: {
        categories: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
      },
      title: { text: "Actividad de Ventas por Mes", align: "center" },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 1 }
    };
  }


  generarGraficoActividadIncidentes() {
    if (this.incidentesFiltrados.length === 0) return;
    const incidentesPorMes = Array(12).fill(0);
    this.incidentesFiltrados.forEach(incidente => {
      const fechaIncidente = new Date(incidente.TIMESTAMP.seconds * 1000);
      const mes = fechaIncidente.getMonth();
      incidentesPorMes[mes]++;
    });

    this.chartActividadIncidentes = {
      series: [{ name: "Incidentes", data: incidentesPorMes }],
      chart: { type: "bar", height: 300 },
      xaxis: { categories: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] },
      title: { text: "Actividad de Incidentes por Mes", align: "center" },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 1 }
    };
  }


  async abrirModalReporte() {
    const modal = await this.modalController.create({
      component: GenerarReporteComponent,
      componentProps: {
        distribuidores: this.distribuidores
      },
      cssClass: 'custom-modal-generador'
    });

    modal.onWillDismiss().then(({ data, role }) => {
      if (role === 'filtros_aplicados') {
        this.filtrarYGenerarReporte(data);
      }
    });

    await modal.present();
  }

  filtrarYGenerarReporte(filtros: any) {
    console.log(filtros)
    const { zona, vendedor, fechaInicio, fechaFin, incluirFechas } = filtros;

    let ventasBase = [...this.ventas];

    if (zona !== 'todo') {
      ventasBase = ventasBase.filter(v => v.ZONA === zona);
    }

    if (vendedor) {
      ventasBase = ventasBase.filter(v => v.ID_VENDEDOR === vendedor);
    }

    if (incluirFechas) {
      if (fechaInicio) {
        const [anio, mes, dia] = fechaInicio.split('-').map(Number);
        const inicio = new Date(anio, mes - 1, dia, 0, 0, 0);
        const desde = inicio.getTime();
        ventasBase = ventasBase.filter(v => v.TIMESTAMP.seconds * 1000 >= desde);
      }

      if (fechaFin) {
        const [anio, mes, dia] = fechaFin.split('-').map(Number);
        const fin = new Date(anio, mes - 1, dia, 23, 59, 59, 999);
        const hasta = fin.getTime();
        ventasBase = ventasBase.filter(v => v.TIMESTAMP.seconds * 1000 <= hasta);
      }
    }


    const reporte = ventasBase.map(v => ({
      "Nombre del operador": v.NOMBRE_VENDEDOR,
      "ID Vendedor": v.ID_VENDEDOR,
      "Folio": v.FOLIO,
      "Producto": v.ID_CILINDRO || 'N/A',
      "Fecha de Venta": v.FECHA_VENTA,
      "Ubicación": v.NOMBRE_LUGAR || v.DOMICILIO,
      "Precio": v.PRECIO || '---'
    }));

    console.log('REPORTE JSON →', JSON.stringify(reporte, null, 2));

    // ✅ Exportar a Excel
    const worksheet = XLSX.utils.json_to_sheet(reporte);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

    const nombreArchivo = `reporte_ventas_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, nombreArchivo);
  }


  async abrirmodalVentas() {
    let ventasBase = [...this.ventas];

    const modalVentas = await this.modalController.create({
      component: ModalBuscarVentaComponent,
      cssClass: 'modalBuscarVenta',
      componentProps: {
        ventas: ventasBase
      }
    });

    modalVentas.present();

  }


  async establecerPago() {
    try {
      const val = await firstValueFrom(this.ventasService.getPrecioZonas());

      const precioActZac = val.find(item => item.id === "activo_zac");
      const precioActGpe = val.find(item => item.id === "activo_gpe");
      const precioActFrs = val.find(item => item.id === "activo_frs");
      const precioActVn = val.find(item => item.id === "activo_vn");

      const alert = await this.alertCtrl.create({
        header: 'Registrar nuevo precio',
        inputs: [
          { name: 'label_zac', type: 'text', value: 'Zacatecas - Precio', attributes: { readonly: true }, cssClass: 'input-label' },
          { name: 'cantidadzac', type: 'number', value: precioActZac?.precio ?? '', placeholder: 'Ingresa precio en pesos' },

          { name: 'label_gpe', type: 'text', value: 'Guadalupe - Precio', attributes: { readonly: true }, cssClass: 'input-label' },
          { name: 'cantidadgpe', type: 'number', value: precioActGpe?.precio ?? '', placeholder: 'Ingresa precio en pesos' },

          { name: 'label_frs', type: 'text', value: 'Fresnillo - Precio', attributes: { readonly: true }, cssClass: 'input-label' },
          { name: 'cantidadfrs', type: 'number', value: precioActFrs?.precio ?? '', placeholder: 'Ingresa precio en pesos' },

          { name: 'label_vn', type: 'text', value: 'Villa Nueva - Precio', attributes: { readonly: true }, cssClass: 'input-label' },
          { name: 'cantidadvn', type: 'number', value: precioActVn?.precio ?? '', placeholder: 'Ingresa precio en pesos' },
        ],
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          {
            text: 'Guardar',
            handler: async (data) => {
              const zonas = [
                { nombre: 'Zacatecas', valor: parseFloat(data.cantidadzac), clave: 'zac' },
                { nombre: 'Guadalupe', valor: parseFloat(data.cantidadgpe), clave: 'gpe' },
                { nombre: 'Fresnillo', valor: parseFloat(data.cantidadfrs), clave: 'frs' },
                { nombre: 'Villa Nueva', valor: parseFloat(data.cantidadvn), clave: 'vn' },
              ];

              const fecha = new Date().toLocaleString('es-MX', {
                timeZone: 'America/Mexico_City',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              });

              const preciosValidos = zonas
                .filter(z => !isNaN(z.valor) && z.valor > 0)
                .map(z => ({ precio: z.valor, fecha, zona: z.clave }));

              if (preciosValidos.length === 0) {
                this.mostrarToast('No se ingresó ningún precio válido.');
                return;
              }

              try {
                for (const p of preciosValidos) {
                  await this.ventasService.actualizarPrecioActivo(p, p.zona);
                }
                await this.ventasService.addPrecioHistorico(preciosValidos);
                this.mostrarToast('Precios guardados correctamente');
              } catch (err) {
                console.error('Error al guardar precio:', err);
                this.mostrarToast('Error al guardar', 'danger');
              }
            },
          },
        ],
      });

      await alert.present();
    } catch (error) {
      console.error('Error al obtener precios:', error);
      this.mostrarToast('Error al cargar precios', 'danger');
    }
  }




  async mostrarToast(mensaje: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color,
      position: 'bottom',
    });
    toast.present();
  }


}
