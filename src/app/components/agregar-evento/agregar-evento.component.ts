import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';
import { AgregarArticuloComponent } from '../agregar-articulo/agregar-articulo.component';

@Component({
  selector: 'app-agregar-evento',
  templateUrl: './agregar-evento.component.html',
  styleUrls: ['./agregar-evento.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class AgregarEventoComponent implements OnInit {
  eventoNuevo: FormGroup;
  autos: any[] = [];
  buscarArticulo: string = ''; // Texto ingresado en el input
  articulos: any[] = []; // Lista de artículos obtenidos del backend
  articulosFiltrados: any[] = []; // Artículos que coinciden con la búsqueda
  articulosSeleccionados: any[] = []; // Artículos seleccionados para la tabla

  // Datos totales 
  totalSinIVA: any;
  totalConIVA: any;

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
    this.eventoNuevo = this.fb.group({
      unidad: ['', Validators.required],
      kilometraje: ['', [Validators.required, Validators.min(1)]],
      servicio: ['', Validators.required],
      costo: ['', [Validators.required, Validators.min(0)]],
      autUser: ['', Validators.required],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      articulos: this.fb.array([])
    });
  }

  get articulosFormArray(): FormArray {
    return this.eventoNuevo.get('articulos') as FormArray;
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

  async getAutos() {
    this.firebaseService.getAutos().subscribe({
      next: (data) => {
        this.autos = data;

      },
      error: (error) => {
        console.log('Error getting documents', error);
      }
    });
  }

  async cancel() {
    this.eventoNuevo.reset();
    await this.modalController.dismiss();
  }

  async showLoading(msg: string) {
    const loading = await this.loadcontroller.create({
      message: msg,
      duration: 1500
    });
    loading.present();
  }

  async presentToast(
    msg: string,
    position: 'top' | 'middle' | 'bottom',
    cl: 'danger' | 'success' | 'warning'
  ) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: position,
      color: cl
    });
    await toast.present();
  }


  filtrarArticulos(event: any) {
    const query = event.target.value.toLowerCase(); // Obtiene el valor ingresado en minúsculas

    if (query.trim() === '') {
      this.articulosFiltrados = []; // Si el campo está vacío, limpia los resultados
      return;
    }

    // Filtra los artículos que coinciden con el texto ingresado
    this.articulosFiltrados = this.articulos.filter((articulo) =>
      articulo.nombre.toLowerCase().includes(query)
    );
  }

  eliminarArticulo(index: number) {
    this.articulosFormArray.removeAt(index); // Elimina el artículo por índice
    this.calcularTotales(); // Recalcula los totales
  }

  agregarArticulo(articulo: any) {
    console.log(articulo)
    // Verifica si ya existe el artículo
    const existe = this.articulosFormArray.controls.some(
      (control) => control.value.nombre === articulo.nombre
    );
    if (existe) return;
  
    // Agrega un nuevo artículo al FormArray
    const nuevoArticulo = this.fb.group({
      nombre: [articulo.nombre, Validators.required],
      precio: [articulo.precio, [Validators.required, Validators.min(0)]], // Campo editable
      cantidad: [1, [Validators.required, Validators.min(1)]], // Campo editable
      proveedor: ['', Validators.required] // Nuevo campo editable para el proveedor
    });
  
    this.articulosFormArray.push(nuevoArticulo);
    this.calcularTotales(); // Recalcula los totales
  }

  calcularTotales() {
    const articulos = this.articulosFormArray.value; // Obtiene los valores del FormArray
    this.totalSinIVA = articulos.reduce(
      (sum, articulo) => sum + (articulo.precio || 0) * (articulo.cantidad || 1),
      0
    );
    this.totalConIVA = this.totalSinIVA * 1.16; // Aplica el IVA del 16%
    this.eventoNuevo.get('costo')?.setValue(this.totalConIVA); // Actualiza el costo en el formulario
  }

  async agregarEvento() {
    await this.showLoading('Agregando evento...');
  
    if (this.eventoNuevo.valid) {
      try {
        const unidadSeleccionada = this.autos.find(
          (d: any) => d.id === this.eventoNuevo.get('unidad')?.value
        );
        const unidad = {
          id: unidadSeleccionada.id,
          unidad: unidadSeleccionada.unidad
        };
  
        // Obtenemos los artículos seleccionados desde el FormArray
        const articulos = this.articulosFormArray.value;
  
        const eventoData = {
          ...this.eventoNuevo.value,
          unidad,
          articulos // Incluimos el array de artículos con proveedor
        };
  
        await this.firebaseService.addEvento(eventoData).then((res) => {
          unidadSeleccionada.km_actual = this.eventoNuevo.get('kilometraje').value;
          const unidadActulizacion = this.verificarDatosIniciales(unidadSeleccionada);
  
          this.firebaseService.updateAuto(unidadActulizacion).then(() => {
            console.log('Unidad actualizada correctamente');
          }).catch((error) => {
            console.error('Error updating document:', error);
          });
        });
        this.presentToast('Evento agregado correctamente', 'bottom', 'success');
        this.cancel();
      } catch (error) {
        this.presentToast('Error al agregar evento', 'bottom', 'danger');
        console.error('Error adding document:', error);
      }
    } else {
      this.presentToast('Todos los campos son obligatorios', 'bottom', 'warning');
    }
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
