import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { UsuarioAutolog } from '../../../models/usuario-autolog.model';
import { UserAdminService } from '../../../services/auth/user-admin.service';
import { AsistiaStatusComponent } from './asistia-status.component';

@Component({
  selector: 'app-acceso-distribuidor',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, AsistiaStatusComponent],
  templateUrl: './acceso-distribuidor.component.html',
})
export class AccesoDistribuidorComponent implements OnInit {
  @Input({ required: true }) distribuidorId!: string;
  @Input() usuarioData: UsuarioAutolog | null = null;
  saving = false;
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    usuario: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    password: new FormControl('', { nonNullable: true }),
    activo: new FormControl(true, { nonNullable: true }),
  });
  constructor(private readonly users: UserAdminService, private readonly modalController: ModalController, private readonly toast: ToastController) {}
  ngOnInit(): void {
    if (this.usuarioData) this.form.patchValue(this.usuarioData);
    else this.form.controls.password.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(128)]);
    this.form.controls.password.updateValueAndValidity();
  }
  async save(): Promise<void> {
    if (this.form.invalid || this.saving || !this.distribuidorId) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    try {
      const value = this.form.getRawValue();
      const identity = { email: value.email, usuario: value.usuario, rol: 'empleado' as const, tipoPersonal: 'DISTRIBUIDOR' as const, distribuidorId: this.distribuidorId, accesoAutolog: false, accesoAsistencia: true };
      const result = this.usuarioData
        ? await this.users.updateUser({ ...identity, uid: this.usuarioData.uid, activo: value.activo })
        : await this.users.createUser({ ...identity, password: value.password });
      await this.modalController.dismiss({ changed: true, uid: result.uid });
    } catch {
      const message = await this.toast.create({ message: 'No fue posible guardar el acceso ASISTIA.', color: 'danger', duration: 2800 });
      await message.present();
    } finally { this.form.controls.password.reset(''); this.saving = false; }
  }
  async cancel(): Promise<void> {
    this.form.controls.password.reset('');
    await this.modalController.dismiss({ changed: false });
  }
}
