import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';

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
  @Input() operadores: any;

  operadorNuevo: FormGroup;

  constructor(
    private fb: FormBuilder,
    private modalController: ModalController,
    private toastController: ToastController,
    private loadController: LoadingController,
    private ditribuidresService: DistribuidoresService
  ) { }

  ngOnInit() {
    this.operadorNuevo = this.fb.group({
      nombre: ['', Validators.required],
      identificador: ['VGBZ-00', Validators.required],
      ruta: ['', Validators.required],
      zona: ['', Validators.required]
    })

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

  async cancel() {
    await this.modalController.dismiss();
    this.operadorNuevo.reset();
  }

  async agregar() {
    const inOperador = this.operadores.find((data:any) => data.identificador == this.operadorNuevo.get('identificador').value.toUpperCase()) 

    if(inOperador){
      this.presentToast('Favor de cambiar el número de identificación', 'bottom', 'warning')
      return
    }
    
    this.operadorNuevo.get('nombre').setValue((this.operadorNuevo.get('nombre').value).toUpperCase());
    this.operadorNuevo.get('identificador').setValue((this.operadorNuevo.get('identificador').value).toUpperCase());
    this.operadorNuevo.get('ruta').setValue((this.operadorNuevo.get('ruta').value).toUpperCase());
    console.log(this.operadorNuevo.value)

    
    if (this.operadorNuevo.valid) {
      const loading = await this.loadController.create({
        message: 'Editando operador...',
        duration: 2000
      });
      await loading.present();

      try {
        await this.ditribuidresService.addDistribuidor(this.operadorNuevo.value).then((val) => {
          this.presentToast('Operador agregado exitosamente', 'bottom', 'success');
          this.operadorNuevo.reset();
          this.modalController.dismiss();
        })
      } catch (error) {
        this.presentToast('Error al agregar operador', 'bottom', 'danger');
      }
    } else {
      this.presentToast('Favor de completar todos los camos', 'bottom', 'warning')
    }
  }

}
