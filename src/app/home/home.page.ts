import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase/firebase.service';
import { ExcelService } from '../services/excel/excel.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTitleSubtitle,
  ApexResponsive,
} from "ng-apexcharts";
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AgregarEventoComponent } from '../components/agregar-evento/agregar-evento.component';
import { EditarEventoComponent } from '../components/editar-evento/editar-evento.component';
import { DetallesEventoUnidadComponent } from '../components/detalles-evento-unidad/detalles-evento-unidad.component';
import { StorageService } from '../services/storage/storage.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis?: ApexXAxis;
  title?: ApexTitleSubtitle;
  labels?: string[];
  responsive?: ApexResponsive[];
};


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  public userRole: string = ''
  public autos: any = [];
  estadoSeleccionado: string = '';
  busquedaUnidad: string = ''; // Texto de búsqueda ingresado


  colorimetriaPaginada: any[] = []; // Datos visibles en la página actual de colorimetría
  paginaColorimetriaActual: number = 1; // Página actual de colorimetría
  colorimetriaPorPagina: number = 10; // Registros por página en colorimetría
  unidadesFiltradas: any[] = []; // Lista filtrada de unidades para búsqueda


  public chartPieTopCost: Partial<ChartOptions> = { series: [], labels: [] };
  public chartPieTopServices: Partial<ChartOptions> = { series: [], labels: [] };
  public chartBarMonthlyActivity: Partial<ChartOptions> = { series: [], xaxis: { categories: [] } };


  registros: any[] = []; // Lista completa de registros
  registrosPaginados: any[] = []; // Registros visibles en la página actual
  paginaActual: number = 1; // Página actual
  registrosPorPagina: number = 5; // Registros por página
  registrosOriginales: any[] = []; // Lista completa de registros sin filtrar

  fechaInicio: string | null = null; // Fecha inicial seleccionada
  fechaFin: string | null = null;   // Fecha final seleccionada



  constructor(
    private firebaseSerive: FirebaseService,
    private excelService: ExcelService,
    private storageService: StorageService,
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController,
    private loadcontroller: LoadingController
  ) { }

  ngOnInit() {
    this.obtenerDatos();

  }

  setFechaInicio(event: any) {
    this.fechaInicio = event.detail.value; // Captura la fecha inicial seleccionada
    this.filtrarPorFechas(); // Filtra los registros al cambiar la fecha
  }

  setFechaFin(event: any) {
    this.fechaFin = event.detail.value; // Captura la fecha final seleccionada
    this.filtrarPorFechas(); // Filtra los registros al cambiar la fecha
  }

  filtrarPorFechas() {
    if (this.fechaInicio && this.fechaFin) {
      const inicio = new Date(this.fechaInicio).getTime();
      const fin = new Date(this.fechaFin).getTime();

      this.registros = this.registrosOriginales.filter((item) => {
        const fechaRegistro = new Date(item.fecha).getTime();
        return fechaRegistro >= inicio && fechaRegistro <= fin;
      });
    } else {
      this.registros = [...this.registrosOriginales];
    }

    this.actualizarTabla();
    this.generarGraficosConDatos(this.registros); // Actualizar gráficos con registros filtrados
  }

  async showLoading(msg: string) {
    const loading = await this.loadcontroller.create({
      message: msg,
      duration: 1500,
    });

    loading.present();
  }

  async presentToast(msg: string, position: 'top' | 'middle' | 'bottom', cl: 'danger' | 'success' | 'warning') {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: position,
      color: cl
    });

    await toast.present();
  }


  obtenerDatos() {
    this.getEventos();
    this.actualizarTabla();
  }

  async getEventos() {
    this.firebaseSerive.getEvento().subscribe({
      next: (data) => {
        this.storageService.get('currentUser').then((user: any) => {
          this.userRole = user.rol;
        })
        const registrosOrdenados = data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        this.registros = registrosOrdenados;
        this.registrosOriginales = [...registrosOrdenados];
        this.firebaseSerive.getAutos().subscribe({
          next: (value) => {
            this.autos = value;
            this.unidadesFiltradas = [...this.autos];
            this.actualizarColorimetriaPaginada();
          },
        })

        this.actualizarTabla();
        this.generarGraficos(); // Generar gráficos después de cargar y ordenar datos
      },
      error: (error) => {
        console.error('Error al obtener eventos:', error);
      },
    });
  }

  // Agregar esta función para calcular el color basado en el estado de la unidad
  calcularColor(auto: any): string {
    const km_actual = auto.km_actual || 0;
    const km_proximo_servicio = auto.km_proximo_servicio || 0;

    if (km_actual >= km_proximo_servicio) {
      return 'rojo';
    } else if (km_actual >= km_proximo_servicio - 3000) {
      return 'amarillo';
    } else {
      return 'verde';
    }
  }

  // Agregar esta función para mostrar el estado en palabras
  calcularEstado(unidad: any): string {
    const kmActual = unidad.km_actual || 0;
    const kmProximoServicio = unidad.km_proximo_servicio || 0;

    if (kmActual >= kmProximoServicio) {
      return 'Servicio vencido';
    } else if (kmProximoServicio - kmActual <= 2000) {
      return 'Próximo a servicio';
    } else {
      return 'En buen estado';
    }
  }

  // Actualiza los registros visibles en la sección de colorimetría
  actualizarColorimetriaPaginada() {
    const inicio = (this.paginaColorimetriaActual - 1) * this.colorimetriaPorPagina;
    const fin = inicio + this.colorimetriaPorPagina;
    this.colorimetriaPaginada = this.unidadesFiltradas.slice(inicio, fin);
  }

  // Calcula el total de páginas para la colorimetría
  getTotalPaginasColorimetria(): number {
    return Math.ceil(this.autos.length / this.colorimetriaPorPagina);
  }

  // Cambia a la página anterior en la colorimetría
  paginaColorimetriaAnterior() {
    if (this.paginaColorimetriaActual > 1) {
      this.paginaColorimetriaActual--;
      this.actualizarColorimetriaPaginada();
    }
  }

  // Cambia a la página siguiente en la colorimetría
  paginaColorimetriaSiguiente() {
    if (this.paginaColorimetriaActual < this.getTotalPaginasColorimetria()) {
      this.paginaColorimetriaActual++;
      this.actualizarColorimetriaPaginada();
    }
  }

  generarGraficos() {
    this.generarGraficosConDatos(this.registrosOriginales);
  }

  generarGraficosConDatos(datos: any[]) {
    const costoPorUnidad = datos.reduce((acc, registro) => {
      const placa = registro.unidad.unidad;
      acc[placa] = (acc[placa] || 0) + registro.costo;
      return acc;
    }, {});

    const topUnidades = Object.entries(costoPorUnidad)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10);

    this.chartPieTopCost = {
      series: topUnidades.map((item: any) => item[1]),
      chart: { type: "pie", height: 300 },
      labels: topUnidades.map((item: any) => item[0]),
    };

    const serviciosPorUnidad = datos.reduce((acc, registro) => {
      const placa = registro.unidad.unidad; // Obtenemos la placa de la unidad
      acc[placa] = (acc[placa] || 0) + 1; // Incrementamos el contador de servicios para esa unidad
      return acc;
    }, {});

    const topServicios = Object.entries(serviciosPorUnidad)
      .sort((a: any, b: any) => b[1] - a[1]) // Ordenamos por cantidad de servicios en orden descendente
      .slice(0, 10); // Tomamos las 10 unidades con más servicios

    this.chartPieTopServices = {
      series: topServicios.map((item: any) => item[1]), // Cantidad de servicios como series
      chart: { type: "pie", height: 300 }, // Configuración del gráfico
      labels: topServicios.map((item: any) => item[0]), // Etiquetas con las placas de las unidades
    };


    const currentYear = new Date().getFullYear(); // Obtiene el año actual

    const actividadMensual = datos.reduce((acc, registro) => {
      const fechaRegistro = new Date(registro.fecha);
      const anioRegistro = fechaRegistro.getFullYear();
      const mesRegistro = fechaRegistro.getMonth();

      // Solo sumar los eventos del año actual
      if (anioRegistro === currentYear) {
        acc[mesRegistro] = (acc[mesRegistro] || 0) + 1;
      }
      return acc;
    }, Array(12).fill(0));

    this.chartBarMonthlyActivity = {
      series: [{ name: "Actividad", data: actividadMensual }],
      chart: { type: "bar", height: 300 },
      xaxis: {
        categories: [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
        ],
      },
      title: { text: `Actividad mensual en el año ${currentYear}` }, // Agrega el año en el título
    };
  }




  buscarEvento(event: any) {
    const query = event.target.value.toLowerCase(); // Convierte el texto ingresado a minúsculas

    if (query && query.trim() !== '') {
      // Filtra los registros por el término de búsqueda
      this.registros = this.registrosOriginales.filter((item) => {
        return (
          (item.unidad && item.unidad.unidad.toString().toLowerCase().includes(query)) || // Verifica si unidad es una cadena o convertible
          (item.servicio && item.servicio.toString().toLowerCase().includes(query)) || // Verifica si servicio es una cadena
          (item.articulo && item.articulo.toString().toLowerCase().includes(query)) || // Verifica si artículo es una cadena
          (item.fecha && item.fecha.toString().toLowerCase().includes(query)) // Verifica si fecha es una cadena
        );
      });
    } else {
      // Si no hay búsqueda, restaura los registros originales
      this.registros = [...this.registrosOriginales];
    }

    // Actualiza la tabla para mostrar los resultados filtrados
    this.actualizarTabla();
  }


  // Calcula el total de páginas
  getTotalPaginas(): number {
    return Math.ceil(this.registros.length / this.registrosPorPagina);
  }

  // Actualiza los registros visibles según la página actual
  actualizarTabla() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.registrosPaginados = this.registros.slice(inicio, fin);
  }

  reiniciarBusqueda() {
    this.fechaInicio = null; // Limpia la fecha inicial
    this.fechaFin = null;    // Limpia la fecha final
    this.registros = [...this.registrosOriginales]; // Restaura los datos originales
    this.actualizarTabla(); // Actualiza la tabla
  }

  // Cambia a la página siguiente
  paginaSiguiente() {
    if (this.paginaActual < this.getTotalPaginas()) {
      this.paginaActual++;
      this.actualizarTabla();
    }
  }

  // Cambia a la página anterior
  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarTabla();
    }
  }

  // EVENTOS
  // Agregar evento
  async agregarEvento() {
    const modalAddEvento = await this.modalController.create({
      component: AgregarEventoComponent,
      cssClass: 'my-custom-class-agregar-evento'
    });

    modalAddEvento.present();
  }

  // Eliminar evento
  async borrarEvento(item: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar el registro?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Eliminación cancelada');
          },
        },
        {
          text: 'Eliminar',
          role: 'confirm',
          handler: () => {
            this.borrarRegistro(item);
          },
        },
      ],
    });

    await alert.present();
  }

  async borrarRegistro(item: any) {
    this.showLoading('Eliminando evento')
    try {
      this.firebaseSerive.deleteEvento(item.id).then((res => {
        this.actualizarTabla();
        this.presentToast('Evento eliminado correctamente', 'bottom', 'success');
      }))
    } catch (error) {
      this.presentToast('Error al eliminar evento', 'bottom', 'danger');
      console.error(error);
    }
  }

  // Editar un evento
  async editarEvento(item: any) {
    const modalEditEvento = await this.modalController.create({
      component: EditarEventoComponent,
      cssClass: 'my-custom-class-agregar-evento',
      componentProps: {
        evento: item
      }
    });

    modalEditEvento.present();
  }

  // Exportar todos los eventos a la vez
  async exportarTodosLosEventos() {
    if (this.registrosOriginales.length > 0) {
      const registrosTransformados = this.registrosOriginales.map((registro) => {
        const { id, articulos, ...resto } = registro;

        // Transformar los artículos en una cadena delimitada por comas
        const articulosString = Array.isArray(articulos)
          ? articulos.map((articulo: any) => `${articulo.nombre} (Cantidad: ${articulo.cantidad})`).join(', ')
          : 'Sin artículos';

        return {
          ...resto,
          unidad: registro.unidad.unidad, // Reemplaza `unidad` con la placa
          artículos: articulosString, // Agregamos la cadena de artículos como un nuevo campo
        };
      });

      const fechaAcutal = new Date().toISOString().split('T')[0];

      this.excelService.exportToExcel(registrosTransformados, 'reporte_general_' + fechaAcutal);
    } else {
      this.presentToast('No hay datos para exportar', 'bottom', 'warning');
    }
  }
  async exportarHisotiralEspesifico(item: any) {
    // Transformar los artículos en una cadena delimitada por comas
    const articulosString = Array.isArray(item.articulos)
      ? item.articulos.map((articulo: any) => `${articulo.nombre} (Cantidad: ${articulo.cantidad})`).join(', ')
      : item.articulo || 'Sin artículos'; // Fallback para eventos antiguos

    const auxItem: any = [{
      fecha: item.fecha,
      unidad: item.unidad.unidad,
      servicio: item.servicio,
      artículos: articulosString,
      costo: item.costo,
    }];

    this.excelService.exportToExcel(auxItem, 'reporte_' + item.unidad.unidad + '_' + item.fecha);
  }


  async detallesEventoRegistro(item: any) {
    const datos = this.registrosOriginales;
    const modalDetalesRegistro = await this.modalController.create({
      component: DetallesEventoUnidadComponent,
      cssClass: 'my-custom-class-details',
      componentProps: {
        datos: datos,
        evento: item
      }
    });

    modalDetalesRegistro.present();
  }

  buscarUnidad(event: any) {
    this.busquedaUnidad = event.target.value?.toLowerCase() || ''; // Actualiza el término de búsqueda en minúsculas
    this.aplicarFiltros(); // Delegamos el filtrado combinado a una función general
  }


  filtrarPorEstado(event: any) {
    this.estadoSeleccionado = event.detail.value; // Captura el estado seleccionado
    this.aplicarFiltros(); // Aplica los filtros combinados
  }

  aplicarFiltros() {
    const query = this.busquedaUnidad; // Texto de búsqueda

    console.log('Estado seleccionado:', this.estadoSeleccionado);

    this.unidadesFiltradas = this.autos.filter((auto) => {
      const coincideBusqueda =
        query === '' || // Si no hay búsqueda, incluye todos
        auto.unidad.toLowerCase().includes(query) || // Coincide con unidad
        auto.operador?.toLowerCase().includes(query); // Coincide con operador

      const color = this.calcularColor(auto); // Calcula el color del auto

      const coincideEstado =
        this.estadoSeleccionado === '' || // Si no hay estado seleccionado, incluye todos
        color === this.estadoSeleccionado; // Coincide con el estado seleccionado

      return coincideBusqueda && coincideEstado; // Devuelve solo los que cumplen ambos criterios
    });

    console.log('Resultados filtrados:', this.unidadesFiltradas);

    // Reinicia la paginación al aplicar filtros
    this.paginaColorimetriaActual = 1;
    this.actualizarColorimetriaPaginada(); // Actualiza los resultados paginados
  }




}
