# FASE 3

## 1. Resumen ejecutivo

La Fase 3 quedó implementada y validada localmente. Se corrigió la superposición intermitente del sidebar mediante una única fuente de estado de layout y se habilitó la administración real de puntos autorizados en `/asistencia/configuracion/puntos`.

Los puntos autorizados permiten crear, consultar, editar y activar/desactivar ubicaciones; seleccionar coordenadas en Leaflet; visualizar y modificar el radio; y asignar varios distribuidores activos. La persistencia se implementó únicamente en el backend canónico `D:\Proyectos\Subida_fire_hosting\autolog\functions`, mediante callables restringidas a administradores y transacciones Firestore.

El baseline se preservó y amplió:

- Frontend: **148/148 PASS**.
- Functions: **57/57 PASS** con emuladores.
- Lint frontend: **PASS**.
- Lint Functions: **PASS**.
- Build frontend: **PASS**.
- Build Functions: **PASS**.
- `git diff --check`: **PASS**.

No se desplegó código, reglas ni índices, y no se modificaron datos de producción.

## 2. Bug del sidebar

La causa real era la combinación de `IonicRouteStrategy` con una instancia de `<app-menu>` montada por cada página autenticada. Ionic conserva páginas en su stack; por ello podían coexistir varias instancias de `MenuComponent`. Cada instancia mantenía sus propios valores `isCollapsed` e `isMobileOpen`, instalaba listeners de resize, Escape y navegación, y agregaba o retiraba directamente las clases globales del elemento `<html>`.

Una instancia conservada podía aplicar un estado anterior durante una navegación o retirar las clases al destruirse mientras otra instancia seguía mostrando el sidebar. El resultado era una combinación inválida, por ejemplo:

- sidebar visual de 260 px con contenido desplazado 76 px;
- sidebar visible con contenido comenzando en 0 px;
- clases de drawer o compacto retiradas por una instancia que ya no era la visible.

La corrección está en `src/app/services/layout/sidebar-layout.service.ts`. Este servicio singleton es ahora la única autoridad sobre:

- sidebar expandido/compacto;
- drawer móvil abierto/cerrado;
- breakpoint actual;
- clases `autolog-shell`, `autolog-sidebar-collapsed` y `autolog-drawer-open`;
- listeners globales de resize, Escape y `NavigationEnd`.

`MenuComponent` consume el estado compartido y dejó de administrar o limpiar las clases globales durante `ngOnDestroy`. Las rutas públicas desactivan el shell; los cambios entre rutas privadas lo conservan. El comportamiento de 768–1199 px se aplica al cruzar el breakpoint y ya no revierte una elección manual en cada evento resize.

No se utilizaron márgenes por página, `z-index` arbitrarios ni `setTimeout` para ocultar el problema.

## 3. Validación sidebar

La vista previa local utiliza servicios en memoria y está rotulada como `Pruebas locales · Sin Firebase`. Se verificaron navegaciones sucesivas entre Distribuidores, Configuración de asistencia, Registros, Usuarios y Puntos autorizados.

En 1280×720 se midió:

| Estado | Borde derecho del sidebar | Inicio del contenido | Superposición |
|---|---:|---:|---|
| Expandido | 260 px | 260 px | No |
| Compacto | 76 px | 76 px | No |

Al volver de compacto a expandido, contenido y sidebar permanecieron sincronizados. El mapa también recalculó su ancho, de aproximadamente 585 px a 769 px en la comprobación controlada.

Se generaron capturas en:

- `artifacts/phase-3/puntos-1920x1080.png`
- `artifacts/phase-3/puntos-1366x768.png`
- `artifacts/phase-3/puntos-1024x768.png`
- `artifacts/phase-3/puntos-768x1024.png`
- `artifacts/phase-3/puntos-430x932.png`
- `artifacts/phase-3/puntos-390x844.png`

En desktop y tablet el contenido empieza después del ancho real del sidebar. En móvil el sidebar conserva el comportamiento esperado de drawer superpuesto. Las pruebas automatizadas cubren transiciones privadas consecutivas, cambio expandido/compacto, cruce de breakpoints, Escape en móvil, limpieza en rutas públicas y destrucción de una instancia cacheada de menú.

## 4. Arquitectura de puntos autorizados

El flujo quedó separado en capas:

