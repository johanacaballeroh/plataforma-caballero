# Requerimientos del producto

## Resumen

El sistema debe permitir administrar certificados de valorizacion de residuos y sus catalogos relacionados, con trazabilidad documental, control de permisos y acceso restringido por empresa para usuarios Cliente.

## Actores

### Administrador

Puede acceder a todos los modulos, gestionar usuarios, roles, catalogos, certificados, reportes, plantillas y logs.

### Gerente

Puede acceder a modulos operativos y reportes. No puede acceder a logs de auditoria.

### Cliente

Puede acceder solo a certificados asociados a sus empresas. Su alcance inicial es lectura y descarga de PDF, segun permisos definidos en seed/RLS.

## Requerimientos funcionales generales

### Autenticacion

- Iniciar sesion con email y contrasena mediante Supabase Auth.
- Cerrar sesion.
- Bloquear rutas internas sin sesion.
- Cargar perfil, roles, permisos y empresas asociadas al usuario autenticado.
- Adaptar la pantalla de login existente de Sakai NG.

### Dashboard

- Mostrar indicadores generales segun permisos.
- Mostrar accesos rapidos solo a modulos permitidos.
- Evitar mostrar metricas no autorizadas a Cliente.
- Usar la estructura visual y componentes existentes de Sakai NG como base.

### Perfil

- Ver datos personales.
- Editar nombre, telefono y avatar cuando aplique.
- Cambiar contrasena.
- Ver roles y empresas asociadas en modo lectura.

### Usuarios

- Listar usuarios con filtros, paginado y ordenamiento por servidor.
- Crear usuarios usando Supabase Auth y `profiles`.
- Editar datos permitidos.
- Asignar uno o mas roles mediante `user_roles`.
- Asociar usuarios Cliente con empresas mediante `user_companies`.
- Activar o inactivar usuarios.

### Roles y permisos

- Listar roles.
- Crear roles personalizados.
- Editar descripcion, estado y permisos.
- Impedir eliminacion de roles base.
- Agrupar permisos por modulo y accion.

### Empresas

- Gestionar empresas.
- Gestionar sedes/sucursales.
- Gestionar contactos.
- Asociar empresas a certificados como generadora, transportista o destino final.

### Items

- Gestionar items valorizables o residuos.
- Asociar items con unidad, categoria, tipo de item y codigo Basilea.

### Certificados

- Listar certificados con filtros por fechas, numero, empresa, estado y tipo cuando aplique.
- Crear certificado.
- Editar certificado mientras su estado lo permita.
- Ver detalle.
- Asociar multiples items.
- Adjuntar documentos.
- Emitir certificado.
- Generar PDF desde plantilla versionada.
- Descargar PDF generado.

### Reportes

- Consultar reporte de certificados.
- Filtrar por rango de fechas y campos disponibles.
- Exportar si el permiso `reports.export` esta habilitado.
- Registrar metadata de exportacion en `report_exports`.

### Logs

- Mostrar logs de auditoria en modo solo lectura para Administrador.
- No permitir edicion ni eliminacion desde frontend.

## Requerimientos no funcionales

- SPA sin SSR.
- Responsive.
- Consistencia visual con Sakai NG.
- Componentes funcionales PrimeNG.
- Ajustes de layout con TailwindCSS.
- Manejo de errores centralizado.
- Estados de carga.
- Confirmaciones en acciones criticas.
- Validacion visible en formularios.
- Paginado por servidor.
- Ordenamiento por servidor.
- Filtros por servidor.
- RLS obligatorio para tablas sensibles.

## Pendientes de validacion funcional

- Flujo exacto de anulacion de certificados.
- Si el Cliente puede descargar documentos adjuntos ademas del PDF.
- Exportacion exacta requerida para reportes: Excel, CSV o PDF.
- Campos obligatorios finales por tipo de generacion de certificado.
- Reglas de numeracion de certificado.
- Si un usuario Cliente puede tener mas de una empresa asociada en operacion real.
