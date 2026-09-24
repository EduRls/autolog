import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';
import { Planta } from 'src/app/models/planta.model';
import { PlantScopeService } from 'src/app/services/plants/plant-scope.service';

@Component({
  selector: 'app-agregar',
  templateUrl: './agregar.component.html',
  styleUrls: ['./agregar.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
})
export class AgregarComponent implements OnInit {

  operadorNuevo!: FormGroup;
  saving = false;
  readonly idempotencyKey = crypto.randomUUID();
  plants: Planta[] = [];
  showPlantSelector = false;

  constructor(
    private fb: FormBuilder,
    private modalController: ModalController,
    private toastController: ToastController,
    private loadController: LoadingController,
    private ditribuidresService: DistribuidoresService,
    private readonly plantScope: PlantScopeService
  ) { }

  ngOnInit() {
    this.operadorNuevo = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(160)]],
      ruta: ['', [Validators.required, Validators.maxLength(50)]],
      zona: ['', Validators.required],
      plantaId: ['']
    });
    void this.initializeScope();
  }

  private async initializeScope(): Promise<void> {
    await this.plantScope.initialize();
    this.plants = this.plantScope.snapshot().plants;
    this.showPlantSelector = this.plantScope.isGlobal() && !this.plantScope.getActivePlantId();
    const control = this.operadorNuevo.controls['plantaId'];
    if (this.showPlantSelector) control.addValidators(Validators.required);
    else control.setValue(this.plantScope.getActivePlantId() || this.plantScope.getPrincipalPlantId() || '');
    control.updateValueAndValidity();
  }

  async presentToast(msg: string, position: 'top' | 'middle' | 'bottom', cl: 'danger' | 'success' | 'warning') {
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

  async agregar(): Promise<void> {
    if (this.saving) return;
    this.normalizeForm();
    if (this.operadorNuevo.invalid) {
      this.operadorNuevo.markAllAsTouched();
      await this.presentToast('Completa los campos obligatorios correctamente.', 'bottom', 'warning');
      return;
    }

    const formValue = this.operadorNuevo.getRawValue();
    this.saving = true;
    const loading = await this.loadController.create({ message: 'Guardando distribuidor…' });
    await loading.present();
    try {
      await this.ditribuidresService.addDistribuidor({ ...formValue, idempotencyKey: this.idempotencyKey });
      await this.presentToast('Distribuidor agregado correctamente.', 'bottom', 'success');
      await this.modalController.dismiss({ changed: true });
    } catch {
      await this.presentToast('No fue posible agregar el distribuidor.', 'bottom', 'danger');
    } finally {
      this.saving = false;
      await loading.dismiss();
    }
  }

  private normalizeForm(): void {
    const value = this.operadorNuevo.getRawValue();
    this.operadorNuevo.patchValue({
      nombre: this.normalizeUppercase(value.nombre),
      ruta: this.normalizeUppercase(value.ruta),
      zona: String(value.zona || '').trim().toLowerCase(),
    }, { emitEvent: false });
  }

  private normalizeUppercase(value: unknown): string {
    return String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
  }

}
