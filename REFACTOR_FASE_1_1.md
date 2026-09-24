# FASE 1.1

## 1. Resumen ejecutivo

La Fase 1.1 estabiliza el listado administrativo de usuarios, conserva la compatibilidad con perfiles legacy y unifica la presentación de los formularios de Usuario y Distribuidor. El listado ya no depende de campos que no existen en perfiles históricos ni de un índice compuesto no desplegado. La política administrativa se concentra en el modelo de `UsuarioAutolog`, y la paginación continúa leyendo lotes limitados desde Firestore.

Los cuatro formularios solicitados comparten una superficie visual reutilizable, accesible y responsive. Se verificaron en 1366×768, 1920×1080, 768×1024, 390×844 y 430×932 con un entorno local sin conexión a Firebase. El expediente y el acceso ASISTIA de Distribuidores siguen disponibles. También se eliminó un error de Ionic producido por una propiedad interna llamada `modal` en el componente de acceso ASISTIA.

La suite frontend terminó con 110/110 pruebas aplicables aprobadas. Functions terminó con 51/51 pruebas aprobadas en emuladores locales. Lint y ambos builds aprobaron.

## 2. Causa exacta del fallo de Usuarios

La consulta responsable estaba en `src/app/services/auth/user-admin.service.ts`. Combinaba:

- `rol in ['admin', 'capturista']`;
- `accesoAutolog == true`;
- `orderBy('usuario', 'asc')`;
- `orderBy(documentId(), 'asc')`.

Firestore respondió `FAILED_PRECONDITION` (HTTP 400) con el mensaje `The query requires an index`. El proyecto real `autolog-13584` no tenía índices compuestos desplegados para `usuarios`; la inspección de índices devolvió `indexes: []`. La consulta anterior se reprodujo de forma de solo lectura contra Firestore y falló. La consulta nueva, `rol IN (...)` ordenada por `__name__`, se ejecutó correctamente sin índice compuesto.

La ausencia de `accesoAutolog` en documentos históricos era un segundo defecto, distinto del error mostrado: Firestore no devuelve documentos donde el campo filtrado no existe. Por eso, aunque se hubiera desplegado el índice solicitado, los perfiles legacy con solo `email`, `usuario` y `rol` habrían quedado ocultos.

La solución elimina el filtro de campo de acceso y el ordenamiento por `usuario` de la consulta del servidor. Firestore preselecciona únicamente roles administrativos reconocidos y pagina por ID documental estable. Después, un normalizador central aplica compatibilidad legacy y una política central excluye cualquier cuenta de Distribuidor/ASISTIA o con acceso AUTOLOG denegado. No se descargan todos los usuarios de la colección.

En desarrollo, los fallos se registran como `[UserAdminService.getPage]` con operación, código Firebase, mensaje y descripción no sensible de la consulta. La UI conserva el mensaje simple y el botón Reintentar.

## 3. Compatibilidad legacy

| Perfil | Interpretación |
|---|---|
| `rol=admin/capturista` sin campos nuevos | `activo=true`, `tipoPersonal=SISTEMA`, `accesoAutolog=true`, `accesoAsistencia=false`; aparece en Usuarios. |
| Usuario AUTOLOG nuevo | Debe ser `admin/capturista`, `tipoPersonal=SISTEMA`, sin `distribuidorId`, `accesoAutolog=true` y `accesoAsistencia=false`; aparece en Usuarios. |
| Distribuidor/ASISTIA | `rol=empleado`, `tipoPersonal=DISTRIBUIDOR`, `distribuidorId`, `accesoAutolog=false`, `accesoAsistencia=true`; nunca aparece en Usuarios. |
| Documento con rol administrativo y `accesoAutolog=false` explícito | Se respeta la denegación y no aparece. |
| Documento con vínculo o tipo de Distribuidor aunque tenga datos incompletos | Se trata conservadoramente como Distribuidor; no recibe compatibilidad AUTOLOG. |

