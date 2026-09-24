import { AccesoDistribuidorComponent } from 'src/app/components/distribuidor/acceso/acceso-distribuidor.component';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AgregarComponent } from 'src/app/components/distribuidor/agregar/agregar.component';
import { EditarComponent } from 'src/app/components/distribuidor/editar/editar.component';
import {
  DOCUMENTO_PERSONAL_CATALOGO,
  TipoDocumentoPersonal,
} from 'src/app/models/documento-personal.model';
import { Distribuidor } from 'src/app/models/distribuidor.model';
import { UsuarioAutolog } from 'src/app/models/usuario-autolog.model';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';
import { AuthorizationService } from 'src/app/services/auth/authorization.service';
import { UserAdminService } from 'src/app/services/auth/user-admin.service';
import { PersonalExpedienteService } from 'src/app/services/personal/personal-expediente.service';
import { PlantScopeService } from 'src/app/services/plants/plant-scope.service';

type DirectoryState = 'loading' | 'ready' | 'empty' | 'error';
type DocumentInsightsState = 'idle' | 'loading' | 'ready' | 'error';

interface MissingDocumentInsight {
  tipo: TipoDocumentoPersonal;
  label: string;
  missingCount: number;
  completionPercent: number;
}

@Component({
  selector: 'app-distribuidores',
  templateUrl: './distribuidores.page.html',
  styleUrls: ['./distribuidores.page.scss'],
})
export class DistribuidoresPage implements OnInit, OnDestroy {

  readonly requiredDocuments = DOCUMENTO_PERSONAL_CATALOGO.filter(item => item.requerido);

  distribuidores: Distribuidor[] = [];
  distribuidoresFiltrados: Distribuidor[] = [];
  distribuidoresPaginados: Distribuidor[] = [];
  accessByDistributorId: Record<string, UsuarioAutolog | null> = {};
  documentCoverageByDistributorId: Record<string, TipoDocumentoPersonal[]> = {};
  canAdminister = false;
  canWrite = false;
  canCreate = false;
  state: DirectoryState = 'loading';
  documentInsightsState: DocumentInsightsState = 'idle';
  errorMessage = '';
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  busqueda: string = '';

  private distributorSubscription?: Subscription;
  private documentInsightsRequest = 0;

  constructor(
    private distribuidresService: DistribuidoresService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private userAdminService: UserAdminService,
    private authorizationService: AuthorizationService,
    private router: Router,
    private expedienteService: PersonalExpedienteService,
    private plantScope: PlantScopeService,
  ) { }

  ngOnInit() {
    void this.initialize();
  }

  ngOnDestroy(): void {
    this.distributorSubscription?.unsubscribe();
    this.documentInsightsRequest++;
  }

  ionViewWillEnter(): void {
    if (this.canAdminister && this.distribuidores.length) {
      void this.loadDocumentInsights();
    }
  }

  getInfo(): void {
    this.state = 'loading';
    this.errorMessage = '';
    this.distributorSubscription?.unsubscribe();
    this.distributorSubscription = this.distribuidresService.getDistribuidores().subscribe({
      next: (data) => {
        this.distribuidores = data;
        this.filtrarDistribuidores();
        this.state = data.length ? 'ready' : 'empty';
        void this.loadAccesses(data);
        void this.loadDocumentInsights();
      },
      error: () => {
        this.distribuidores = [];
        this.distribuidoresFiltrados = [];
        this.distribuidoresPaginados = [];
        this.state = 'error';
        this.errorMessage = 'No fue posible cargar el directorio de distribuidores.';
      }
    });
  }

  get totalDistribuidores(): number {
    return this.distribuidores.length;
  }

  get activeCount(): number {
    return this.distribuidores.filter(distribuidor => this.isActive(distribuidor)).length;
  }

  get inactiveCount(): number {
    return this.totalDistribuidores - this.activeCount;
  }

  get accountCount(): number {
    return this.distribuidores.filter(distribuidor =>
      Boolean(distribuidor.usuarioUid || this.accessByDistributorId[distribuidor.id])
    ).length;
  }

