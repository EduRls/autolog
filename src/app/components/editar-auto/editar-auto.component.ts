import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';

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

  constructor(
    private modalController: ModalController,
    private loadcontroller: LoadingController,
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.editarAuto = this.fb.group({
      id: [this.auto.id, Validators.required],
      unidad: [this.auto.unidad, Validators.required],
      kilometraje: [this.auto.kilometraje, Validators.required],
      km_actual: [this.auto.km_actual, Validators.required],
      km_proximo_servicio: [this.auto.km_proximo_servicio, Validators.required],
      operador: [this.auto.operador, Validators.required],
      desc: [this.auto.desc, Validators.required]
    });
    this.mitigarCamposFaltantes();
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


  establecerKilometraje(){
    const actual:any = this.editarAuto.get('kilometraje').value;
    const km_actual = this.editarAuto.get('km_actual').value;
    const prox_Servicio = parseInt(actual) + 10000;

    if(km_actual == 0 && prox_Servicio == 0){
      this.editarAuto.get('km_actual').setValue(actual);
      this.editarAuto.get('km_proximo_servicio').setValue(prox_Servicio);
    }
    
  }

  verificarCambioServicio() {
    const km_ini = this.editarAuto.get('kilometraje')?.value || 0;
    const km_actual = this.editarAuto.get('km_actual')?.value || 0;
    const km_proximo_servicio = this.editarAuto.get('km_proximo_servicio')?.value || 0;
  
    // Si no hay kilometraje inicial pero hay un actual, actualiza ambos campos
    if (km_ini === 0 && km_actual > 0 && km_proximo_servicio === 0) {
      this.editarAuto.get('kilometraje')?.setValue(km_actual);
      this.editarAuto.get('km_proximo_servicio')?.setValue(km_actual + 10000);
    }
  }

  async editarAutoFirebase(){
    this.showLoading('Editando auto...');
    if(this.editarAuto.valid){
      try {
        this.firebaseService.updateAuto(this.editarAuto.value).then((res:any) => {
          this.presentToast('Auto editado correctamente', 'bottom','success');
          this.cancel();
        })
      } catch (error) {
        this.presentToast('Hubo un error al editar el auto', 'bottom', 'danger');
        console.error(error);
      }
    }else{
      this.presentToast('Todos los campos son obligatorios', 'bottom', 'warning');
      return;
    }
  }


}
