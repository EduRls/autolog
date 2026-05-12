import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AgregarAutoComponent } from '../components/agregar-auto/agregar-auto.component';
import { FirebaseService } from '../services/firebase/firebase.service';
import { EditarAutoComponent } from '../components/editar-auto/editar-auto.component';
import { StorageService } from '../services/storage/storage.service';


import * as XLSX from 'xlsx';

@Component({
  selector: 'app-autos',
  templateUrl: './autos.page.html',
  styleUrls: ['./autos.page.scss'],
})
export class AutosPage implements OnInit {
  public userRole:string = ''

  registros: any[] = []; // Lista completa de registros
  registrosPaginados: any[] = []; // Registros de la página actual
  paginaActual: number = 1; // Página actual
  registrosPorPagina: number = 5; // Número de registros por página
  registrosOriginales: any[] = []; // Lista completa sin filtrar


  constructor(
    private firebaseService: FirebaseService,
    private modalController: ModalController,
    private alertController: AlertController,
    private loadcontroller: LoadingController,
    private toastController: ToastController,
    private storageService: StorageService
  ) { }

  ngOnInit() {
    this.getAutos();
    this.actualizarTabla();
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

  async getAutos(){
    this.firebaseService.getAutos().subscribe({
      next: (data) => {
        this.storageService.get('currentUser').then((user:any) => {
          this.userRole = user.rol;
        })
        this.registros = data;
        this.registrosOriginales = [...data]; // Clona los datos originales
        this.actualizarTabla();
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  buscarAuto(event: any) {
    const query = event.target.value.toLowerCase(); // Obtén el texto del buscador en minúsculas
  
    if (query && query.trim() !== '') {
      // Filtra los registros por el término de búsqueda
      this.registros = this.registrosOriginales.filter((item) => {
        return (
          item.unidad.toLowerCase().includes(query) || // Filtra por "unidad"
          item.operador?.toLowerCase().includes(query) || // Filtra por "operador" (opcional si existe)
          item.descripcion?.toLowerCase().includes(query) // Filtra por "descripción" (opcional si existe)
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

  async addAuto(){
    const modalAddAuto = await this.modalController.create({
      component: AgregarAutoComponent,
      cssClass:'my-custom-class-add-auto'
    });

    modalAddAuto.present();
  }

  async editarAuto(item:any){
    const modalUpateAuto = await this.modalController.create({
      component: EditarAutoComponent,
      cssClass:'my-custom-class-add-auto',
      componentProps: {
        auto: item
      }
    });

    modalUpateAuto.present();
  }

  async borrarAuto(item: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar el registro ${item.unidad}?`,
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
            this.eliminarRegistro(item);
          },
        },
      ],
    });

    await alert.present();
  }

  eliminarRegistro(item: any) {
    try {
      this.firebaseService.deleteAuto(item.id).then((res:any) =>{
        this.presentToast('Registro eliminado correctamente!', 'bottom','success')
        this.getAutos();
        this.actualizarTabla();
      })
    } catch (error) {
      this.presentToast('Algo ha salido mal al intentar eliminar el registro!', 'bottom', 'danger')
    }
    
  }

}
