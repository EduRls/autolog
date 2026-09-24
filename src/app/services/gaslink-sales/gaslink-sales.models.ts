import { DocumentSnapshot, Timestamp } from '@angular/fire/firestore';

export interface GaslinkSale {
  id: string;
  folio: string | null;
  fechaVenta: Date | null;
  empresa: string | null;
  vendedor: string | null;
  cliente: string | null;
  formaPago: string | null;
  litros: number | null;
  total: number | null;
  origen: string | null;
  sourceHash: string | null;
  duplicateIndex: number | null;
  primeraSincronizacion: Date | null;
  ultimaSincronizacion: Date | null;
  fechaGeneracionArchivo: Date | null;
}

export interface GaslinkSalesFilters {
  startDate: Date;
  endDate: Date;
  folio: string | null;
  vendedor: string | null;
}
export interface GaslinkSalesPage {
  sales: GaslinkSale[];
  lastVisible: DocumentSnapshot | null;
  hasMore: boolean;
}
export interface GaslinkSalesSummary { count: number; liters: number; total: number; average: number }

export function safeDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  return null;
}

const text = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim() : null;
const number = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;

export function mapGaslinkSale(id: string, data: Record<string, unknown>): GaslinkSale {
  return {
    id, folio: text(data['folio']), fechaVenta: safeDate(data['fechaVenta']), empresa: text(data['empresa']),
    vendedor: text(data['vendedor']), cliente: text(data['cliente']), formaPago: text(data['formaPago']),
    litros: number(data['litros']), total: number(data['total']), origen: text(data['origen']),
    sourceHash: text(data['sourceHash']), duplicateIndex: number(data['duplicateIndex']),
    primeraSincronizacion: safeDate(data['primeraSincronizacion']), ultimaSincronizacion: safeDate(data['ultimaSincronizacion']),
    fechaGeneracionArchivo: safeDate(data['fechaGeneracionArchivo'])
  };
}
