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
  operadoresDisponibles: Distribuidor[] = [];
  private allOperadores: Distribuidor[] = [];
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
      unidad: ['', Validators.required],
      operador: ['', Validators.required],
      operadorId: [null, Validators.required],
      desc: ['', Validators.required],
      kilometraje: ['', Validators.required],
      km_actual: ['', Validators.required],
      km_proximo_servicio: ['', Validators.required],
      plantaId: ['']
    });
    void this.initializeScope();
  }

  seleccionarOperador(distribuidorId: string | null): void {
    const distribuidor = this.operadoresDisponibles.find(item => item.id === distribuidorId);
    if (distribuidor) this.autoNuevo.patchValue({ operador: distribuidor.nombre });
  }

  onPlantChange(plantId: string): void {
    this.autoNuevo.patchValue({ operadorId: null, operador: '' });
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
    const actual:any = this.autoNuevo.get('kilometraje').value;
    const prox_Servicio = parseInt(actual) + 10000;

    this.autoNuevo.get('km_actual').setValue(parseInt(actual));
    this.autoNuevo.get('km_proximo_servicio').setValue(prox_Servicio);
  }

  async agregarAuto(){
    this.showLoading('Agregando auto...');
    if(this.autoNuevo.valid){
      try {
        this.firebaseService.addAuto(this.autoNuevo.value).then((res:any) => {
          this.presentToast('Auto agregado correctamente', 'bottom','success');
          this.cancel();
        })
      } catch (error) {
        this.presentToast('Hubo un error al agregar el auto', 'bottom', 'danger');
        console.error(error);
      }
    }else{
      this.presentToast('Todos los campos son obligatorios', 'bottom', 'warning');
      return;
    }
  }



}
