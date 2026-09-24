import { Timestamp } from '@angular/fire/firestore';
import { NavigationSectionId, normalizeNavigationSections } from '../components/menu/navigation.config';

export type RolAdministrativo = 'admin' | 'capturista' | 'planta';

export type UsuarioRol = 'admin' | 'capturista' | 'planta' | 'empleado';
export type TipoPersonalUsuario = 'SISTEMA' | 'DISTRIBUIDOR';

export interface UsuarioAutologDocument {
  uid?: string;
  email: string;
  usuario: string;
  rol: UsuarioRol;
  activo?: boolean;
  tipoPersonal?: TipoPersonalUsuario;
  distribuidorId?: string | null;
  accesoAutolog?: boolean;
  accesoAsistencia?: boolean;
  plantaIdPrincipal?: string | null;
  plantasLectura?: string[];
  accesoTodasPlantas?: boolean;
  seccionesMenu?: NavigationSectionId[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UsuarioAutolog extends UsuarioAutologDocument {
  id: string;
  uid: string;
  activo: boolean;
  tipoPersonal: TipoPersonalUsuario;
  distribuidorId: string | null;
  accesoAutolog: boolean;
  accesoAsistencia: boolean;
  plantaIdPrincipal: string | null;
  plantasLectura: string[];
  accesoTodasPlantas: boolean;
  seccionesMenu: NavigationSectionId[];
}

export interface CreateUsuarioAutologRequest {
  email: string;
  password: string;
  usuario: string;
  rol: UsuarioRol;
  tipoPersonal: TipoPersonalUsuario;
  distribuidorId?: string | null;
  accesoAutolog: boolean;
  accesoAsistencia: boolean;
  plantaIdPrincipal?: string | null;
  plantasLectura?: string[];
  accesoTodasPlantas?: boolean;
  seccionesMenu?: NavigationSectionId[];
}

export interface UpdateUsuarioAutologRequest {
  uid: string;
  email: string;
  usuario: string;
  rol: UsuarioRol;
  activo: boolean;
  tipoPersonal: TipoPersonalUsuario;
  distribuidorId?: string | null;
  accesoAutolog: boolean;
  accesoAsistencia: boolean;
  plantaIdPrincipal?: string | null;
  plantasLectura?: string[];
  accesoTodasPlantas?: boolean;
  seccionesMenu?: NavigationSectionId[];
}

export interface UsuarioAutologResult {
  uid: string;
  email: string;
  activo: boolean;
}

/** Values persisted by the current UI and legacy administrative profiles. */
export const ADMINISTRATIVE_ROLE_VALUES = [
  'admin', 'capturista', 'planta',
  'Admin', 'Capturista', 'Planta',
  'ADMIN', 'CAPTURISTA', 'PLANTA'
];

export function normalizeUsuarioAutolog(id: string, data: UsuarioAutologDocument): UsuarioAutolog {
  const rawRole = String(data.rol || '').trim().toLowerCase();
  const administrativeRole = rawRole === 'admin' || rawRole === 'capturista' || rawRole === 'planta';
  const distributor = data.tipoPersonal === 'DISTRIBUIDOR' || Boolean(data.distribuidorId);
  return {
    ...data,
    id,
    uid: data.uid || id,
    rol: administrativeRole ? rawRole as RolAdministrativo : 'empleado',
    activo: data.activo !== false,
    tipoPersonal: distributor ? 'DISTRIBUIDOR' : (data.tipoPersonal ?? 'SISTEMA'),
    distribuidorId: data.distribuidorId ?? null,
    accesoAutolog: data.accesoAutolog === true ||
      (data.accesoAutolog === undefined && administrativeRole && !distributor),
    accesoAsistencia: data.accesoAsistencia === true,
    plantaIdPrincipal: typeof data.plantaIdPrincipal === 'string' && data.plantaIdPrincipal.trim()
      ? data.plantaIdPrincipal.trim() : null,
    plantasLectura: Array.isArray(data.plantasLectura)
      ? [...new Set(data.plantasLectura.filter((id): id is string => typeof id === 'string' && Boolean(id.trim())).map(id => id.trim()))]
      : [],
    accesoTodasPlantas: data.accesoTodasPlantas === true || rawRole === 'admin' || rawRole === 'capturista',
    seccionesMenu: normalizeNavigationSections(rawRole, data.seccionesMenu),
  };
}

/** Directory policy: legacy administrative defaults never grant a worker access. */
export function isAdministrativeAccount(user: UsuarioAutolog): boolean {
  return (user.rol === 'admin' || user.rol === 'capturista' || user.rol === 'planta') &&
    user.tipoPersonal === 'SISTEMA' && !user.distribuidorId &&
    user.accesoAutolog && !user.accesoAsistencia;
}
