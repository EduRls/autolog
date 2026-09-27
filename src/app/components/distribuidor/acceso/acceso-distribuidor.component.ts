import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { ManagedDistributorAccessResult, UsuarioAutolog } from '../../../models/usuario-autolog.model';
import { UserAdminService } from '../../../services/auth/user-admin.service';
import { AsistiaStatusComponent } from './asistia-status.component';

@Component({
  selector: 'app-acceso-distribuidor',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, AsistiaStatusComponent],
  templateUrl: './acceso-distribuidor.component.html',
  styleUrls: ['./acceso-distribuidor.component.scss'],
})
export class AccesoDistribuidorComponent implements OnInit {
  @Input({ required: true }) distribuidorId!: string;
  @Input() usuarioData: UsuarioAutolog | null = null;
  saving = false;
  changed = false;
  createdCredentials: ManagedDistributorAccessResult | null = null;
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
    usuario: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    activo: new FormControl(true, { nonNullable: true }),
  });
  constructor(private readonly users: UserAdminService, private readonly modalController: ModalController, private readonly toast: ToastController) {}
  get editing(): boolean { return Boolean(this.usuarioData); }
  ngOnInit(): void {
    if (this.usuarioData) this.form.patchValue(this.usuarioData);
    this.form.controls.password.setValidators([Validators.minLength(6), Validators.maxLength(128)]);
    this.form.controls.password.updateValueAndValidity();
  }
  async save(): Promise<void> {
    if (this.createdCredentials) {
      await this.modalController.dismiss({ changed: true, uid: this.createdCredentials.uid });
      return;
    }
    if (this.form.invalid || this.saving || !this.distribuidorId) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    try {
      const value = this.form.getRawValue();
      if (!this.usuarioData) {
        const result = await this.users.createManagedDistributorUser(this.distribuidorId);
        this.createdCredentials = result;
        this.changed = true;
        this.form.patchValue({
          email: result.email,
          usuario: result.usuario,
          password: result.temporaryPassword,
          activo: true,
        });
        return;
      }
      const identity = { email: value.email, usuario: value.usuario, rol: 'empleado' as const, tipoPersonal: 'DISTRIBUIDOR' as const, distribuidorId: this.distribuidorId, accesoAutolog: false, accesoAsistencia: true };
      const result = await this.users.updateUser({
        ...identity,
        uid: this.usuarioData.uid,
        activo: value.activo,
        password: value.password,
      });
      if (value.password) {
        const message = await this.toast.create({
          message: 'Contraseña actualizada correctamente.',
          color: 'success',
          duration: 2400,
          icon: 'checkmark-circle-outline',
        });
        await message.present();
      }
      await this.modalController.dismiss({ changed: true, uid: result.uid });
    } catch {
      const message = await this.toast.create({ message: 'No fue posible guardar el acceso ASISTIA.', color: 'danger', duration: 2800 });
      await message.present();
    } finally {
      if (!this.createdCredentials) this.form.controls.password.reset('');
      this.saving = false;
    }
  }
  async cancel(): Promise<void> {
    this.form.controls.password.reset('');
    await this.modalController.dismiss({
      changed: this.changed,
      uid: this.createdCredentials?.uid,
    });
  }
  async copyCredentials(): Promise<void> {
    if (!this.createdCredentials) return;
    const text = `Usuario: ${this.createdCredentials.usuario}\nContraseña temporal: ${this.createdCredentials.temporaryPassword}`;
    try {
      await navigator.clipboard.writeText(text);
      const message = await this.toast.create({ message: 'Credenciales copiadas.', color: 'success', duration: 1800 });
      await message.present();
    } catch {
      const message = await this.toast.create({ message: 'No fue posible copiar. Puedes seleccionar los datos manualmente.', color: 'warning', duration: 2800 });
      await message.present();
    }
  }
}
