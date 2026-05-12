import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController, LoadingController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';


@Component({
  selector: 'app-editar-usuario',
  templateUrl: './editar-usuario.component.html',
  styleUrls: ['./editar-usuario.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class EditarUsuarioComponent  implements OnInit {

  @Input() usuarioData: any; // Datos del usuario a editar
  editarForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private modalController: ModalController,
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    // Inicializa el formulario con los datos actuales del usuario
    this.editarForm = this.fb.group({
      id: [this.usuarioData.id, Validators.required], // ID del usuario
      usuario: [this.usuarioData.usuario, Validators.required],
      rol: [this.usuarioData.rol, Validators.required]
    });
  }

  async cancel() {
    await this.modalController.dismiss();
  }

  async showLoading(message: string) {
    const loading = await this.loadingController.create({
      message,
      duration: 1000
    });
    await loading.present();
  }

  async presentToast(message: string, color: 'danger' | 'success' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'bottom',
      color
    });
    await toast.present();
  }

  async editarUsuario() {
    if (this.editarForm.valid) {
      await this.showLoading('Guardando cambios...');

      try {
        const updatedData = this.editarForm.value; // Datos actualizados
        await this.firebaseService.updateUsuario(updatedData);
        this.presentToast('Usuario editado correctamente', 'success');
        this.cancel();
      } catch (error) {
        console.error('Error al editar usuario:', error);
        this.presentToast('Error al guardar los cambios', 'danger');
      }
    } else {
      this.presentToast('Todos los campos son obligatorios', 'warning');
    }
  }

}
