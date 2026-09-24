# REFACTOR FASE 5.1 — CORRECCIÓN Y VALIDACIÓN END-TO-END

Fecha de cierre: 8 de septiembre de 2026  
Proyecto Firebase: `autolog-13584`  
Backend canónico: `D:\Proyectos\Subida_fire_hosting\autolog\functions`

## 1. Causa del primer intento de salida

La causa está demostrada por los logs de producción y los documentos de idempotencia. La Function recibió tres POST autenticados en el periodo investigado, además de sus tres preflight OPTIONS:

| Hora `America/Mexico_City` | HTTP | Resultado | Evento devuelto | Documento nuevo |
|---|---:|---|---|---|
| 14:42:44–14:42:46 | 200 | `SUCCESS` | `CHECK_IN` | Sí, entrada `vLLALAkMJFob1rIMLB2t` |
| 14:42:53–14:42:54 | 200 | `DUPLICATE_IGNORED` | `CHECK_IN` anterior | No |
| 14:44:38 | 200 | `SUCCESS` | `CHECK_OUT` | Sí, salida `DqDL0KMLRUgXbSgYSsAe` |

El intento interpretado por la persona como salida llegó 8.025 segundos después de la entrada y cayó dentro de `DUPLICATE_WINDOW_MS = 15_000`. El backend no recibe un tipo autoritativo desde el cliente; decide el siguiente movimiento a partir de `attendanceState`. La protección defensiva devolvió la entrada anterior con `duplicado=true/status=IDEMPOTENT`, por lo que no creó una salida.

No existe una regla de dos minutos. No hubo rechazo, error de red registrado, request HTTP duplicado, transacción abortada ni error silencioso del backend. Las tres llamadas tuvieron HTTP 200. La tercera llamada, 1 minuto 52.318 segundos después de la entrada, ya estaba fuera de la ventana y creó la salida.

El código del cliente contenía además una carrera real: el efecto que esperaba `registerAttendance` dependía de propiedades React que podían cambiar al actualizar el estado. Su cleanup invalidaba la operación y podía perder una respuesta exitosa antes de presentar/sincronizar la UI. No causó la ausencia del documento de salida observada —esa ausencia fue la ventana de 15 segundos—, pero sí podía explicar una UI que no reflejara inmediatamente una respuesta. Se eliminó esa carrera.

Los logs anteriores no guardaban el `idempotencyKey` ni el ID del evento. Firestore guarda solamente `sha256(uid:idempotencyKey)`, por diseño. Se encontraron tres hashes distintos: entrada, intento protegido y salida. No es posible reconstruir las claves originales desde esos hashes. Desde Fase 5.1 los logs seguros incluyen `idempotencyHash`, `attendanceId` y `duplicateReason`, sin registrar la clave original ni secretos.

## 2. Idempotencia

La clave se genera con `crypto.randomUUID()` y prefijo `attendance_`; existe un fallback basado en tiempo más aleatorio para entornos sin `randomUUID`.

- Se crea al abrir un intento lógico.
- Se conserva en Reintentar.
- Se conserva si la pantalla se cierra o se vuelve a abrir después de una respuesta de red incierta.
- Se libera solo cuando el servidor devuelve un resultado válido.
- La siguiente apertura lógica —por ejemplo, salida después de una entrada confirmada— genera otra clave.
- CHECK_IN y CHECK_OUT no comparten clave después de un resultado confirmado.

El servidor calcula `sha256(uid:idempotencyKey)` y consulta `attendanceIdempotency` dentro de la transacción. La misma clave devuelve el mismo `asistenciaId` y no escribe otro evento. Una clave distinta dentro de los 15 segundos posteriores al último movimiento activa la protección contra doble toque y devuelve el último evento. La respuesta distingue ahora `SAME_KEY` de `DUPLICATE_WINDOW` e incluye `retryAfterSeconds` cuando aplica.

