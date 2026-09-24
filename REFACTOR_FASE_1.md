# AUTOLOG — Reporte de refactorización, fase 1

Fecha: 6 de septiembre de 2026. Cambios exclusivamente locales.

## 1. Resumen de lo realizado

Se retiró la entidad funcional Empleados del frontend y del backend activo. Distribuidores queda como único personal operativo, con expediente conservado, identificador automático y acceso ASISTIA separado de Usuarios. Unidades selecciona distribuidores activos. No se implementaron páginas nuevas de asistencia, geocercas, biometría ni la reorganización del menú.

**Estado de validación:** builds y lint aprobados en ambos proyectos; 37/37 pruebas específicas de frontend y 51/51 pruebas de Functions con emuladores aprobadas. La suite general del frontend NO está completamente aprobada: 68 pruebas pasan y 28 fallan por configuración de pruebas existentes. Detalle en §12 y §14.

**Ubicaciones verificadas:** frontend `D:\Proyectos\autolog`; backend utilizado `D:\Proyectos\Subida_fire_hosting\autolog\functions`. La ruta literal `D:\Proyectos\Subida\_fire\_hosting\autolog\functions` no existe en este equipo. Se utilizó la ubicación física disponible del proyecto de hosting/backend, que contiene las Functions canónicas. La copia antigua `D:\Proyectos\autolog\functions` NO se modificó ni utilizó para desarrollar o compilar Functions.

El inventario siguiente compara hashes con el estado al comenzar esta fase, no con HEAD: el espacio de trabajo ya contenía cambios del usuario. No se instalaron dependencias ni se modificaron los manifiestos/lockfiles durante esta fase.

## 2. Archivos creados

16 archivos, incluido este reporte. Los archivos de expediente bajo `personal/` son movimientos/renombrados de responsabilidades existentes.

- [Frontend: REFACTOR_FASE_1.md](<D:/Proyectos/autolog/REFACTOR_FASE_1.md>)
- [Frontend: src/app/components/distribuidor/acceso/acceso-distribuidor.component.html](<D:/Proyectos/autolog/src/app/components/distribuidor/acceso/acceso-distribuidor.component.html>)
- [Frontend: src/app/components/distribuidor/acceso/acceso-distribuidor.component.ts](<D:/Proyectos/autolog/src/app/components/distribuidor/acceso/acceso-distribuidor.component.ts>)
- [Frontend: src/app/components/personal/expediente-personal/expediente-personal.component.html](<D:/Proyectos/autolog/src/app/components/personal/expediente-personal/expediente-personal.component.html>)
- [Frontend: src/app/components/personal/expediente-personal/expediente-personal.component.scss](<D:/Proyectos/autolog/src/app/components/personal/expediente-personal/expediente-personal.component.scss>)
- [Frontend: src/app/components/personal/expediente-personal/expediente-personal.component.ts](<D:/Proyectos/autolog/src/app/components/personal/expediente-personal/expediente-personal.component.ts>)
- [Frontend: src/app/components/personal/subir-documento-personal/subir-documento-personal.component.html](<D:/Proyectos/autolog/src/app/components/personal/subir-documento-personal/subir-documento-personal.component.html>)
- [Frontend: src/app/components/personal/subir-documento-personal/subir-documento-personal.component.scss](<D:/Proyectos/autolog/src/app/components/personal/subir-documento-personal/subir-documento-personal.component.scss>)
- [Frontend: src/app/components/personal/subir-documento-personal/subir-documento-personal.component.spec.ts](<D:/Proyectos/autolog/src/app/components/personal/subir-documento-personal/subir-documento-personal.component.spec.ts>)
- [Frontend: src/app/components/personal/subir-documento-personal/subir-documento-personal.component.ts](<D:/Proyectos/autolog/src/app/components/personal/subir-documento-personal/subir-documento-personal.component.ts>)
- [Frontend: src/app/models/documento-personal.model.ts](<D:/Proyectos/autolog/src/app/models/documento-personal.model.ts>)
- [Frontend: src/app/phase-one.spec.ts](<D:/Proyectos/autolog/src/app/phase-one.spec.ts>)
- [Frontend: src/app/services/personal/personal-document.utils.ts](<D:/Proyectos/autolog/src/app/services/personal/personal-document.utils.ts>)
- [Backend: functions/src/auth/autolog-access.ts](<D:/Proyectos/Subida_fire_hosting/autolog/functions/src/auth/autolog-access.ts>)
- [Backend: functions/src/distributors/create-distribuidor.ts](<D:/Proyectos/Subida_fire_hosting/autolog/functions/src/distributors/create-distribuidor.ts>)
- [Backend: functions/test/distributor.test.js](<D:/Proyectos/Subida_fire_hosting/autolog/functions/test/distributor.test.js>)

## 3. Archivos modificados

60 archivos de código, pruebas o configuración local.

