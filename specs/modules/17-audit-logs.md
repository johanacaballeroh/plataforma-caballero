# Modulo 17: Logs de auditoria

## Proposito

Consultar eventos de auditoria registrados por cambios en tablas sensibles del sistema.

## Pantallas identificadas

- Listado de logs de auditoria.
- Filtros por accion, tabla, usuario, registro y rango de fechas.
- Vista detalle de cambios antes/despues.

## Campos desde `audit_logs`

- `id`
- `user_id`
- `action`
- `table_name`
- `record_id`
- `old_data`
- `new_data`
- `created_at`

## Reglas de negocio

- El modulo es solo lectura.
- Solo usuarios con `logs.view` pueden acceder.
- Los logs deben mostrar el usuario cuando exista perfil asociado.
- El detalle debe permitir comparar datos anteriores y posteriores.
- Los cambios se registran desde triggers de Supabase, no desde controles visuales del frontend.

## Tablas auditadas

Desde el esquema base:

- `roles`
- `role_permissions`
- `companies`
- `company_branches`
- `company_contacts`
- `units`
- `categories`
- `item_types`
- `basel_codes`
- `quantity_types`
- `document_types`
- `certificate_generation_types`
- `certificate_template_versions`
- `items`
- `certificates`
- `certificate_items`
- `certificate_documents`
- `certificate_files`

Desde migracion adicional:

- `profiles`
- `user_roles`
- `user_companies`
- `report_exports`

## Permiso requerido

- `logs.view`

## Criterios de aceptacion

- La pantalla usa paginado, filtros y ordenamiento por servidor.
- La ruta esta protegida con `logs.view`.
- El usuario no puede editar ni eliminar logs desde frontend.
- La vista detalle muestra diferencias por campo.
- Las acciones criticas de administracion quedan cubiertas por triggers.

## Pendiente de validacion

- Politica de retencion historica de logs.
- Exportacion de logs.
- Enmascaramiento de datos sensibles dentro de `old_data` y `new_data`.
