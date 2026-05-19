# Contratos de acceso a datos

## Alcance

El proyecto no tendrá backend Node propio. Los contratos de datos se implementan con Supabase JS Client sobre:

- tablas,
- vistas,
- Storage,
- funciones SQL si se agregan de forma explícita.

Este documento define el patrón esperado para la futura implementación frontend.

## Patrón de listado server-side

Entrada estándar:

- `page`: número de página base 1.
- `pageSize`: cantidad de filas.
- `sortField`: columna permitida.
- `sortOrder`: `asc` o `desc`.
- `filters`: objeto con filtros por campo.

Salida estándar:

- `data`: filas.
- `total`: total con filtros aplicados.
- `page`.
- `pageSize`.

Reglas:

- Validar `sortField` contra una lista permitida por módulo.
- No concatenar SQL desde frontend.
- Usar `.range(from, to)`.
- Usar `.order(sortField, { ascending })`.
- Usar `count: 'exact'` cuando se necesita total.

## Patrón CRUD

### Crear

- Validar formulario en frontend.
- Enviar solo columnas permitidas.
- RLS valida permiso real.
- Auditoría se registra por triggers donde aplica.

### Editar

- Cargar registro por `id`.
- Validar permisos.
- Enviar cambios mínimos.
- Mantener `updated_at` mediante triggers.

### Cambiar estado

- Preferir actualizar `status` sobre eliminación física cuando aplique.
- Confirmar la acción.
- Registrar auditoría.

### Detalle

- Cargar entidad principal.
- Cargar relaciones necesarias con consultas separadas o joins de Supabase cuando convenga.
- Respetar RLS en cada tabla relacionada.

## Contratos por dominio

### Usuarios

Tablas:

- `profiles`
- `user_roles`
- `roles`
- `user_companies`
- `companies`

Operaciones:

- listar perfiles,
- ver perfil,
- actualizar datos permitidos,
- asignar roles,
- asociar empresas.

Pendiente de validación:

- flujo exacto para crear usuarios desde frontend con Supabase Auth sin backend propio.

### Roles y permisos

Tablas:

- `roles`
- `permissions`
- `role_permissions`

Operaciones:

- listar roles,
- crear rol,
- editar rol,
- asignar permisos,
- cambiar estado.

Regla:

- No eliminar roles con `is_system_role = true`.

### Empresas

Tablas:

- `companies`
- `company_branches`
- `company_contacts`

Operaciones:

- CRUD de empresa,
- CRUD de sucursales,
- CRUD de contactos.

### Ítems y catálogos

Tablas:

- `items`
- `units`
- `categories`
- `item_types`
- `basel_codes`
- `quantity_types`
- `document_types`
- `certificate_generation_types`

Operaciones:

- CRUD server-side,
- consultas para selects activos,
- filtros por estado y texto.

### Certificados

Tablas:

- `certificates`
- `certificate_items`
- `certificate_documents`
- `certificate_files`
- `certificate_template_versions`

Operaciones:

- listar,
- crear,
- editar,
- ver detalle,
- administrar ítems,
- adjuntar documentos,
- emitir,
- registrar PDF generado.

### Reportes

Vista y tabla:

- `v_certificate_report`
- `report_exports`

Operaciones:

- consultar reporte de certificados,
- filtrar por rango de fechas,
- exportar si se confirma alcance.

## Storage

Buckets:

- `certificate-templates`
- `generated-certificates`
- `certificate-documents`

Reglas:

- No usar buckets públicos.
- Guardar metadata en tablas.
- Usar rutas organizadas por entidad y fecha cuando se implemente.
- Usar URLs firmadas para lectura cuando corresponda.

## Manejo de errores

El frontend debe normalizar:

- errores de validación,
- errores de autenticación,
- errores de autorización/RLS,
- errores de red,
- errores de Storage.

Cada error debe mostrarse con un mensaje comprensible para el usuario y registrar detalle técnico solo donde corresponda.