Si se repite una clave antigua después de que la jornada avanzó, se devuelve el evento original pero el resumen `today` se toma del `attendanceState` actual. Así, recuperar la entrada después de haber registrado la salida no reabre visualmente la jornada.

## 3. Estado CHECK_IN/CHECK_OUT

La política continúa siendo una entrada y una salida por día laboral:

```text
NOT_STARTED → CHECK_IN → OPEN / siguiente CHECK_OUT
OPEN        → CHECK_OUT → COMPLETED / siguiente null
COMPLETED   → JOURNEY_COMPLETED
```

Tras una respuesta exitosa, ASISTIA aplica inmediatamente `response.today` antes del refresh de confirmación. Las lecturas iniciadas antes de escribir ya no pueden revertir el estado confirmado. El CTA cambia a `Registrar salida` después de CHECK_IN y a `Jornada completada` después de CHECK_OUT.

Un error de `registerAttendance` mantiene el flujo en error y nunca muestra éxito. Una respuesta idempotente dice `Registro anterior recuperado`, aclara que no se creó un movimiento nuevo y sincroniza el estado oficial. Si se activó la ventana defensiva, explica que dura 15 segundos y muestra el tiempo restante informado por el servidor. El flujo no puede cerrarse mientras la escritura está en curso.

La ubicación se vuelve a solicitar al abrir cada registro. No se cambió el modelo de geocerca. La cámara continúa siendo real y la verificación facial continúa MOCK.

## 4. Causa de AUTOLOG vacío

La causa principal fue Hosting no desplegado, no Firestore ni las Functions administrativas.

- El Hosting visible antes de Fase 5.1 tenía una publicación del 7 de septiembre de 2026, anterior a la implementación de Fase 5 del 8 de septiembre.
- Su bundle contenía `Pendientes` y no contenía `getAttendanceDashboard` ni `listAttendanceRecords`.
- El build local sí contenía Panel y Registros conectados a esos callables.
- El usuario confirmó que la versión local mostraba inmediatamente la información real.

No se encontró discrepancia de región: AUTOLOG crea Functions en `us-central1`, la misma región de las cuatro Functions de asistencia.

No se encontró discrepancia de fecha: `getAttendanceDashboard` calcula el día con `America/Mexico_City` y consulta `fechaLocal == "2026-09-08"`. No convierte el filtro a un intervalo UTC. `listAttendanceRecords` compara `dateFrom/dateTo` con la cadena laboral `YYYY-MM-DD` de `attendanceState`.

No se encontró error de contrato. Los nombres TypeScript coinciden con las respuestas: `metrics.present/checkIns/checkOuts/movements`, `recentActivity`, y las filas agrupadas con `checkInTime/checkOutTime/workedMinutes/status`.

La identidad administrativa comprobada existe en Firebase Auth, no está deshabilitada y su documento `usuarios/{uid}` normaliza correctamente los campos legacy: `rol=admin`, `activo=true` por default legacy, `accesoAutolog=true` por default legacy y `tipoPersonal=SISTEMA` por default legacy. Los logs reales del navegador muestran `auth=VALID`, `actorRole=admin` y `SUCCESS` en ambos endpoints.

## 5. Dashboard corregido

El Panel distingue `loading`, `data`, `empty` y `error`. Durante loading no presenta ceros como si fueran datos. Un error muestra `No fue posible cargar la asistencia` y Reintentar; en desarrollo registra el error técnico en consola.

La cuarta tarjeta es `Movimientos`; `Pendientes` ya no aparece. La actividad reciente usa directamente nombre, VGBZ, tipo, timestamp oficial y punto retornados por backend, formateando la hora en `America/Mexico_City`.

## 6. Registros corregidos

El contrato final de Fase 5 es una fila de jornada por distribuidor y fecha construida desde `attendanceState`; no son filas de eventos individuales. La pantalla ahora lo declara como `Jornadas` y presenta entrada, salida, duración, punto y estado.

