import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { FirebaseService } from '../services/firebase/firebase.service';
import { StorageService } from '../services/storage/storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private firebaseService: FirebaseService,
    private storageService: StorageService
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async login() {
    if (!this.loginForm.valid) {
      await this.showToast('Por favor, completa los campos correctamente', 'warning');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Iniciando sesión...' });
    await loading.present();
    const { email, password } = this.loginForm.value;

    try {
      const userCredential = await this.authService.login({ email, password });

      if (!userCredential) {
        await this.showToast('Correo o contraseña incorrectos', 'danger');
        return;
      }

      const userDoc = await this.firebaseService.getUserProfile(userCredential.user.uid, email);
      const userData = userDoc?.data();

      if (!userData) {
        await this.showToast('El usuario no tiene un rol asignado', 'danger');
        return;
      }

      const normalizedUser = {
        ...userData,
        rol: String(userData['rol'] || '').trim().toLowerCase()
      };

      await this.storageService.set('currentUser', normalizedUser);
      await this.showToast('Inicio de sesión exitoso', 'success');
      await this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      await this.showToast('Ocurrió un error al iniciar sesión', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({ message, duration: 2000, color });
    await toast.present();
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  recoverPassword() {
    this.router.navigate(['/recover-password']);
  }
}
