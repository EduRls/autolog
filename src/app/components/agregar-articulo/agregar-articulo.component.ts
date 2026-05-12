import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';

@Component({
  selector: 'app-agregar-articulo',
  templateUrl: './agregar-articulo.component.html',
  styleUrls: ['./agregar-articulo.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AgregarArticuloComponent implements OnInit {

  public articuloNuevo: FormGroup;

  constructor(
    private modalController: ModalController,
    private loadcontroller: LoadingController,
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.articuloNuevo = this.fb.group({
      articulo: [''],
      precio: [''],
      desc: ['']
    });
  }

  async cancel(){
    this.articuloNuevo.reset();
    await this.modalController.dismiss();
  }

  async confirm(item:any){
    await this.modalController.dismiss(item)
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

  async agregarArticuloNuevo(){
    this.showLoading('Agregando nuevo articulo...');
    if(this.articuloNuevo.valid){
      try{
        this.firebaseService.addArticulo(this.articuloNuevo.value).then((res:any) => {
          this.presentToast('Artículo agregado correctamente', 'bottom', 'success');
          this.confirm(this.articuloNuevo.value);
        })
      }catch (error) {
        this.presentToast('Hubo un error al agregar el artículo', 'bottom', 'danger');
        console.error(error);
      }
    }else{
      this.presentToast('Favor de completar todos los campos', 'bottom', 'warning')
    }
  }


}
