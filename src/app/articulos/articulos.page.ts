import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase/firebase.service';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AgregarArticuloComponent } from '../components/agregar-articulo/agregar-articulo.component';
import { StorageService } from '../services/storage/storage.service';

@Component({
  selector: 'app-articulos',
  templateUrl: './articulos.page.html',
  styleUrls: ['./articulos.page.scss'],
})
export class ArticulosPage implements OnInit {
  public userRole:string = ''

  articulos: any[] = []; // Todos los artículos
  registrosPaginados: any[] = []; // Artículos en la página actual
  paginaActual: number = 1; // Página actual
  registrosPorPagina: number = 5; // Número de registros por página
  articulosFiltrados: any[] = []; // Artículos filtrados por búsqueda


  constructor(
    private firebaseService: FirebaseService,
    private modalController: ModalController,
    private alertController: AlertController,
    private loadcontroller: LoadingController,
    private toastController: ToastController,
    private storageService: StorageService
  ) { }

  ngOnInit() {
    this.getArticulos();
  }

  async getArticulos() {
    this.firebaseService.getArticulos().subscribe({
      next: (articulos) => {
        this.storageService.get('currentUser').then((user:any) => {
          this.userRole = user.rol;
        })
        this.articulos = articulos;
        this.articulosFiltrados = [...this.articulos];
        this.actualizarTabla();
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  buscarArticulo(event: any) {
    const query = event.target.value.toLowerCase();
    if (query && query.trim() !== '') {
      this.articulosFiltrados = this.articulos.filter(articulo =>
        articulo.articulo.toLowerCase().includes(query) ||
        articulo.desc.toLowerCase().includes(query)
      );
    } else {
      this.articulosFiltrados = [...this.articulos];
    }
    this.paginaActual = 1; // Reinicia la paginación
    this.actualizarTabla();
  }

  getTotalPaginas(): number {
    return Math.ceil(this.articulosFiltrados.length / this.registrosPorPagina);
  }

  actualizarTabla() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.registrosPaginados = this.articulosFiltrados.slice(inicio, fin);
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

  async showLoading(msg:string) {
    const loading = await this.loadcontroller.create({
      message: msg,
      duration: 1500,
    });

    loading.present();
  }

  async presentToast(msg:string, position: 'top' | 'middle' | 'bottom', cl: 'danger' | 'success' | 'warning') {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: position,
      color: cl
    });

    await toast.present();
  }

  async agregarArticulo(){
    const modalAgregarArticulos = await this.modalController.create({
      component: AgregarArticuloComponent,
      cssClass: 'articulo-css'
    });

    modalAgregarArticulos.present();
  }

  async editarArticulo(articulo:any){
    const modalEditarArticulo = await this.modalController.create({
      component: AgregarArticuloComponent,
      cssClass: 'articulo-css',
      componentProps: {
        articulo: articulo
      }
    });

    modalEditarArticulo.present();
  }

  async borrarArticulo(item: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este artículo?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              this.showLoading('Eliminando artículo...');
              await this.firebaseService.deleteArticulo(item.id);
              this.presentToast('Artículo eliminado con éxito', 'bottom', 'success');
              this.getArticulos();
            } catch (error) {
              this.presentToast('Error al eliminar artículo', 'bottom', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

}
