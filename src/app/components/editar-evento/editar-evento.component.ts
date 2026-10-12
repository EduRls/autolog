import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { Subscription, from, switchMap } from 'rxjs';
import { PlantScopeService } from 'src/app/services/plants/plant-scope.service';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';
import { AgregarArticuloComponent } from '../agregar-articulo/agregar-articulo.component';

@Component({
  selector: 'app-editar-evento',
  templateUrl: './editar-evento.component.html',
  styleUrls: ['./editar-evento.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class EditarEventoComponent implements OnInit, OnDestroy {
  @Input() evento: any;

  editarEventoRegistro: FormGroup;
  autos: any[] = [];
  /** El selector no se habilita hasta que los permisos y las unidades estén listos. */
  autosEstado: 'cargando' | 'listo' | 'vacio' | 'error' = 'cargando';
  autosMensaje = '';
  private autosSubscription?: Subscription;
  private cargaUnidades?: HTMLIonLoadingElement;
  buscarArticulo = '';
  articulos: any[] = [];
  articulosFiltrados: any[] = [];
  totalSinIVA: number = 0;
  totalConIVA: number = 0;

  constructor(
    private modalController: ModalController,
    private loadcontroller: LoadingController,
    private toastController: ToastController,
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private plantScope: PlantScopeService
  ) { }

  ngOnInit() {
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
    return this.editarEventoRegistro.get('articulos') as FormArray;
  }

  /**
   * Espera a que se resuelvan perfil y planta antes de consultar las unidades,
   * para que el selector no quede vacío. Conserva la unidad del propio servicio
   * aunque ya no aparezca en la lista (p. ej. unidad dada de baja).
   */
  cargarAutos() {
    this.autosEstado = 'cargando';
    this.autosMensaje = '';
    this.autosSubscription?.unsubscribe();
    this.autosSubscription = from(this.plantScope.initialize()).pipe(
      switchMap(() => this.firebaseService.getAutos())
    ).subscribe({
      next: (data) => {
        const lista = [...data];
        const actual = this.evento?.unidad;
        if (actual?.id && !lista.some(auto => auto.id === actual.id)) {
          // Entrada solo para mostrarla: no tiene datos completos del auto.
          lista.push({ id: actual.id, unidad: actual.unidad, sinDatos: true });
        }
        this.autos = lista.sort((a, b) =>
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
    const query = String(event?.target?.value ?? '').toLowerCase();
    this.buscarArticulo = String(event?.target?.value ?? '');
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
    // Conserva el texto buscado, pero contrae el menú de resultados.
    this.articulosFiltrados = [];
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
        if (!unidadSeleccionada) {
          this.presentToast('La unidad seleccionada ya no está disponible. Vuelve a elegirla.', 'bottom', 'warning');
          return;
        }
  
        const updatedEvento = {
          ...this.editarEventoRegistro.value,
          unidad: {
            id: unidadSeleccionada.id,
            unidad: unidadSeleccionada.unidad,
          },
          articulos: this.articulosFormArray.value // Incluye todos los campos del formulario reactivo
        };
  
        await this.firebaseService.updateEvento(updatedEvento).then(() => {
          // Si la unidad ya no está en la lista solo se muestra; no se actualiza el auto.
          if (unidadSeleccionada.sinDatos) return;
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
