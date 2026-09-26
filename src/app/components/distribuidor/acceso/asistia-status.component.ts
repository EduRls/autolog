import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { AlertController, IonicModule } from '@ionic/angular';
import { AsistiaAdminStatus, AsistiaOnboardingAdminService } from '../../../services/attendance/asistia-onboarding-admin.service';

@Component({
  selector: 'app-asistia-status', standalone: true, imports: [CommonModule, IonicModule],
  styleUrls: ['./asistia-status.component.scss'],
  template: `
    <section class="status-section" aria-label="Estado ASISTIA">
      <div class="status-heading">
        <span class="status-heading-icon"><ion-icon name="phone-portrait-outline" aria-hidden="true"></ion-icon></span>
        <div><h2>Estado en ASISTIA</h2><p>Configuración del teléfono y verificación de presencia.</p></div>
      </div>
      <div class="status-loading" *ngIf="loading" role="status"><ion-spinner name="crescent"></ion-spinner><span>Cargando configuración…</span></div>
      <div class="status-error" *ngIf="error" role="alert"><ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon><span>{{ error }}</span><button type="button" (click)="load()">Reintentar</button></div>
      <ng-container *ngIf="status && !loading">
        <div class="overall-state" [class.ready]="status.onboarding.completed">
          <ion-icon [name]="status.onboarding.completed ? 'checkmark-circle-outline' : 'time-outline'" aria-hidden="true"></ion-icon>
          <span><small>Estado general</small><strong>{{ status.onboarding.completed ? 'Listo para presencia facial' : 'Configuración pendiente' }}</strong></span>
        </div>
        <div class="status-grid">
          <article [class.complete]="status.onboarding.generalPoliciesAccepted"><ion-icon name="document-text-outline" aria-hidden="true"></ion-icon><span><small>Políticas</small><strong>{{ status.onboarding.generalPoliciesAccepted ? 'Aceptadas' : 'Pendientes' }}</strong></span></article>
          <article [class.complete]="status.device.linked"><ion-icon name="phone-portrait-outline" aria-hidden="true"></ion-icon><span><small>Dispositivo</small><strong>{{ status.device.linked ? 'Vinculado' : 'No vinculado' }}</strong></span></article>
          <article [class.complete]="status.faceVerification.presenceConfigured"><ion-icon name="scan-outline" aria-hidden="true"></ion-icon><span><small>Presencia facial</small><strong>{{ status.faceVerification.presenceConfigured ? 'Configurada' : 'Pendiente' }}</strong></span></article>
        </div>
        <p class="device-detail" *ngIf="status.device.linked"><ion-icon name="information-circle-outline" aria-hidden="true"></ion-icon>{{ status.device.platform }} · vinculado el {{ status.device.linkedAt | date:'dd/MM/yyyy HH:mm':'-0600' }}</p>
        <p class="mode-note" *ngIf="status.onboarding.biometricMode === 'BIOMETRIC_OPT_IN'">Modalidad personalizada solicitada: pendiente de proveedor. Identidad biométrica no verificada.</p>
        <p class="mode-note" *ngIf="status.onboarding.biometricMode === 'PRESENCE_ONLY'">Modalidad activa: presencia facial sin referencia biométrica.</p>
        <button class="unlink-button" type="button" *ngIf="status.canResetDevice && status.device.linked" [disabled]="resetting" (click)="confirmReset()"><ion-spinner *ngIf="resetting" name="crescent"></ion-spinner><ion-icon *ngIf="!resetting" name="unlink-outline" aria-hidden="true"></ion-icon>{{ resetting ? 'Desvinculando…' : 'Desvincular dispositivo' }}</button>
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