- [Frontend: firestore.indexes.json](<D:/Proyectos/autolog/firestore.indexes.json>)
- [Frontend: firestore.rules](<D:/Proyectos/autolog/firestore.rules>)
- [Frontend: src/app/app-routing.module.ts](<D:/Proyectos/autolog/src/app/app-routing.module.ts>)
- [Frontend: src/app/components/agregar-auto/agregar-auto.component.html](<D:/Proyectos/autolog/src/app/components/agregar-auto/agregar-auto.component.html>)
- [Frontend: src/app/components/agregar-auto/agregar-auto.component.spec.ts](<D:/Proyectos/autolog/src/app/components/agregar-auto/agregar-auto.component.spec.ts>)
- [Frontend: src/app/components/agregar-auto/agregar-auto.component.ts](<D:/Proyectos/autolog/src/app/components/agregar-auto/agregar-auto.component.ts>)
- [Frontend: src/app/components/agregar-usuario/agregar-usuario.component.html](<D:/Proyectos/autolog/src/app/components/agregar-usuario/agregar-usuario.component.html>)
- [Frontend: src/app/components/agregar-usuario/agregar-usuario.component.scss](<D:/Proyectos/autolog/src/app/components/agregar-usuario/agregar-usuario.component.scss>)
- [Frontend: src/app/components/agregar-usuario/agregar-usuario.component.spec.ts](<D:/Proyectos/autolog/src/app/components/agregar-usuario/agregar-usuario.component.spec.ts>)
- [Frontend: src/app/components/agregar-usuario/agregar-usuario.component.ts](<D:/Proyectos/autolog/src/app/components/agregar-usuario/agregar-usuario.component.ts>)
- [Frontend: src/app/components/distribuidor/agregar/agregar.component.html](<D:/Proyectos/autolog/src/app/components/distribuidor/agregar/agregar.component.html>)
- [Frontend: src/app/components/distribuidor/agregar/agregar.component.spec.ts](<D:/Proyectos/autolog/src/app/components/distribuidor/agregar/agregar.component.spec.ts>)
- [Frontend: src/app/components/distribuidor/agregar/agregar.component.ts](<D:/Proyectos/autolog/src/app/components/distribuidor/agregar/agregar.component.ts>)
- [Frontend: src/app/components/distribuidor/editar/editar.component.html](<D:/Proyectos/autolog/src/app/components/distribuidor/editar/editar.component.html>)
- [Frontend: src/app/components/distribuidor/editar/editar.component.spec.ts](<D:/Proyectos/autolog/src/app/components/distribuidor/editar/editar.component.spec.ts>)
- [Frontend: src/app/components/distribuidor/editar/editar.component.ts](<D:/Proyectos/autolog/src/app/components/distribuidor/editar/editar.component.ts>)
- [Frontend: src/app/components/editar-auto/editar-auto.component.html](<D:/Proyectos/autolog/src/app/components/editar-auto/editar-auto.component.html>)
- [Frontend: src/app/components/editar-auto/editar-auto.component.spec.ts](<D:/Proyectos/autolog/src/app/components/editar-auto/editar-auto.component.spec.ts>)
- [Frontend: src/app/components/editar-auto/editar-auto.component.ts](<D:/Proyectos/autolog/src/app/components/editar-auto/editar-auto.component.ts>)
- [Frontend: src/app/components/editar-usuario/editar-usuario.component.html](<D:/Proyectos/autolog/src/app/components/editar-usuario/editar-usuario.component.html>)
- [Frontend: src/app/components/editar-usuario/editar-usuario.component.scss](<D:/Proyectos/autolog/src/app/components/editar-usuario/editar-usuario.component.scss>)
- [Frontend: src/app/components/editar-usuario/editar-usuario.component.spec.ts](<D:/Proyectos/autolog/src/app/components/editar-usuario/editar-usuario.component.spec.ts>)
- [Frontend: src/app/components/editar-usuario/editar-usuario.component.ts](<D:/Proyectos/autolog/src/app/components/editar-usuario/editar-usuario.component.ts>)
- [Frontend: src/app/components/menu/menu.component.html](<D:/Proyectos/autolog/src/app/components/menu/menu.component.html>)
- [Frontend: src/app/components/menu/menu.component.spec.ts](<D:/Proyectos/autolog/src/app/components/menu/menu.component.spec.ts>)
- [Frontend: src/app/components/menu/menu.component.ts](<D:/Proyectos/autolog/src/app/components/menu/menu.component.ts>)
- [Frontend: src/app/login/login.page.spec.ts](<D:/Proyectos/autolog/src/app/login/login.page.spec.ts>)
- [Frontend: src/app/login/login.page.ts](<D:/Proyectos/autolog/src/app/login/login.page.ts>)
- [Frontend: src/app/models/attendance.model.ts](<D:/Proyectos/autolog/src/app/models/attendance.model.ts>)
- [Frontend: src/app/models/distribuidor.model.ts](<D:/Proyectos/autolog/src/app/models/distribuidor.model.ts>)
- [Frontend: src/app/models/usuario-autolog.model.ts](<D:/Proyectos/autolog/src/app/models/usuario-autolog.model.ts>)
- [Frontend: src/app/reloj/reloj.page.spec.ts](<D:/Proyectos/autolog/src/app/reloj/reloj.page.spec.ts>)
- [Frontend: src/app/reloj/reloj.page.ts](<D:/Proyectos/autolog/src/app/reloj/reloj.page.ts>)
- [Frontend: src/app/services/admVentas/distribuidores/distribuidores.service.spec.ts](<D:/Proyectos/autolog/src/app/services/admVentas/distribuidores/distribuidores.service.spec.ts>)
- [Frontend: src/app/services/admVentas/distribuidores/distribuidores.service.ts](<D:/Proyectos/autolog/src/app/services/admVentas/distribuidores/distribuidores.service.ts>)
- [Frontend: src/app/services/auth/authorization.service.ts](<D:/Proyectos/autolog/src/app/services/auth/authorization.service.ts>)
- [Frontend: src/app/services/auth/user-admin.service.ts](<D:/Proyectos/autolog/src/app/services/auth/user-admin.service.ts>)
- [Frontend: src/app/services/personal/personal-document-storage.service.ts](<D:/Proyectos/autolog/src/app/services/personal/personal-document-storage.service.ts>)
- [Frontend: src/app/services/personal/personal-expediente.service.ts](<D:/Proyectos/autolog/src/app/services/personal/personal-expediente.service.ts>)
- [Frontend: src/app/usuarios/usuarios.page.html](<D:/Proyectos/autolog/src/app/usuarios/usuarios.page.html>)
- [Frontend: src/app/usuarios/usuarios.page.spec.ts](<D:/Proyectos/autolog/src/app/usuarios/usuarios.page.spec.ts>)
- [Frontend: src/app/usuarios/usuarios.page.ts](<D:/Proyectos/autolog/src/app/usuarios/usuarios.page.ts>)
- [Frontend: src/app/ventas/distribuidores/distribuidores.module.ts](<D:/Proyectos/autolog/src/app/ventas/distribuidores/distribuidores.module.ts>)
- [Frontend: src/app/ventas/distribuidores/distribuidores.page.html](<D:/Proyectos/autolog/src/app/ventas/distribuidores/distribuidores.page.html>)
- [Frontend: src/app/ventas/distribuidores/distribuidores.page.ts](<D:/Proyectos/autolog/src/app/ventas/distribuidores/distribuidores.page.ts>)
- [Frontend: src/app/ventas/distribuidores/expediente/distribuidor-expediente.page.html](<D:/Proyectos/autolog/src/app/ventas/distribuidores/expediente/distribuidor-expediente.page.html>)
- [Frontend: src/global.scss](<D:/Proyectos/autolog/src/global.scss>)
- [Frontend: storage.rules](<D:/Proyectos/autolog/storage.rules>)
- [Backend: functions/src/attendance/attendance.service.ts](<D:/Proyectos/Subida_fire_hosting/autolog/functions/src/attendance/attendance.service.ts>)
- [Backend: functions/src/auth/personal-types.ts](<D:/Proyectos/Subida_fire_hosting/autolog/functions/src/auth/personal-types.ts>)
- [Backend: functions/src/auth/require-admin.ts](<D:/Proyectos/Subida_fire_hosting/autolog/functions/src/auth/require-admin.ts>)
- [Backend: functions/src/auth/user-validation.ts](<D:/Proyectos/Subida_fire_hosting/autolog/functions/src/auth/user-validation.ts>)
- [Backend: functions/src/externalApi/firebase-auth.middleware.ts](<D:/Proyectos/Subida_fire_hosting/autolog/functions/src/externalApi/firebase-auth.middleware.ts>)
- [Backend: functions/src/index.ts](<D:/Proyectos/Subida_fire_hosting/autolog/functions/src/index.ts>)
- [Backend: functions/src/users/autolog-user.callables.ts](<D:/Proyectos/Subida_fire_hosting/autolog/functions/src/users/autolog-user.callables.ts>)
- [Backend: functions/test/identity-attendance.emulator.test.js](<D:/Proyectos/Subida_fire_hosting/autolog/functions/test/identity-attendance.emulator.test.js>)
- [Backend: functions/test/identity-attendance.test.js](<D:/Proyectos/Subida_fire_hosting/autolog/functions/test/identity-attendance.test.js>)
- [Backend: rules/firestore.indexes.json](<D:/Proyectos/Subida_fire_hosting/autolog/rules/firestore.indexes.json>)
- [Backend: rules/firestore.rules](<D:/Proyectos/Subida_fire_hosting/autolog/rules/firestore.rules>)
- [Backend: rules/storage.rules](<D:/Proyectos/Subida_fire_hosting/autolog/rules/storage.rules>)

