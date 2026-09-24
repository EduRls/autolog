# FASE 2

## 1. Resumen ejecutivo

La Fase 2 reorganizó la navegación de AUTOLOG mediante una configuración central, grupos colapsables y una búsqueda local de opciones. Se añadió el módulo administrativo de Asistencia con carga diferida y tres páginas: Panel, Registros y Configuración.

La implementación conserva los permisos de las opciones existentes. Panel y Registros de asistencia requieren acceso a AUTOLOG; Configuración requiere además rol `admin`. No se utilizó el `attendanceGuard` del trabajador.

Las páginas nuevas son únicamente estructurales y visuales. No inyectan servicios de Firebase, no consultan Firestore, no crean colecciones y no contienen datos simulados presentados como reales. Las métricas muestran cero y las áreas sin datos muestran estados vacíos explícitos.

También se corrigieron tres problemas del menú directamente relacionados con esta fase:

- `Resumen` y `Panel de servicios` ya no quedan activos simultáneamente. Se distinguen mediante `/home` y `/home#servicios` sin duplicar la página ni modificar su lógica.
- El pie muestra `Administrador`, `Capturista` o `Usuario` según el rol real, en lugar de asumir que todo usuario no administrador es capturista.
- Las clases globales del shell se eliminan al destruir el menú y el contenido se desplaza correctamente al expandir el sidebar entre 768 y 1199 px.

Validación final: frontend 128/128, Functions 51/51, lint y builds correctos, y `git diff --check` correcto.

## 2. Arquitectura anterior del menú

El menú se renderizaba mediante `MenuComponent`, un componente standalone importado por los módulos de cada página autenticada. La aplicación no tenía una única instancia global del sidebar; cada página montaba `<app-menu>`.

Las opciones, los métodos de navegación, los permisos visuales y los títulos estaban repartidos entre HTML y TypeScript. Cada opción tenía su propio botón y método. La navegación no tenía búsqueda ni grupos reutilizables. El sidebar completo ya manejaba dos anchos, 260 px y 76 px, y en móvil funcionaba como drawer superpuesto.

Se conservó esta integración por página para evitar una refactorización del shell ajena al objetivo. El cambio se concentró en el componente compartido y su configuración.

## 3. Arquitectura nueva del menú

La navegación queda organizada así:

- General: Resumen.
- Ventas: Panel de ventas, Historial e incidentes, Generar códigos QR, Productos y cilindros.
- Flotilla: Panel de servicios, Unidades, Distribuidores, Artículos.
- Expendio: Panel de expendio, Registro de ventas.
- Asistencia: Panel de asistencia, Registros, Configuración.
- Administración: Usuarios.
- Pie: Mi perfil y Cerrar sesión.

General se mantiene como acceso directo. Ventas, Flotilla, Expendio, Asistencia y Administración son grupos colapsables. La opción activa usa una superficie diferenciada y una guía azul lateral.

## 4. Configuración central de navegación

Archivo: `src/app/components/menu/navigation.config.ts`.

Define:

- `NavigationGroup`: id, etiqueta, icono, comportamiento colapsable e items.
- `NavigationItem`: id, etiqueta, icono, ruta, título, descripción, palabras clave, permiso opcional y estrategia de coincidencia.
- `NavigationPermission`: actualmente `admin`.
- `PageMeta`: metadatos reutilizados por el encabezado.

`AUTOLOG_NAVIGATION` alimenta el render, la búsqueda, el estado activo, los títulos y el filtrado visual. `EXTRA_PAGE_TITLES` conserva títulos para páginas secundarias que no aparecen como opciones principales.

Los permisos de esta configuración son de presentación. Los guards de rutas siguen siendo la autoridad para el acceso.

## 5. Searchbar

La búsqueda se ejecuta completamente en memoria sobre la configuración de navegación. No consulta Firestore ni otro servicio.

El texto se normaliza con Unicode NFD, se eliminan diacríticos y se convierte a minúsculas. Así, `configuracion` encuentra `Configuración`, y la búsqueda ignora mayúsculas y acentos. Se comparan la etiqueta del grupo, la etiqueta de la opción y sus keywords. Si coincide el nombre de un grupo, se muestran sus opciones visibles.

Antes de buscar se filtran los items por permiso, por lo que un capturista no recibe resultados de Configuración ni Usuarios. Durante una búsqueda los grupos coincidentes se expanden temporalmente. Al limpiar el campo vuelve el estado normal de acordeones.

En sidebar compacto se muestra únicamente un botón de búsqueda. Al activarlo, el sidebar se expande y enfoca el input.

## 6. Accordions

Cada grupo colapsable utiliza un botón real con `aria-expanded`, `aria-controls` e icono de estado. Los ids abiertos se mantienen en un `Set` y se persisten en `localStorage` bajo `autolog-navigation-open-groups`.

