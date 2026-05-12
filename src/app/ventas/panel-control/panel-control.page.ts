import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { VentasBuenasService } from 'src/app/services/admVentas/diarias/ventasBuenas/ventas-buenas.service';
import { VentasMalasService } from 'src/app/services/admVentas/diarias/ventasMalas/ventas-malas.service';
import {
  ApexChart,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexXAxis,
  ApexStroke,
  ApexDataLabels,
  ApexAxisChartSeries
} from "ng-apexcharts";
import { GeoLocationService } from 'src/app/services/geo/geo-location.service';
import * as L from 'leaflet';
import { LoadingController, Platform } from '@ionic/angular';
import "leaflet.markercluster"; // 🔹 Importamos el clúster de Leaflet
import { FirebaseService } from 'src/app/services/firebase/firebase.service';


@Component({
  selector: 'app-panel-control',
  templateUrl: './panel-control.page.html',
  styleUrls: ['./panel-control.page.scss'],
})
export class PanelControlPage implements OnInit, OnDestroy, AfterViewInit {

  // Opciones del mapa
  options: any;
  // Capas (marcadores u overlays) que se mostrarán
  layers: any[] = [];
  lugares: { [coords: string]: string } = {};


  // Variables principales
  public ventasRegistros: any = []
  public ventasSospechosas: any = []

  // Variables para la fecha
  fechaHoraActual: string = ""; // Variable para mostrar la fecha y hora
  private intervalo: any; // Variable para almacenar el intervalo

  // Graficos
  public chartMejoresProveedores: Partial<{ series: ApexNonAxisChartSeries, chart: ApexChart, labels: string[] }> = { series: [], labels: [] };
  public chartVentasDia: Partial<{
    series: ApexAxisChartSeries,
    chart: ApexChart,
    xaxis: ApexXAxis,
    stroke: ApexStroke,
    dataLabels: ApexDataLabels
  }> = { series: [], xaxis: { categories: [] } };

  // Variables tarjetas
  totalVentas: number = 0;
  totalIngresos: number = 0;
  totalIncidentes: number = 0;
  incidenteMasFrecuente: string = "N/A";


  // Variables para la tabla
  registros: any[] = [];
  registrosPaginados: any[] = [];
  paginaActual: number = 1;
  registrosPorPagina: number = 5;

  // Variables para la tabla de incidentes
  incidentesLista: any[] = [];
  incidentesPagina: any[] = [];
  paginaActualIncidentes: number = 1;
  incidentesPorPagina: number = 5;

  // 🔹 Configuración del gráfico de pastel (Incidentes por Vendedor)
  graficoPastel: {
    series: number[];
    chart: ApexChart;
    labels: string[];
    colors: string[];
    legend: ApexLegend;
  } = {
      series: [],
      chart: { type: "pie", width: "100%" },
      labels: [],
      colors: ["#FF4560", "#008FFB", "#00E396", "#FEB019", "#775DD0"],
      legend: { position: "bottom" }
    };



  graficoBarras: {
    series: { name: string; data: number[] }[];
    chart: ApexChart;
    xaxis: ApexXAxis;
    colors: string[];
    dataLabels: ApexDataLabels;
  } = {
      series: [{ name: "Incidentes", data: [] }],
      chart: { type: "bar", height: 250 },
      xaxis: {
        categories: [], // 🔹 Se llenará con los nombres de los incidentes
        labels: {
          rotate: -45, // 🔹 Rotar los nombres si son largos
          style: {
            fontSize: "12px",
            fontWeight: "bold"
          }
        }
      },
      colors: ["#FF4560"],
      dataLabels: {
        enabled: true, // 🔹 Mostrar números dentro de las barras
        style: {
          fontSize: "14px",
          fontWeight: "bold",
          colors: ["#fff"] // 🔹 Texto blanco dentro de la barra
        }
      }
    };


  constructor(
    private ventasBuenasService: VentasBuenasService,
    private ventasSospechosService: VentasMalasService,
    private maps: GeoLocationService,
    private firebase: FirebaseService,
    private loadingController: LoadingController,
  ) { }

  ngOnInit() {
    this.actualizarReloj(); // Llamar a la función cuando inicia el componente
    this.intervalo = setInterval(() => this.actualizarReloj(), 1000); // Actualiza cada segundo
    this.getInfo();
    this.getInfoIncidentes();
    this.inicializarMapa(this.ventasRegistros)
  }

  async ngAfterViewInit() {
    const loading = await this.loadingController.create({
      message: 'Cargando mapa...',
      duration: 1000
    });

    await loading.present();

    setTimeout(() => {
      window.dispatchEvent(new Event('resize')); // 🔹 Redibujamos el mapa
    }, 1000);


  }

  ngOnDestroy() {
    if (this.intervalo) {
      clearInterval(this.intervalo); // Limpia el intervalo al salir de la página
    }
  }

