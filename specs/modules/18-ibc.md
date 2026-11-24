# Modulo 18: Control IBC (MVP)

## Alcance confirmado

Categoria propia `Control IBC`, entre Operacion y Catalogos, con badge PrimeNG `NUEVO` alineado al extremo derecho del encabezado. Reune Servicios IBC, Envases IBC, Quimicos y Reportes y seguimiento. Acceso interno por permisos; Cliente no recibe permisos IBC.

Angular standalone, Sakai, PrimeNG y Tailwind. Implementacion aislada en `src/app/pages/ibc`. Rutas protegidas `/ibc/services`, `/ibc/services/:id`, `/ibc/containers`, `/ibc/containers/:id`, `/ibc/chemicals`. Formularios reactivos; alta/edicion/detalle de catalogos mediante dialogos. Listados paginados, filtrados y ordenados en servidor.

## Datos y contratos

- `ibc_containers`: UUID, codigo interno unico generado, numero original no unico, notas y estado activo/inactivo. La identidad fisica no se deduce automaticamente del numero de Excel.
- `ibc_chemicals`: nombre, descripcion, activo/inactivo.
- `ibc_service_cycles`: envase, empresa solicitante y quimico del ingreso, nombres historicos, fecha, GRE, OC, notas, estado y entrega. Un solo ciclo abierto por envase. Empresa receptora por ciclo; no representa propiedad permanente.
- `ibc_service_events`: eventos inmutables y estructurados con actor, fecha del hecho, fecha del registro, resultado de prueba y estado resultante. Reparaciones y liberaciones se conservan junto a las pruebas fallidas.
- `ibc_documents`: metadata de PDF/PNG/JPEG/WebP, maximo 20 MiB, bucket privado `ibc-documents`. Adjuntos por servicio; sin reemplazo de archivos historicos.

Listados: `first`, `rows`, `sortField`, `sortOrder`, filtros; resultado filas + total exacto. Filtros de servicios: texto (numero/codigo/quimico/empresa/GRE/OC), empresa, quimico, estado y fechas de ingreso. Orden estable con UUID como desempate. Exportacion CSV paginada completa con metadata en `report_exports`, sin limite silencioso de filas y con proteccion contra formulas de hoja de calculo.

RPC `ibc_receive`: crea un ingreso individual (y opcionalmente su envase) y el evento de recepcion en una transaccion. Los eventos se insertan en `ibc_service_events`; un trigger privado aplica el flujo bajo bloqueo de fila, comprueba identidad activa y permiso especifico. No hay permisos directos para cambiar estados, entrega o conteos. No se borran ciclos ni eventos desde el cliente.

## Flujo

Recibido -> lavado -> pendiente de prueba -> prueba aprobada -> listo para entrega -> entregado.

Prueba con fuga -> retenido -> reparacion -> nueva prueba -> liberacion explicita si aprobada -> listo para entrega. Reparar no libera, una nueva fuga conserva retencion y no se puede entregar con retencion. La prueba debe ser posterior al ultimo lavado/reparacion. Las fechas no pueden preceder el ingreso ni el ultimo evento ni ser futuras. Actor del registro obtenido de Auth. Cada lavado terminado cuenta una vez. El historico de rotacion importado no se suma al conteo verificado.

Edicion de referencias/observaciones y correcciones de datos de ingreso auditadas; ciclos entregados cerrados. Correcciones operativas se documentan mediante un nuevo evento de observacion, sin modificar eventos anteriores.

Permisos `ibc.view/create/update/wash/test/repair/release/deliver/documents/export` y `ibc_chemicals.view/create/update`. Administrador y Gerente reciben los permisos; logs tecnicos solo Administrador. RLS en todas las tablas y Storage. Funciones API invoker; definers privados solo para los triggers de transiciones y auditoria, sin ejecucion directa para clientes. `private.ibc_audit_changes()` registra en `audit_logs` sin depender de `public.audit_table_changes()`; esta ultima existe en el SQL base local pero se verifico ausente en el proyecto remoto.

## Reportes y seguimiento

Ruta `/ibc/reports`, permiso `ibc.view`; exportacion con `ibc.export`. Utiliza las vistas y politicas existentes, sin migraciones ni nuevos permisos.

Separacion por proposito: Servicios IBC concentra la operacion individual (registro, bandeja, busqueda y acciones), mientras Reportes concentra el analisis agregado y la exportacion. No hay tarjetas de indicadores ni exportacion en Servicios; no hay tabla de servicios individuales ni instrucciones operativas repetidas en Reportes.

Reportes: filtros analiticos por empresa, quimico y fechas de ingreso (dia de Lima inclusive). Periodo inicial sin limite para incluir historicos. Indicadores de total de servicios, abiertos, retenidos y entregados; distribucion por los cinco estados con conteos exactos del servidor y porcentajes sobre ese mismo conjunto. No son cantidades de envases unicos ni entregas ocurridas durante el periodo: el periodo selecciona los ingresos. Exporta todos los servicios del conjunto filtrado, con metadata existente.

Cada estado del grafico enlaza a Servicios IBC conservando empresa, quimico y periodo aplicados, y agregando el estado elegido mediante query params. La bandeja de Servicios es el unico listado individual y tambien muestra los dias completos en servicio (duracion fija para entregados). Por defecto abre pendientes y prioriza el ingreso mas antiguo; puede incluir entregados o todos mediante filtro. Paginado, filtros y ordenamiento en servidor. No se inventan plazos SLA ni se califican servicios como atrasados.

La exportacion y los enlaces de Reportes usan los filtros aplicados, no cambios sin confirmar en el formulario. Estados de carga, vacio y error; solicitudes antiguas no reemplazan resultados mas recientes. La bandeja recibe cambios en los query params y restablece el paginado.

## Datos de demostracion

Seed separado y optativo `supabase/ibc-demo.sql`: ocho numeros de la captura (936, 180, 531, 14, 278, 26, 972, 976), quimicos, GRE y fechas legibles. Empresa ficticia identificada como demo. Colores no interpretados. Todos los eventos agregados se marcan como simulados. No es migracion de datos operativos. No incluye importador ni conexion a Drive.

## Pendiente de validación

Unicidad real del numero, significado de Columna 1, colores, rotacion y la expresion «enlace ibc». Flujo de reparacion/nueva prueba/liberacion elegido para el MVP y sujeto a contraste con la empresa antes del uso operativo. No se inventan parametros tecnicos de hermeticidad.

## Aceptacion

Verificar ciclo sin fuga, fuga/reparacion/nueva prueba/liberacion, reingreso, historial, conteos, concurrencia, bloqueo de transiciones directas, RLS sin sesion/Cliente, Storage privado, filtros/paginado/orden y exportacion completa. Build y lint obligatorios. Migracion aditiva sin modificar certificados.