```text
AsistenciaPuntosPage
  -> AttendancePointsService
    -> Firebase callable
      -> validación de administrador e input
        -> transacción Firestore
          -> asistencia_puntos
          -> asistencia_punto_asignaciones

AsistenciaPuntosPage
  -> DistribuidoresService.getActivos()
    -> selector de distribuidores activos
```

El frontend no escribe directamente en las colecciones nuevas. La página administra los estados `loading`, `empty`, `error` y `data`, y ofrece reintento. No existe acción de borrado físico.

## 5. Modelo Firestore

### `asistencia_puntos/{puntoId}`

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | string | Nombre normalizado del punto. |
| `descripcion` | string | Descripción opcional. |
| `latitude` | number | Latitud entre -90 y 90. |
| `longitude` | number | Longitud entre -180 y 180. |
| `radioMetros` | number | Radio entero entre 10 y 5000 metros. |
| `activo` | boolean | Baja lógica/disponibilidad futura. |
| `createdAt` | timestamp | Timestamp de servidor. |
| `updatedAt` | timestamp | Timestamp de servidor. |
| `createdByUid` | string | UID obtenido del contexto autenticado. |
| `updatedByUid` | string | UID obtenido del contexto autenticado. |

El ID del punto es automático y no contiene el nombre ni las coordenadas.

### `asistencia_punto_asignaciones/{puntoId}__{distribuidorId}`

| Campo | Tipo | Descripción |
|---|---|---|
| `puntoId` | string | Referencia lógica al punto. |
| `distribuidorId` | string | ID Firestore del distribuidor. |
| `createdAt` | timestamp | Timestamp de servidor. |
| `createdByUid` | string | Administrador que creó la asignación. |

El ID determinista impide duplicar la misma relación y mantiene una relación muchos a muchos sin arreglos crecientes en el documento del punto.

## 6. Arquitectura backend

Se agregó `src/attendance/attendance-points.callables.ts` al backend canónico. Todas las funciones se ejecutan en `us-central1` y llaman a la validación común `requireAdmin`.

| Callable | Responsabilidad | Escritura |
|---|---|---|
| `listAttendancePoints` | Lista puntos ordenados por nombre y agrega el total de asignaciones. | No |
| `getAttendancePointAssignments` | Devuelve los IDs de distribuidores asignados a un punto. | No |
| `createAttendancePoint` | Valida, crea el punto y sus asignaciones. | Transacción única |
| `updateAttendancePoint` | Actualiza datos, estado y conjunto de asignaciones. | Transacción única |
| `setAttendancePointAssignments` | Sincroniza exclusivamente las asignaciones de un punto. | Transacción única |

Las validaciones rechazan:

- campos no reconocidos;
- nombre vacío o mayor a 120 caracteres;
- descripción mayor a 500 caracteres;
- coordenadas fuera de rango;
- radio no entero o fuera de 10–5000 m;
- valores no booleanos en `activo`;
- más de 250 distribuidores;
- IDs inválidos, repetidos o con `/`;
- puntos inexistentes;
- distribuidores inexistentes o inactivos.

Los campos de auditoría se toman del servidor y del contexto de autenticación; el cliente no puede suplantarlos. La creación y actualización sincronizan punto y asignaciones dentro de la misma transacción, por lo que no quedan estados parciales.

`externalDeviceApi` y `syncGaslinkSales` no fueron editadas y no sufrieron cambios funcionales. Sus archivos fuente conservaron su hash respecto del snapshot inicial de esta fase.

## 7. Security Rules

Las reglas locales del frontend y del backend canónico incluyen:

```text
match /asistencia_puntos/{puntoId} {
  allow read, write: if false;
}

match /asistencia_punto_asignaciones/{asignacionId} {
  allow read, write: if false;
}
```

Ambas colecciones también se excluyeron del wildcard legacy. El acceso se realiza exclusivamente mediante Admin SDK en callables que validan rol `admin`. La prueba con emulador confirmó que una lectura Firestore directa recibe HTTP 403.

No se modificaron reglas de Storage.

## 8. Índices

No fue necesario modificar `firestore.indexes.json`. Las consultas nuevas utilizan:

- `orderBy('nombre')` en una sola colección;
- `where('puntoId', '==', ...)` para asignaciones.

Firestore cubre ambas con índices automáticos de un solo campo. No se creó ni desplegó ningún índice compuesto.

