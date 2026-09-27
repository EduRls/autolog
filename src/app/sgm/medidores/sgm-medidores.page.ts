import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { RegistroMedidoresComponent } from 'src/app/components/registro-medidores/registro-medidores.component';
import { PlantScopeService } from 'src/app/services/plants/plant-scope.service';
import { SgmMedidoresService } from 'src/app/services/sgm/sgm-medidores.service';
import { ESTADO_OPERACION_COLOR, ESTADO_OPERACION_LABEL, RegistroMedidores, nextConsecutivo } from '../sgm.models';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-sgm-medidores',
  templateUrl: './sgm-medidores.page.html',
  styleUrls: ['../sgm.shared.scss', './sgm-medidores.page.scss'],
})
export class SgmMedidoresPage implements OnInit, OnDestroy {
  registros: RegistroMedidores[] = [];
  state: LoadState = 'loading';
  searchTerm = '';
  expandedId: string | null = null;
  readonly estadoLabel = ESTADO_OPERACION_LABEL;
  readonly estadoColor = ESTADO_OPERACION_COLOR;
  private subscription?: Subscription;

  constructor(
    private readonly sgmService: SgmMedidoresService,
    private readonly plantScope: PlantScopeService,
    private readonly modalController: ModalController
  ) {}

  get canWrite(): boolean { return !this.plantScope.isReadOnly(); }

  get registrosFiltrados(): RegistroMedidores[] {
    const term = this.normalize(this.searchTerm.trim());
    if (!term) return this.registros;
    return this.registros.filter(registro => [
      registro.consecutivo, registro.almacenamiento, registro.realizo, registro.aprobo,
      ...registro.medidores.flatMap(medidor => [medidor.identificacionInterna, medidor.descripcion, medidor.marca, medidor.modelo, medidor.numeroSerie, medidor.localizacion]),
    ].some(value => this.normalize(value).includes(term)));
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  load(): void {
    this.state = 'loading';
    this.subscription?.unsubscribe();
    this.subscription = this.sgmService.listRegistros().subscribe({
      next: registros => { this.registros = registros; this.state = 'ready'; },
      error: error => { console.error(error); this.state = 'error'; },
    });
  }

  toggle(registro: RegistroMedidores): void {
    this.expandedId = this.expandedId === registro.id ? null : registro.id;
  }

  canEdit(registro: RegistroMedidores): boolean {
    return Boolean(registro.plantaId && this.plantScope.canWritePlant(registro.plantaId));
  }

  plantName(plantaId: string): string {
    return this.plantScope.snapshot().plants.find(plant => plant.id === plantaId)?.nombre || plantaId;
  }

  get showPlantColumn(): boolean {
    return this.plantScope.isGlobal() && !this.plantScope.getActivePlantId();
  }

  async openForm(registro?: RegistroMedidores): Promise<void> {
    const plantId = registro?.plantaId ?? this.plantScope.getActivePlantId();
    const samePlant = plantId ? this.registros.filter(item => item.plantaId === plantId) : this.registros;
    const modal = await this.modalController.create({
      component: RegistroMedidoresComponent,
      cssClass: ['autolog-form-modal', 'autolog-meters-modal'],
      backdropDismiss: false,
      componentProps: {
        registro,
        consecutivoSugerido: nextConsecutivo(samePlant),
        consecutivosExistentes: samePlant.map(item => item.consecutivo),
      },
    });
    await modal.present();
  }

  private normalize(value: string): string {
    return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
}
