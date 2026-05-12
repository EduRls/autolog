import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { ExcelService } from 'src/app/services/excel/excel.service';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';

@Component({
  selector: 'app-detalles-evento-unidad',
  templateUrl: './detalles-evento-unidad.component.html',
  styleUrls: ['./detalles-evento-unidad.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class DetallesEventoUnidadComponent implements OnInit {
  @Input() datos: any;
  @Input() evento: any;

  public historialUnidad: any[] = [];
  registrosPaginados: any[] = [];
  paginaActual: number = 1;
  registrosPorPagina: number = 5;

  public dineroInvertido: number = 0;
  public ultimaFechaServicio: string = '';
  public placaUnidad: string = '';
  public operadorUnidad: string = '';

  constructor(
    private modalController: ModalController,
    private loadcontroller: LoadingController,
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private excelService: ExcelService
  ) { }

  ngOnInit() {
    this.cargarHistorial();
    this.obtenerInformacionUnidad();
  }

  async obtenerInformacionUnidad() {
    try {
      await this.firebaseService.getAutos().subscribe({
        next: (autos) => {
          const unidad = autos.find((auto: any) => auto.id === this.evento.unidad.id);
          if (unidad) {
            this.operadorUnidad = unidad.operador || 'No asignado';
            this.placaUnidad = unidad.unidad || 'Sin placa';
          }

          const registrosFiltrados = this.datos.filter(
            (registro: any) => registro.unidad.unidad === this.evento.unidad.unidad
          );

          this.dineroInvertido = registrosFiltrados.reduce((acc, registro) => acc + registro.costo, 0);
          this.ultimaFechaServicio =
            registrosFiltrados.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
              ?.fecha || 'Sin servicios';
        },
        error: (error) => {
          console.error('Error obteniendo información de la unidad:', error);
        },
      })


    } catch (error) {
      console.error('Error obteniendo información de la unidad:', error);
    }
  }

  async cargarHistorial() {
    this.historialUnidad = this.datos
      .filter((registro: any) => registro.unidad.unidad === this.evento.unidad.unidad)
      .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    this.actualizarTabla();
  }

  getTotalPaginas(): number {
    return Math.ceil(this.historialUnidad.length / this.registrosPorPagina);
  }

  actualizarTabla() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.registrosPaginados = this.historialUnidad.slice(inicio, fin);
  }

  paginaSiguiente() {
    if (this.paginaActual < this.getTotalPaginas()) {
      this.paginaActual++;
      this.actualizarTabla();
    }
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarTabla();
    }
  }

  exportarHisotiral() {
    const historialExportado = this.historialUnidad.map((registro: any) => {
        const { unidad, id, articulos, ...resto } = registro;

        // Transformar los artículos en una cadena delimitada por comas
        const articulosString = articulos
            ? articulos.map((articulo: any) => `${articulo.nombre} (Cantidad: ${articulo.cantidad})`).join(', ')
            : 'Sin artículos';

        return {
            ...resto,
            unidad: unidad.unidad,
            artículos: articulosString, // Agregamos la cadena de artículos como un nuevo campo
        };
    });

    // Exportar el historial transformado a Excel
    this.excelService.exportToExcel(
        historialExportado,
        `reporte_${this.operadorUnidad}_${this.placaUnidad}`
    );
}


  async cancel() {
    await this.modalController.dismiss();
  }
}
