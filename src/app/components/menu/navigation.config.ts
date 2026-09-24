export type NavigationPermission = 'admin' | 'global';
export type NavigationSectionId = 'general' | 'sales' | 'fleet' | 'station' | 'attendance' | 'administration';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  title: string;
  description: string;
  keywords: string[];
  permission?: NavigationPermission;
  match?: 'exact' | 'prefix';
}

export interface NavigationGroup {
  id: NavigationSectionId;
  label: string;
  icon: string;
  collapsible: boolean;
  items: NavigationItem[];
}

export interface PageMeta { title: string; description: string; }

export const AUTOLOG_NAVIGATION: NavigationGroup[] = [
  { id: 'general', label: 'General', icon: 'grid-outline', collapsible: false, items: [
    { id: 'summary', label: 'Resumen', icon: 'grid-outline', route: '/home', title: 'Resumen', description: 'Consulta el resumen operativo de AUTOLOG.', keywords: ['inicio', 'dashboard', 'general'] },
  ] },
  { id: 'sales', label: 'Ventas', icon: 'stats-chart-outline', collapsible: true, items: [
    { id: 'sales-panel', label: 'Panel de ventas', icon: 'pie-chart-outline', route: '/panel-control', title: 'Panel de ventas', description: 'Consulta el desempeño comercial, ubicaciones e incidentes recientes.', keywords: ['ventas', 'panel', 'comercial', 'dashboard'], permission: 'global' },
    { id: 'sales-history', label: 'Historial e incidentes', icon: 'receipt-outline', route: '/historial', title: 'Historial de ventas', description: 'Analiza ventas e incidentes por periodo, zona y distribuidor.', keywords: ['ventas', 'historial', 'incidentes', 'reportes'], permission: 'global' },
    { id: 'qr-codes', label: 'Generar códigos QR', icon: 'qr-code-outline', route: '/generar-codigos', title: 'Generación de códigos QR', description: 'Configura y genera identificadores para cilindros.', keywords: ['qr', 'códigos', 'codigos', 'cilindros'], permission: 'admin' },
    { id: 'products', label: 'Productos y cilindros', icon: 'cube-outline', route: '/productos', title: 'Productos y cilindros', description: 'Consulta la asignación y estado de los cilindros.', keywords: ['productos', 'cilindros', 'inventario'], permission: 'admin' },
  ] },
  { id: 'fleet', label: 'Flotilla', icon: 'car-sport-outline', collapsible: true, items: [
    { id: 'service-panel', label: 'Panel de servicios', icon: 'speedometer-outline', route: '/home#servicios', title: 'Panel de servicios', description: 'Consulta el estado actual de la flotilla y administra sus mantenimientos.', keywords: ['servicios', 'mantenimiento', 'flotilla', 'panel'] },
    { id: 'vehicles', label: 'Unidades', icon: 'car-outline', route: '/autos', title: 'Unidades', description: 'Administra las unidades, operadores y kilometrajes de la flotilla.', keywords: ['autos', 'vehículos', 'vehiculos', 'unidades'] },
    { id: 'distributors', label: 'Distribuidores', icon: 'people-outline', route: '/distribuidores', title: 'Distribuidores', description: 'Administra distribuidores, rutas y zonas de operación.', keywords: ['distribuidores', 'personal', 'operadores', 'rutas'], match: 'prefix' },
    { id: 'articles', label: 'Artículos', icon: 'construct-outline', route: '/articulos', title: 'Artículos', description: 'Gestiona los insumos y costos utilizados en los servicios.', keywords: ['artículos', 'articulos', 'insumos', 'refacciones'], permission: 'global' },
  ] },
  { id: 'station', label: 'Expendio', icon: 'storefront-outline', collapsible: true, items: [
    { id: 'station-panel', label: 'Panel de expendio', icon: 'storefront-outline', route: '/panel-expendio', title: 'Panel de expendio', description: 'Espacio de trabajo para la operación de expendio.', keywords: ['expendio', 'panel', 'tanque', 'sensor'], permission: 'global' },
    { id: 'station-sales', label: 'Registro de ventas', icon: 'receipt-outline', route: '/registro-ventas', title: 'Registro de ventas', description: 'Consulta las ventas sincronizadas desde el sistema de expendio.', keywords: ['expendio', 'ventas', 'registro', 'gaslink'], permission: 'global' },
  ] },
  { id: 'attendance', label: 'Asistencia', icon: 'calendar-outline', collapsible: true, items: [
    { id: 'attendance-panel', label: 'Panel de asistencia', icon: 'today-outline', route: '/asistencia', title: 'Panel de asistencia', description: 'Supervisa el registro diario de los trabajadores.', keywords: ['asistencia', 'asistia', 'panel', 'presentes'], permission: 'global' },
    { id: 'attendance-records', label: 'Registros', icon: 'time-outline', route: '/asistencia/registros', title: 'Registros de asistencia', description: 'Consulta entradas, salidas e historial.', keywords: ['asistencia', 'asistia', 'registros', 'entradas', 'salidas', 'historial'], permission: 'global' },
    { id: 'attendance-settings', label: 'Configuración', icon: 'options-outline', route: '/asistencia/configuracion', title: 'Configuración de asistencia', description: 'Administra ubicaciones y reglas utilizadas por ASISTIA.', keywords: ['asistencia', 'asistia', 'configuración', 'configuracion', 'puntos', 'geocercas'], permission: 'admin', match: 'prefix' },
  ] },
  { id: 'administration', label: 'Administración', icon: 'settings-outline', collapsible: true, items: [
    { id: 'plants', label: 'Plantas', icon: 'business-outline', route: '/plantas', title: 'Plantas', description: 'Administra el catálogo global de plantas.', keywords: ['plantas', 'sedes', 'alcance'], permission: 'admin' },
    { id: 'users', label: 'Usuarios', icon: 'person-add-outline', route: '/usuarios', title: 'Usuarios', description: 'Administra las cuentas y roles con acceso a AUTOLOG.', keywords: ['usuarios', 'cuentas', 'administración', 'administracion'], permission: 'admin' },
  ] },
];