## 9. Leaflet

Se reutilizó la instalación existente de Leaflet/OpenStreetMap. No se agregó Google Maps, Mapbox ni otra dependencia.

La página usa:

- `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')`;
- atribución de OpenStreetMap;
- centro inicial `22.768056, -102.533056`;
- `L.marker` arrastrable;
- `L.circle` para la geocerca;
- marcador `divIcon` local para evitar rutas externas de imágenes.

Un `ResizeObserver` y la suscripción al estado del sidebar ejecutan `invalidateSize()` cuando cambia el espacio disponible. `requestAnimationFrame` se usa únicamente para esperar a que exista el contenedor del editor en el DOM antes de inicializar el mapa; no se usa como parche de layout.

## 10. Selección de ubicación

El administrador puede:

1. Pulsar `Nuevo punto` o abrir un punto existente.
2. Hacer clic en el mapa para establecer latitud y longitud.
3. Volver a hacer clic para mover marcador y círculo.
4. Arrastrar el marcador para afinar la ubicación.
5. Consultar latitud y longitud como valores informativos de solo lectura.
6. Guardar únicamente cuando la ubicación es válida.

En edición se cargan el centro, marcador y círculo persistidos. Las pruebas verifican la actualización de coordenadas y la carga del estado existente.

## 11. Radio

El radio inicial para puntos nuevos es 150 m. Las constantes compartidas del frontend son:

- mínimo: 10 m;
- máximo: 5000 m;
- predeterminado: 150 m.

El backend aplica los mismos límites de seguridad. El input es numérico, obligatorio y muestra la unidad `m`. Cada cambio válido actualiza inmediatamente el radio del `L.circle`. No se incluyó slider porque el control numérico ofrece precisión y encaja con los formularios administrativos existentes.

## 12. Distribuidores asignados

El selector carga exclusivamente distribuidores activos mediante `DistribuidoresService.getActivos()`. Permite buscar por nombre o VGBZ, ignora mayúsculas y acentos, y mantiene selección múltiple.

El backend vuelve a comprobar existencia y estado activo dentro de la transacción; el filtro del frontend no constituye la autorización. Un distribuidor inactivo, inexistente o duplicado es rechazado aunque el cliente intente enviarlo manualmente.

La lista principal muestra el total de distribuidores asignados por punto.

## 13. Crear punto

El flujo de alta requiere nombre, coordenadas y radio válido. Descripción, estado y distribuidores se incluyen en el mismo formulario. Al guardar:

1. el frontend construye un `AttendancePointInput`;
2. `createAttendancePoint` valida autenticación y rol;
3. valida campos y distribuidores activos;
4. reserva un ID Firestore automático;
5. escribe punto y asignaciones en una transacción;
6. devuelve el punto creado y recarga la lista.

No hay datos simulados en el build productivo. Los datos visibles en la vista previa están marcados `(prueba)` y viven solo en memoria.

## 14. Editar punto

La edición reutiliza el mismo formulario. Carga los datos del punto, consulta sus asignaciones, inicializa mapa, marcador y círculo, y persiste datos y conjunto final de distribuidores de forma atómica. El punto puede cambiar nombre, descripción, coordenadas, radio, estado y asignaciones.

No se modifica ningún registro de asistencia porque esa funcionalidad aún no existe en esta fase.

## 15. Activar/desactivar

La baja es lógica mediante `activo: false`. La interfaz solicita confirmación antes de desactivar y no expone botón ni método de borrado físico. Reactivar utiliza el mismo control de estado del formulario.

La desactivación conserva el documento y sus asignaciones para mantener trazabilidad y permitir una futura reactivación.

## 16. Cálculo Haversine

Se agregó `src/app/utils/geofence.util.ts`, independiente de Angular y Firebase. Expone:

- `haversineDistanceMeters(origen, destino)`;
- `isInsideGeofence(posicion, centro, radioMetros)`.

Utiliza radio terrestre medio de 6,371,000 m. El criterio de pertenencia incluye el borde: `distancia <= radioMetros`. Las pruebas cubren puntos idénticos, distancia conocida, simetría, interior, borde y exterior.

La utilidad queda disponible para una fase posterior, pero no se conectó al registro real de asistencia ni a la app ASISTIA.

## 17. Responsive