La ruta activa abre automáticamente su grupo al iniciar y después de cada `NavigationEnd`. El estado activo compara ruta y fragmento; Distribuidores utiliza coincidencia por prefijo para cubrir sus páginas hijas.

La transición usa `grid-template-rows` y opacidad, con duración corta basada en el token existente. `prefers-reduced-motion` reduce las transiciones.

El plegado de grupos permanece separado del plegado completo del sidebar.

## 7. Responsive

Se verificaron manualmente 1366x768, 1920x1080, 768x1024, 390x844 y 430x932 mediante un preview local sin Firebase.

- Escritorio: sidebar de 260 px, búsqueda completa, grupos y pie visibles.
- Tablet/intermedio: inicio compacto a 76 px; al usar búsqueda o abrir un grupo, el sidebar se expande y el contenido cambia correctamente su desplazamiento a 260 px.
- Móvil: drawer superpuesto con backdrop, búsqueda completa, scroll independiente y cierre al navegar, al pulsar el backdrop o Escape.
- Las páginas de Asistencia cambian de cuatro a dos y una columna según el ancho. Los filtros pasan a una columna en móvil.
- No se observó overflow horizontal.

La evidencia visual se guardó en `artifacts/phase-2/`.

## 8. Página Panel de asistencia

Ruta: `/asistencia`.

Incluye encabezado, resumen del día, métricas de Presentes, Entradas, Salidas y Pendientes, y una tarjeta de Actividad reciente. Todas las métricas muestran `0`. El estado vacío indica que no hay registros y que los movimientos aparecerán cuando ASISTIA comience a registrarlos.

No contiene servicios, suscripciones ni lecturas de datos.

## 9. Página Registros

Ruta: `/asistencia/registros`.

Incluye filtros visuales para distribuidor, fecha y estado. La estructura de tabla queda preparada con las columnas Distribuidor, Fecha, Entrada, Salida, Horas, Ubicación y Estado.

El componente define los estados `loading`, `empty`, `error` y `data`, y arranca en `empty` con una colección vacía. Los controles todavía no disparan consultas.

## 10. Página Configuración

Ruta: `/asistencia/configuracion`.

La sección prioritaria es Puntos autorizados. El CTA `Configurar puntos` permanece deshabilitado y separado visualmente de la etiqueta `Próximamente`.

Horarios y turnos, Tolerancias, Dispositivos y Biometría aparecen como tarjetas futuras. No se crearon subrutas ni lógica para ellas.

## 11. Routing

Rutas nuevas:

- `/asistencia`: Panel de asistencia.
- `/asistencia/registros`: Registros de asistencia.
- `/asistencia/configuracion`: Configuración de asistencia.

`app-routing.module.ts` carga `AsistenciaModule` de forma lazy y aplica `autologAccessGuard` al módulo completo. El routing hijo aplica `adminGuard` únicamente a Configuración.

## 12. Guards y permisos

| Ruta | Admin | Capturista |
| --- | --- | --- |
| `/asistencia` | Permitido | Permitido |
| `/asistencia/registros` | Permitido | Permitido |
| `/asistencia/configuracion` | Permitido | Denegado por `adminGuard` |

El menú replica estos permisos para no mostrar opciones restringidas, pero no reemplaza los guards. Las cuentas con `accesoAutolog=false` siguen siendo rechazadas por `autologAccessGuard` antes de entrar al módulo.

## 13. Archivos creados

Código y pruebas:

- `src/app/components/menu/navigation.config.ts`
- `src/app/asistencia/asistencia.module.ts`
- `src/app/asistencia/asistencia-routing.module.ts`
- `src/app/asistencia/asistencia-routing.module.spec.ts`
- `src/app/asistencia/asistencia.pages.spec.ts`
- `src/app/asistencia/asistencia.shared.scss`
- `src/app/asistencia/panel/asistencia-panel.page.ts`
- `src/app/asistencia/panel/asistencia-panel.page.html`
- `src/app/asistencia/registros/asistencia-registros.page.ts`
- `src/app/asistencia/registros/asistencia-registros.page.html`
- `src/app/asistencia/configuracion/asistencia-configuracion.page.ts`
- `src/app/asistencia/configuracion/asistencia-configuracion.page.html`
- `REFACTOR_FASE_2.md`

Evidencia visual:

- `artifacts/phase-2/panel-1366x768.png`
- `artifacts/phase-2/panel-1920x1080.png`
- `artifacts/phase-2/search-1366x768.png`
- `artifacts/phase-2/registros-1920x1080.png`
- `artifacts/phase-2/configuracion-1920x1080.png`
- `artifacts/phase-2/configuracion-768x1024.png`
- `artifacts/phase-2/configuracion-390x844.png`
- `artifacts/phase-2/panel-430x932.png`
- `artifacts/phase-2/drawer-390x844.png`

