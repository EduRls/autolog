import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { FirebaseService } from '../services/firebase/firebase.service';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { AgregarUsuarioComponent } from '../components/agregar-usuario/agregar-usuario.component';
import { EditarUsuarioComponent } from '../components/editar-usuario/editar-usuario.component';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
})
export class UsuariosPage implements OnInit {
  usuarios: any[] = []; // Lista de usuarios
  constructor(
    private firebaseService: FirebaseService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.cargarUsuarios();
  }

  // Mostrar un mensaje tipo Toast
  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  async cargarUsuarios() {
    this.firebaseService.getUsuarios().subscribe((usuarios: any[]) => {
      this.usuarios = usuarios;
    });
  }

  // Agregar un nuevo usuario
  async agregarUsuario() {
    const modal = await this.modalController.create({
      component: AgregarUsuarioComponent,
      cssClass: 'usuario-modal'
    });
    modal.onDidDismiss().then(() => {
      this.cargarUsuarios(); // Recarga la lista de usuarios al cerrar el modal
    });
    await modal.present();
  }

  // Editar un usuario
  async editarUsuario(usuario: any) {
    const modal = await this.modalController.create({
      component: EditarUsuarioComponent,
      cssClass: 'usuario-modal',
      componentProps: {
        usuarioData: usuario
      }
    });
    modal.onDidDismiss().then(() => {
      this.cargarUsuarios(); // Recarga la lista de usuarios al cerrar el modal
    });
    await modal.present();
  }

  // Eliminar un usuario
  async eliminarUsuario(usuario: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar a <b>${usuario.usuario}</b>?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {}
        },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.firebaseService.deleteUsuario(usuario.id);
              this.presentToast('Usuario eliminado correctamente', 'success');
              this.cargarUsuarios(); // Recarga la lista de usuarios
            } catch (error) {
              console.error(error);
              this.presentToast('Error al eliminar usuario', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

}
