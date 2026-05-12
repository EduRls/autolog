import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
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
    if (this.loginForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Iniciando sesión...',
      });
      await loading.present();
  
      const { email, password } = this.loginForm.value;
  
      try {
        const userCredential = await this.authService.login({ email, password });
  
        if (userCredential) {
          // Obtén la información del usuario desde Firestore
          const userDoc = await this.firebaseService.getUserByEmail(email); // Necesitas implementar esta función
          const userData = userDoc ? userDoc.data() : null;
  
          if (userData) {
            // Guarda el usuario y rol en el almacenamiento local o en un servicio
            this.storageService.set('currentUser', userData); // Ejemplo con localStorage
            console.log('Información del usuario:', userData);
  
            // Muestra mensaje de éxito y redirige
            this.showToast('Inicio de sesión exitoso', 'success');
            this.router.navigate(['/home']); // Redirige al dashboard
          } else {
            // Si no se encuentra el usuario en Firestore
            this.showToast('El usuario no tiene un rol asignado', 'danger');
          }
        } else {
          // Si el inicio de sesión falló
          this.showToast('Correo o contraseña incorrectos', 'danger');
        }
      } catch (error) {
        console.error('Error durante el inicio de sesión:', error);
        this.showToast('Ocurrió un error al iniciar sesión', 'danger');
      } finally {
        loading.dismiss();
      }
    } else {
      this.showToast('Por favor, completa los campos correctamente', 'warning');
    }
  }
  

  async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
    });
    await toast.present();
  }

  goToRegister() {
    this.router.navigate(['/register']); // Cambia la ruta a la pantalla de registro
  }

  recoverPassword() {
    this.router.navigate(['/recover-password']); // Cambia la ruta a la pantalla de recuperación de contraseña
  }

}
