import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Timestamp } from '@angular/fire/firestore';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import {
  DOCUMENTO_PERSONAL_CATALOGO,
  DocumentoPersonalUploadInput,
  ExpedientePersonalTarget,
  TipoDocumentoPersonal,
} from '../../../models/documento-personal.model';
import { MAX_PERSONAL_DOCUMENT_SIZE } from '../../../services/personal/personal-document.utils';
import { PersonalDocumentStorageService } from '../../../services/personal/personal-document-storage.service';
import { PersonalExpedienteService } from '../../../services/personal/personal-expediente.service';

interface DocumentoFormControls {
  tipo: FormControl<TipoDocumentoPersonal | ''>;
  nombre: FormControl<string>;
  fechaDocumento: FormControl<string>;
  fechaVencimiento: FormControl<string>;
  notas: FormControl<string>;
}

@Component({
  selector: 'app-subir-documento-personal',
  templateUrl: './subir-documento-personal.component.html',
  styleUrls: ['./subir-documento-personal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class SubirDocumentoPersonalComponent implements OnInit {
  @Input({ required: true }) target!: ExpedientePersonalTarget;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  readonly tiposDocumento = DOCUMENTO_PERSONAL_CATALOGO;
  readonly maxSizeMb = MAX_PERSONAL_DOCUMENT_SIZE / 1024 / 1024;
  documentoForm!: FormGroup<DocumentoFormControls>;
  selectedFile: File | null = null;
  saving = false;
  isDragging = false;

  constructor(
    private readonly expedienteService: PersonalExpedienteService,
    private readonly documentStorage: PersonalDocumentStorageService,
    private readonly modalController: ModalController,
    private readonly toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.documentoForm = new FormGroup<DocumentoFormControls>({
      tipo: new FormControl<TipoDocumentoPersonal | ''>('', { nonNullable: true, validators: [Validators.required] }),
      nombre: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(160)] }),
      fechaDocumento: new FormControl('', { nonNullable: true }),
      fechaVencimiento: new FormControl('', { nonNullable: true }),
      notas: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
    });
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    await this.selectFile(file, input);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.saving) this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragging = false;
    if (this.saving) return;
    const file = event.dataTransfer?.files?.[0] ?? null;
    if (file) await this.selectFile(file);
  }

  clearSelectedFile(event?: Event): void {
    event?.stopPropagation();
    this.selectedFile = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  private async selectFile(file: File, input?: HTMLInputElement): Promise<void> {
    try {
      this.documentStorage.assertValidFile(file);
      this.selectedFile = file;
      if (!this.documentoForm.controls.nombre.value) {
        this.documentoForm.controls.nombre.setValue(file.name.replace(/\.[^.]+$/, ''));
      }
    } catch (error) {
      this.selectedFile = null;
      if (input) input.value = '';
      if (this.fileInput && this.fileInput.nativeElement !== input) {
        this.fileInput.nativeElement.value = '';
      }
      await this.presentToast(error instanceof Error ? error.message : 'El archivo no es válido.', 'warning');
    }
  }

  async upload(): Promise<void> {
    if (this.documentoForm.invalid || !this.selectedFile || this.saving) {
      this.documentoForm.markAllAsTouched();
      await this.presentToast('Selecciona el tipo y un archivo válido.', 'warning');
      return;
    }

    this.saving = true;
    try {
      const value = this.documentoForm.getRawValue();
      const input: DocumentoPersonalUploadInput = {
        tipo: value.tipo as TipoDocumentoPersonal,
        nombre: value.nombre.trim() || this.selectedFile.name,
        fechaDocumento: this.toTimestamp(value.fechaDocumento),
        fechaVencimiento: this.toTimestamp(value.fechaVencimiento),
        notas: value.notas.trim() || null,
      };
      await this.expedienteService.uploadDocumento(this.target, this.selectedFile, input);
      this.selectedFile = null;
      this.documentoForm.reset({ tipo: '', nombre: '', fechaDocumento: '', fechaVencimiento: '', notas: '' });
      await this.presentToast('Documento cargado al expediente.', 'success');
      await this.modalController.dismiss({ changed: true });
    } catch (error) {
      await this.presentToast(
        error instanceof Error ? error.message : 'No fue posible subir el documento.',
        'danger'
      );
    } finally {
      this.saving = false;
    }
  }

  async close(): Promise<void> {
    this.selectedFile = null;
    await this.modalController.dismiss({ changed: false });
  }

  formatFileSize(size: number): string {
    return size < 1024 * 1024
      ? `${Math.ceil(size / 1024)} KB`
      : `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  private toTimestamp(value: string): Timestamp | null {
    return value ? Timestamp.fromDate(new Date(`${value}T12:00:00`)) : null;
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2600, color, position: 'bottom' });
    await toast.present();
  }
}
