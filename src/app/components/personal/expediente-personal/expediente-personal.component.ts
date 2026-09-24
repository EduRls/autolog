import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AlertController, IonicModule, ModalController, ToastController } from '@ionic/angular';
import {
  DOCUMENTO_PERSONAL_CATALOGO,
  DocumentoPersonal,
  EstadoDocumentoPersonal,
  ExpedientePersonalTarget,
  TipoDocumentoPersonal,
  tipoDocumentoPersonalLabel,
} from '../../../models/documento-personal.model';
import { Distribuidor } from '../../../models/distribuidor.model';
import { PersonalExpedienteService } from '../../../services/personal/personal-expediente.service';
import {
  countPendingRequiredDocuments,
  daysUntilExpiration,
  getDocumentoPersonalEstado,
} from '../../../services/personal/personal-document.utils';
import { SubirDocumentoPersonalComponent } from '../subir-documento-personal/subir-documento-personal.component';

type ExpedienteState = 'loading' | 'ready' | 'empty' | 'error';

@Component({
  selector: 'app-expediente-personal',
  templateUrl: './expediente-personal.component.html',
  styleUrls: ['./expediente-personal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ExpedientePersonalComponent implements OnInit {
  @Input() distribuidor?: Distribuidor;
  @Input() pageMode = false;

  documentos: DocumentoPersonal[] = [];
  state: ExpedienteState = 'loading';
  actionDocumentId: string | null = null;

  constructor(
    private readonly expedienteService: PersonalExpedienteService,
    private readonly modalController: ModalController,
    private readonly alertController: AlertController,
    private readonly toastController: ToastController
  ) {}

  ngOnInit(): void {
    if (!this.distribuidor) {
      throw new Error('El expediente requiere una persona.');
    }
    void this.loadDocumentos();
  }

  get target(): ExpedientePersonalTarget {
    const distribuidor = this.distribuidor;
    if (!distribuidor) throw new Error('El expediente requiere una persona.');
    return {
      tipoPersonal: 'DISTRIBUIDOR',
      personalId: distribuidor.id,
      nombreCompleto: distribuidor.nombre,
      detalle: [distribuidor.identificador, distribuidor.ruta].filter(Boolean).join(' · '),
      activo: distribuidor.activo !== false &&
        !['INACTIVO', 'BAJA', 'ELIMINADO'].includes(
          String(distribuidor.estado || distribuidor.estatus || '').toUpperCase()
        ),
    };
  }

  get documentosActuales(): DocumentoPersonal[] {
    return this.documentos.filter(documento => documento.esVersionActual);
  }

  get expedienteTitle(): string {
    return 'Expediente del distribuidor';
  }

  get pendientes(): number {
    return countPendingRequiredDocuments(
      this.documentos,
      DOCUMENTO_PERSONAL_CATALOGO.filter(item => item.requerido).map(item => item.value)
    );
  }

  get porVencer(): number {
    return this.documentosActuales.filter(documento => this.estado(documento) === 'POR_VENCER').length;
  }

  get vencidos(): number {
    return this.documentosActuales.filter(documento => this.estado(documento) === 'VENCIDO').length;
  }

  get tiposPendientes(): ReadonlyArray<{ value: TipoDocumentoPersonal; label: string }> {
    const uploadedTypes = new Set(this.documentosActuales.map(documento => documento.tipo));
    return DOCUMENTO_PERSONAL_CATALOGO
      .filter(item => item.requerido && !uploadedTypes.has(item.value))
      .map(item => ({ value: item.value, label: item.label }));
  }

  async loadDocumentos(): Promise<void> {
    this.state = 'loading';
    try {
      this.documentos = await this.expedienteService.getDocumentos(this.target);
      this.state = this.documentos.length ? 'ready' : 'empty';
    } catch {
      this.documentos = [];
      this.state = 'error';
    }
  }

  async openUpload(): Promise<void> {
    const modal = await this.modalController.create({
      component: SubirDocumentoPersonalComponent,
      componentProps: { target: this.target },
      cssClass: 'personal-documento-modal',
    });
    await modal.present();
    const result = await modal.onDidDismiss<{ changed: boolean }>();
    if (result.data?.changed) await this.loadDocumentos();
  }

  async view(documento: DocumentoPersonal): Promise<void> {
    await this.withDocumentAction(documento, async () => {
      const url = await this.expedienteService.getDocumentoUrl(documento);
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) throw new Error('El navegador bloqueó la nueva pestaña.');
    }, 'No fue posible abrir el documento.');
  }

  async download(documento: DocumentoPersonal): Promise<void> {
    await this.withDocumentAction(documento, async () => {
      const url = await this.expedienteService.getDocumentoUrl(documento);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = documento.nombreArchivo;
      anchor.rel = 'noopener';
      anchor.click();
    }, 'No fue posible descargar el documento.');
  }

  triggerReplace(documento: DocumentoPersonal): void {
    document.getElementById(`replace-${documento.id}`)?.click();
  }

  async replace(documento: DocumentoPersonal, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;
    await this.withDocumentAction(documento, async () => {
      await this.expedienteService.replaceDocumento(this.target, documento, file);
      await this.presentToast('Nueva versión cargada; la versión anterior se conservó.', 'success');
      await this.loadDocumentos();
    }, 'No fue posible reemplazar el documento.');
  }

  async confirmDelete(documento: DocumentoPersonal): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar documento',
      message: `Se eliminará el archivo “${documento.nombre}” de Storage y su metadata.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => void this.remove(documento) },
      ],
    });
    await alert.present();
  }

  estado(documento: DocumentoPersonal): EstadoDocumentoPersonal {
    return getDocumentoPersonalEstado(documento);
  }

  estadoLabel(documento: DocumentoPersonal): string {
    const estado = this.estado(documento);
    const days = daysUntilExpiration(documento.fechaVencimiento);
    if (estado === 'POR_VENCER' && days !== null) return `Vence en ${days} días`;
    return {
      VIGENTE: 'Vigente',
      POR_VENCER: 'Por vencer',
      VENCIDO: 'Vencido',
      PENDIENTE: 'Pendiente',
      NO_APLICA: documento.esVersionActual ? 'No aplica' : 'Reemplazado',
    }[estado];
  }

  estadoColor(documento: DocumentoPersonal): string {
    return { VIGENTE: 'success', POR_VENCER: 'warning', VENCIDO: 'danger', PENDIENTE: 'medium', NO_APLICA: 'medium' }[this.estado(documento)];
  }

  tipoLabel(tipo: TipoDocumentoPersonal): string {
    return tipoDocumentoPersonalLabel(tipo);
  }

  funcionPrincipal(): string {
    return this.target.detalle;
  }

  formatSize(bytes: number): string {
    return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  async close(): Promise<void> {
    await this.modalController.dismiss();
  }

  private async remove(documento: DocumentoPersonal): Promise<void> {
    await this.withDocumentAction(documento, async () => {
      await this.expedienteService.deleteDocumento(this.target, documento);
      await this.presentToast('Documento eliminado del expediente.', 'success');
      await this.loadDocumentos();
    }, 'El documento no pudo eliminarse completamente. Intenta nuevamente.');
  }

  private async withDocumentAction(
    documento: DocumentoPersonal,
    action: () => Promise<void>,
    errorMessage: string
  ): Promise<void> {
    if (this.actionDocumentId) return;
    this.actionDocumentId = documento.id;
    try {
      await action();
    } catch (error) {
      await this.presentToast(error instanceof Error ? error.message : errorMessage, 'danger');
    } finally {
      this.actionDocumentId = null;
    }
  }

  private async presentToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2800, color, position: 'bottom' });
    await toast.present();
  }
}
