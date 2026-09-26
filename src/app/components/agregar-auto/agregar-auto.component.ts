import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';
import { Distribuidor } from 'src/app/models/distribuidor.model';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';
import { Planta } from 'src/app/models/planta.model';
import { PlantScopeService } from 'src/app/services/plants/plant-scope.service';

@Component({
  selector: 'app-agregar-auto',
  templateUrl: './agregar-auto.component.html',
  styleUrls: ['./agregar-auto.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AgregarAutoComponent  implements OnInit {

  public autoNuevo: FormGroup
  saving = false;
  operadoresDisponibles: Distribuidor[] = [];
  private allOperadores: Distribuidor[] = [];
  operadorPorAgregar = '';
  plants: Planta[] = [];
  showPlantSelector = false;

  constructor(
    private modalController: ModalController,
    private loadcontroller: LoadingController,
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private fb: FormBuilder,
    private distribuidoresService: DistribuidoresService,
    private readonly plantScope: PlantScopeService
  ) { }

  ngOnInit() {
    this.autoNuevo = this.fb.group({
      unidad: ['', [Validators.required, Validators.maxLength(30)]],
      operador: ['', Validators.required],
      operadorId: [null, Validators.required],
      operadorIds: [[], [Validators.required, Validators.maxLength(9)]],
      operadores: [[], [Validators.required, Validators.maxLength(9)]],
      desc: ['', [Validators.required, Validators.maxLength(500)]],
      kilometraje: ['', [Validators.required, Validators.min(0)]],
      km_actual: ['', [Validators.required, Validators.min(0)]],
      km_proximo_servicio: ['', [Validators.required, Validators.min(0)]],
      plantaId: ['']
    });
    void this.initializeScope();
  }

  toggleOperador(distribuidorId: string, selected: boolean): void {
    const currentIds = this.autoNuevo.controls['operadorIds'].value as string[];
    const operadorIds = selected
      ? [...new Set([...currentIds, distribuidorId])]
      : currentIds.filter(id => id !== distribuidorId);
    const seleccionados = operadorIds
      .map(id => this.operadoresDisponibles.find(item => item.id === id))
      .filter((item): item is Distribuidor => Boolean(item));
    this.autoNuevo.patchValue({
      operadorIds,
      operadores: seleccionados.map(item => item.nombre),
      operadorId: seleccionados[0]?.id || null,
      operador: seleccionados[0]?.nombre || ''
    });
    this.autoNuevo.controls['operadorIds'].markAsTouched();
  }

  operadorSeleccionado(distribuidorId: string): boolean {
    return (this.autoNuevo.controls['operadorIds'].value as string[]).includes(distribuidorId);
  }

  agregarOperadorSeleccionado(distribuidorId: string): void {
    if (!distribuidorId) return;
    this.toggleOperador(distribuidorId, true);
    this.operadorPorAgregar = '';
  }

  get operadoresSeleccionados(): Distribuidor[] {
    const ids = this.autoNuevo.controls['operadorIds'].value as string[];
    return ids
      .map(id => this.operadoresDisponibles.find(item => item.id === id))
      .filter((item): item is Distribuidor => Boolean(item));
  }

  onPlantChange(plantId: string): void {
    this.operadorPorAgregar = '';
    this.autoNuevo.patchValue({ operadorId: null, operador: '', operadorIds: [], operadores: [] });
    this.filterOperadores(plantId);
  }

  private async loadOperadores(): Promise<void> {
    try {
      this.allOperadores = await this.distribuidoresService.getActivos();
      this.filterOperadores(this.autoNuevo.controls['plantaId'].value);
    } catch {
      this.allOperadores = [];
      this.operadoresDisponibles = [];
    }
  }

  private filterOperadores(plantId: string): void {
    this.operadoresDisponibles = plantId
      ? this.allOperadores.filter(item => item.plantaIdPrincipal === plantId)
      : [];
  }

  private async initializeScope(): Promise<void> {
    await this.plantScope.initialize();
    this.plants = this.plantScope.snapshot().plants;
    this.showPlantSelector = this.plantScope.isGlobal() && !this.plantScope.getActivePlantId();
    const control = this.autoNuevo.controls['plantaId'];
    if (this.showPlantSelector) control.addValidators(Validators.required);
    else control.setValue(this.plantScope.getActivePlantId() || this.plantScope.getPrincipalPlantId() || '');
    control.updateValueAndValidity();
    await this.loadOperadores();
  }

  async cancel(){
    if (this.saving) return;
    this.autoNuevo.reset();
    await this.modalController.dismiss();
  }

  async showLoading(msg:string) {
    const loading = await this.loadcontroller.create({
      message: msg,
      duration: 1500,
    });

    loading.present();
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

  establecerKilometraje(){
    const inicial = Number(this.autoNuevo.get('kilometraje')?.value);
    if (!Number.isFinite(inicial) || inicial < 0) return;
    this.autoNuevo.get('km_actual')?.setValue(inicial);
    this.establecerProximoServicio();
  }

  establecerProximoServicio(): void {
    const actual = Number(this.autoNuevo.get('km_actual')?.value);
    this.autoNuevo.get('km_proximo_servicio')?.setValue(
      Number.isFinite(actual) && actual >= 0 ? actual + 10000 : ''
    );
  }

  async agregarAuto(){
    if (this.saving) return;
    if (this.autoNuevo.invalid) {
      this.autoNuevo.markAllAsTouched();
      await this.presentToast('Completa correctamente los campos obligatorios.', 'bottom', 'warning');
      return;
    }
    this.saving = true;
    const loading = await this.loadcontroller.create({ message: 'Registrando unidad…' });
    await loading.present();
    try {
      await this.firebaseService.addAuto(this.autoNuevo.getRawValue());
      await this.presentToast('Unidad agregada correctamente.', 'bottom','success');
      await this.modalController.dismiss({ changed: true });
    } catch (error) {
      await this.presentToast('No fue posible agregar la unidad.', 'bottom', 'danger');
      console.error(error);
    } finally {
      this.saving = false;
      await loading.dismiss();
    }
  }



}
