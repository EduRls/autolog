import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
  saving = false;

  constructor(
    private modalController: ModalController,
    private loadcontroller: LoadingController,
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.articuloNuevo = this.fb.group({
      articulo: ['', [Validators.required, Validators.maxLength(120)]],
      precio: ['', [Validators.required, Validators.min(0)]],
      desc: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  async cancel(){
    if (this.saving) return;
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
    if (this.saving) return;
    if (this.articuloNuevo.invalid) {
      this.articuloNuevo.markAllAsTouched();
      await this.presentToast('Completa correctamente los campos obligatorios.', 'bottom', 'warning');
      return;
    }
    this.saving = true;
    const loading = await this.loadcontroller.create({ message: 'Agregando artículo…' });
    await loading.present();
    try {
      const value = this.articuloNuevo.getRawValue();
      await this.firebaseService.addArticulo(value);
      await this.presentToast('Artículo agregado correctamente.', 'bottom', 'success');
      await this.modalController.dismiss(value);
    } catch (error) {
      await this.presentToast('No fue posible agregar el artículo.', 'bottom', 'danger');
      console.error(error);
    } finally {
      this.saving = false;
      await loading.dismiss();
    }
  }


}