  get incompleteFileCount(): number {
    if (this.documentInsightsState !== 'ready') return 0;
    return this.distribuidores.filter(distribuidor =>
      this.isActive(distribuidor) && this.missingDocumentsFor(distribuidor) > 0
    ).length;
  }

  get topMissingDocuments(): MissingDocumentInsight[] {
    if (this.documentInsightsState !== 'ready' || !this.activeCount) return [];
    return this.requiredDocuments
      .map(documentType => {
        const missingCount = this.distribuidores.filter(distribuidor =>
          this.isActive(distribuidor) &&
          !this.documentCoverageByDistributorId[distribuidor.id]?.includes(documentType.value)
        ).length;
        return {
          tipo: documentType.value,
          label: documentType.label,
          missingCount,
          completionPercent: Math.round(((this.activeCount - missingCount) / this.activeCount) * 100),
        };
      })
      .filter(documentType => documentType.missingCount > 0)
      .sort((left, right) => right.missingCount - left.missingCount || left.label.localeCompare(right.label))
      .slice(0, 3);
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

  filtrarDistribuidores() {
    if (!this.busqueda.trim()) {
      this.distribuidoresFiltrados = [...this.distribuidores];
    } else {
      const filtro = this.busqueda.toLowerCase();
      this.distribuidoresFiltrados = this.distribuidores.filter(distribuidor =>
        distribuidor.nombre.toLowerCase().includes(filtro) ||
        distribuidor.identificador.toLowerCase().includes(filtro)
      );
    }
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.distribuidoresPaginados = this.distribuidoresFiltrados.slice(inicio, fin);
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarPaginacion();
    }
  }

  paginaSiguiente() {
    if (this.paginaActual < this.getTotalPaginas()) {
      this.paginaActual++;
      this.actualizarPaginacion();
    }
  }

  getTotalPaginas(): number {
    return Math.max(1, Math.ceil(this.distribuidoresFiltrados.length / this.registrosPorPagina));
  }

  /* 
  AGREGAR UN NUEVO OPERADOR
  */
  async addDistribuidor() {
    if (!this.canCreate || !this.canWrite) return;
    const modalOperador = await this.modalController.create({
      component: AgregarComponent,
      cssClass: 'autolog-form-modal'
    });

    modalOperador.present();
  }

  async editarDistribuidor(data: any) {
    if (!this.canWrite) return;
    const modalOperador = await this.modalController.create({
      component: EditarComponent,
      componentProps: {
        operadorData: data,
        canAdministerAccess: this.canAdminister,
      },
      cssClass: 'autolog-form-modal'
    });

    modalOperador.present();
  }

  async openExpediente(distribuidor: Distribuidor): Promise<void> {
    await this.router.navigate(['/distribuidores', distribuidor.id, 'expediente']);
  }

  async manageAccess(distribuidor: Distribuidor): Promise<void> {
    const linked = this.accessByDistributorId[distribuidor.id] || null;
    const modal = await this.modalController.create({
      component: AccesoDistribuidorComponent,
      componentProps: { distribuidorId: distribuidor.id, usuarioData: linked },
      cssClass: 'usuario-modal',
    });
    await modal.present();
    const result = await modal.onDidDismiss<{ changed: boolean; uid?: string }>();
    if (result.data?.uid) distribuidor.usuarioUid = result.data.uid;
    if (result.data?.changed) await this.loadAccesses(this.distribuidores);
  }

