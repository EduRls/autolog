import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Subscription, distinctUntilChanged, map, merge } from 'rxjs';
import { Planta } from 'src/app/models/planta.model';
import { PlantScopeService } from 'src/app/services/plants/plant-scope.service';
import { SgmMedidoresService } from 'src/app/services/sgm/sgm-medidores.service';
import {
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
export class RegistroMedidoresComponent implements OnInit, OnDestroy {
  /** Registro a editar; si se omite, el formulario crea uno nuevo. */
  @Input() registro?: RegistroMedidores;

  form!: FormGroup;
  saving = false;
  /** Plantas disponibles como destino del registro. */
  plants: Planta[] = [];
  readonly estados = ESTADOS_OPERACION_MEDIDOR;
  readonly estadoLabel = ESTADO_OPERACION_LABEL;
  /** Consecutivo que seguiría, consultado en la colección de registros. */
  consecutivoSiguiente = '';
  private consultaConsecutivo = 0;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalController: ModalController,
    private readonly toastController: ToastController,
    private readonly sgmService: SgmMedidoresService,
    private readonly plantScope: PlantScopeService
  ) {}

  get isEdit(): boolean { return Boolean(this.registro); }
  get medidores(): FormArray<FormGroup> { return this.form.controls['medidores'] as FormArray<FormGroup>; }

  /** Consecutivo del registro, o el que seguiría si es nuevo. Lo asigna el sistema al guardar. */
  get consecutivoMostrado(): string {
    if (this.registro) return this.registro.consecutivo;
    return this.consecutivoSiguiente || '—';
  }

  async ngOnInit(): Promise<void> {
    const today = this.today();
    this.form = this.fb.group({
      plantaId: [this.registro?.plantaId ?? '', Validators.required],
      almacenamiento: [this.registro?.almacenamiento ?? '', [Validators.required, Validators.maxLength(250)]],
      fechaRegistro: [this.registro?.fechaRegistro ?? today, [Validators.required, this.sameYearAsConsecutivo]],
      medidores: this.fb.array<FormGroup>([]),
      realizo: [this.registro?.realizo ?? '', [Validators.required, Validators.maxLength(120)]],
      aprobo: [this.registro?.aprobo ?? '', [Validators.required, Validators.maxLength(120)]],
      fechaCierre: [this.registro?.fechaCierre ?? '', Validators.required],
    }, { validators: this.cierreAfterRegistro });

    const medidores = this.registro?.medidores?.length ? this.registro.medidores : [undefined];
    medidores.forEach(medidor => this.medidores.push(this.createMedidorGroup(medidor)));

    await this.setupPlants();

    if (!this.isEdit) {
      const plantaId$ = this.form.controls['plantaId'].valueChanges;
      const year$ = this.form.controls['fechaRegistro'].valueChanges.pipe(map(value => String(value || '').slice(0, 4)), distinctUntilChanged());
      this.subscriptions.add(merge(plantaId$, year$).subscribe(() => this.consultarConsecutivo()));
      await this.consultarConsecutivo();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /** Consulta el último consecutivo de la planta y año seleccionados y muestra el que sigue. */
  async consultarConsecutivo(): Promise<void> {
    const plantaId = this.form.controls['plantaId'].value;
    const year = Number(String(this.form.controls['fechaRegistro'].value || '').slice(0, 4));
    const consulta = ++this.consultaConsecutivo;
    this.consecutivoSiguiente = '';
    if (!plantaId || !year) return;
    try {
      const siguiente = await this.sgmService.getSiguienteConsecutivo(plantaId, year);
      if (consulta === this.consultaConsecutivo) this.consecutivoSiguiente = siguiente;
    } catch (error) {
      console.error(error);
    }
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
      if (this.registro) {
        await this.sgmService.updateRegistro(this.registro, payload);
        await this.presentToast(`Registro ${this.registro.consecutivo} actualizado correctamente.`, 'success');
      } else {
        const { consecutivo } = await this.sgmService.createRegistro(payload);
        await this.presentToast(`Registro ${consecutivo} guardado correctamente.`, 'success');
      }
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

  /**
   * Nuevo registro: se listan las plantas donde el usuario puede escribir y se preselecciona
   * la planta activa (o la única disponible). Al editar, la planta queda bloqueada.
   */
  private async setupPlants(): Promise<void> {
    await this.plantScope.initialize();
    const control = this.form.controls['plantaId'];
    const all = this.plantScope.snapshot().plants;
    if (this.registro) {
      this.plants = all.filter(plant => plant.id === this.registro!.plantaId);
      if (!this.plants.length) this.plants = [{ id: this.registro.plantaId, nombre: this.registro.plantaId } as Planta];
      control.disable();
      return;
    }
    this.plants = all.filter(plant => plant.activo !== false && this.plantScope.canWritePlant(plant.id));
    const active = this.plantScope.getActivePlantId();
    const preselected = active && this.plants.some(plant => plant.id === active)
      ? active
      : this.plants.length === 1 ? this.plants[0].id : '';
    control.setValue(preselected);
  }

  /** Al editar, la fecha debe permanecer en el año del consecutivo ya asignado. */
  private readonly sameYearAsConsecutivo = (control: AbstractControl): ValidationErrors | null => {
    const year = Number(String(this.registro?.consecutivo || '').split('/')[1]);
    if (!year || !control.value) return null;
    return Number(String(control.value).slice(0, 4)) === year ? null : { consecutivoYear: year };
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
