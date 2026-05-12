import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
})
export class ProductosPage implements OnInit {

  // Variables para distribuidores
  distribuidores: any[] = [];
  distribuidoresFiltrados: any[] = [];
  distribuidoresPaginados: any[] = [];
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  busqueda: string = '';

  // Variables para selección y productos
  isDistribuidorSelected: boolean = false;
  distribuidorSelected: any = {};
  productosListisSelected: boolean = false;
  productosList: any[] = [];

  // Variables para la paginación de productos
  productosListPaginados: any[] = [];
  productosPaginaActual: number = 1;
  productosRegistrosPorPagina: number = 6;

  asignaciones: any[] = [];

  constructor(
    private distribuidresService: DistribuidoresService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
  ) { }

  ngOnInit() {
    this.getInfo();
  }

  async getInfo() {
    this.distribuidresService.getDistribuidores().subscribe({
      next: (data) => {
        this.distribuidores = data;
        this.filtrarDistribuidores();
      },
      error: (error) => {
        console.error('Error al obtener los distribuidores:', error);
      }
    });

    this.distribuidresService.getAsignacionesVentas().subscribe({
      next: (asignaciones) => {
        console.log(asignaciones)
        this.asignaciones = asignaciones;
      },
      error: (error) => {
        console.error('Error al obtener las asignaciones de ventas:', error);
      }
    });
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

  onSearchBarChange(event: any) {
    this.busqueda = event.detail.value || '';
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    if (!this.busqueda.trim()) {
      this.distribuidoresFiltrados = [...this.distribuidores];
    } else {
      const filtro = this.busqueda.toLowerCase();
      this.distribuidoresFiltrados = this.distribuidores.filter(distribuidor =>
        distribuidor.nombre.toLowerCase().includes(filtro) ||
        distribuidor.identificador.toLowerCase().includes(filtro)
      );
    }
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }


  // Paginación para distribuidores
  filtrarDistribuidores() {
    if (!this.busqueda.trim()) {
      this.distribuidoresFiltrados = [...this.distribuidores];
    } else {
      const filtro = this.busqueda.toLowerCase();
      this.distribuidoresFiltrados = this.distribuidores.filter(distribuidor =>
        distribuidor.nombre.toLowerCase().includes(filtro) ||
        distribuidor.identificador.toLowerCase().includes(filtro)
      );
    }
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.distribuidoresPaginados = this.distribuidoresFiltrados.slice(inicio, fin);
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarPaginacion();
    }
  }

  paginaSiguiente() {
    if (this.paginaActual < this.getTotalPaginas()) {
      this.paginaActual++;
      this.actualizarPaginacion();
    }
  }

  getTotalPaginas(): number {
    return Math.ceil(this.distribuidoresFiltrados.length / this.registrosPorPagina);
  }

  // Seleccionar distribuidor y actualizar productos
seleccionarDistribuidor(distribuidor: any) {
  this.distribuidorSelected = distribuidor;
  this.isDistribuidorSelected = true;

  const asignaciones = this.asignaciones.filter((val: any) => val.id_vendedor == this.distribuidorSelected.identificador);

  if (asignaciones.length === 0) {
    this.presentToast('No hay productos asignados para este distribuidor hoy.', 'bottom', 'warning');
    this.productosList = [];
    this.actualizarPaginacionProductos();
    return;
  } else {
    this.productosListisSelected = true;

    let productosAcumulados: any[] = [];

    for (const asignacion of asignaciones) {
      const productosObj = asignacion.productos;

      const productos = Object.values(productosObj).flatMap((productoSet: any) => {
        return Object.entries(productoSet).map(([codigo, detalle]: [string, any]) => {
          return { codigo, ...detalle };
        });
      });

      productosAcumulados.push(...productos);
    }

    // 🔄 Ahora sí, ordena después de acumular todo
    productosAcumulados.sort((a, b) => {
      const fechaA = new Date(a.fecha_asignacion);
      const fechaB = new Date(b.fecha_asignacion);
      return fechaA.getTime() - fechaB.getTime(); // Orden ascendente
    });

    this.productosList = productosAcumulados;

    // Reiniciamos la paginación de productos
    this.productosPaginaActual = 1;
    this.actualizarPaginacionProductos();
  }
}


  // Paginación para productos
  actualizarPaginacionProductos() {
    const inicio = (this.productosPaginaActual - 1) * this.productosRegistrosPorPagina;
    const fin = inicio + this.productosRegistrosPorPagina;
    this.productosListPaginados = this.productosList.slice(inicio, fin);
  }

  productosPaginaAnterior() {
    if (this.productosPaginaActual > 1) {
      this.productosPaginaActual--;
      this.actualizarPaginacionProductos();
    }
  }

  productosPaginaSiguiente() {
    if (this.productosPaginaActual < this.getTotalPaginasProductos()) {
      this.productosPaginaActual++;
      this.actualizarPaginacionProductos();
    }
  }

  getTotalPaginasProductos(): number {
    return Math.ceil(this.productosList.length / this.productosRegistrosPorPagina);
  }
}
