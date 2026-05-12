import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';

@Component({
  selector: 'app-editar',
  templateUrl: './editar.component.html',
  styleUrls: ['./editar.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class EditarComponent  implements OnInit {

  @Input() operadorData:any;
  editarOperadorForm: FormGroup;

  constructor(
    private modalController: ModalController,
    private distribuidorService: DistribuidoresService,
    private loadcontroller: LoadingController,
    private toastController: ToastController,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.editarOperadorForm = this.fb.group({
      id: [this.operadorData.id, Validators.required],
      nombre: [this.operadorData.nombre, Validators.required],
      identificador: [this.operadorData.identificador, Validators.required],
      ruta: [this.operadorData.ruta, Validators.required],
      zona: [this.operadorData.zona, Validators.required]
    });

    this.editarOperadorForm.get('identificador')?.disable();
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

  async cancel(){
    await this.modalController.dismiss();
  }

  async editarOperador(){
    if(this.editarOperadorForm.valid){
      const loading = await this.loadcontroller.create({
        message: 'Editando operador...',
        duration: 2000
      });
      await loading.present();

      this.editarOperadorForm.get('nombre').setValue((this.editarOperadorForm.get('nombre').value).toUpperCase());
      this.editarOperadorForm.get('identificador').setValue((this.editarOperadorForm.get('identificador').value).toUpperCase());
      this.editarOperadorForm.get('ruta').setValue((this.editarOperadorForm.get('ruta').value).toUpperCase());
      this.editarOperadorForm.get('identificador')?.enable();
      try {
        this.distribuidorService.updateDistribuidor(this.editarOperadorForm.value).then((e) => {
          console.log(e)
          this.presentToast('Operador editado correctamente', 'bottom', 'success')
          this.modalController.dismiss();
        });

      } catch (error) {
        this.presentToast('Hubo un error al editar el operador', 'bottom', 'danger')
        console.error(error)
      } finally {
        await loading.dismiss();
      }
    }else{
      this.presentToast('Error al editar operador', 'bottom', 'danger')
    }
  }

}