Además, los comandos de build regeneraron las salidas ignoradas `www/`, `functions/lib/` y cachés de Angular. Los emuladores actualizaron su registro local, sin editarlo manualmente:

- [Backend: functions/firestore-debug.log](<D:/Proyectos/Subida_fire_hosting/autolog/functions/firestore-debug.log>)

Los logs de pruebas de frontend se guardaron en `%TEMP%`, no en Firebase.

## 4. Archivos eliminados

24 archivos retirados de sus ubicaciones anteriores. Primero se actualizaron los consumidores y se movió el expediente compartido; después se retiraron el CRUD, rutas, modelo, servicios y pruebas exclusivos de Empleados. Los componentes de expediente, modelo documental y utilidades reutilizables tienen reemplazo nominal en §2 y §8.

- `D:\Proyectos\autolog\src\app\components\empleados\empleado-form\empleado-form.component.html`
- `D:\Proyectos\autolog\src\app\components\empleados\empleado-form\empleado-form.component.scss`
- `D:\Proyectos\autolog\src\app\components\empleados\empleado-form\empleado-form.component.spec.ts`
- `D:\Proyectos\autolog\src\app\components\empleados\empleado-form\empleado-form.component.ts`
- `D:\Proyectos\autolog\src\app\components\empleados\expediente-empleado\expediente-empleado.component.html`
- `D:\Proyectos\autolog\src\app\components\empleados\expediente-empleado\expediente-empleado.component.scss`
- `D:\Proyectos\autolog\src\app\components\empleados\expediente-empleado\expediente-empleado.component.ts`
- `D:\Proyectos\autolog\src\app\components\empleados\subir-documento-empleado\subir-documento-empleado.component.html`
- `D:\Proyectos\autolog\src\app\components\empleados\subir-documento-empleado\subir-documento-empleado.component.scss`
- `D:\Proyectos\autolog\src\app\components\empleados\subir-documento-empleado\subir-documento-empleado.component.spec.ts`
- `D:\Proyectos\autolog\src\app\components\empleados\subir-documento-empleado\subir-documento-empleado.component.ts`
- `D:\Proyectos\autolog\src\app\empleados\empleados-routing.module.ts`
- `D:\Proyectos\autolog\src\app\empleados\empleados.module.ts`
- `D:\Proyectos\autolog\src\app\empleados\empleados.page.html`
- `D:\Proyectos\autolog\src\app\empleados\empleados.page.scss`
- `D:\Proyectos\autolog\src\app\empleados\empleados.page.spec.ts`
- `D:\Proyectos\autolog\src\app\empleados\empleados.page.ts`
- `D:\Proyectos\autolog\src\app\models\documento-empleado.model.ts`
- `D:\Proyectos\autolog\src\app\models\empleado.model.ts`
- `D:\Proyectos\autolog\src\app\services\empleados\empleado-document-storage.service.ts`
- `D:\Proyectos\autolog\src\app\services\empleados\empleado-expediente.service.ts`
- `D:\Proyectos\autolog\src\app\services\empleados\empleados.service.ts`
- `D:\Proyectos\autolog\src\app\services\empleados\empleados.utils.spec.ts`
- `D:\Proyectos\autolog\src\app\services\empleados\empleados.utils.ts`

