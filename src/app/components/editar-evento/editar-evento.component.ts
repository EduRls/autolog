import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';
import { AgregarArticuloComponent } from '../agregar-articulo/agregar-articulo.component';

@Component({
  selector: 'app-editar-evento',
  templateUrl: './editar-evento.component.html',
  styleUrls: ['./editar-evento.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class EditarEventoComponent implements OnInit {
  @Input() evento: any;

  editarEventoRegistro: FormGroup;
  autos: any[] = [];
  articulos: any[] = [];
  articulosFiltrados: any[] = [];
  totalSinIVA: number = 0;
  totalConIVA: number = 0;

  constructor(
    private modalController: ModalController,
    private loadcontroller: LoadingController,
    private toastController: ToastController,
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) { }

  ngOnInit() {
    this.getAutos();
    this.getArticulos();
    this.editarEventoRegistro = this.fb.group({
      id: [this.evento.id, Validators.required],
      unidad: [this.evento.unidad.id, Validators.required],
      kilometraje: [this.evento.kilometraje, Validators.required],
      servicio: [this.evento.servicio, Validators.required],
      costo: [this.evento.costo, Validators.required],
      fecha: [this.evento.fecha, Validators.required],
      autUser: [this.evento.autUser || '', Validators.required],
      articulos: this.fb.array(this.evento.articulos.map((articulo: any) =>
        this.fb.group({
          nombre: [articulo.nombre, Validators.required],
          precio: [articulo.precio, Validators.required],
          cantidad: [articulo.cantidad, [Validators.required, Validators.min(1)]],
          proveedor: [articulo.proveedor || '', Validators.required]
        })
      ))
    });

    this.calcularTotales();
  }

  get articulosFormArray(): FormArray {
    return this.editarEventoRegistro.get('articulos') as FormArray;
  }

  async getAutos() {
    this.firebaseService.getAutos().subscribe({
      next: (data) => {
        this.autos = data;
      },
      error: (error) => {
        console.error('Error getting documents', error);
      }
    });
  }

  async getArticulos() {
    this.firebaseService.getArticulos().subscribe((articulos: any) => {
      this.articulos = articulos.map((articulo: any) => ({
        nombre: articulo.articulo,
        descripcion: articulo.desc,
        precio: articulo.precio
      }));
    });
  }

  filtrarArticulos(event: any) {
    const query = event.target.value.toLowerCase();
    if (query.trim() === '') {
      this.articulosFiltrados = [];
      return;
    }

    // Implementación de búsqueda
    // Actualizar la lista según tus datos
    this.articulosFiltrados = this.articulos.filter((articulo) =>
      articulo.nombre.toLowerCase().includes(query)
    );
  }

  agregarArticulo(articulo: any) {
    const existe = this.articulosFormArray.controls.some(
      (control) => control.value.nombre === articulo.nombre
    );
    if (existe) return;
  
    this.articulosFormArray.push(
      this.fb.group({
        nombre: [articulo.nombre, Validators.required],
        precio: [articulo.precio, [Validators.required, Validators.min(0)]], // Campo editable
        cantidad: [1, [Validators.required, Validators.min(1)]], // Campo editable
        proveedor: ['', Validators.required] // Campo editable para el proveedor
      })
    );
    this.calcularTotales();
  }

  eliminarArticulo(index: number) {
    this.articulosFormArray.removeAt(index);
    this.calcularTotales();
  }


  calcularTotales() {
    const articulos = this.articulosFormArray.value;
    this.totalSinIVA = articulos.reduce(
      (sum, articulo) => sum + (articulo.precio || 0) * (articulo.cantidad || 1),
      0
    );
    this.totalConIVA = this.totalSinIVA * 1.16;
    this.editarEventoRegistro.get('costo')?.setValue(this.totalConIVA);
  }

  async editarEvento() {
    if (this.editarEventoRegistro.valid) {
      try {
        const unidadSeleccionadaId = this.editarEventoRegistro.get('unidad')?.value;
        const unidadSeleccionada = this.autos.find((auto: any) => auto.id === unidadSeleccionadaId);
  
        const updatedEvento = {
          ...this.editarEventoRegistro.value,
          unidad: {
            id: unidadSeleccionada.id,
            unidad: unidadSeleccionada.unidad,
          },
          articulos: this.articulosFormArray.value // Incluye todos los campos del formulario reactivo
        };
  
        await this.firebaseService.updateEvento(updatedEvento).then(() => {
          unidadSeleccionada.km_actual = this.editarEventoRegistro.get('kilometraje').value;
          const unidadActualizada = this.verificarDatosIniciales(unidadSeleccionada);
  
          this.firebaseService.updateAuto(unidadActualizada).then(() => {
            console.log('Unidad actualizada correctamente');
          }).catch((error) => {
            console.error('Error updating document:', error);
          });
        });
  
        this.presentToast('Evento editado correctamente', 'bottom', 'success');
        this.cancel();
      } catch (error) {
        console.error('Error al editar el evento:', error);
        this.presentToast('Error al editar evento', 'bottom', 'danger');
      }
    } else {
      this.presentToast('Todos los campos son obligatorios', 'bottom', 'warning');
    }
  }
  

  async cancel() {
    this.modalController.dismiss();
  }

  async presentToast(msg: string, position: 'top' | 'middle' | 'bottom', color: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      position,
      color
    });
    toast.present();
  }

  verificarDatosIniciales(unidadSeleccionada: any) {
    const km_actual = unidadSeleccionada.km_actual || 0;
    const kilometraje = unidadSeleccionada.kilometraje || 0;
    const km_proximo_servicio = unidadSeleccionada.km_proximo_servicio || 0;

    if (kilometraje === 0 && km_actual > 0) {
      unidadSeleccionada.kilometraje = km_actual;
    }

    if (km_proximo_servicio === 0 && km_actual > 0) {
      unidadSeleccionada.km_proximo_servicio = km_actual + 10000;
    }

    if (km_actual === 0 && kilometraje > 0) {
      unidadSeleccionada.km_actual = kilometraje;
    }

    // Nuevo: actualizar el próximo servicio automáticamente si es superado
    if (km_actual >= km_proximo_servicio) {
      unidadSeleccionada.km_proximo_servicio = km_actual + 10000;
    }

    return unidadSeleccionada;
  }

  async agregarArticuloNuevo(){
      const modalArticulo = await this.modalController.create({
        component: AgregarArticuloComponent,
      });
  
      await modalArticulo.present();
  
      modalArticulo.onDidDismiss().then((result) => {
        if (result.data) {
          const auxData = {
            nombre: result.data.articulo,
            precio: result.data.precio,
            descripcion: result.data.desc
          }
          this.getArticulos();
          this.agregarArticulo(auxData);
        }
          
      });
  
    }
}
