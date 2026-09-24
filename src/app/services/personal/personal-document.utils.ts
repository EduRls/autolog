import { Timestamp } from '@angular/fire/firestore';
import {
  DocumentoPersonal,
  DocumentoPersonalDocument,
  DocumentoPersonalUploadInput,
  EstadoDocumentoPersonal,
  ExpedientePersonalTarget,
  TipoDocumentoPersonal,
} from '../../models/documento-personal.model';

export const MAX_PERSONAL_DOCUMENT_SIZE = 10 * 1024 * 1024;
export const PERSONAL_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export interface UploadedPersonalDocumentMetadata {
  storagePath: string;
  nombreArchivo: string;
  mimeType: string;
  size: number;
}

export function normalizePersonalText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function nullableText(value: string | null | undefined): string | null {
  const normalized = value?.trim().replace(/\s+/g, ' ') ?? '';
  return normalized || null;
}

export function isAllowedPersonalDocument(file: Pick<File, 'type' | 'size'>): boolean {
  return PERSONAL_DOCUMENT_MIME_TYPES.includes(
    file.type as (typeof PERSONAL_DOCUMENT_MIME_TYPES)[number]
  ) && file.size > 0 && file.size <= MAX_PERSONAL_DOCUMENT_SIZE;
}

export function sanitizePersonalFilename(filename: string): string {
  const extensionIndex = filename.lastIndexOf('.');
  const extension = extensionIndex >= 0 ? filename.slice(extensionIndex).toLowerCase() : '';
  const baseName = extensionIndex >= 0 ? filename.slice(0, extensionIndex) : filename;
  const safeBase = normalizePersonalText(baseName)
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'documento';
  return `${safeBase}${extension.replace(/[^a-z0-9.]/g, '')}`;
}

export function buildPersonalDocumentStoragePath(
  target: ExpedientePersonalTarget,
  documentoId: string,
  filename: string
): string {
  const collection = 'distribuidores';
  const safePersonalId = safePathSegment(target.personalId);
  const safeDocumentoId = safePathSegment(documentoId);
  return `personal/${collection}/${safePersonalId}/expediente/${safeDocumentoId}/${sanitizePersonalFilename(filename)}`;
}

export function getDocumentoPersonalEstado(
  documento: Pick<DocumentoPersonal, 'estadoManual' | 'fechaVencimiento' | 'esVersionActual'>,
  now: Date = new Date()
): EstadoDocumentoPersonal {
  if (!documento.esVersionActual) return 'NO_APLICA';
  if (documento.estadoManual === 'NO_APLICA') return 'NO_APLICA';
  if (!documento.fechaVencimiento) return 'VIGENTE';

  const expiration = documento.fechaVencimiento.toDate();
  const remainingDays = Math.ceil((expiration.getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (remainingDays < 0) return 'VENCIDO';
  if (remainingDays <= 30) return 'POR_VENCER';
  return 'VIGENTE';
}

export function daysUntilExpiration(timestamp: Timestamp | null, now: Date = new Date()): number | null {
  if (!timestamp) return null;
  return Math.ceil((timestamp.toDate().getTime() - startOfDay(now).getTime()) / 86_400_000);
}

export function countPendingRequiredDocuments(
  documents: ReadonlyArray<Pick<DocumentoPersonal, 'tipo' | 'esVersionActual'>>,
  requiredTypes: ReadonlyArray<TipoDocumentoPersonal>
): number {
  const uploadedTypes = new Set(
    documents.filter(document => document.esVersionActual).map(document => document.tipo)
  );
  return requiredTypes.filter(type => !uploadedTypes.has(type)).length;
}

export async function withUploadCompensation<T>(
  upload: () => Promise<T>,
  persistMetadata: (uploaded: T) => Promise<void>,
  removeUploaded: (uploaded: T) => Promise<void>
): Promise<T> {
  const uploaded = await upload();
  try {
    await persistMetadata(uploaded);
    return uploaded;
  } catch (error) {
    try {
      await removeUploaded(uploaded);
    } catch {
      // The original metadata error is more useful to the caller. A cleanup retry can be performed later.
    }
    throw error;
  }
}

export function createDocumentoPersonalMetadata(
  target: ExpedientePersonalTarget,
  uploadedByUid: string,
  input: DocumentoPersonalUploadInput,
  uploaded: UploadedPersonalDocumentMetadata,
  now: Timestamp,
  version = 1,
  replacedDocumentId: string | null = null
): DocumentoPersonalDocument {
  return {
    personalId: target.personalId,
    tipoPersonal: target.tipoPersonal,
    distribuidorId: target.tipoPersonal === 'DISTRIBUIDOR' ? target.personalId : null,
    tipo: input.tipo,
    nombre: input.nombre.trim(),
    nombreArchivo: uploaded.nombreArchivo,
    storagePath: uploaded.storagePath,
    mimeType: uploaded.mimeType,
    size: uploaded.size,
    fechaDocumento: input.fechaDocumento,
    fechaVencimiento: input.fechaVencimiento,
    estadoManual: null,
    notas: input.notas?.trim() || null,
    uploadedAt: now,
    uploadedByUid,
    updatedAt: now,
    version,
    esVersionActual: true,
    replacedDocumentId,
    replacedByDocumentId: null,
  };
}

export async function deletePersonalDocumentWithRecovery(
  deleteFile: () => Promise<void>,
  deleteMetadata: () => Promise<void>
): Promise<void> {
  try {
    await deleteFile();
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : '';
    if (code !== 'storage/object-not-found') throw error;
  }
  await deleteMetadata();
}

function safePathSegment(value: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error('El identificador contiene caracteres no permitidos.');
  }
  return value;
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}
