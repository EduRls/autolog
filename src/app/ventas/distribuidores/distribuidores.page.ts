import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { AgregarComponent } from 'src/app/components/distribuidor/agregar/agregar.component';
import { EditarComponent } from 'src/app/components/distribuidor/editar/editar.component';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';

@Component({
  selector: 'app-distribuidores',
  templateUrl: './distribuidores.page.html',
  styleUrls: ['./distribuidores.page.scss'],
})
export class DistribuidoresPage implements OnInit {

  distribuidores: any[] = [];
  distribuidoresFiltrados: any[] = [];
  distribuidoresPaginados: any[] = [];
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  busqueda: string = '';

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
        console.log(data)
        this.filtrarDistribuidores();
      },
      error: (error) => {
        console.error('Error al obtener los distribuidores:', error);
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

  /* 
  AGREGAR UN NUEVO OPERADOR
  */
  async addDistribuidor() {
    const modalOperador = await this.modalController.create({
      component: AgregarComponent,
      componentProps: {
        operadores: this.distribuidores
      },
      cssClass: 'my-custom-class-editar-operador'
    });

    modalOperador.present();
  }

  async editarDistribuidor(data: any) {
    const modalOperador = await this.modalController.create({
      component: EditarComponent,
      componentProps: {
        operadorData: data
      },
      cssClass: 'my-custom-class-editar-operador'
    });

    modalOperador.present();
  }

  async eliminarDistribuidor(id: string) {
    const alert = await this.alertController.create({
      header: 'Eliminar Distribuidor',
      message: '¿Estás seguro de que deseas eliminar este distribuidor?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.distribuidresService.deleteDistribuidor(id).then(res => {
              this.presentToast('Distribuidor eliminado correctamente', 'middle', 'success');
              this.getInfo();
            });
          }
        }
      ]
    });
    await alert.present();
  }

  transformarZona(zona: string): string {
    return zona === 'gpe' ? 'Guadalupe' :
      zona === 'zac' ? 'Zacatecas' :
        'Sin zona';
  }


}
