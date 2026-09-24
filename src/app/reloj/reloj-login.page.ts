import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AttendanceService } from '../services/attendance/attendance.service';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-reloj-login',
  templateUrl: './reloj-login.page.html',
  styleUrls: ['./reloj.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class RelojLoginPage implements OnInit, OnDestroy {
  readonly loginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });
  loading = false;
  resetting = false;
  private authSubscription?: Subscription;

  constructor(
    private readonly auth: AuthService,
    private readonly attendance: AttendanceService,
    private readonly router: Router,
    private readonly toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.authSubscription = this.auth.user$.subscribe(user => {
      if (user && !this.loading) void this.restoreSession();
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.loginForm.controls.password.reset('');
  }

  async login(): Promise<void> {
    if (this.loginForm.invalid || this.loading) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    try {
      const value = this.loginForm.getRawValue();
      await this.auth.loginWithEmailPassword(value);
      await this.attendance.getMyProfile();
      this.loginForm.controls.password.reset('');
      await this.router.navigateByUrl('/reloj', { replaceUrl: true });
    } catch (error) {
      await this.auth.logout().catch(() => undefined);
      await this.toast(this.describeError(error), 'danger');
    } finally {
      this.loginForm.controls.password.reset('');
      this.loading = false;
    }
  }

  async recoverPassword(): Promise<void> {
    const email = this.loginForm.controls.email.value.trim();
    if (!email || this.loginForm.controls.email.invalid || this.resetting) {
      this.loginForm.controls.email.markAsTouched();
      await this.toast('Ingresa primero un correo válido.', 'warning');
      return;
    }
    this.resetting = true;
    try {
      await this.auth.sendPasswordReset(email);
      await this.toast('Si el correo tiene una cuenta, recibirá instrucciones.', 'success');
    } catch {
      await this.toast('No fue posible enviar el correo. Revisa tu conexión.', 'danger');
    } finally {
      this.resetting = false;
    }
  }

  private async restoreSession(): Promise<void> {
    try {
      await this.attendance.getMyProfile();
      await this.router.navigateByUrl('/reloj', { replaceUrl: true });
    } catch {
      await this.auth.logout().catch(() => undefined);
    }
  }

  private describeError(error: unknown): string {
    const code = typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : '';
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
      return 'Correo o contraseña incorrectos.';
    }
    if (code.includes('user-disabled')) return 'Esta cuenta se encuentra desactivada.';
    if (code.includes('permission-denied')) return 'La cuenta no tiene acceso al reloj checador.';
    if (code.includes('not-found') || code.includes('failed-precondition')) {
      return 'La cuenta no tiene un perfil laboral activo y válido.';
    }
    if (code.includes('network')) return 'No hay conexión. Intenta nuevamente.';
    return 'No fue posible iniciar sesión en el reloj checador.';
  }

  private async toast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({ message, color, duration: 2800 });
    await toast.present();
  }
}
