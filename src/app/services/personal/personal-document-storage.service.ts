import { Injectable } from '@angular/core';
import {
  Storage,
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from '@angular/fire/storage';
import { ExpedientePersonalTarget } from '../../models/documento-personal.model';
import {
  MAX_PERSONAL_DOCUMENT_SIZE,
  UploadedPersonalDocumentMetadata,
  buildPersonalDocumentStoragePath,
  isAllowedPersonalDocument,
} from './personal-document.utils';

@Injectable({ providedIn: 'root' })
export class PersonalDocumentStorageService {
  constructor(private readonly storage: Storage) {}

  async uploadDocumento(
    target: ExpedientePersonalTarget,
    documentoId: string,
    file: File
  ): Promise<UploadedPersonalDocumentMetadata> {
    this.assertValidFile(file);
    const storagePath = buildPersonalDocumentStoragePath(target, documentoId, file.name);
    const storageReference = ref(this.storage, storagePath);
    await uploadBytes(storageReference, file, {
      contentType: file.type,
      customMetadata: {
        tipoPersonal: target.tipoPersonal,
        personalId: target.personalId,
        documentoId,
      },
    });
    return {
      storagePath,
      nombreArchivo: file.name,
      mimeType: file.type,
      size: file.size,
    };
  }

  async getDocumentoUrl(storagePath: string): Promise<string> {
    return getDownloadURL(ref(this.storage, storagePath));
  }

  async deleteDocumento(storagePath: string): Promise<void> {
    await deleteObject(ref(this.storage, storagePath));
  }

  assertValidFile(file: Pick<File, 'type' | 'size'>): void {
    if (file.size <= 0) throw new Error('El archivo está vacío.');
    if (file.size > MAX_PERSONAL_DOCUMENT_SIZE) {
      throw new Error('El archivo excede el límite de 10 MB.');
    }
    if (!isAllowedPersonalDocument(file)) {
      throw new Error('Sólo se permiten archivos PDF, JPG, JPEG o PNG.');
    }
  }
}