## 5. Cómo quedó Usuarios

**Alta:** correo electrónico, contraseña temporal, nombre de usuario y rol (Administrador/Capturista). **Edición:** correo, nombre, rol y activo; se conserva la desactivación administrativa existente. No hay selector laboral, persona vinculada ni controles de acceso al reloj.

El frontend fija automáticamente esta política, validada también por Functions:

```text
rol: admin | capturista
tipoPersonal: SISTEMA
distribuidorId: null
accesoAutolog: true
accesoAsistencia: false
```

El listado usa una consulta real en UserAdminService, antes de paginar:

```text
usuarios
  where rol in [admin, capturista]
  where accesoAutolog == true
  orderBy usuario asc, documentId asc
  cursor + límite
```

Las cuentas de distribuidores no aparecen por filtrado de Firestore; no depende del HTML. Usuarios administrativos desactivados siguen siendo visibles para poder administrarlos, porque `activo` no forma parte del filtro.

**Compatibilidad explícita:** registros antiguos sin `accesoAutolog=true`, con rol de distinta capitalización o sin `usuario` no entran en esta consulta. No se modificaron datos para incorporarlos. Login/guards conservan el acceso administrativo legacy cuando falta el indicador, siempre que el rol sea administrativo y no exista una prohibición explícita. Esta diferencia es deliberada: listado estricto solicitado frente a autenticación legacy conservada.

## 6. Cómo quedó Distribuidores