  async inicializarMapa(data: any) {
    this.options = {
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '© OpenStreetMap contributors'
        })
      ],
      zoom: 13,
      center: L.latLng(22.768056, -102.533056)
    };

    // 🔹 Pasamos el array completo de ventas, no solo coordenadas
    this.layers = await this.maps.agregarMarcadores(data);
  }


  actualizarReloj() {
    const ahora = new Date();
    const formato = ahora.toLocaleString("es-MX", {
      weekday: "long", // Día de la semana (ejemplo: "miércoles")
      year: "numeric",
      month: "long", // Nombre completo del mes (ejemplo: "febrero")
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // Formato de 12 horas
      timeZone: "America/Mexico_City", // Asegura la zona horaria correcta
    });

    this.fechaHoraActual = this.capitalizarTexto(formato);
  }

  // Función para capitalizar la primera letra de cada palabra
  capitalizarTexto(texto: string): string {
    return texto.replace(/\b\w/g, (letra) => letra.toUpperCase());
  }

  async getInfo() {
    this.firebase.getDistribuidores().subscribe({
      next: (distribuidores) => {
        this.ventasBuenasService.getVentas().subscribe({
          next: (data) => {
            const ventasConNombres = data.map((venta: any) => {
              const dist = distribuidores.find((d: any) => d.identificador === venta.ID_VENDEDOR);
              return {
                ...venta,
                NOMBRE_VENDEDOR: dist?.nombre || 'Sin nombre'
              };
            });

            this.ventasRegistros = ventasConNombres;
            this.totalVentas = ventasConNombres.length;
            this.totalIngresos = ventasConNombres.reduce(
              (total, venta) => total + parseFloat(venta.PRECIO || 0),
              0
            );
            this.registros = ventasConNombres;

            this.actualizarTabla();

            setTimeout(() => {
              this.generarGraficoProveedores();
              this.generarGraficoVentasDia();
              this.inicializarMapa(ventasConNombres);
            }, 300);
          },
          error: (error) => console.error("❌ Error al obtener ventas:", error),
        });
      },
      error: (error) => console.error("❌ Error al obtener distribuidores:", error),
    });
  }


  getInfoIncidentes() {
    // Primero obtenemos distribuidores
    this.firebase.getDistribuidores().subscribe({
      next: (distribuidores) => {
        // Luego ventas sospechosas
        this.ventasSospechosService.getVentas().subscribe({
          next: (data) => {
            console.log(data);
            this.ventasSospechosas = data;
            this.totalIncidentes = this.ventasSospechosas.length;

            const tiposIncidentes: { [key: string]: number } = {};
            const vendedoresIncidentes: { [key: string]: number } = {};
            this.incidentesLista = [];

            this.ventasSospechosas.forEach((venta) => {
              // 🔹 Buscar nombre del vendedor
              const dist = distribuidores.find((d: any) => d.identificador === venta.ID_VENDEDOR);
              const nombreVendedor = dist?.nombre || 'Desconocido';

              // 🔹 Tipo de error
              let tipo = venta.error?.trim();
              if (!tipo) {
                if (!venta.ID_CILINDRO) tipo = "Falta ID de Cilindro";
                else if (!venta.ID_VENDEDOR) tipo = "Falta ID de Vendedor";
                else if (!venta.DOMICILIO) tipo = "Domicilio vacío";
                else tipo = "Datos incompletos";
              }

              // 🔹 Conteo por tipo
              tiposIncidentes[tipo] = (tiposIncidentes[tipo] || 0) + 1;

              // 🔹 Conteo por nombre del vendedor
              vendedoresIncidentes[nombreVendedor] = (vendedoresIncidentes[nombreVendedor] || 0) + 1;

              // 🔹 Lista detallada
              this.incidentesLista.push({
                ID_VENDEDOR: venta.ID_VENDEDOR || "Sin ID",
                NOMBRE_VENDEDOR: nombreVendedor,
                tipo,
                FECHA_VENTA: venta.FECHA_VENTA
              });
            });

            // 🔹 Tipo más frecuente
            this.incidenteMasFrecuente = Object.keys(tiposIncidentes).reduce((a, b) =>
              tiposIncidentes[a] > tiposIncidentes[b] ? a : b,
              "N/A"
            );

            // 🔹 Actualizar tabla
            this.actualizarTablaIncidentes();

            // 🔹 Gráfico pastel por nombre del vendedor
            this.graficoPastel.series = Object.values(vendedoresIncidentes);
            this.graficoPastel.labels = Object.keys(vendedoresIncidentes);

            // 🔹 Gráfico de barras por tipo de incidente
            this.graficoBarras = {
              ...this.graficoBarras,
              series: [{ name: "Incidentes", data: Object.values(tiposIncidentes) }],
              xaxis: { categories: Object.keys(tiposIncidentes) }
            };
          },
          error: (error) => console.error("❌ Error al obtener incidentes:", error),
        });
      },
      error: (err) => console.error("❌ Error al obtener distribuidores:", err),
    });
  }





  // 🔹 Paginación de incidentes
  actualizarTablaIncidentes() {
    const inicio = (this.paginaActualIncidentes - 1) * this.incidentesPorPagina;
    const fin = inicio + this.incidentesPorPagina;
    this.incidentesPagina = this.incidentesLista.slice(inicio, fin);
  }

  paginaAnteriorIncidentes() {
    if (this.paginaActualIncidentes > 1) {
      this.paginaActualIncidentes--;
      this.actualizarTablaIncidentes();
    }
  }

  paginaSiguienteIncidentes() {
    if (this.paginaActualIncidentes < this.getTotalPaginasIncidentes()) {
      this.paginaActualIncidentes++;
      this.actualizarTablaIncidentes();
    }
  }

  getTotalPaginasIncidentes(): number {
    return Math.ceil(this.incidentesLista.length / this.incidentesPorPagina);
  }

  // 🔹 Convertir fecha y hora desde Firebase Timestamp
  convertirFechaHora(segundos: number): string {
    const fecha = new Date(segundos * 1000);
    return fecha.toLocaleString("es-MX", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }


  async actualizarTabla() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.registrosPaginados = this.registros.slice(inicio, fin);

    // 🔹 Obtener direcciones solo de los visibles en la tabla
    for (const venta of this.registrosPaginados) {
      const domicilio = venta.DOMICILIO;
      if (domicilio && !this.lugares[domicilio]) {
        // Espera un poco entre llamadas para no saturar
        this.lugares[domicilio] = await this.maps.obtenerNombreLugar(domicilio);
        await new Promise(res => setTimeout(res, 500)); // medio segundo entre peticiones
      }
    }
  }


  // Métodos de Paginación
  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarTabla();
    }
  }

  paginaSiguiente() {
    if (this.paginaActual < this.getTotalPaginas()) {
      this.paginaActual++;
      this.actualizarTabla();
    }
  }

  getTotalPaginas(): number {
    return Math.ceil(this.registros.length / this.registrosPorPagina);
  }

  // Convertir fecha en formato legible
  convertirFecha(segundos: number): string {
    const fecha = new Date(segundos * 1000);
    return fecha.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
  }

  sonMismaFecha(fecha1: Date, fecha2: Date): boolean {
    return (
      fecha1.getFullYear() === fecha2.getFullYear() &&
      fecha1.getMonth() === fecha2.getMonth() &&
      fecha1.getDate() === fecha2.getDate()
    );
  }


  obtenerFechaTexto(fecha: any): string {
    if (!fecha) return "";
    try {
      if (typeof fecha === "string") {
        return fecha.split(',')[0].trim();
      } else if (fecha.toDate) {
        return fecha.toDate().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
      }
    } catch (error) {
      console.error("Error al procesar fecha:", fecha, error);
    }
    return "";
  }


  generarGraficoProveedores() {
    // Agrupar las ventas por proveedor
    const ventasPorProveedor = this.ventasRegistros.reduce((acc, venta) => {
      const proveedor = venta.NOMBRE_VENDEDOR;
      acc[proveedor] = (acc[proveedor] || 0) + 1;
      return acc;
    }, {});

    // Ordenar por mayor número de ventas
    const topProveedores = Object.entries(ventasPorProveedor)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5); // Tomamos solo los top 5 proveedores con más ventas

    // Configurar el gráfico Pie
    this.chartMejoresProveedores = {
      series: topProveedores.map((item: any) => item[1]), // Número de ventas por proveedor
      chart: {
        type: "pie",
        height: 600, // Ajustamos la altura
        width: "150%" // Aseguramos que use el ancho del contenedor
      },
      labels: topProveedores.map((item: any) => item[0]), // Nombre del proveedor
    };

  }

  generarGraficoVentasDia() {
    // Crear un array con 12 intervalos de 2 horas
    const ventasPorIntervalo = new Array(12).fill(0);

    // Recorrer las ventas y sumarlas al intervalo correspondiente
    this.ventasRegistros.forEach(venta => {
      const fechaVenta = new Date(venta.FECHA_VENTA.seconds * 1000);
      const hora = fechaVenta.getHours();
      const indice = Math.floor(hora / 2); // Cada bloque abarca 2 horas
      ventasPorIntervalo[indice]++;
    });

    // Generar etiquetas: 00:00 - 01:59, 02:00 - 03:59, ...
    const intervalos = Array.from({ length: 12 }, (_, i) => {
      const inicio = (i * 2).toString().padStart(2, '0') + ":00";
      const fin = (i * 2 + 1).toString().padStart(2, '0') + ":59";
      return `${inicio} - ${fin}`;
    });

    // Configurar el gráfico
    this.chartVentasDia = {
      series: [
        {
          name: "Ventas",
          data: ventasPorIntervalo
        }
      ],
      chart: {
        type: "line",
        height: 280,
        width: "160%"
      },
      stroke: {
        curve: "smooth"
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: intervalos
      }
    };
  }





}
