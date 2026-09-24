# DESPLIEGUE DE FASES 1 A 3

Fecha: 7 de septiembre de 2026  
Proyecto Firebase: `autolog-13584`

## Componentes publicados

### Hosting

- Origen: `D:\Proyectos\autolog\www`
- URL: `https://autolog-13584.web.app`
- Resultado: despliegue completado.
- Verificación raíz: HTTP 200.
- Verificación `/asistencia/configuracion/puntos`: HTTP 200.
- Bundle verificado: `main.6ffc39122ac3f2b0.js`.

### Functions

Origen canónico: `D:\Proyectos\Subida_fire_hosting\autolog\functions`

Se publicaron en `us-central1`, runtime Node.js 22:

- `createAutologUser`
- `updateAutologUser`
- `disableAutologUser`
- `createDistribuidor`
- `createAttendancePoint`
- `listAttendancePoints`
- `getAttendancePointAssignments`
- `updateAttendancePoint`
- `setAttendancePointAssignments`

`externalDeviceApi` y `syncGaslinkSales` ya existían y fueron excluidas explícitamente del comando de despliegue. No se redeployaron ni se cambió su comportamiento.

Las callables `getMyAutologProfile`, `getMyAttendance` y `registerAttendance` no se publicaron porque pertenecen al futuro flujo del trabajador y no son necesarias para Usuarios, Distribuidores o la configuración administrativa de puntos autorizados.

Firebase confirmó después del despliegue once Functions activas: las nueve anteriores, `externalDeviceApi` y `syncGaslinkSales`.

### Firestore Rules

- Archivo: `D:\Proyectos\autolog\firestore.rules`
- Compilación: correcta.
- Publicación: completada.
- Las colecciones `asistencia_puntos` y `asistencia_punto_asignaciones` rechazan acceso directo; solo las callables administrativas usan Admin SDK.

### Firestore indexes

- Archivo: `D:\Proyectos\autolog\firestore.indexes.json`
- Publicación: completada.
- Índices remotos confirmados:
  - `asistencias`: `uid ASC`, `fechaHoraServidor DESC`, `__name__ DESC`.
  - `ventas_gaslink`: `folio ASC`, `fechaVenta DESC`, `__name__ DESC`.

### Storage Rules

- Archivo: `D:\Proyectos\autolog\storage.rules`
- Compilación: correcta.
- Publicación: completada.
- Se conserva la ruta de expedientes de distribuidores bajo `personal/distribuidores/...`.

## Configuración local actualizada

`D:\Proyectos\autolog\firebase.json` ahora declara Hosting, Firestore Rules, Firestore indexes y Storage Rules. Esto permite que futuros despliegues utilicen una configuración explícita y reproducible.

## Validaciones previas

- Build frontend: PASS.
- Lint Functions: PASS.
- Build Functions: PASS.
- El predeploy de Functions volvió a ejecutar lint y build: PASS.
- Firestore Rules: compilación remota PASS.
- Storage Rules: compilación remota PASS.

## Política de artefactos

El primer comando de Functions creó correctamente las nueve Functions, pero Firebase CLI reportó después que no existía una política de limpieza de imágenes. Se resolvió configurando la eliminación automática de imágenes de más de siete días en:

- `us-central1/gcf-artifacts`
- `us-east4/gcf-artifacts`

Esto evita acumulación de almacenamiento de builds antiguos y no modifica las revisiones activas.

## Datos

- No se ejecutaron migraciones.
- No se crearon ni modificaron manualmente documentos de producción.
- No se renumeraron distribuidores.
- No se crearon puntos autorizados durante la verificación.
- No se modificaron usuarios de Authentication.

## Resultado

El despliegue necesario para las Fases 1, 1.1, 2 y 3 quedó completado en `autolog-13584`. Hosting, Functions administrativas, reglas e índices están publicados y la ruta nueva responde correctamente.