export const AUTOLOG_NAVIGATION_SECTION_IDS: NavigationSectionId[] =
  AUTOLOG_NAVIGATION.map(group => group.id);

export function defaultNavigationSections(role: string): NavigationSectionId[] {
  const normalizedRole = String(role || '').trim().toLowerCase();
  if (normalizedRole === 'admin') return [...AUTOLOG_NAVIGATION_SECTION_IDS];
  if (normalizedRole === 'capturista') return ['general', 'sales', 'fleet', 'station', 'attendance'];
  if (normalizedRole === 'planta') return ['general', 'fleet'];
  return [];
}

export function availableNavigationSections(role: string): NavigationSectionId[] {
  const normalizedRole = String(role || '').trim().toLowerCase();
  if (normalizedRole === 'admin') return [...AUTOLOG_NAVIGATION_SECTION_IDS];
  if (normalizedRole === 'capturista' || normalizedRole === 'planta') {
    return ['general', 'sales', 'fleet', 'station', 'attendance'];
  }
  return [];
}

export function normalizeNavigationSections(role: string, value: unknown): NavigationSectionId[] {
  const allowed = new Set(availableNavigationSections(role));
  if (!Array.isArray(value)) return defaultNavigationSections(role);
  const selected = value.filter((section): section is NavigationSectionId =>
    typeof section === 'string' && allowed.has(section as NavigationSectionId));
  return [...new Set<NavigationSectionId>(['general', ...selected])];
}

export const EXTRA_PAGE_TITLES: Record<string, PageMeta> = {
  attendancePoints: { title: 'Puntos autorizados', description: 'Define ubicaciones y radios permitidos para ASISTIA.' },
  distribuidorExpediente: { title: 'Expediente de distribuidor', description: 'Consulta y administra su documentación digital.' },
  incidentes: { title: 'Incidentes', description: 'Consulta los incidentes registrados en la operación.' },
  convertidorDictamen: { title: 'Convertidor de dictámenes', description: 'Transforma dictámenes en archivos JSON estructurados.' },
  admSorteos: { title: 'Sorteos', description: 'Consulta participantes y resultados mensuales.' },
  yo: { title: 'Mi perfil', description: 'Consulta la información de tu cuenta.' },
  plantas: { title: 'Plantas', description: 'Administra el catálogo global de plantas.' },
};
