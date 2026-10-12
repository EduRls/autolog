import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { Subscription, from, switchMap } from 'rxjs';
import { PlantScopeService } from 'src/app/services/plants/plant-scope.service';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';
import { AgregarArticuloComponent } from '../agregar-articulo/agregar-articulo.component';

@Component({
  selector: 'app-agregar-evento',
  templateUrl: './agregar-evento.component.html',
  styleUrls: ['./agregar-evento.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class AgregarEventoComponent implements OnInit, OnDestroy {
  eventoNuevo: FormGroup;
  autos: any[] = [];
  /** Estado de la lista de unidades: el selector no se habilita hasta que los permisos y las unidades estén listos. */
  autosEstado: 'cargando' | 'listo' | 'vacio' | 'error' = 'cargando';
  autosMensaje = '';
  private autosSubscription?: Subscription;
  private cargaUnidades?: HTMLIonLoadingElement;
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
    private firebaseService: FirebaseService,
    private plantScope: PlantScopeService
  ) { }

  ngOnInit() {
    this.eventoNuevo = this.fb.group({
      unidad: ['', Validators.required],
      kilometraje: ['', [Validators.required, Validators.min(1)]],
      servicio: ['', Validators.required],
      costo: ['', [Validators.required, Validators.min(0)]],
      autUser: ['', Validators.required],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      articulos: this.fb.array([])
    });
    this.cargarAutos();
    void this.mostrarCargaUnidades();
    this.getArticulos();
  }

  ngOnDestroy() {
    this.autosSubscription?.unsubscribe();
    void this.ocultarCargaUnidades();
  }

  /** Indicador de carga (máx. 4 s): se cierra en cuanto llegan las unidades o hay error. */
  private async mostrarCargaUnidades() {
    const loading = await this.loadcontroller.create({
      message: 'Cargando unidades…', duration: 4000, backdropDismiss: false
    });
    if (this.autosEstado !== 'cargando') return;
    this.cargaUnidades = loading;
    await loading.present();
  }

  private async ocultarCargaUnidades() {
    const loading = this.cargaUnidades;
    this.cargaUnidades = undefined;
    if (loading) await loading.dismiss().catch(() => undefined);
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

  /**
   * Carga las unidades de la planta del usuario. Primero espera a que se
   * resuelva el perfil/permisos (PlantScopeService) y solo entonces consulta,
   * así el selector nunca se abre vacío por llegar antes que los permisos.
   */
  cargarAutos() {
    this.autosEstado = 'cargando';
    this.autosMensaje = '';
    this.autosSubscription?.unsubscribe();
    this.autosSubscription = from(this.plantScope.initialize()).pipe(
      switchMap(() => this.firebaseService.getAutos())
    ).subscribe({
      next: (data) => {
        this.autos = [...data].sort((a, b) =>
          String(a.unidad ?? '').localeCompare(String(b.unidad ?? ''), 'es-MX', { numeric: true }));
        this.autosEstado = this.autos.length ? 'listo' : 'vacio';
        this.autosMensaje = this.autos.length ? '' : 'No hay unidades registradas en tu planta.';
        void this.ocultarCargaUnidades();
      },
      error: (error) => {
        console.error('Error getting documents', error);
        this.autos = [];
        this.autosEstado = 'error';
        this.autosMensaje = error?.message === 'PLANT_CONTEXT_REQUIRED'
          ? 'Tu usuario no tiene una planta asignada. Contacta al administrador.'
          : 'No fue posible cargar las unidades.';
        void this.ocultarCargaUnidades();
      }
    });
  }

  get placeholderUnidad(): string {
    if (this.autosEstado === 'cargando') return 'Cargando unidades…';
    if (this.autosEstado === 'listo') return 'Selecciona una unidad';
    return 'Sin unidades disponibles';
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
        if (!unidadSeleccionada) {
          this.presentToast('La unidad seleccionada ya no está disponible. Vuelve a elegirla.', 'bottom', 'warning');
          return;
        }
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
  
        await this.firebaseService.addEvento(eventoData);
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
      cssClass: ['autolog-form-modal', 'autolog-article-modal'],
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