La función `normalizeUsuarioAutolog` aplica valores por defecto. `isAdministrativeAccount` decide si el perfil pertenece al directorio administrativo. Ambas viven en `src/app/models/usuario-autolog.model.ts` y son reutilizadas por `UserAdminService`.

## 4. Cambios en listado de Usuarios

La consulta actual usa `rol IN ['admin', 'capturista', 'Admin', 'Capturista', 'ADMIN', 'CAPTURISTA']` y ordena por `documentId()` ascendente. Así cubre valores históricos de capitalización conocidos sin exigir el índice compuesto que faltaba.

La página solicita lotes de al menos 25 candidatos y conserva como máximo 26 cuentas elegibles para determinar `hasNext`. Si un lote contiene cuentas explícitamente denegadas, continúa desde su último snapshot hasta completar la página o agotar resultados. No carga la colección completa y las cuentas `empleado` quedan excluidas desde Firestore.

El cursor público es el snapshot de la última cuenta visible. Siguiente y Anterior solo actualizan número y pila de cursores cuando la carga terminó correctamente. Un error ya no deja la paginación adelantada. Reintentar reinicia la primera página y vuelve a llamar al servicio.

El orden visible cambia de nombre de usuario a ID documental estable. Esta decisión evita depender de un campo `usuario` posiblemente ausente y de un índice compuesto no desplegado.

## 5. Modal Agregar Usuario

El formulario contiene únicamente correo, contraseña temporal, nombre de usuario y rol. El rol se presenta como dos opciones directas: Administrador y Capturista. No contiene selector de personal, Empleado, Distribuidor, `empleadoId`, `distribuidorId` ni controles de acceso.

Los valores técnicos continúan enviados internamente como `tipoPersonal=SISTEMA`, `accesoAutolog=true` y `accesoAsistencia=false`. La contraseña acepta hasta 128 caracteres, en concordancia con el backend. El formulario incorpora título, descripción, cierre accesible, errores asociados a cada campo, foco azul, bloqueo durante guardado y texto de carga.

## 6. Modal Editar Usuario

Usa el mismo lenguaje visual y contiene correo, nombre de usuario, rol y estado de la cuenta. No solicita contraseña. La cuenta activa/inactiva se presenta mediante un switch claro. Rol y valores técnicos continúan restringidos al contrato administrativo de AUTOLOG.

## 7. Modal Agregar Distribuidor

Muestra el identificador como información del sistema con el texto “Se asignará automáticamente al guardar”; no genera un VGBZ de muestra ni ofrece un input editable. Nombre, ruta y zona son los únicos datos operativos editables. La Function `createDistribuidor` sigue siendo la autoridad del consecutivo.

## 8. Modal Editar Distribuidor

Muestra el VGBZ real en un bloque de solo lectura y explica que es permanente. Solo nombre, ruta y zona son editables dentro del modal; el estado conserva el flujo existente mediante la acción del directorio. El acceso ASISTIA sigue accesible desde el formulario y desde el directorio. El expediente abre en `/distribuidores/:id/expediente` con su catálogo y vínculo al distribuidor intactos.

La revisión del acceso ASISTIA descubrió el error de consola de Ionic: `modal is a reserved property when using ion-modal`. Se renombró únicamente la propiedad inyectada a `modalController`; no cambió el contrato ni la funcionalidad del flujo.

## 9. Estilos reutilizados/creados

`src/theme/administrative-form.scss` contiene la superficie compartida y está importado una sola vez desde `src/global.scss`. Define modal, header, body con scroll interno, footer fijo dentro del diálogo, grids, campos, estados focus/disabled/error, radio cards, switch, botones e identificación del sistema usando los tokens existentes de AUTOLOG.

Los SCSS locales de los cuatro componentes solo aseguran que el host ocupe la altura disponible. No se agregaron dependencias ni excepciones específicas dispersas en `global.scss`.

Matriz visual automatizada:

| Modal | 1366×768 | 1920×1080 | 768×1024 | 390×844 | 430×932 |
|---|---:|---:|---:|---:|---:|
| Agregar usuario | PASS | PASS | PASS | PASS | PASS |
| Editar usuario | PASS | PASS | PASS | PASS | PASS |
| Agregar distribuidor | PASS | PASS | PASS | PASS | PASS |
| Editar distribuidor | PASS | PASS | PASS | PASS, scroll interno | PASS, scroll interno |

En todos los casos el diálogo quedó dentro del viewport, el footer visible y sin overflow horizontal. Las capturas están en `artifacts/phase-1-1/`.

## 10. Las 28 pruebas anteriores

| Prueba | Causa anterior | Solución | Estado |
|---|---|---|---|
| GenerarCodigosPage | TestBed sin módulo/proveedores reales de la página | Se importó el módulo correcto y se aislaron servicios externos | PASS |
| StorageService | Ionic Storage sin inicializar | Mock explícito de `create`, `get` y `set` | PASS |
| PruebaPage | Dependencias de página ausentes | Módulo y proveedores controlados | PASS |
| GeoLocationService | `HttpClient` ausente | `provideHttpClient` y `provideHttpClientTesting` | PASS |
| CilindrosService | Firestore no provisto | Mock mínimo de Firestore | PASS |
| SorteoService | Firestore no provisto | Mock mínimo de Firestore | PASS |
| IncidentesService | Firestore no provisto | Mock mínimo de Firestore | PASS |
| HoraService | `HttpClient` ausente | Cliente HTTP y backend de prueba | PASS |
| ArticulosPage | TestBed incompleto | Módulo de página y servicios simulados | PASS |
| AgregarEventoComponent | Componente standalone tratado como declaración y dependencias ausentes | Import standalone y proveedores explícitos | PASS |
| HistorialPage | Router y servicios faltantes | Módulo de página, router de prueba y mocks | PASS |
| AutosPage | Dependencias reales intentaban inicializarse | Módulo y mocks deterministas | PASS |
| EditarArticuloComponent | Standalone incorrecto e `@Input` ausente | Import correcto y artículo de prueba válido | PASS |
| DetallesEventoUnidadComponent | Inputs requeridos ausentes | Datos y evento mínimos válidos antes de `detectChanges` | PASS |
| FirebaseService | Firestore no provisto | Mock explícito sin acceso de red | PASS |
| HomePage | Dependencias de layout/servicios ausentes | Módulo y proveedores de prueba | PASS |
| SorteosPage | Servicios reales no aislados | Módulo y mocks deterministas | PASS |
| VentasService | Firestore no provisto | Mock mínimo de Firestore | PASS |
| AuthService | Schedulers internos de AngularFire no inicializados | `Auth` simulado e inicialización de `ɵAngularFireSchedulers` | PASS |
| VentasMalasService | Firestore no provisto | Mock mínimo de Firestore | PASS |
| EditarEventoComponent | Standalone incorrecto e input incompleto | Import correcto y evento válido | PASS |
| GenerarReporteComponent | Dependencias del componente ausentes | Import/proveedores de prueba explícitos | PASS |
| VentasBuenasService | Firestore no provisto | Mock mínimo de Firestore | PASS |
| MonitoreogasmakeService | Firestore no provisto | Mock mínimo de Firestore | PASS |
| PanelControlPage | Intervalo de ciclo de vida impedía estabilizar el fixture; frontera de mapa real | Espera acotada, destrucción del fixture y spy de inicialización de mapa | PASS |
| AgregarArticuloComponent | Standalone/proveedores incompletos | Import correcto y mocks explícitos | PASS |
| ProductosPage | Dependencias de página ausentes | Módulo y servicios simulados | PASS |
| ModalBuscarVentaComponent | Inicialización real de mapa en el test | Spy de la frontera de mapa y datos controlados | PASS |

No se usaron `skip`, `xit`, `xdescribe` ni `fdescribe`. No se eliminó ninguna prueba aplicable. Adicionalmente se corrigió el TestBed de `ConvertidorDictamenPage` para cargar `CommonModule`, Forms e Ionic, eliminando sus errores `NG0303` de consola.

