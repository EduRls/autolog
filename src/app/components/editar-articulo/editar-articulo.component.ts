import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';

@Component({
  selector: 'app-editar-articulo',
  templateUrl: './editar-articulo.component.html',
  styleUrls: ['./editar-articulo.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class EditarArticuloComponent implements OnInit {

  @Input() articuloDetalles: any;

  public editarArticuloDetalles: FormGroup;

  constructor(
    private modalController: ModalController,
    private loadcontroller: LoadingController,
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.editarArticuloDetalles = this.fb.group({
      id: [this.articuloDetalles.id, Validators.required],
      articulo: [this.articuloDetalles.articulo, Validators.required],
      precio: [this.articuloDetalles.precio, Validators.required],
      desc: [this.articuloDetalles.desc, Validators.required]
    })
  }

  
  async cancel(){
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

  async editarArticulo(){
    this.showLoading('Editando artículo...');
    if(this.editarArticuloDetalles.valid){
      try {
        this.firebaseService.updateArticulo(this.editarArticuloDetalles.value).then((res:any) => {
          this.presentToast('Artículo agregado correctamente', 'bottom','success');
          this.cancel();
        })
      } catch (error) {
        this.presentToast('Hubo un error al editar el artículo', 'bottom', 'danger');
        console.error(error);
      }
    }else{
      this.presentToast('Todos los campos son obligatorios', 'bottom', 'warning');
      return;
    }
  }



}