La página usa una composición de lista + editor en pantallas amplias y una columna en anchos reducidos. Se validaron 1920×1080, 1366×768, 1024×768, 768×1024, 430×932 y 390×844.

Características verificadas:

- `min-width: 0` en regiones flexibles;
- ausencia de overflow horizontal de la aplicación;
- mapa con altura adaptada y ancho recalculado;
- acciones que se apilan en móvil;
- etiquetas y coordenadas con wrapping;
- sidebar desktop/tablet sincronizado;
- drawer móvil superpuesto por diseño.

La barra inferior `Pruebas locales · Sin Firebase` que aparece en las capturas pertenece únicamente al harness local y puede tapar contenido al final del viewport; no forma parte del build productivo.

## 18. Archivos creados

### Frontend

- `src/app/services/layout/sidebar-layout.service.ts`
- `src/app/services/layout/sidebar-layout.service.spec.ts`
- `src/app/models/attendance-point.model.ts`
- `src/app/services/attendance/attendance-points.service.ts`
- `src/app/asistencia/puntos/asistencia-puntos.page.ts`
- `src/app/asistencia/puntos/asistencia-puntos.page.html`
- `src/app/asistencia/puntos/asistencia-puntos.page.scss`
- `src/app/asistencia/puntos/asistencia-puntos.page.spec.ts`
- `src/app/utils/geofence.util.ts`
- `src/app/utils/geofence.util.spec.ts`
- `artifacts/phase-3/puntos-1920x1080.png`
- `artifacts/phase-3/puntos-1366x768.png`
- `artifacts/phase-3/puntos-1024x768.png`
- `artifacts/phase-3/puntos-768x1024.png`
- `artifacts/phase-3/puntos-430x932.png`
- `artifacts/phase-3/puntos-390x844.png`
- `REFACTOR_FASE_3.md`

### Backend canónico

- `D:\Proyectos\Subida_fire_hosting\autolog\functions\src\attendance\attendance-points.callables.ts`
- `D:\Proyectos\Subida_fire_hosting\autolog\functions\test\attendance-points.test.js`
- `D:\Proyectos\Subida_fire_hosting\autolog\functions\test\attendance-points.emulator.test.js`

## 19. Archivos modificados

La comparación de esta fase se hizo contra snapshots SHA-256 tomados antes de modificar, porque el repositorio ya contenía cambios locales acumulados de Fases 1, 1.1 y 2.

### Frontend

- `firestore.rules`
- `src/app/asistencia/asistencia-routing.module.ts`
- `src/app/asistencia/asistencia-routing.module.spec.ts`
- `src/app/asistencia/asistencia.module.ts`
- `src/app/asistencia/asistencia.pages.spec.ts`
- `src/app/asistencia/configuracion/asistencia-configuracion.page.ts`
- `src/app/asistencia/configuracion/asistencia-configuracion.page.html`
- `src/app/components/menu/menu.component.ts`
- `src/app/components/menu/menu.component.spec.ts`
- `src/app/components/menu/navigation.config.ts`
- `src/testing/preview/main.ts`

### Backend canónico

- `D:\Proyectos\Subida_fire_hosting\autolog\functions\src\index.ts`
- `D:\Proyectos\Subida_fire_hosting\autolog\rules\firestore.rules`

## 20. Archivos eliminados

No se eliminó ningún archivo en la Fase 3.

## 21. Tests frontend

Comando:

```powershell
npm.cmd test -- --watch=false --browsers=ChromeHeadlessCI
```

Resultado: **148 ejecutadas, 148 PASS, 0 FAIL**.

Cobertura nueva relevante:

| Área | Casos cubiertos |
|---|---|
| Sidebar | fuente singleton, expandido/compacto, breakpoint, rutas privadas sucesivas, ruta pública, Escape móvil, instancia cacheada |
| Routing | ruta `/asistencia/configuracion/puntos` protegida por `adminGuard` |
| Lista | loading, data, empty, error y reintento |
| Mapa | carga de coordenadas, selección y actualización de círculo/radio |
| Formulario | alta, edición, validación de ubicación y radio |
| Distribuidores | búsqueda por nombre/VGBZ, normalización de acentos, selección múltiple |
| Estado | desactivación lógica y ausencia de borrado físico |
| Geocerca | distancias Haversine e inclusión del borde |

## 22. Tests Functions

Prueba ordinaria, sin emuladores activos:

