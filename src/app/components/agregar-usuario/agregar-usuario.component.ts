import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { RolAdministrativo } from '../../models/usuario-autolog.model';
import { UserAdminService } from '../../services/auth/user-admin.service';
import { Planta } from '../../models/planta.model';
import { PlantAdminService } from '../../services/plants/plant-admin.service';
import { AUTOLOG_NAVIGATION, NavigationGroup, NavigationSectionId, availableNavigationSections, defaultNavigationSections } from '../menu/navigation.config';

interface RegistroUsuarioControls {
  email: FormControl<string>;
  password: FormControl<string>;
  usuario: FormControl<string>;
  rol: FormControl<RolAdministrativo | ''>;
  plantaIdPrincipal: FormControl<string>;
  plantasLectura: FormControl<string[]>;
  seccionesMenu: FormControl<NavigationSectionId[]>;
}

@Component({
  selector: 'app-agregar-usuario',
  templateUrl: './agregar-usuario.component.html',
  styleUrls: ['./agregar-usuario.component.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CommonModule],
})
export class AgregarUsuarioComponent implements OnInit {

  registroForm!: FormGroup<RegistroUsuarioControls>;
  saving = false;
  plants: Planta[] = [];

  constructor(
    private readonly userAdminService: UserAdminService,
    private readonly modalController: ModalController,
    private readonly toastController: ToastController,
    private readonly plantAdminService: PlantAdminService
  ) {}

  ngOnInit(): void {
    this.registroForm = new FormGroup<RegistroUsuarioControls>({
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6), Validators.maxLength(128)] }),
      usuario: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
      rol: new FormControl<RolAdministrativo | ''>('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^(admin|capturista|planta)$/)] }),
      plantaIdPrincipal: new FormControl('', { nonNullable: true }),
      plantasLectura: new FormControl<string[]>([], { nonNullable: true }),
      seccionesMenu: new FormControl<NavigationSectionId[]>([], { nonNullable: true }),
    });
    this.plantAdminService.list().subscribe(plants => this.plants = plants.filter(plant => plant.activo));
    this.registroForm.controls.rol.valueChanges.subscribe(role => {
      const principal = this.registroForm.controls.plantaIdPrincipal;
      if (role === 'planta') principal.addValidators(Validators.required);
      else { principal.clearValidators(); principal.setValue(''); this.registroForm.controls.plantasLectura.setValue([]); }
      principal.updateValueAndValidity();
      this.registroForm.controls.seccionesMenu.setValue(defaultNavigationSections(role));
    });
  }

  get permissionGroups(): NavigationGroup[] {
    const role = this.registroForm.controls.rol.value;
    const sections = new Set(availableNavigationSections(role));
    return AUTOLOG_NAVIGATION
      .filter(group => sections.has(group.id))
      .map(group => ({ ...group, items: group.items.filter(item => this.roleAllowsItem(item.permission)) }));
  }

  isSectionSelected(section: NavigationSectionId): boolean {
    return this.registroForm.controls.seccionesMenu.value.includes(section);
  }

  groupItemLabels(group: NavigationGroup): string {
    return group.items.map(item => item.label).join(' · ');
  }

  toggleSection(section: NavigationSectionId, event: Event): void {
    if (section === 'general') return;
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.registroForm.controls.seccionesMenu.value;
    const next = checked ? [...current, section] : current.filter(value => value !== section);
    this.registroForm.controls.seccionesMenu.setValue([...new Set(next)]);
    this.registroForm.controls.seccionesMenu.markAsDirty();
  }

  async registerUser(): Promise<void> {
    if (this.registroForm.invalid || this.saving) {
      this.registroForm.markAllAsTouched();
      await this.presentToast('Revisa los campos obligatorios.', 'warning');
      return;
    }

    this.saving = true;
    const value = this.registroForm.getRawValue();
    try {
      const result = await this.userAdminService.createUser({
        email: value.email,
        password: value.password,
        usuario: value.usuario,
        rol: value.rol as RolAdministrativo,
        tipoPersonal: 'SISTEMA',
        distribuidorId: null,
        accesoAutolog: true,
        accesoAsistencia: false,
        plantaIdPrincipal: value.rol === 'planta' ? value.plantaIdPrincipal : null,
        plantasLectura: value.rol === 'planta' ? value.plantasLectura.filter(id => id !== value.plantaIdPrincipal) : [],
        accesoTodasPlantas: value.rol !== 'planta',
        seccionesMenu: value.seccionesMenu,
      });
      this.registroForm.controls.password.reset('');
      await this.presentToast('Usuario registrado sin cambiar tu sesión.', 'success');
      await this.modalController.dismiss({ changed: true, uid: result.uid });
    } catch (error) {
      await this.presentToast(this.describeError(error), 'danger');
    } finally {
      this.registroForm.controls.password.reset('');
      this.saving = false;
    }
  }

  async cancel(): Promise<void> {
    if (this.saving) return;
    this.registroForm.controls.password.reset('');
    await this.modalController.dismiss({ changed: false });
  }

  private describeError(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('already-exists') || message.includes('email-already')) return 'El correo ya tiene una cuenta.';
    if (message.includes('permission-denied') || message.includes('permission')) return 'No tienes permisos para crear usuarios.';
    if (message.includes('invalid-argument')) return 'Revisa el correo, contraseña, nombre y rol.';
    return 'No fue posible registrar el usuario.';
  }

  private async presentToast(message: string, color: 'danger' | 'success' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2600, color, position: 'bottom' });
    await toast.present();
  }

  private roleAllowsItem(permission?: 'admin' | 'global'): boolean {
    const role = this.registroForm.controls.rol.value;
    if (permission === 'admin') return role === 'admin';
    if (permission === 'global') return ['admin', 'capturista', 'planta'].includes(role);
    return Boolean(role);
  }
}
