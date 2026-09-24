import { Distribuidor } from './distribuidor.model';

export const ATTENDANCE_POINT_RADIUS_MIN = 10;
export const ATTENDANCE_POINT_RADIUS_MAX = 5000;
export const ATTENDANCE_POINT_RADIUS_DEFAULT = 150;

export interface AttendancePoint {
  id: string;
  nombre: string;
  descripcion?: string;
  latitude: number;
  longitude: number;
  radioMetros: number;
  activo: boolean;
  asignados: number;
}

export interface AttendancePointInput {
  nombre: string;
  descripcion: string;
  latitude: number;
  longitude: number;
  radioMetros: number;
  activo: boolean;
  distribuidorIds: string[];
}

export interface AttendancePointAssignments {
  puntoId: string;
  distribuidorIds: string[];
}

export interface AttendancePointsLoadResult {
  puntos: AttendancePoint[];
}

export type AttendancePointDistributor = Pick<Distribuidor, 'id' | 'nombre' | 'identificador'>;
