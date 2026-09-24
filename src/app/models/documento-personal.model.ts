import { Timestamp } from '@angular/fire/firestore';

export type TipoDocumentoPersonal =
  | 'CONTRATO'
  | 'ALTA_SEGURO'
  | 'SEGURO_VIDA'
  | 'CONFIDENCIALIDAD'
  | 'CODIGO_ETICA'
  | 'CSF'
  | 'INFONAVIT'
  | 'IDENTIFICACION'
  | 'COMPROBANTE_DOMICILIO'
  | 'LICENCIA'
  | 'CERTIFICADO'
  | 'CAPACITACION'
  | 'MEDICO_LABORAL'
  | 'OTRO';

export type EstadoDocumentoPersonal =
  | 'VIGENTE'
  | 'POR_VENCER'
  | 'VENCIDO'
  | 'PENDIENTE'
  | 'NO_APLICA';

export type TipoPersonalExpediente = 'DISTRIBUIDOR';

export interface ExpedientePersonalTarget {
  tipoPersonal: TipoPersonalExpediente;
  personalId: string;
  nombreCompleto: string;
  detalle: string;
  activo: boolean;
}

export interface DocumentoPersonalDocument {
  personalId?: string;
  tipoPersonal?: TipoPersonalExpediente;
  distribuidorId?: string | null;
  tipo: TipoDocumentoPersonal;
  nombre: string;
  nombreArchivo: string;
  storagePath: string;
  mimeType: string;
  size: number;
  fechaDocumento: Timestamp | null;
  fechaVencimiento: Timestamp | null;
  estadoManual: 'NO_APLICA' | null;
  notas: string | null;
  uploadedAt: Timestamp;
  uploadedByUid: string;
  updatedAt: Timestamp;
  version: number;
  esVersionActual: boolean;
  replacedDocumentId: string | null;
  replacedByDocumentId: string | null;
}

export interface DocumentoPersonal extends DocumentoPersonalDocument {
  id: string;
}

export interface DocumentoPersonalUploadInput {
  tipo: TipoDocumentoPersonal;
  nombre: string;
  fechaDocumento: Timestamp | null;
  fechaVencimiento: Timestamp | null;
  notas: string | null;
}


export const DOCUMENTO_PERSONAL_CATALOGO: ReadonlyArray<{
  value: TipoDocumentoPersonal;
  label: string;
  requerido: boolean;
}> = [
  { value: 'CONTRATO', label: 'Contrato laboral', requerido: true },
  { value: 'ALTA_SEGURO', label: 'Alta de seguro', requerido: true },
  { value: 'SEGURO_VIDA', label: 'Seguro de vida', requerido: false },
  { value: 'CONFIDENCIALIDAD', label: 'Carta de confidencialidad', requerido: true },
  { value: 'CODIGO_ETICA', label: 'Código de ética', requerido: true },
  { value: 'CSF', label: 'Constancia de Situación Fiscal', requerido: true },
  { value: 'INFONAVIT', label: 'INFONAVIT', requerido: false },
  { value: 'IDENTIFICACION', label: 'Identificación', requerido: true },
  { value: 'COMPROBANTE_DOMICILIO', label: 'Comprobante de domicilio', requerido: true },
  { value: 'LICENCIA', label: 'Licencia', requerido: false },
  { value: 'CERTIFICADO', label: 'Certificado', requerido: false },
  { value: 'CAPACITACION', label: 'Curso / capacitación', requerido: false },
  { value: 'MEDICO_LABORAL', label: 'Documentación médica laboral', requerido: false },
  { value: 'OTRO', label: 'Otro', requerido: false },
];

export function tipoDocumentoPersonalLabel(tipo: TipoDocumentoPersonal): string {
  return DOCUMENTO_PERSONAL_CATALOGO.find(item => item.value === tipo)?.label ?? tipo;
}