## 11. Pruebas finales

| Comando | Total | PASS | FAIL |
|---|---:|---:|---:|
| `npm.cmd test -- --watch=false --browsers=ChromeHeadlessCI` | 110 | 110 | 0 |
| `firebase.cmd emulators:exec --config ../firebase.emulators.json --project demo-autolog --only auth,functions,firestore,storage "npm test"` | 51 | 51 | 0 |

Las pruebas frontend añadidas cubren normalización legacy, exclusión de Distribuidores/ASISTIA, acceso explícitamente denegado, paginación sobre candidatos excluidos, siguiente/anterior, error y Reintentar. La suite de Functions cubre VGBZ, concurrencia, identidad, usuarios, acceso ASISTIA, guardas operativas y regresiones existentes.

## 12. Functions

No se modificó código de Functions en esta fase. La suite del backend canónico compiló TypeScript y aprobó 51/51 pruebas usando el proyecto local `demo-autolog` y emuladores de Auth, Functions, Firestore y Storage.

`externalDeviceApi` y `syncGaslinkSales` no sufrieron cambios funcionales ni cambios de código. El emulador indicó que `syncGaslinkSales` se omitió como función programada porque Pub/Sub no forma parte de la configuración de esta corrida; sus pruebas unitarias de sincronización sí se ejecutaron y aprobaron.

El host tiene Node 24 mientras `package.json` solicita Node 22. Firebase mostró la advertencia y ejecutó la suite con Node 24; no produjo fallos.

## 13. Lint

| Proyecto | Comando | Resultado |
|---|---|---|
| Frontend | `npm.cmd run lint` | PASS |
| Functions | `npm.cmd run lint` | PASS |

## 14. Builds

| Proyecto | Comando | Resultado |
|---|---|---|
| Frontend | `npm.cmd run build` | PASS |
| Functions | `npm.cmd run build` (incluido al inicio de `npm test`) | PASS |

El build frontend conserva advertencias preexistentes de dependencias CommonJS y reglas CSS de Ionic que el optimizador no procesa; no hay errores de compilación.

## 15. Archivos creados

- `src/app/services/auth/user-admin.service.spec.ts`: política legacy, exclusiones, errores y paginación.
- `src/testing/component-test-providers.ts`: proveedores deterministas compartidos por specs.
- `src/testing/preview/main.ts`: aplicación local de validación visual, explícitamente sin Firebase.
- `src/theme/administrative-form.scss`: estilos compartidos de formularios administrativos.
- `tsconfig.preview.json`: compilación aislada del preview.
- `artifacts/phase-1-1/*.png`: 20 capturas, cuatro modales por cinco viewports.
- `REFACTOR_FASE_1_1.md`: este informe.

## 16. Archivos modificados

Funcionalidad y presentación:

- `angular.json`
- `firestore.indexes.json`
- `src/global.scss`
- `src/app/models/usuario-autolog.model.ts`
- `src/app/services/auth/user-admin.service.ts`
- `src/app/usuarios/usuarios.page.ts`
- `src/app/ventas/distribuidores/distribuidores.page.ts`
- `src/app/components/agregar-usuario/agregar-usuario.component.{ts,html,scss}`
- `src/app/components/editar-usuario/editar-usuario.component.{html,scss}`
- `src/app/components/distribuidor/agregar/agregar.component.{html,scss}`
- `src/app/components/distribuidor/editar/editar.component.{html,scss}`
- `src/app/components/distribuidor/acceso/acceso-distribuidor.component.ts`
- `D:/Proyectos/Subida_fire_hosting/autolog/rules/firestore.indexes.json`

Pruebas:

- `src/app/usuarios/usuarios.page.spec.ts`
- `src/app/articulos/articulos.page.spec.ts`
- `src/app/autos/autos.page.spec.ts`
- `src/app/components/agregar-articulo/agregar-articulo.component.spec.ts`
- `src/app/components/agregar-auto/agregar-auto.component.spec.ts`
- `src/app/components/agregar-evento/agregar-evento.component.spec.ts`
- `src/app/components/detalles-evento-unidad/detalles-evento-unidad.component.spec.ts`
- `src/app/components/editar-articulo/editar-articulo.component.spec.ts`
- `src/app/components/editar-evento/editar-evento.component.spec.ts`
- `src/app/components/generar-reporte/generar-reporte.component.spec.ts`
- `src/app/components/modal-buscar-venta/modal-buscar-venta.component.spec.ts`
- `src/app/herramientas/convertidor-dictamen/convertidor-dictamen.page.spec.ts`
- `src/app/home/home.page.spec.ts`
- `src/app/prueba/prueba.page.spec.ts`
- `src/app/services/admVentas/cilindros/cilindros.service.spec.ts`
- `src/app/services/admVentas/diarias/ventasBuenas/ventas-buenas.service.spec.ts`
- `src/app/services/admVentas/diarias/ventasMalas/ventas-malas.service.spec.ts`
- `src/app/services/admVentas/incidentes/incidentes.service.spec.ts`
- `src/app/services/admVentas/sorteo/sorteo.service.spec.ts`
- `src/app/services/admVentas/ventas/ventas.service.spec.ts`
- `src/app/services/auth/auth.service.spec.ts`
- `src/app/services/firebase/firebase.service.spec.ts`
- `src/app/services/geo/geo-location.service.spec.ts`
- `src/app/services/hora/hora.service.spec.ts`
- `src/app/services/monitoreogasmake.service.spec.ts`
- `src/app/services/storage/storage.service.spec.ts`
- `src/app/ventas/generar-codigos/generar-codigos.page.spec.ts`
- `src/app/ventas/historial/historial.page.spec.ts`
- `src/app/ventas/panel-control/panel-control.page.spec.ts`
- `src/app/ventas/productos/productos.page.spec.ts`
- `src/app/ventas/sorteos/sorteos.page.spec.ts`

## 17. Archivos eliminados

No se eliminó código, configuración funcional ni pruebas. Los logs temporales de Firebase Emulator se regeneran o retiran automáticamente al cerrar el emulador y no forman parte del cambio funcional.

## 18. Índices o Rules

Se retiró localmente el índice compuesto de `usuarios` tanto del frontend como del archivo canónico de índices porque la consulta nueva no lo necesita. No se agregó ningún índice. Los índices existentes de asistencia y Gaslink permanecen intactos en sus respectivos archivos.

No se modificaron `firestore.rules` ni `storage.rules`. No se desplegaron reglas ni índices.

## 19. Pendientes reales

- La validación del listado contra el proyecto real fue de solo lectura mediante las credenciales administrativas ya configuradas en Firebase CLI. Confirmó el error del índice y que la consulta nueva es aceptada por Firestore. No se ejecutó una sesión end-to-end del navegador contra producción ni se modificaron datos reales.
- Las Functions nuevas o actualizadas de la Fase 1 siguen únicamente preparadas en código local hasta una fase de despliegue autorizada. Esta fase no cambia ese estado.
- Conviene ejecutar Functions con Node 22 en CI o en el entorno de despliegue para coincidir exactamente con el runtime declarado; la validación local disponible usó Node 24.
- La suite Karma queda verde, pero algunos specs legacy todavía escriben avisos no bloqueantes al montar componentes visuales reales de Ionic (`ion-datetime-button`) y ApexCharts durante el teardown. No cambian resultados ni corresponden a los 28 fallos corregidos; conviene reemplazar esas fronteras visuales por stubs en una limpieza posterior para obtener una consola completamente silenciosa.

No quedan pruebas rojas, errores de lint ni errores de build.

## 20. Confirmación de NO DEPLOY

- No se ejecutó Firebase deploy.
- No se desplegaron Functions.
- No se desplegó Hosting.
- No se desplegaron Firestore Rules.
- No se desplegaron Storage Rules.
- No se desplegaron índices.
- No se ejecutaron migraciones.
- No se crearon ni modificaron manualmente usuarios, distribuidores ni otros datos de producción.
