# Arquitectura multiplanta de AUTOLOG

## Principios

AUTOLOG separa el rol (qué puede hacer una cuenta) del alcance (sobre qué planta puede hacerlo). Las colecciones continúan en la raíz de Firestore; no existen subcolecciones operativas bajo `plantas`.

El identificador de relación siempre es el ID del documento `plantas/{plantaId}`, nunca el nombre, la ruta ni la zona. No existe una planta ficticia `GLOBAL`: un documento histórico sin `plantaId` permanece **sin clasificar**.

## Roles y alcance

- `admin`: acceso global, administración de usuarios y del catálogo de plantas.
- `capturista`: conserva el acceso operativo global legacy. Puede elegir una planta de trabajo o usar la vista agregada.
- `planta`: AUTOLOG habilitado, una planta principal de lectura/escritura y cero o más plantas adicionales de solo lectura.
- `empleado`: cuenta laboral de distribuidor para ASISTIA; no obtiene acceso general a AUTOLOG.

Los perfiles legacy `admin` y `capturista` sin campos de alcance se normalizan como globales. Un perfil `planta` es válido únicamente con `tipoPersonal=SISTEMA`, `accesoAutolog=true`, `accesoAsistencia=false`, `plantaIdPrincipal` y `accesoTodasPlantas=false`.

## Modelos

`plantas/{id}` es un catálogo maestro con `nombre`, `clave`, `descripcion`, `activo`, `createdAt`, `createdByUid`, `updatedAt` y `updatedByUid`.

El alcance de `usuarios/{uid}` usa:

- `plantaIdPrincipal`: planta editable por el rol `planta`.
- `plantasLectura`: IDs adicionales consultables, nunca editables.
- `accesoTodasPlantas`: verdadero para el alcance global de admin/capturista y falso para planta.

Los nuevos `autos` y `eventos` almacenan `plantaId`. El auto también conserva `operadorId`; el distribuidor referenciado debe tener el mismo `plantaIdPrincipal`. El evento copia la planta del auto dentro de la transacción de alta, por lo que su clasificación histórica no depende de relaciones futuras.

Los distribuidores usan `plantaIdPrincipal` como adscripción operativa explícita. Su cuenta `empleado/DISTRIBUIDOR` sigue siendo una identidad separada.

## Contexto frontend

`PlantScopeService` obtiene el perfil autenticado directamente de `usuarios/{uid}`. `localStorage` solo recuerda la selección visual; la selección se vuelve a validar contra el perfil real.

Admin y capturista pueden seleccionar “Todas las plantas” para consultas agregadas. Cuando una escritura requiere planta y no existe contexto concreto, el formulario exige una planta destino. El rol planta no puede seleccionar el contexto global: inicia en su principal y puede cambiar a una adicional marcada como solo lectura.

Las consultas de `autos`, `eventos` y `distribuidores` usan `where(plantaId == contexto)` cuando existe una planta activa. Un rol planta nunca carga la colección completa. El panel de servicios, sus gráficas y la exportación operan sobre los datos del contexto y los filtros aplicados.

## Reglas de seguridad

Firestore resuelve el perfil por UID y aplica:

- lectura global para admin/capturista;
- lectura para planta en principal o `plantasLectura`;
- escritura para planta solo en `plantaIdPrincipal`;
- `plantaId` inmutable en actualizaciones ordinarias;
- coherencia `auto.plantaId == distribuidor.plantaIdPrincipal`;
- coherencia `evento.plantaId == auto.plantaId`;
- documentos sin `plantaId` no son legibles por un usuario planta;
- usuarios, plantas, expedientes e infraestructura ASISTIA conservan restricciones específicas.

El wildcard de compatibilidad no incluye al rol planta y excluye las colecciones con reglas explícitas, para evitar que una regla general anule sus validaciones.

Las callables de usuario validan el alcance, verifican que las plantas asignadas existan y estén activas, y solo pueden ser usadas por admin. `createDistribuidor` permite admin o planta: para planta ignora cualquier planta enviada y fuerza la principal del caller.

## Clasificación actual

### Multiplanta implementado

- `plantas`
- `usuarios` (alcance)
- `autos`
- `eventos`
- `distribuidores` (adscripción)
- panel y exportación de servicios
- colecciones legacy de ventas con `plantaId` confiable: `ventas_sms`, `venta_dia_sms`, `venta_dia_sospechosa_sms`, `venta_sospechosa`, `asignacion_diaria`

### Global

- `articulos` (catálogo, sin inventario local en esta fase)
- precios por zona y configuración global para roles globales

### Bloqueado temporalmente para planta

- panel de dispositivos/expendio
- dashboard administrativo ASISTIA
- productos, QR, historial y paneles comerciales cuya semántica no permite aislamiento fiable
- configuración y herramientas globales

El bloqueo existe en routing/capacidades y en la ausencia del rol planta en el wildcard de Rules; no depende solo del menú.

### Pendiente de mapeo

- GasLink → planta: el importador no infiere planta por texto. Las ventas sin mapeo quedan sin clasificar y solo los roles globales las leen. Las actualizaciones con `merge` preservan un `plantaId` ya asignado.
- IMEI → planta: hasta contar con una relación canónica, la API de dispositivos acepta únicamente admin/capturista activos con AUTOLOG; planta queda denegado para impedir `/devices` global.
- ASISTIA administrativa → planta: falta comprobar una asociación completa punto/distribuidor/planta antes de habilitar el dashboard a planta.
- QR/productos y precios/zona: no se asume que zona, ruta o nombre equivalgan a planta.

## Datos históricos y transferencia

No se ejecutó backfill. Admin/capturista conservan visibilidad sobre documentos legacy sin `plantaId`; planta no los recibe. La asignación histórica deberá hacerse con un proceso previo de diagnóstico, evidencia de fuente y revisión de ambigüedades.

`plantaId` de una unidad no se expone como edición ordinaria. La transferencia administrativa queda pendiente hasta contar con un registro de transferencias; cuando exista, no deberá modificar eventos históricos.

## Publicación futura

Antes de desplegar se deben crear las plantas reales, asignar usuarios, definir y revisar un backfill, configurar mappings GasLink/IMEI, comprobar índices con las consultas finales, ejecutar los emuladores y pruebas smoke, y recién entonces publicar Rules, Functions y frontend en un orden coordinado.