- **Alta:** nombre, ruta y zona; disponible para administrador. El frontend llama `createDistribuidor` y no escribe directamente un alta en Firestore.
- **VGBZ:** Function administrativa, contador `distributorCounters/VGBZ` y documento independiente `distribuidores/{randomId}`.
- **Inicialización:** si falta contador, una transacción lee los identificadores existentes y obtiene el mayor sufijo válido `VGBZ-<dígitos>`, aceptando variantes como `VGBZ-001` y cualquier cantidad de dígitos segura. No cambia registros previos.
- **Concurrencia:** la misma transacción actualiza contador, crea distribuidor y registra idempotencia. Dos inicializaciones concurrentes compiten por el mismo contador y Firestore reintenta; no se asigna dos veces el consecutivo. No se usa length+1 ni last+add en frontend.
- **Formato:** mínimo cuatro dígitos; después de 9999 continúa VGBZ-10000. Valores históricos fuera del rango numérico seguro producen error en lugar de asignar un número ambiguo.
- **Reintentos:** clave estable por formulario y actor en `distributorRequests/{hash}`. Misma solicitud/datos devuelve el mismo ID; reutilizar la clave con otros datos se rechaza.
- **Edición:** identificador visible, control deshabilitado/solo lectura y excluido de la escritura del servicio. Reglas locales también impiden cambiarlo.
- **Expediente:** mismo Firestore, Storage, catálogo, estados y versionado; solo se desacoplaron nombres y rama de la entidad eliminada.
- **usuarioUid:** conservado; la cuenta se vincula mediante la transacción existente con `usuarios/{uid}` y Authentication.
- **Acceso ASISTIA:** componente separado `AccesoDistribuidorComponent`; correo, nombre y contraseña temporal al crear, estado activo al editar. Sin roles administrativos ni permiso AUTOLOG seleccionables.

Política obligatoria de la cuenta vinculada:

```text
rol: empleado
tipoPersonal: DISTRIBUIDOR
distribuidorId: <ID Firestore del distribuidor>
accesoAutolog: false
accesoAsistencia: true
```

La contraseña temporal la captura el administrador; no se genera un mecanismo nuevo de invitaciones ni cambio obligatorio. Authentication conserva el UID y no se guardan contraseñas en Firestore. Los controles de contraseña se limpian tras la operación.

## 7. Cómo quedó operador de Unidades

Alta y edición consultan `DistribuidoresService.getActivos()`. Se excluyen `activo=false` y estados legacy INACTIVO/BAJA/ELIMINADO.

```text
autos.operadorId = ID Firestore de distribuidores/{id}
autos.operador   = nombre del distribuidor seleccionado
```

El nombre se muestra de solo lectura y el selector de identidad es obligatorio. Un registro antiguo que no tenga operadorId deberá seleccionar un distribuidor cuando se edite; no se escribió ni migró ninguna unidad existente. No se cambiaron ventas, servicios, kilometrajes ni cálculos vehiculares.

## 8. Cómo quedó el expediente compartido

Renombrados/movimientos:

| Antes | Ahora |
|---|---|
| components/empleados/expediente-empleado, ExpedienteEmpleadoComponent | components/personal/expediente-personal, ExpedientePersonalComponent |
| components/empleados/subir-documento-empleado, SubirDocumentoEmpleadoComponent | components/personal/subir-documento-personal, SubirDocumentoPersonalComponent |
| documento-empleado.model, DocumentoEmpleado | documento-personal.model, DocumentoPersonal |
| DOCUMENTO_EMPLEADO_CATALOGO | DOCUMENTO_PERSONAL_CATALOGO |
| services/empleados/empleados.utils | services/personal/personal-document.utils |

`PersonalExpedienteService`, `PersonalDocumentStorageService` y `ExpedientePersonalTarget` permanecen; el único destino activo es DISTRIBUIDOR. Las clases CSS y nombres de modal se renombraron junto con sus consumidores.

Rutas conservadas:

```text
Firestore: distribuidores/{id}/expediente/{documentoId}
Storage: personal/distribuidores/{id}/expediente/{documentoId}/{archivo}
```

No se cambia `storagePath` de documentos existentes. Se conserva upload/reemplazo, compensación de errores, marcado de versión actual, número de versión y catálogo documental. No se intentó corregir la concurrencia de reemplazos ni añadir funcionalidades al expediente.

## 9. Cambios en Functions

- **Nueva createDistribuidor:** autorización administrativa, validación, inicialización/transacción VGBZ e idempotencia; exportada en index.ts.
- **createAutologUser / updateAutologUser:** conservan Admin SDK, vínculo transaccional con distribuidor y compensación ante fallo; se restringió el contrato a las dos políticas anteriores y se retiró EMPLEADO_OFICINA/empleadoId.
- **disableAutologUser:** conserva comportamiento, desactiva Authentication/perfil y mantiene vínculos. Está en el archivo de callables actualizado, sin nueva política de eliminación.
- **requireAdmin:** rechaza explícitamente una identidad DISTRIBUIDOR incluso ante datos inconsistentes; conserva fallback legacy por correo.
- **getMyAutologProfile/registerAttendance/getMyAttendance existentes:** se retiró únicamente el resolver de la entidad eliminada del servicio compartido; la ruta/reloj y flujo para distribuidores se conservaron. No se creó la aplicación ASISTIA.
- **syncGaslinkSales:** SIN cambios funcionales ni cambios de sus archivos; parsing, cron, región, checkpoints y negocio permanecen iguales.
- **externalDeviceApi:** parsing, rutas, respuestas de negocio, región y cliente externo SIN cambios. **Excepción de autorización explícita:** el middleware antes aceptaba cualquier token Firebase válido; ahora rechaza con HTTP 403/PERMISSION_DENIED perfiles `tipoPersonal=DISTRIBUIDOR` o `accesoAutolog=false`. Los demás portadores legacy de token conservan el comportamiento anterior, incluso sin perfil. Tokens ausentes/inválidos mantienen 401. Se añade una lectura del perfil y fallback legacy por correo; no se tocó el proveedor externo.