  async eliminarDistribuidor(id: string) {
    if (!this.canAdminister) return;
    const alert = await this.alertController.create({
      header: 'Desactivar distribuidor',
      message: 'Se conservarán sus ventas, expediente, asistencia y vínculo de cuenta.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Desactivar',
          role: 'destructive',
          handler: () => void this.deactivateDistribuidor(id),
        }
      ]
    });
    await alert.present();
  }

  transformarZona(zona: string): string {
    return zona === 'gpe' ? 'Guadalupe' :
      zona === 'zac' ? 'Zacatecas' :
        'Sin zona';
  }

  accessLabel(distribuidor: Distribuidor): string {
    const usuario = this.accessByDistributorId[distribuidor.id];
    if (!usuario) return distribuidor.usuarioUid ? 'Cuenta vinculada' : 'Sin cuenta';
    if (usuario.accesoAutolog && usuario.accesoAsistencia) return 'AUTOLOG + Reloj';
    if (usuario.accesoAutolog) return 'AUTOLOG';
    if (usuario.accesoAsistencia) return 'Reloj checador';
    return 'Sin accesos';
  }

  isActive(distribuidor: Distribuidor): boolean {
    if (distribuidor.activo === false) return false;
    return !['INACTIVO', 'BAJA', 'ELIMINADO'].includes(
      String(distribuidor.estado || distribuidor.estatus || '').toUpperCase()
    );
  }

  missingDocumentsFor(distribuidor: Distribuidor): number {
    const uploadedTypes = this.documentCoverageByDistributorId[distribuidor.id] ?? [];
    return this.requiredDocuments.filter(documentType => !uploadedTypes.includes(documentType.value)).length;
  }

  documentStatusLabel(distribuidor: Distribuidor): string {
    if (this.documentInsightsState === 'loading' || this.documentInsightsState === 'idle') {
      return 'Calculando…';
    }
    if (this.documentInsightsState === 'error') return 'No disponible';
    const missing = this.missingDocumentsFor(distribuidor);
    return missing ? `${missing} pendiente${missing === 1 ? '' : 's'}` : 'Completo';
  }

  documentStatusColor(distribuidor: Distribuidor): string {
    if (this.documentInsightsState !== 'ready') return 'medium';
    return this.missingDocumentsFor(distribuidor) ? 'warning' : 'success';
  }

  private async initialize(): Promise<void> {
    try {
      await this.plantScope.initialize();
      this.canAdminister = await this.authorizationService.isCurrentUserAdmin();
      const role = this.plantScope.snapshot().profile?.rol;
      this.canCreate = role === 'admin' || role === 'planta';
      this.plantScope.state$.subscribe(() => this.canWrite = !this.plantScope.isReadOnly());
    } catch {
      this.canAdminister = false;
      this.canCreate = false;
      this.canWrite = false;
    }
    this.getInfo();
  }

  private async loadAccesses(distribuidores: Distribuidor[]): Promise<void> {
    if (!this.canAdminister) {
      this.accessByDistributorId = {};
      return;
    }
    const entries = await Promise.all(distribuidores.map(async distribuidor => {
      try {
        const usuario = distribuidor.usuarioUid
          ? await this.userAdminService.getUsuario(distribuidor.usuarioUid)
          : await this.userAdminService.getUsuarioByDistribuidorId(distribuidor.id);
        return [distribuidor.id, usuario] as const;
      } catch {
        return [distribuidor.id, null] as const;
      }
    }));
    this.accessByDistributorId = Object.fromEntries(entries);
  }

  async loadDocumentInsights(): Promise<void> {
    if (!this.canAdminister) {
      this.documentInsightsState = 'idle';
      this.documentCoverageByDistributorId = {};
      return;
    }
    const requestId = ++this.documentInsightsRequest;
    this.documentInsightsState = 'loading';
    try {
      const coverage = await this.expedienteService.getDistribuidorDocumentCoverage();
      if (requestId !== this.documentInsightsRequest) return;
      this.documentCoverageByDistributorId = coverage;
      this.documentInsightsState = 'ready';
    } catch {
      if (requestId !== this.documentInsightsRequest) return;
      this.documentCoverageByDistributorId = {};
      this.documentInsightsState = 'error';
    }
  }

  private async deactivateDistribuidor(id: string): Promise<void> {
    try {
      await this.distribuidresService.deactivateDistribuidor(id);
      await this.presentToast('Distribuidor desactivado correctamente', 'middle', 'success');
    } catch {
      await this.presentToast('No fue posible desactivar al distribuidor.', 'middle', 'danger');
    }
  }

}
