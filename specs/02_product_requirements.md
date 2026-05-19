# Requerimientos del producto

## Resumen

El sistema debe permitir administrar certificados de valorización de residuos y sus catálogos relacionados, con trazabilidad documental, control de permisos y acceso restringido por empresa para usuarios Cliente.

## Actores

### Administrador

Puede acceder a todos los módulos, gestionar usuarios, roles, catálogos, certificados, reportes, plantillas y logs.

### Gerente

Puede acceder a módulos operativos y reportes. No puede acceder a logs de auditoría.

### Cliente

Puede acceder solo a certificados asociados a sus empresas. Su alcance inicial es lectura y descarga de PDF, según permisos definidos en seed/RLS.

## Requerimientos funcionales generales

### Autenticación

- Iniciar sesión con email y contraseña mediante Supabase Auth.
- Cerrar sesión.
- Bloquear rutas internas sin sesión.
- Cargar perfil, roles, permisos y empresas asociadas al usuario autenticado.

### Dashboard

- Mostrar indicadores generales según permisos.
- Mostrar accesos rápidos solo a módulos permitidos.
- Evitar mostrar métricas no autorizadas a Cliente.

### Perfil

- Ver datos personales.
- Editar nombre y datos permitidos.
- Cambiar contraseña.
- Ver información básica de roles y empresas asociadas cuando aplique.

### Usuarios

- Listar usuarios con filtros, paginado y ordenamiento por servidor.
- Crear usuarios.
- Editar datos permitidos.
- Asignar uno o más roles mediante `user_roles`.
- Asociar usuarios Cliente con empresas mediante `user_companies`.
- Activar o inactivar usuarios.

### Roles y permisos

- Listar roles.
- Crear roles personalizados.
- Editar descripción, estado y permisos.
- Impedir eliminación de roles base.
- Agrupar permisos por módulo y acción.

### Empresas

- Gestionar empresas.
- Gestionar sucursales.
- Gestionar contactos.
- Asociar empresas a certificados como generadora, transportista o destino final.

### Ítems

- Gestionar ítems valorizables o residuos.
- Asociar ítems con unidad, categoría, tipo de ítem y código Basilea.

### Certificados

- Listar certificados con filtros por fechas, número, empresa, estado y tipo cuando aplique.
- Crear certificado.
- Editar certificado mientras su estado lo permita.
- Ver detalle.
- Asociar múltiples ítems.
- Adjuntar documentos.
- Emitir certificado.
- Generar PDF desde plantilla versionada.
- Descargar PDF generado.

### Reportes

- Consultar reporte de certificados.
- Filtrar por rango de fechas y campos disponibles.
- Exportar si el permiso `reports.export` está habilitado.

## Requerimientos no funcionales

- SPA sin SSR.
- Responsive.
- Consistencia visual con Sakai NG.
- Componentes funcionales PrimeNG.
- Ajustes de layout con TailwindCSS.
- Manejo de errores centralizado.
- Estados de carga.
- Confirmaciones en acciones críticas.
- Validación visible en formularios.
- Paginado por servidor.
- Ordenamiento por servidor.
- Filtros por servidor.
- RLS obligatorio para tablas sensibles.

## Pendientes de validación funcional

- Flujo exacto de anulación de certificados.
- Si el Cliente puede descargar documentos adjuntos además del PDF.
- Exportación exacta requerida para reportes: Excel, CSV o PDF.
- Campos obligatorios finales para cada tipo de generación de certificado.
- Reglas de numeración de certificado.
- Si un usuario puede tener más de una empresa asociada en operación real.
