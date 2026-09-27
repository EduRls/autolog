import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Planta } from 'src/app/models/planta.model';
import { PlantScopeService } from 'src/app/services/plants/plant-scope.service';
import { SgmMedidoresService } from 'src/app/services/sgm/sgm-medidores.service';
import {
  CONSECUTIVO_PATTERN,
  ESTADO_OPERACION_LABEL,
  ESTADOS_OPERACION_MEDIDOR,
  MedidorRegistro,
  RegistroMedidores,
  RegistroMedidoresPayload,
} from 'src/app/sgm/sgm.models';

@Component({
  selector: 'app-registro-medidores',
  templateUrl: './registro-medidores.component.html',
  styleUrls: ['./registro-medidores.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class RegistroMedidoresComponent implements OnInit {
  /** Registro a editar; si se omite, el formulario crea uno nuevo. */
  @Input() registro?: RegistroMedidores;
  /** Consecutivo sugerido para un registro nuevo. */
  @Input() consecutivoSugerido = '';
  /** Consecutivos ya usados en la planta, para evitar duplicados. */
  @Input() consecutivosExistentes: string[] = [];

  form!: FormGroup;
  saving = false;
  plants: Planta[] = [];
  showPlantSelector = false;
  readonly estados = ESTADOS_OPERACION_MEDIDOR;
  readonly estadoLabel = ESTADO_OPERACION_LABEL;

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalController: ModalController,
    private readonly toastController: ToastController,
    private readonly sgmService: SgmMedidoresService,
    private readonly plantScope: PlantScopeService
  ) {}

  get isEdit(): boolean { return Boolean(this.registro); }
  get medidores(): FormArray<FormGroup> { return this.form.controls['medidores'] as FormArray<FormGroup>; }

  async ngOnInit(): Promise<void> {
    const today = this.today();
    this.form = this.fb.group({
      plantaId: [''],
      almacenamiento: [this.registro?.almacenamiento ?? '', [Validators.required, Validators.maxLength(250)]],
      consecutivo: [this.registro?.consecutivo ?? this.consecutivoSugerido, [Validators.required, Validators.pattern(CONSECUTIVO_PATTERN), this.uniqueConsecutivo]],
      fechaRegistro: [this.registro?.fechaRegistro ?? today, Validators.required],
      medidores: this.fb.array<FormGroup>([]),
      realizo: [this.registro?.realizo ?? '', [Validators.required, Validators.maxLength(120)]],
      aprobo: [this.registro?.aprobo ?? '', [Validators.required, Validators.maxLength(120)]],
      fechaCierre: [this.registro?.fechaCierre ?? '', Validators.required],
    }, { validators: this.cierreAfterRegistro });

    const medidores = this.registro?.medidores?.length ? this.registro.medidores : [undefined];
    medidores.forEach(medidor => this.medidores.push(this.createMedidorGroup(medidor)));

    if (!this.isEdit) await this.setupPlantSelector();
  }

  addMedidor(): void {
    this.medidores.push(this.createMedidorGroup());
  }

  removeMedidor(index: number): void {
    if (this.medidores.length === 1) return;
    this.medidores.removeAt(index);
  }

  invalid(control: AbstractControl | null): boolean {
    return Boolean(control && control.touched && control.invalid);
  }

  async cancel(): Promise<void> {
    if (this.saving) return;
    await this.modalController.dismiss();
  }

  async save(): Promise<void> {
    if (this.saving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.presentToast('Completa correctamente los campos obligatorios.', 'warning');
      return;
    }
    this.saving = true;
    try {
      const payload = this.form.getRawValue() as RegistroMedidoresPayload;
      if (this.registro) await this.sgmService.updateRegistro(this.registro, payload);
      else await this.sgmService.createRegistro(payload);
      await this.presentToast(this.isEdit ? 'Registro actualizado correctamente.' : 'Registro guardado correctamente.', 'success');
      await this.modalController.dismiss(payload, 'saved');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error && error.message === 'PLANT_REQUIRED'
        ? 'Selecciona la planta destino del registro.'
        : 'No fue posible guardar el registro.';
      await this.presentToast(message, 'danger');
    } finally {
      this.saving = false;
    }
  }

  private createMedidorGroup(medidor?: MedidorRegistro): FormGroup {
    return this.fb.group({
      identificacionInterna: [medidor?.identificacionInterna ?? '', [Validators.required, Validators.maxLength(40)]],
      descripcion: [medidor?.descripcion ?? '', [Validators.required, Validators.maxLength(200)]],
      marca: [medidor?.marca ?? '', [Validators.required, Validators.maxLength(80)]],
      modelo: [medidor?.modelo ?? '', [Validators.required, Validators.maxLength(80)]],
      numeroSerie: [medidor?.numeroSerie ?? '', [Validators.required, Validators.maxLength(80)]],
      localizacion: [medidor?.localizacion ?? '', [Validators.required, Validators.maxLength(150)]],
      estadoOperacion: [medidor?.estadoOperacion ?? 'EN_OPERACION', Validators.required],
    });
  }

  private async setupPlantSelector(): Promise<void> {
    await this.plantScope.initialize();
    this.plants = this.plantScope.snapshot().plants;
    this.showPlantSelector = this.plantScope.isGlobal() && !this.plantScope.getActivePlantId();
    const control = this.form.controls['plantaId'];
    if (this.showPlantSelector) control.addValidators(Validators.required);
    else control.setValue(this.plantScope.getActivePlantId() || this.plantScope.getPrincipalPlantId() || '');
    control.updateValueAndValidity();
  }

  private readonly uniqueConsecutivo = (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value || '').trim();
    if (!value || value === this.registro?.consecutivo) return null;
    return this.consecutivosExistentes.includes(value) ? { duplicated: true } : null;
  };

  private readonly cierreAfterRegistro = (group: AbstractControl): ValidationErrors | null => {
    const registro = group.get('fechaRegistro')?.value;
    const cierre = group.get('fechaCierre')?.value;
    return registro && cierre && cierre < registro ? { cierreBeforeRegistro: true } : null;
  };

  private today(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private async presentToast(message: string, color: 'danger' | 'success' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 1800, position: 'bottom', color });
    await toast.present();
  }
}
