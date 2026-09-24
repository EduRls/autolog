import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertController, IonicModule, ModalController, ToastController } from '@ionic/angular';
import {
  RolAdministrativo,
  UsuarioAutolog,
} from '../../models/usuario-autolog.model';
import { UserAdminService } from '../../services/auth/user-admin.service';
import { Planta } from '../../models/planta.model';
import { PlantAdminService } from '../../services/plants/plant-admin.service';
import { AUTOLOG_NAVIGATION, NavigationGroup, NavigationSectionId, availableNavigationSections, defaultNavigationSections } from '../menu/navigation.config';

interface EditarUsuarioControls {
  email: FormControl<string>;
  usuario: FormControl<string>;
  rol: FormControl<RolAdministrativo>;
  activo: FormControl<boolean>;
  plantaIdPrincipal: FormControl<string>;
  plantasLectura: FormControl<string[]>;
  seccionesMenu: FormControl<NavigationSectionId[]>;
}

@Component({
  selector: 'app-editar-usuario',
  templateUrl: './editar-usuario.component.html',
  styleUrls: ['./editar-usuario.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class EditarUsuarioComponent implements OnInit {
  @Input({ required: true }) usuarioData!: UsuarioAutolog;
  @Input() allowDisable = false;

  editarForm!: FormGroup<EditarUsuarioControls>;
  saving = false;
  changed = false;
  plants: Planta[] = [];

  constructor(
    private readonly modalController: ModalController,
    private readonly userAdminService: UserAdminService,
    private readonly toastController: ToastController,
    private readonly alertController: AlertController,
    private readonly plantAdminService: PlantAdminService
  ) {}

  ngOnInit(): void {
    this.editarForm = new FormGroup<EditarUsuarioControls>({
      email: new FormControl(this.usuarioData.email, { nonNullable: true, validators: [Validators.required, Validators.email] }),
      usuario: new FormControl(this.usuarioData.usuario, { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
      rol: new FormControl(this.usuarioData.rol as RolAdministrativo, { nonNullable: true, validators: [Validators.required, Validators.pattern(/^(admin|capturista|planta)$/)] }),
      activo: new FormControl(this.usuarioData.activo, { nonNullable: true }),
      plantaIdPrincipal: new FormControl(this.usuarioData.plantaIdPrincipal || '', { nonNullable: true }),
      plantasLectura: new FormControl<string[]>(this.usuarioData.plantasLectura || [], { nonNullable: true }),
      seccionesMenu: new FormControl<NavigationSectionId[]>(this.usuarioData.seccionesMenu, { nonNullable: true }),
    });
    this.plantAdminService.list().subscribe(plants => this.plants = plants.filter(plant => plant.activo || this.usuarioData.plantaIdPrincipal === plant.id || this.usuarioData.plantasLectura.includes(plant.id)));
    this.editarForm.controls.rol.valueChanges.subscribe(role => {
      this.applyPlantValidators(role);
      this.editarForm.controls.seccionesMenu.setValue(defaultNavigationSections(role));
    });
    this.applyPlantValidators(this.editarForm.controls.rol.value);
  }

  get permissionGroups(): NavigationGroup[] {
    const role = this.editarForm.controls.rol.value;
    const sections = new Set(availableNavigationSections(role));
    return AUTOLOG_NAVIGATION
      .filter(group => sections.has(group.id))
      .map(group => ({ ...group, items: group.items.filter(item => this.roleAllowsItem(item.permission)) }));
  }

  isSectionSelected(section: NavigationSectionId): boolean {
    return this.editarForm.controls.seccionesMenu.value.includes(section);
  }

  groupItemLabels(group: NavigationGroup): string {
    return group.items.map(item => item.label).join(' · ');
  }

  toggleSection(section: NavigationSectionId, event: Event): void {
    if (section === 'general') return;
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.editarForm.controls.seccionesMenu.value;
    const next = checked ? [...current, section] : current.filter(value => value !== section);
    this.editarForm.controls.seccionesMenu.setValue([...new Set(next)]);
    this.editarForm.controls.seccionesMenu.markAsDirty();
  }

  async editarUsuario(): Promise<void> {
    if (this.editarForm.invalid || this.saving) {
      this.editarForm.markAllAsTouched();
      await this.presentToast('Revisa los campos obligatorios.', 'warning');
      return;
    }
    this.saving = true;
    try {
      const value = this.editarForm.getRawValue();
      await this.userAdminService.updateUser({
        uid: this.usuarioData.uid,
        email: value.email,
        usuario: value.usuario,
        rol: value.rol,
        activo: value.activo,
        tipoPersonal: 'SISTEMA',
        distribuidorId: null,
        accesoAutolog: true,
        accesoAsistencia: false,
        plantaIdPrincipal: value.rol === 'planta' ? value.plantaIdPrincipal : null,
        plantasLectura: value.rol === 'planta' ? value.plantasLectura.filter(id => id !== value.plantaIdPrincipal) : [],
        accesoTodasPlantas: value.rol !== 'planta',
        seccionesMenu: value.seccionesMenu,
      });
      this.changed = true;
      await this.presentToast('Usuario actualizado en Authentication y Firestore.', 'success');
      await this.cancel();
    } catch {
      await this.presentToast('No fue posible actualizar el usuario.', 'danger');
    } finally {
      this.saving = false;
    }
  }

  async confirmDisable(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Desactivar acceso',
      message: `La cuenta ${this.usuarioData.email} dejará de poder iniciar sesión.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Desactivar', role: 'destructive', handler: () => void this.disable() },
      ],
    });
    await alert.present();
  }

  async cancel(): Promise<void> {
    await this.modalController.dismiss({ changed: this.changed, uid: this.usuarioData.uid });
  }

  private async disable(): Promise<void> {
    this.saving = true;
    try {
      await this.userAdminService.disableUser(this.usuarioData.uid);
      this.changed = true;
      await this.presentToast('Acceso desactivado. El usuario y su historial se conservaron.', 'success');
      await this.cancel();
    } catch {
      await this.presentToast('No fue posible desactivar el acceso.', 'danger');
    } finally {
      this.saving = false;
    }
  }

  private async presentToast(message: string, color: 'danger' | 'success' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }

  private applyPlantValidators(role: RolAdministrativo): void {
    const principal = this.editarForm.controls.plantaIdPrincipal;
    if (role === 'planta') principal.addValidators(Validators.required);
    else { principal.clearValidators(); principal.setValue(''); this.editarForm.controls.plantasLectura.setValue([]); }
    principal.updateValueAndValidity({ emitEvent: false });
  }

  private roleAllowsItem(permission?: 'admin' | 'global'): boolean {
    const role = this.editarForm.controls.rol.value;
    if (permission === 'admin') return role === 'admin';
    if (permission === 'global') return ['admin', 'capturista', 'planta'].includes(role);
    return true;
  }
}
