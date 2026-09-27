export const SGM_REGISTROS_MEDIDORES_COLLECTION = 'sgm_registros_medidores';

export type EstadoOperacionMedidor = 'EN_OPERACION' | 'EN_MANTENIMIENTO' | 'FUERA_DE_OPERACION';

export const ESTADOS_OPERACION_MEDIDOR: EstadoOperacionMedidor[] = ['EN_OPERACION', 'EN_MANTENIMIENTO', 'FUERA_DE_OPERACION'];

export const ESTADO_OPERACION_LABEL: Record<EstadoOperacionMedidor, string> = {
  EN_OPERACION: 'En operación',
  EN_MANTENIMIENTO: 'En mantenimiento',
  FUERA_DE_OPERACION: 'Fuera de operación',
};

export const ESTADO_OPERACION_COLOR: Record<EstadoOperacionMedidor, string> = {
  EN_OPERACION: 'success',
  EN_MANTENIMIENTO: 'warning',
  FUERA_DE_OPERACION: 'danger',
};

export interface MedidorRegistro {
  no: number;
  identificacionInterna: string;
  descripcion: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  localizacion: string;
  estadoOperacion: EstadoOperacionMedidor;
}

export interface RegistroMedidoresPayload {
  plantaId?: string | null;
  almacenamiento: string;
  /** Fecha en formato YYYY-MM-DD. */
  fechaRegistro: string;
  medidores: MedidorRegistro[];
  realizo: string;
  aprobo: string;
  /** Fecha de cierre del registro en formato YYYY-MM-DD. */
  fechaCierre: string;
}

export interface RegistroMedidores extends RegistroMedidoresPayload {
  id: string;
  plantaId: string;
  /** Asignado por el sistema al guardar; el usuario no puede modificarlo. */
  consecutivo: string;
  createdAt?: unknown;
  createdByUid?: string | null;
  updatedAt?: unknown;
  updatedByUid?: string | null;
}

/** Formato del consecutivo: 001/2026. */
export const CONSECUTIVO_PATTERN = /^\d{3,}\/\d{4}$/;

export function formatConsecutivo(numero: number, year: number): string {
  return `${String(numero).padStart(3, '0')}/${year}`;
}

export function maxConsecutivoNumero(registros: Pick<RegistroMedidores, 'consecutivo'>[], year: number): number {
  return registros.reduce((current, registro) => {
    const [number, registroYear] = String(registro.consecutivo || '').split('/');
    return Number(registroYear) === year ? Math.max(current, Number(number) || 0) : current;
  }, 0);
}

export function nextConsecutivo(registros: Pick<RegistroMedidores, 'consecutivo'>[], year = new Date().getFullYear()): string {
  return formatConsecutivo(maxConsecutivoNumero(registros, year) + 1, year);
}