Sin filtros envía valores vacíos válidos y devuelve jornadas existentes. Fecha, distribuidor, estado, cursor y paginación fueron verificados. `EMPTY` solo se usa con cero resultados válidos; errores de Function usan `ERROR`, muestran `No fue posible cargar los registros` y ofrecen Reintentar. Las consultas nuevas invalidan respuestas antiguas para evitar carreras de paginación/filtros.

La duración usa los `eventTime` basados en `fechaHoraServidor`, nunca `createdAt`. El backend actual devuelve minutos enteros truncados: la jornada real de 1:52.318 se representa como `1 min`.

## 7. KPIs finales

La ejecución directa de los handlers administrativos sin modificar contra Firestore de producción devolvió:

| KPI | Valor |
|---|---:|
| Presentes | 0 |
| Entradas | 1 |
| Salidas | 1 |
| Movimientos | 2 |

Actividad real retornada:

- EDUARDO RUELAS CORTÉS, VGBZ-0192, Salida, 14:44, Gas Butano de Guadalupe.
- EDUARDO RUELAS CORTÉS, VGBZ-0192, Entrada, 14:42, Gas Butano de Guadalupe.

`listAttendanceRecords` sin filtros y con fecha/búsqueda devolvió una jornada completada con ambos movimientos. El ID canónico real del distribuidor es `0FAihED2Rm8DgdOGi04I` (contiene ceros en posiciones que visualmente pueden confundirse con la letra O).

## 8. Archivos modificados

ASISTIA:

- `src/App.tsx`
- `src/components/AttendanceFlow.tsx`
- `src/context/AttendanceProvider.tsx`
- `src/services/attendanceService.ts`
- `src/types/attendance.ts`
- `test/phase5.test.tsx`
- `test/phase5-1-flow.test.tsx`

AUTOLOG:

- `src/app/asistencia/panel/asistencia-panel.page.ts`
- `src/app/asistencia/panel/asistencia-panel.page.html`
- `src/app/asistencia/registros/asistencia-registros.page.ts`
- `src/app/asistencia/registros/asistencia-registros.page.html`
- `src/app/asistencia/asistencia.pages.spec.ts`
- `REFACTOR_FASE_5_1.md`

Backend canónico:

- `functions/src/attendance/register-attendance.callable.ts`
- `functions/src/attendance/attendance.types.ts`
- `functions/test/identity-attendance.emulator.test.js`

La evidencia reproducible quedó en `artifacts/phase-5-1/`; no contiene tokens, contraseñas ni claves de idempotencia originales.

## 9. Tests ASISTIA

Antes: **40/40**.  
Después: **51/51 PASS**, 5 archivos.

Se añadieron escenarios para actualización inmediata de entrada/salida, error sin éxito, respuesta idempotente, retry sin duplicar, separación de claves, servidor prevalente, respuesta perdida después de escribir, ventana real de 15 segundos, cierre durante escritura y carreras de refresh/props.

## 10. Tests AUTOLOG

Antes: **151/151**.  
Después: **159/159 PASS** con Chrome Headless.

Cubren dashboard abierto/completado, cuatro KPIs, actividad reciente, registros sin filtros, filtro laboral por fecha y distribuidor, timestamps México, estados loading/empty/error/data, reintento y ausencia de `Pendientes`.

## 11. Tests Functions

Antes: **64/64**.  
Después: **64/64 PASS**, sin skips, con emuladores Auth + Functions + Firestore + Storage.

Se ampliaron las aserciones de la integración existente, por lo que el número de tests de nivel superior no cambió. Se validaron `SAME_KEY`, `DUPLICATE_WINDOW`, `retryAfterSeconds`, estado actual al recuperar una clave antigua, CHECK_IN→CHECK_OUT, ausencia de requisito de dos minutos, dashboard ENTRADA+SALIDA, listados generales/por fecha, admin/capturista permitidos y distribuidor rechazado.

## 12. Lint/builds

