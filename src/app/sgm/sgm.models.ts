export type MedidorEstado = 'activo' | 'alerta' | 'inactivo';

export interface Medidor {
  id: string;
  clave: string;
  ubicacion: string;
  tipo: string;
  ultimaLectura: number | null;
  unidad: string;
  fechaLectura: Date | null;
  estado: MedidorEstado;
}

export const MEDIDOR_ESTADO_LABEL: Record<MedidorEstado, string> = {
  activo: 'Activo',
  alerta: 'Con alerta',
  inactivo: 'Inactivo',
};

export const MEDIDOR_ESTADO_COLOR: Record<MedidorEstado, string> = {
  activo: 'success',
  alerta: 'warning',
  inactivo: 'medium',
};