Por esa excepción NO sería correcto afirmar que externalDeviceApi no cambió absolutamente ningún comportamiento. El cambio está limitado al permiso autorizado por el punto 13 de la solicitud y tiene pruebas unitarias para ambos casos y compatibilidad legacy.

Verificación por hashes: en los directorios externalApi/Gaslink solamente cambió `firebase-auth.middleware.ts`; la copia antigua del backend no tuvo cambios.

## 10. Cambios en reglas/índices

Solo locales, tanto en el frontend como en `rules/` del proyecto canónico:

- Firestore: retiro de reglas específicas de la entidad eliminada; alta de distribuidor solo por callable; identificador y usuarioUid protegidos contra escritura directa; colecciones de contador/idempotencia excluidas del permiso legacy general.
- Firestore/Storage: acceso AUTOLOG requiere rol administrativo, cuenta activa y no pertenecer a DISTRIBUIDOR; respeta `accesoAutolog=false`.
- Storage: rutas de distribuidores conservadas; retiradas rutas dedicadas exclusivamente a Empleados.
- Metadata documental: se admite únicamente el campo legacy `empleadoId:null`, si ya está presente en documentos de distribuidores, para que una actualización de versión/estado no invalide el documento. No se resuelve ni mantiene una relación con Empleados y los nuevos metadatos no lo generan.
- Índices: retirados los exclusivos de Empleados; añadido índice compuesto Usuarios `(rol ASC, accesoAutolog ASC, usuario ASC, __name__ ASC)`. Índices previos de Gaslink/asistencias conservados.

Los emuladores cargaron las reglas locales. Esto no demuestra equivalencia con reglas desplegadas ni validación completa de todos sus permisos. El `firebase.json` de producción no apunta actualmente a estos archivos de reglas/índices; el archivo de emuladores sí. No se alteró esa configuración para publicar nada.

## 11. Referencias restantes a Empleados

No quedan imports, rutas, CRUD, servicios, modelos ni consumidores activos de la **entidad** Empleados en frontend o Functions canónicas.

Referencias residuales en código y pruebas, con líneas de esta entrega:

| Archivo | Líneas | Justificación |
|---|---|---|
| [Frontend: src/app/phase-one.spec.ts](<D:/Proyectos/autolog/src/app/phase-one.spec.ts>) | 31, 43, 49 | Fixtures/pruebas del rol técnico empleado de las cuentas de distribuidores o de su rechazo en AUTOLOG. |
| [Frontend: src/app/login/login.page.spec.ts](<D:/Proyectos/autolog/src/app/login/login.page.spec.ts>) | 14 | Fixtures/pruebas del rol técnico empleado de las cuentas de distribuidores o de su rechazo en AUTOLOG. |
| [Frontend: src/app/models/usuario-autolog.model.ts](<D:/Proyectos/autolog/src/app/models/usuario-autolog.model.ts>) | 5 | Rol técnico empleado requerido para cuentas DISTRIBUIDOR/ASISTIA; no representa una colección ni entidad Empleados. |
| [Frontend: src/app/reloj/reloj.page.spec.ts](<D:/Proyectos/autolog/src/app/reloj/reloj.page.spec.ts>) | 13 | Fixtures/pruebas del rol técnico empleado de las cuentas de distribuidores o de su rechazo en AUTOLOG. |
| [Frontend: src/app/services/auth/user-admin.service.ts](<D:/Proyectos/autolog/src/app/services/auth/user-admin.service.ts>) | 138 | Rol técnico empleado requerido para cuentas DISTRIBUIDOR/ASISTIA; no representa una colección ni entidad Empleados. |
| [Frontend: src/app/components/menu/menu.component.spec.ts](<D:/Proyectos/autolog/src/app/components/menu/menu.component.spec.ts>) | 27 | Prueba negativa: comprueba que la opción retirada no está en el menú. |
| [Frontend: src/app/components/distribuidor/acceso/acceso-distribuidor.component.ts](<D:/Proyectos/autolog/src/app/components/distribuidor/acceso/acceso-distribuidor.component.ts>) | 35 | Rol técnico empleado requerido para cuentas DISTRIBUIDOR/ASISTIA; no representa una colección ni entidad Empleados. |
| [Backend: functions/src/auth/roles.ts](<D:/Proyectos/Subida_fire_hosting/autolog/functions/src/auth/roles.ts>) | 1 | Rol técnico empleado requerido para cuentas DISTRIBUIDOR/ASISTIA; no representa una colección ni entidad Empleados. |
| [Backend: functions/src/auth/user-validation.ts](<D:/Proyectos/Subida_fire_hosting/autolog/functions/src/auth/user-validation.ts>) | 296 | Rol técnico empleado requerido para cuentas DISTRIBUIDOR/ASISTIA; no representa una colección ni entidad Empleados. |
| [Backend: functions/test/distributor.test.js](<D:/Proyectos/Subida_fire_hosting/autolog/functions/test/distributor.test.js>) | 47, 59 | Rol técnico de ASISTIA y detector de regresiones de la entidad retirada. |
| [Backend: functions/test/identity-attendance.emulator.test.js](<D:/Proyectos/Subida_fire_hosting/autolog/functions/test/identity-attendance.emulator.test.js>) | 108, 130, 150, 167, 186, 197, 208 | Fixtures/pruebas del rol técnico empleado de las cuentas de distribuidores o de su rechazo en AUTOLOG. |
| [Backend: functions/test/identity-attendance.test.js](<D:/Proyectos/Subida_fire_hosting/autolog/functions/test/identity-attendance.test.js>) | 24, 135 | Fixtures/pruebas del rol técnico empleado de las cuentas de distribuidores o de su rechazo en AUTOLOG. |
| [Frontend: firestore.rules](<D:/Proyectos/autolog/firestore.rules>) | 45, 52 | Campo legacy exclusivamente null en metadatos de expedientes de distribuidores; no vínculo funcional. |
| [Backend: rules/firestore.rules](<D:/Proyectos/Subida_fire_hosting/autolog/rules/firestore.rules>) | 45, 52 | Misma compatibilidad documental local. |

