import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service'; 

@Component({
  selector: 'app-agregar-usuario',
  templateUrl: './agregar-usuario.component.html',
  styleUrls: ['./agregar-usuario.component.scss'],
  standalone: true,
  imports: [FormsModule, IonicModule, ReactiveFormsModule, CommonModule]
})
export class AgregarUsuarioComponent  implements OnInit {

  registroForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private modalController: ModalController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.registroForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      usuario: ['', Validators.required],
      rol: ['', Validators.required],
    });
  }

  async registerUser() {
    if (this.registroForm.valid) {
      console.log(this.registroForm.value)
      const { email, password, usuario, rol } = this.registroForm.value;
      
      const result = await this.authService.register({ email, password, usuario, rol });
      if (result) {
        this.presentToast('Usuario registrado correctamente', 'success');
        this.closeModal();
      } else {
        this.presentToast('Error al registrar usuario', 'danger');
      }
      
    } else {
      this.presentToast('Por favor completa todos los campos', 'warning');
    }
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  async closeModal() {
    await this.modalController.dismiss();
  }

  async cancel() {
    await this.modalController.dismiss();
  }

}
