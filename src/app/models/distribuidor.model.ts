export interface Distribuidor {
  id: string;
  nombre: string;
  identificador: string;
  ruta: string;
  zona: string;
  usuarioUid?: string | null;
  activo?: boolean;
  estado?: string;
  estatus?: string;
  plantaIdPrincipal?: string | null;
}


export function isDistribuidorActivo(value: Distribuidor): boolean {
  return value.activo !== false && !['INACTIVO', 'BAJA', 'ELIMINADO'].includes(String(value.estado || value.estatus || '').toUpperCase());
}
