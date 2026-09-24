import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { AlertController, IonicModule } from '@ionic/angular';
import { AsistiaAdminStatus, AsistiaOnboardingAdminService } from '../../../services/attendance/asistia-onboarding-admin.service';

@Component({
  selector: 'app-asistia-status', standalone: true, imports: [CommonModule, IonicModule],
  template: `
    <section aria-label="Estado ASISTIA">
      <h2>ASISTIA</h2>
      <p *ngIf="loading" role="status">Cargando configuración…</p>
      <p *ngIf="error" role="alert">{{ error }} <ion-button (click)="load()">Reintentar</ion-button></p>
      <ng-container *ngIf="status && !loading">
        <p>Políticas: {{ status.onboarding.generalPoliciesAccepted ? 'Aceptadas' : 'Pendientes' }}</p>
        <p>Estado: {{ status.onboarding.completed ? 'Listo para presencia facial' : 'Pendiente' }}</p>
        <p>Dispositivo: {{ status.device.linked ? 'Vinculado' : 'No vinculado' }}</p>
        <p *ngIf="status.device.linked">{{ status.device.platform }} · {{ status.device.linkedAt | date:'dd/MM/yyyy HH:mm':'-0600' }}</p>
        <p>Presencia facial: {{ status.faceVerification.presenceConfigured ? 'Configurada' : 'Pendiente' }}</p>
        <p *ngIf="status.onboarding.biometricMode === 'BIOMETRIC_OPT_IN'">Modalidad personalizada solicitada: pendiente de proveedor. Identidad biométrica no verificada.</p>
        <p *ngIf="status.onboarding.biometricMode === 'PRESENCE_ONLY'">Modalidad: presencia facial sin referencia biométrica.</p>
        <ion-button *ngIf="status.canResetDevice && status.device.linked" color="warning" [disabled]="resetting" (click)="confirmReset()">Desvincular dispositivo</ion-button>
      </ng-container>
    </section>`,
})
export class AsistiaStatusComponent implements OnChanges {
  @Input({ required: true }) distribuidorId!: string;
  status: AsistiaAdminStatus | null = null;
  loading = false;
  resetting = false;
  error: string | null = null;
  private version = 0;
  constructor(private readonly service: AsistiaOnboardingAdminService, private readonly alerts: AlertController) {}
  ngOnChanges(): void { void this.load(); }
  async load(): Promise<void> {
    if (!this.distribuidorId) return;
    const version = ++this.version;
    this.loading = true; this.error = null;
    try { const status = await this.service.getStatus(this.distribuidorId); if (version === this.version) this.status = status; }
    catch { if (version === this.version) { this.status = null; this.error = 'No fue posible cargar el estado ASISTIA.'; } }
    finally { if (version === this.version) this.loading = false; }
  }
  async confirmReset(): Promise<void> {
    if (!this.status?.canResetDevice || this.resetting) return;
    const id = this.distribuidorId;
    const alert = await this.alerts.create({ header: 'Desvincular dispositivo',
      message: 'La instalación actual dejará de registrar asistencia. El trabajador deberá vincular un dispositivo y repetir la configuración de presencia. Los históricos se conservan.',
      buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Desvincular', role: 'confirm' }] });
    await alert.present();
    const result = await alert.onDidDismiss();
    if (result.role !== 'confirm' || id !== this.distribuidorId) return;
    this.resetting = true; this.error = null;
    try { await this.service.resetDevice(id); await this.load(); }
    catch { this.error = 'No fue posible desvincular el dispositivo.'; }
    finally { this.resetting = false; }
  }
}
