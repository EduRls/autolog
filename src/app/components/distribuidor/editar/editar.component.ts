import { AccesoDistribuidorComponent } from 'src/app/components/distribuidor/acceso/acceso-distribuidor.component';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';
import { Distribuidor } from 'src/app/models/distribuidor.model';
import { UsuarioAutolog } from 'src/app/models/usuario-autolog.model';
import { UserAdminService } from 'src/app/services/auth/user-admin.service';

@Component({
  selector: 'app-editar',
  templateUrl: './editar.component.html',
  styleUrls: ['./editar.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class EditarComponent  implements OnInit {

  @Input() operadorData!: Distribuidor;
  @Input() canAdministerAccess = false;
  editarOperadorForm: FormGroup;
  linkedUsuario: UsuarioAutolog | null = null;
  accessLoading = false;
  saving = false;

  constructor(
    private modalController: ModalController,
    private distribuidorService: DistribuidoresService,
    private loadcontroller: LoadingController,
    private toastController: ToastController,
    private fb: FormBuilder,
    private userAdminService: UserAdminService
  ) { }

  ngOnInit() {
    this.editarOperadorForm = this.fb.group({
      id: [this.operadorData.id, Validators.required],
      nombre: [this.operadorData.nombre, [Validators.required, Validators.maxLength(160)]],
      identificador: [{ value: this.operadorData.identificador, disabled: true }],
      ruta: [this.operadorData.ruta, [Validators.required, Validators.maxLength(50)]],
      zona: [this.operadorData.zona, Validators.required]
    });

    if (this.canAdministerAccess) void this.loadLinkedUser();
  }

  async manageAccess(): Promise<void> {
    if (!this.canAdministerAccess || this.accessLoading || this.saving) return;
    const component = AccesoDistribuidorComponent;
    const componentProps = { distribuidorId: this.operadorData.id, usuarioData: this.linkedUsuario };
    const modal = await this.modalController.create({ component, componentProps, cssClass: 'usuario-modal' });
    await modal.present();
    const result = await modal.onDidDismiss<{ changed: boolean; uid?: string }>();
    if (result.data?.uid) this.operadorData.usuarioUid = result.data.uid;
    if (result.data?.changed) await this.loadLinkedUser();
  }

  private async loadLinkedUser(): Promise<void> {
    this.accessLoading = true;
    try {
      this.linkedUsuario = this.operadorData.usuarioUid
        ? await this.userAdminService.getUsuario(this.operadorData.usuarioUid)
        : await this.userAdminService.getUsuarioByDistribuidorId(this.operadorData.id);
    } catch {
      this.linkedUsuario = null;
    } finally {
      this.accessLoading = false;
    }
  }

  async presentToast(msg:string, position: 'top' | 'middle' | 'bottom', cl: 'danger' | 'success' | 'warning') {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: position,
      color: cl
    });

    await toast.present();
  }

  async cancel(): Promise<void> {
    if (this.saving) return;
    await this.modalController.dismiss({ changed: false });
  }

  async editarOperador(): Promise<void> {
    if (this.saving) return;
    this.normalizeForm();
    if (this.editarOperadorForm.invalid) {
      this.editarOperadorForm.markAllAsTouched();
      await this.presentToast('Completa los campos obligatorios correctamente.', 'bottom', 'warning');
      return;
    }

    const formValue = this.editarOperadorForm.value;
    this.saving = true;
    const loading = await this.loadcontroller.create({ message: 'Guardando cambios…' });
    await loading.present();
    try {
      await this.distribuidorService.updateDistribuidor(formValue);
      await this.presentToast('Distribuidor actualizado correctamente.', 'bottom', 'success');
      await this.modalController.dismiss({ changed: true });
    } catch {
      await this.presentToast('No fue posible actualizar el distribuidor.', 'bottom', 'danger');
    } finally {
      this.saving = false;
      await loading.dismiss();
    }
  }

  private normalizeForm(): void {
    const value = this.editarOperadorForm.getRawValue();
    this.editarOperadorForm.patchValue({
      nombre: this.normalizeUppercase(value.nombre),
      ruta: this.normalizeUppercase(value.ruta),
      zona: String(value.zona || '').trim().toLowerCase(),
    }, { emitEvent: false });
  }

  private normalizeUppercase(value: unknown): string {
    return String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
  }

}