Otros lugares deliberadamente conservados:

- [Frontend: functions/src/index.ts](<D:/Proyectos/autolog/functions/src/index.ts>): copia antigua de backend expresamente excluida por la solicitud; no consumidor del frontend ni fuente del build canónico.
- [Backend: IDENTITY_ATTENDANCE_CONTRACTS.md](<D:/Proyectos/Subida_fire_hosting/autolog/IDENTITY_ATTENDANCE_CONTRACTS.md>): contrato histórico anterior, superado para esta fase por este reporte.
- [Backend: IMPLEMENTATION_REPORT.md](<D:/Proyectos/Subida_fire_hosting/autolog/IMPLEMENTATION_REPORT.md>): reporte histórico anterior, incluye los archivos y entidad ya retirados.
- [Backend: LEGACY_COMPATIBILITY.md](<D:/Proyectos/Subida_fire_hosting/autolog/LEGACY_COMPATIBILITY.md>): decisiones históricas anteriores, no contrato activo de esta fase.
- Este reporte: explicación de eliminaciones, movimientos y compatibilidad documental.

No se modificaron esas copias/documentos históricos. La búsqueda de código activo está además automatizada en `distributor.test.js`; no inspecciona node_modules, artefactos compilados ni la copia antigua excluida.

## 12. Pruebas ejecutadas

Package manager identificado: **npm**, con package-lock.json; scripts existentes de Angular y Node test runner. No se añadieron frameworks.

| Comando / ubicación | Resultado |
|---|---|
| Frontend: `npm.cmd run lint` | Aprobado. |
| Frontend: `node_modules\.bin\tsc.cmd --noEmit -p tsconfig.app.json` | Aprobado. |
| Frontend: `node_modules\.bin\tsc.cmd --noEmit -p tsconfig.spec.json` | Aprobado. |
| Frontend: `npm.cmd test -- --watch=false --browsers=ChromeHeadlessCI` | **68 aprobadas / 28 fallidas**. |
| Frontend: mismo comando con los includes detallados abajo | **37/37 aprobadas**. |
| Backend canónico: `npm.cmd run lint` | Aprobado. |
| Backend canónico: `npm.cmd test` sin emuladores, ejecución intermedia | 48 aprobadas / 2 omitidas; después se añadió una prueba de autorización y se ejecutó todo en emuladores. |
| Backend canónico: `firebase.cmd emulators:exec --config ../firebase.emulators.json --project demo-autolog --only auth,functions,firestore,storage "npm test"` | **51/51 aprobadas, sin omisiones**. |

Comando reproducible de la selección del frontend:

```powershell
npm.cmd test -- --watch=false --browsers=ChromeHeadlessCI --include=src/app/phase-one.spec.ts --include=src/app/components/agregar-auto/*.spec.ts --include=src/app/components/editar-auto/*.spec.ts --include=src/app/components/agregar-usuario/*.spec.ts --include=src/app/components/editar-usuario/*.spec.ts --include=src/app/components/distribuidor/**/*.spec.ts --include=src/app/components/personal/**/*.spec.ts --include=src/app/components/menu/*.spec.ts --include=src/app/login/*.spec.ts --include=src/app/services/admVentas/distribuidores/*.spec.ts --include=src/app/usuarios/*.spec.ts --include=src/app/ventas/distribuidores/**/*.spec.ts --include=src/app/guards/*.spec.ts --include=src/app/reloj/*.spec.ts
```

Se usó Java 21 ya instalado en `C:\Program Files\Android\Android Studio\jbr` para los emuladores. El CLI usó Node 24 del host y avisó que Functions declara Node 22: el runtime exacto Node 22 no fue validado. Proyectos demo exclusivamente; syncGaslinkSales programada no se ejecutó, al no iniciar Pub/Sub. Sus pruebas unitarias de parsing/sincronización sí formaron parte del resultado.