```powershell
npm.cmd test
```

Resultado: **57 total, 54 PASS, 3 SKIP, 0 FAIL**. Los tres skips son pruebas de integración marcadas para ejecutarse únicamente con emuladores.

Prueba completa con Auth, Functions, Firestore y Storage Emulator:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
npm.cmd run test:emulator
```

Resultado final: **57/57 PASS, 0 SKIP, 0 FAIL**.

Las pruebas verifican:

- admin puede listar, crear, editar, desactivar y asignar;
- capturista, distribuidor/ASISTIA y usuario no autenticado son rechazados;
- coordenadas, radio y nombre inválidos son rechazados;
- distribuidores inexistentes, inactivos o duplicados son rechazados;
- asignación muchos a muchos con dos distribuidores activos;
- UID de auditoría obtenido del servidor;
- asignación determinista y transaccional;
- lectura Firestore directa denegada por reglas;
- inexistencia de borrado físico.

No se instalaron dependencias ni frameworks de prueba.

## 23. Lint

| Proyecto | Comando | Resultado |
|---|---|---|
| Frontend | `npm.cmd run lint` | PASS |
| Functions canónicas | `npm.cmd run lint` | PASS |

## 24. Builds

| Proyecto | Comando | Resultado |
|---|---|---|
| Frontend | `npm.cmd run build` | PASS |
| Functions canónicas | `npm.cmd run build` | PASS |

El build frontend conserva avisos de optimización conocidos de Ionic y dependencias CommonJS. Leaflet ya era una dependencia del proyecto; la página nueva hace visible su aviso CommonJS en el chunk correspondiente. No hay errores de compilación.

## 25. git diff --check

Comando:

```powershell
git diff --check
```

Resultado: **PASS**. Git muestra advertencias informativas de futura conversión LF→CRLF en el entorno Windows, sin errores de espacios ni conflictos.

## 26. Hallazgos no corregidos

- El backend declara Node 22 en `engines`, mientras el Firebase Emulator de esta estación se ejecutó con Node 24. Las Functions compilaron y las 57 pruebas pasaron; conviene ejecutar también el pipeline oficial con Node 22 antes de desplegar.
- La ejecución inicial del emulador encontró Java 8 del sistema, incompatible con la versión actual de Firebase Tools. Se reutilizó el JBR 21 ya instalado con Android Studio mediante `JAVA_HOME`; no se instaló software.
- La suite frontend emite avisos antiguos de selectores del optimizador Ionic y CommonJS para localforage, ApexCharts, xlsx-js-style, qrcode, file-saver, markercluster y Leaflet. No causan fallos y resolverlos implicaría cambios ajenos a esta fase.
- Algunas pruebas antiguas de Ionic datetime/ApexCharts escriben avisos en consola aunque finalizan correctamente. No se alteraron porque no están relacionadas con sidebar o puntos autorizados.
- No se hizo una prueba contra Firebase de producción. La persistencia y las Rules se comprobaron exclusivamente con emuladores, como exige el alcance.

No quedó un defecto funcional conocido dentro del alcance de la Fase 3.

## 27. Qué queda preparado para Fase 4

Quedaron disponibles, sin activar asistencia real:

- modelo persistente de puntos y asignaciones;
- callables administrativas y Rules de acceso indirecto;
- cálculo Haversine puro con criterio de borde;
- coordenadas y radios validados;
- relación muchos a muchos con distribuidores;
- estado activo/inactivo y auditoría de cambios;
- interfaz administrativa responsive.

No se conectó ASISTIA móvil, no se valida GPS del trabajador, no se registran entradas/salidas y no se implementaron reconocimiento facial, horarios, turnos, tolerancias, dispositivos ni biometría. No se avanzó automáticamente a la Fase 4.

## 28. Confirmación de NO DEPLOY

Se confirma explícitamente:

- **No Firebase deploy.**
- **No Functions deploy.**
- **No Hosting deploy.**
- **No Rules deploy.**
- **No indexes deploy.**
- **No migraciones.**
- **No cambios manuales en producción.**
- **No creación ni modificación de usuarios, distribuidores o puntos en Firebase real.**
- **No cambios en la app móvil ASISTIA.**

Toda persistencia de validación ocurrió dentro del proyecto demo de Firebase Emulator y fue eliminada al finalizar el proceso del emulador.