## 14. Archivos modificados

- `src/app/components/menu/menu.component.ts`: render desde configuración, búsqueda, acordeones, estado activo, roles, responsive y limpieza del shell.
- `src/app/components/menu/menu.component.html`: estructura accesible y reutilizable para grupos, búsqueda y pie.
- `src/app/components/menu/menu.component.scss`: estilos de grupos, búsqueda, sidebar compacto, drawer y transiciones.
- `src/app/components/menu/menu.component.spec.ts`: cobertura funcional del menú.
- `src/app/app-routing.module.ts`: export de rutas para pruebas y lazy route de Asistencia.
- `src/app/home/home.page.html`: ancla `servicios` para separar el estado activo de Resumen y Panel de servicios.
- `src/global.scss`: sincronización del desplazamiento del contenido con el estado expandido/compacto en tablet.
- `src/testing/preview/main.ts`: rutas locales de Asistencia para validación visual sin Firebase.

## 15. Archivos eliminados

Ninguno.

## 16. Pruebas nuevas/modificadas

El spec del menú contiene 11 pruebas que cubren render de grupos, acordeones, apertura por ruta activa, búsqueda por texto y keywords, mayúsculas, acentos, filtrado por permisos, sidebar compacto, drawer/Escape, perfil/logout y estado activo de las rutas de Asistencia.

Se añadieron 4 pruebas de páginas para métricas, empty state, filtros, tabla futura, estados visuales y CTA deshabilitado. Se añadieron 4 pruebas de routing y permisos para lazy loading, acceso AUTOLOG y restricción admin.

Las 19 pruebas específicas de Fase 2 pasan. No se añadieron `skip`, `xit`, `xdescribe`, `fit` ni `fdescribe`.

## 17. Resultados de pruebas

| Alcance | Comando | Resultado |
| --- | --- | --- |
| Frontend específico Fase 2 | `npm.cmd test -- --watch=false --browsers=ChromeHeadlessCI --include=...` | 19/19 PASS |
| Frontend completo | `npm.cmd test -- --watch=false --browsers=ChromeHeadlessCI` | 128/128 PASS, 0 FAIL |
| Functions con emuladores | `firebase.cmd emulators:exec --config ../firebase.emulators.json --project demo-autolog --only auth,functions,firestore,storage "npm test"` | 51/51 PASS, 0 FAIL |

## 18. Lint

| Proyecto | Comando | Resultado |
| --- | --- | --- |
| Frontend | `npm.cmd run lint` | PASS |
| Functions canónicas | `npm.cmd run lint` | PASS |

## 19. Builds

| Proyecto | Comando | Resultado |
| --- | --- | --- |
| Frontend | `npm.cmd run build` | PASS; se generó el chunk lazy `asistencia-asistencia-module` |
| Functions canónicas | `npm.cmd run build` | PASS |

El script de pruebas de Functions vuelve a ejecutar `npm run build` antes de las 51 pruebas y también terminó correctamente.

## 20. git diff --check

`git diff --check`: PASS. Git solo informó advertencias de normalización futura LF/CRLF; no encontró errores de espacios en el diff.

## 21. Hallazgos no corregidos

Son problemas preexistentes y ajenos a la Fase 2:

- La suite frontend, aunque termina 128/128, imprime mensajes de teardown de ApexCharts (`Element not found` y `NG0953`) en pruebas antiguas.
- Varias pruebas antiguas de Ionic imprimen avisos por `ion-datetime-button` sin la instancia asociada y por `disabled` usado junto a formularios reactivos.
- El build frontend conserva advertencias conocidas por dependencias CommonJS y por selectores Ionic que el optimizador no procesa.
- Functions declara Node 22, mientras el host local de emuladores ejecutó Node 24. La suite pasó, pero conviene alinear el runtime local en una fase de mantenimiento.

No se corrigieron porque no afectan esta implementación y hacerlo requeriría tocar componentes ajenos al alcance.

## 22. Confirmación de NO DEPLOY

- No se ejecutó Firebase deploy.
- No se desplegaron Functions.
- No se desplegó Hosting.
- No se desplegaron Firestore Rules ni Storage Rules.
- No se desplegaron índices.
- No se ejecutaron migraciones.
- No se hicieron cambios manuales en producción.
- No se modificaron datos reales.
- No se modificó la aplicación móvil ASISTIA.
- No se modificó el código fuente de Functions en esta fase.
- `externalDeviceApi` y `syncGaslinkSales` no sufrieron cambios funcionales.
- No se modificaron `firestore.rules`, `storage.rules` ni `firestore.indexes.json`.