- ASISTIA tests: PASS.
- ASISTIA lint: PASS.
- ASISTIA build: PASS.
- AUTOLOG tests: PASS.
- AUTOLOG lint: PASS.
- AUTOLOG build: PASS; solo warnings CommonJS preexistentes.
- Functions emuladores: PASS.
- Functions lint: PASS.
- Functions build TypeScript: PASS.
- `git diff --check` con `cr-at-eol`: PASS. Git conserva warnings de normalización LF/CRLF del worktree existente.
- Revisión focalizada de whitespace de los 15 archivos fuente/test modificados: PASS.
- `npx cap sync android`: PASS.
- `gradlew.bat assembleDebug`: BUILD SUCCESSFUL.
- APK: `android/app/build/outputs/apk/debug/app-debug.apk`, 6,778,679 bytes, SHA-256 `3A9FB701221D1B143F82A3A95C01101F112CF0758A28431492E4C3D384A2B8F1`.

## 13. Deploy

Deploy selectivo exitoso:

1. Hosting `autolog-13584`, release `1788901686418000`, versión `3174b79de0376941`, publicada el 8 de septiembre de 2026 a las 21:08:06Z.
2. `functions:registerAttendance` en `us-central1`, revisión `registerattendance-00002-bep`, activa desde las 21:09:18Z.

No se desplegaron `getMyAttendance`, `getAttendanceDashboard`, `listAttendanceRecords`, `externalDeviceApi`, `syncGaslinkSales`, Rules, Indexes ni Storage. La comparación antes/después confirma que las revisiones y fechas de las Functions no seleccionadas permanecieron iguales. `syncGaslinkSales` continúa como scheduled Function en `us-east4`.

## 14. Verificación real posterior

- `https://autolog-13584.web.app` sirve el `index.html` y el chunk de asistencia exactamente iguales al build validado; ambos SHA-256 coinciden byte por byte.
- Después del deploy, `getAttendanceDashboard` recibió una llamada real con Firebase Auth válido, rol admin, fecha `2026-09-08` y resultado `SUCCESS`.
- Después del deploy, `listAttendanceRecords` recibió una llamada real con Firebase Auth válido, rol admin, resultado `SUCCESS`, `returned=1` y `scanned=1`.
- No aparecen `permission-denied`, `failed-precondition` ni errores de índice en esas consultas.
- Los handlers ejecutados contra producción devolvieron los dos movimientos ya existentes; no se creó ningún registro nuevo.
- El usuario confirmó que AUTOLOG local mostraba la información real y completó el acceso al Hosting publicado. La sesión del navegador embebido de Codex permaneció separada en `/login`, por lo que la inspección visual/consola se sustentó en la confirmación del usuario, los hashes del bundle y los logs de Functions; no se inventa una inspección de consola que esa sesión no permitió.

La nueva revisión de `registerAttendance` inició correctamente. Los GET automáticos de comprobación de plataforma se rechazan como método inválido esperado para un callable; no corresponden a una marcación ni a un fallo de POST.

## 15. Pendientes

- Instalar/distribuir el APK actualizado de ASISTIA en el dispositivo físico y repetir entrada/salida en un nuevo día laboral o con un entorno controlado. No se creó asistencia de prueba en producción.
- Observar en la próxima marcación los nuevos campos seguros de log (`attendanceId`, `idempotencyHash`, `duplicateReason`) para diagnóstico operativo futuro.
- La retención/TTL de `attendanceIdempotency` continúa como pendiente operativo ya documentado en Fase 5.

No queda pendiente ningún cambio de Hosting ni de las Functions administrativas para mostrar los movimientos existentes.

## 16. Confirmación de que no se avanzó a biometría

No se implementó biometría real, enrolamiento, liveness, horarios, turnos, retardos, ausencias, asistencia offline, background location, notificaciones ni otro modelo de geocerca. La cámara sigue siendo real y la validación facial sigue siendo `FACE_MOCK / MOCK_VERIFIED`. No se avanzó a Fase 6.