Cobertura solicitada:

| Caso | Evidencia |
|---|---|
| Alta admin/capturista | Forms y creación callable real Auth+Firestore en emulador. |
| Administrativo no puede elegir empleado | Roles UI limitados, validador y rechazo backend. |
| Usuarios excluye distribuidores | Consulta explícita en servicio y consulta real en Firestore emulado con cuentas de ambos tipos. |
| Expediente conservado | Target, storage path, carga y estado de versión en pruebas de expediente. |
| VGBZ automático | Validación de entrada, callable y formato. |
| Dos altas concurrentes | Promise.all con transacciones reales en Firestore emulado; bootstrap de VGBZ-099 produce 0100/0101. |
| Identificador ineditable | FormControl deshabilitado y servicio llamado sin identificador. |
| Operador distribuidor activo | Filtro de activos, selectores de alta/edición y contrato ID/nombre. |
| Cuenta distribuidor false/true | Payload del componente y persistencia callable vinculada. |
| Guard bloquea distribuidor | AuthorizationService real con perfil simulado + autologAccessGuard; login dirige al reloj existente. |
| Sin entidad retirada | Escaneo de dependencias activas, TypeScript y builds. |

Fallos de la suite general: faltan proveedores Firestore/Auth/HttpClient/Storage en TestBed o se declaran componentes standalone dentro de declarations. Los archivos de estas pruebas no fueron alterados en esta fase; no se deshabilitaron ni ocultaron. No se ha ejecutado una reconstrucción del baseline completo para comparar la suite anterior.

- AutosPage should create FAILED
- ArticulosPage should create FAILED
- GeoLocationService should be created FAILED
- SorteosPage should create FAILED
- HoraService should be created FAILED
- ProductosPage should create FAILED
- StorageService should be created FAILED
- MonitoreogasmakeService should be created FAILED
- DetallesEventoUnidadComponent should create FAILED
- AgregarEventoComponent should create FAILED
- AuthService should be created FAILED
- FirebaseService should be created FAILED
- EditarEventoComponent should create FAILED
- AgregarArticuloComponent should create FAILED
- VentasBuenasService should be created FAILED
- EditarArticuloComponent should create FAILED
- VentasMalasService should be created FAILED
- IncidentesService should be created FAILED
- SorteoService should be created FAILED
- VentasService should be created FAILED
- ModalBuscarVentaComponent should create FAILED
- PruebaPage should create FAILED
- HistorialPage should create FAILED
- GenerarReporteComponent should create FAILED
- HomePage should create FAILED
- GenerarCodigosPage should create FAILED
- CilindrosService should be created FAILED
- PanelControlPage should create FAILED

Logs: [suite completa](<C:/Users/su_13/AppData/Local/Temp/autolog-phase1-full-tests.log>), [selección de fase 1](<C:/Users/su_13/AppData/Local/Temp/autolog-phase1-target-tests.log>).

## 13. Builds

| Comando | Resultado |
|---|---|
| `npm.cmd run build` en frontend | Aprobado; bundle inicial ~1.25 MB. Advertencias CommonJS existentes y selectores CSS Ionic no procesados por optimización; sin errores de compilación. |
| `npm.cmd run build` en Functions canónicas | Aprobado; también ejecutado por npm test dentro de los emuladores. |

No se ejecutaron builds/despliegues de Capacitor. No se abrió una sesión interactiva del frontend contra Firebase de producción para probar formularios.

## 14. Pendientes

1. **Suite general del frontend:** reparar las 28 configuraciones de pruebas enumeradas arriba. Esta limitación impide afirmar que todas las pruebas del proyecto pasan, aunque la selección de esta fase y ambos builds sí pasan.
2. **Activación futura coordinada:** createDistribuidor y las callables de usuarios están preparadas localmente, pero no desplegadas. Como hoy solo externalDeviceApi/syncGaslinkSales están desplegadas, el frontend nuevo no puede usar estas altas en producción hasta una fase autorizada de despliegue. Deben revisarse/publicarse conjuntamente reglas e índices: el contador requiere que no queden escritores directos alternativos de distribuidores ni escrituras manuales a su secuencia.
3. **Datos legacy administrativos:** la consulta estricta deja fuera documentos que no cumplen los indicadores explícitos. No se hizo inventario de producción ni backfill; debe revisarse antes de activar el listado nuevo.
4. **Runtime:** validar con Node 22 antes de un despliegue; aquí el emulador ejecutó Node 24. No se instaló otra versión.
5. **Expedientes:** se conservan los límites de concurrencia/versionado existentes según el alcance. La consulta global collectionGroup de cobertura y sus permisos/índices previos no se rediseñaron ni se certificaron contra producción.

## 15. NO DESPLEGADO

**No hubo ningún deploy** de Functions, Hosting, Firestore Rules, Storage Rules ni índices. No se ejecutaron migraciones, renumeraciones ni modificaciones a datos de Firebase de producción. Solo se escribieron datos efímeros de prueba en emuladores demo y archivos locales autorizados.
