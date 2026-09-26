import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';
import { Distribuidor } from 'src/app/models/distribuidor.model';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';

@Component({
  selector: 'app-editar-auto',
  templateUrl: './editar-auto.component.html',
  styleUrls: ['./editar-auto.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, IonicModule, CommonModule]
})
export class EditarAutoComponent implements OnInit {

  @Input() auto:any;

  public editarAuto: FormGroup
  operadoresDisponibles: Distribuidor[] = [];
  saving = false;

  constructor(
    private modalController: ModalController,
    private loadcontroller: LoadingController,
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private fb: FormBuilder,
    private distribuidoresService: DistribuidoresService
  ) { }

  ngOnInit() {
    this.editarAuto = this.fb.group({
      id: [this.auto.id, Validators.required],
      unidad: [this.auto.unidad, [Validators.required, Validators.maxLength(30)]],
      kilometraje: [this.auto.kilometraje, [Validators.required, Validators.min(0)]],
      km_actual: [this.auto.km_actual, [Validators.required, Validators.min(0)]],
      km_proximo_servicio: [this.auto.km_proximo_servicio, [Validators.required, Validators.min(0)]],
      operador: [this.auto.operador, Validators.required],
      operadorId: [this.auto.operadorId ?? null, Validators.required],
      operadorIds: [this.initialOperatorIds(), [Validators.required, Validators.maxLength(9)]],
      operadores: [this.initialOperatorNames(), [Validators.required, Validators.maxLength(9)]],
      desc: [this.auto.desc, [Validators.required, Validators.maxLength(500)]]
    });
    this.mitigarCamposFaltantes();
    void this.loadOperadores();
  }

  toggleOperador(distribuidorId: string, selected: boolean): void {
    const currentIds = this.editarAuto.controls['operadorIds'].value as string[];
    const operadorIds = selected
      ? [...new Set([...currentIds, distribuidorId])]
      : currentIds.filter(id => id !== distribuidorId);
    const seleccionados = operadorIds
      .map(id => this.operadoresDisponibles.find(item => item.id === id))
      .filter((item): item is Distribuidor => Boolean(item));
    this.editarAuto.patchValue({
      operadorIds,
      operadores: seleccionados.map(item => item.nombre),
      operadorId: seleccionados[0]?.id || null,
      operador: seleccionados[0]?.nombre || ''
    });
    this.editarAuto.controls['operadorIds'].markAsTouched();
  }

  operadorSeleccionado(distribuidorId: string): boolean {
    return (this.editarAuto.controls['operadorIds'].value as string[]).includes(distribuidorId);
  }

  private initialOperatorIds(): string[] {
    if (Array.isArray(this.auto.operadorIds) && this.auto.operadorIds.length) return this.auto.operadorIds;
    return this.auto.operadorId ? [this.auto.operadorId] : [];
  }

  private initialOperatorNames(): string[] {
    if (Array.isArray(this.auto.operadores) && this.auto.operadores.length) return this.auto.operadores;
    return this.auto.operador ? [this.auto.operador] : [];
  }

  private async loadOperadores(): Promise<void> {
    try {
      this.operadoresDisponibles = await this.distribuidoresService.getActivos();
    } catch {
      this.operadoresDisponibles = [];
    }
  }

  async mitigarCamposFaltantes() {
    const km = this.editarAuto.get('kilometraje')?.value || 0;
    const km_actual = this.editarAuto.get('km_actual')?.value || 0;
    const km_proximo_servicio = this.editarAuto.get('km_proximo_servicio')?.value || 0;
  
    // Si no hay kilometraje inicial, asigna el actual como inicial
    if (km === 0 && km_actual > 0) {
      this.editarAuto.get('kilometraje')?.setValue(km_actual);
    }
  
    // Si no hay kilometraje actual, asigna el inicial como actual
    if (km_actual === 0 && km > 0) {
      this.editarAuto.get('km_actual')?.setValue(km);
    }
  
    // Si no hay próximo servicio, calcula a partir del actual
    if (km_proximo_servicio === 0 && km_actual > 0) {
      this.editarAuto.get('km_proximo_servicio')?.setValue(km_actual + 10000);
    }
  }
  

  async cancel(){
    if (this.saving) return;
    this.editarAuto.reset();
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


  establecerProximoServicio(): void {
    const actual = Number(this.editarAuto.get('km_actual')?.value);
    this.editarAuto.get('km_proximo_servicio')?.setValue(
      Number.isFinite(actual) && actual >= 0 ? actual + 10000 : ''
    );
  }

  async editarAutoFirebase(){
    if (this.saving) return;
    if (this.editarAuto.invalid) {
      this.editarAuto.markAllAsTouched();
      await this.presentToast('Completa correctamente los campos obligatorios.', 'bottom', 'warning');
      return;
    }
    this.saving = true;
    const loading = await this.loadcontroller.create({ message: 'Guardando cambios…' });
    await loading.present();
    try {
      await this.firebaseService.updateAuto(this.editarAuto.getRawValue());
      await this.presentToast('Unidad actualizada correctamente.', 'bottom','success');
      await this.modalController.dismiss({ changed: true });
    } catch (error) {
      await this.presentToast('No fue posible actualizar la unidad.', 'bottom', 'danger');
      console.error(error);
    } finally {
      this.saving = false;
      await loading.dismiss();
    }
  }


}
