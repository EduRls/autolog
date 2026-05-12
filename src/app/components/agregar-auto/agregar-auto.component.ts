import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';

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

  constructor(
    private modalController: ModalController,
    private loadcontroller: LoadingController,
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.autoNuevo = this.fb.group({
      unidad: ['', Validators.required],
      operador: ['', Validators.required],
      desc: ['', Validators.required],
      kilometraje: ['', Validators.required],
      km_actual: ['', Validators.required],
      km_proximo_servicio: ['', Validators.required]
    });
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
