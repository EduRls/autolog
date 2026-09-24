import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import {
  AttendanceHistoryEvent,
  AttendanceLocationInput,
  AutologWorkerProfile,
} from '../models/attendance.model';
import { AttendanceService } from '../services/attendance/attendance.service';
import { AuthService } from '../services/auth/auth.service';

type ClockState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-reloj',
  templateUrl: './reloj.page.html',
  styleUrls: ['./reloj.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class RelojPage implements OnInit, OnDestroy {
  profile: AutologWorkerProfile | null = null;
  events: AttendanceHistoryEvent[] = [];
  state: ClockState = 'loading';
  now = new Date();
  submitting = false;
  private pendingIdempotencyKey: string | null = null;
  private clockInterval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly attendance: AttendanceService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.clockInterval = setInterval(() => this.now = new Date(), 1000);
    void this.load();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  get nextLabel(): string {
    return this.events[0]?.tipo === 'ENTRADA' ? 'Registrar salida' : 'Registrar entrada';
  }

  get personalDetail(): string {
    if (!this.profile) return '';
    const personal = this.profile.personal;
    return ['Distribuidor', personal.ruta && `Ruta ${personal.ruta}`, personal.zona].filter(Boolean).join(' · ');
  }

  async load(): Promise<void> {
    this.state = 'loading';
    try {
      const [profile, events] = await Promise.all([
        this.attendance.getMyProfile(),
        this.attendance.getMyAttendance(),
      ]);
      this.profile = profile;
      this.events = events;
      this.state = 'ready';
    } catch (error) {
      this.state = 'error';
      await this.toast(this.describeError(error), 'danger');
    }
  }

  async register(): Promise<void> {
    if (this.submitting || this.state !== 'ready') return;
    this.submitting = true;
    this.pendingIdempotencyKey ??= this.createIdempotencyKey();
    try {
      const ubicacion = await this.getLocationIfAvailable();
      const result = await this.attendance.registerAttendance(
        this.pendingIdempotencyKey,
        ubicacion
      );
      this.pendingIdempotencyKey = null;
      await this.toast(
        result.duplicado ? 'El registro ya había sido procesado.' : `${result.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} registrada.`,
        'success'
      );
      this.events = await this.attendance.getMyAttendance();
    } catch (error) {
      await this.toast(this.describeError(error), 'danger');
    } finally {
      this.submitting = false;
    }
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/reloj/login', { replaceUrl: true });
  }

  private createIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID().replace(/-/g, '_');
    }
    return `${Date.now()}_${Math.random().toString(36).slice(2)}_attendance`;
  }

  private async getLocationIfAvailable(): Promise<AttendanceLocationInput | undefined> {
    if (!navigator.geolocation) return undefined;
    return new Promise(resolve => navigator.geolocation.getCurrentPosition(
      position => resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }),
      () => resolve(undefined),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    ));
  }

  private describeError(error: unknown): string {
    const code = typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : '';
    if (code.includes('permission-denied')) return 'Tu cuenta no tiene acceso a asistencia o está inactiva.';
    if (code.includes('failed-precondition') || code.includes('not-found')) return 'Tu vínculo laboral necesita revisión administrativa.';
    if (code.includes('network')) return 'No hay conexión. El mismo intento podrá reanudarse sin duplicarse.';
    return 'No fue posible completar la operación.';
  }

  private async toast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({ message, color, duration: 2800 });
    await toast.present();
  }
}
