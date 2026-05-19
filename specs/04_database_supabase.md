# Base de datos Supabase

## Fuente oficial del esquema

El esquema real está en:

- `/supabase/schema.sql`

Archivos relacionados:

- `/supabase/rls-policies.sql`
- `/supabase/storage-policies.sql`
- `/supabase/seed.sql`

Este documento resume el contrato de datos para implementación frontend. Si hay conflicto, prevalece el SQL real.

## Convenciones

- Tablas en `snake_case`.
- Primary keys UUID con `gen_random_uuid()`, salvo `profiles.id` que referencia `auth.users(id)`.
- Fechas estándar:
  - `created_at`
  - `updated_at`
- Estados comunes:
  - `active`
  - `inactive`
- Estados de certificados:
  - `draft`
  - `issued`
  - `cancelled`
  - `inactive`
- No guardar PDFs ni documentos como base64.
- Almacenar archivos en Supabase Storage y guardar metadata en tablas.

## Seguridad y usuarios

### `profiles`

Extiende Supabase Auth.

Campos principales:

- `id`
- `full_name`
- `email`
- `phone`
- `avatar_url`
- `status`
- `created_at`
- `updated_at`

Notas:

- No tiene `role_id`.
- La asignación de roles se realiza mediante `user_roles`.
- La asociación con empresas se realiza mediante `user_companies`.

### `roles`

Campos principales:

- `id`
- `name`
- `description`
- `is_system_role`
- `status`
- `created_at`
- `updated_at`

Roles base:

- Administrador.
- Gerente.
- Cliente.

### `permissions`

Campos principales:

- `id`
- `module_key`
- `action_key`
- `description`
- `created_at`

La combinación `module_key` + `action_key` debe ser única.

### `user_roles`

Relación muchos a muchos entre usuarios y roles.

Campos:

- `user_id`
- `role_id`
- `created_at`

### `role_permissions`

Relación muchos a muchos entre roles y permisos.

Campos:

- `role_id`
- `permission_id`
- `created_at`

### `user_companies`

Relación entre usuarios y empresas, especialmente para rol Cliente.

Campos:

- `user_id`
- `company_id`
- `created_at`

## Empresas

### `companies`

Campos principales:

- `id`
- `company_type`
- `ruc`
- `business_name`
- `trade_name`
- `fiscal_address`
- `status`
- `created_at`
- `updated_at`

Valores de `company_type`:

- `generator`
- `transporter`
- `final_destination`
- `both`

### `company_branches`

Campos principales:

- `id`
- `company_id`
- `branch_type`
- `name`
- `address`
- `status`
- `created_at`
- `updated_at`

Valores de `branch_type`:

- `deposit`
- `fiscal_address`
- `office`
- `branch`

### `company_contacts`

Campos principales:

- `id`
- `company_id`
- `full_name`
- `position`
- `email`
- `phone`
- `status`
- `created_at`
- `updated_at`

## Catálogos

### `units`

- `id`
- `code`
- `name`
- `abbreviation`
- `status`
- `created_at`
- `updated_at`

### `categories`

- `id`
- `name`
- `description`
- `status`
- `created_at`
- `updated_at`

### `item_types`

- `id`
- `name`
- `status`
- `created_at`
- `updated_at`

### `basel_codes`

- `id`
- `code`
- `description`
- `status`
- `created_at`
- `updated_at`

### `quantity_types`

- `id`
- `name`
- `show_value`
- `status`
- `created_at`
- `updated_at`

### `document_types`

- `id`
- `name`
- `status`
- `created_at`
- `updated_at`

### `certificate_generation_types`

- `id`
- `name`
- `description`
- `show_final_destination_company`
- `show_destination_place`
- `status`
- `created_at`
- `updated_at`

Nota:

- No existe `show_value` en el esquema actual para esta tabla.
- Si el formulario antiguo requiere controlar valor/cantidad por tipo de generación, queda `Pendiente de validación`.

## Ítems

### `items`

Campos principales:

- `id`
- `code`
- `name`
- `description`
- `unit_id`
- `category_id`
- `item_type_id`
- `basel_code_id`
- `status`
- `created_at`
- `updated_at`

Relaciones:

- `unit_id` -> `units.id`
- `category_id` -> `categories.id`
- `item_type_id` -> `item_types.id`
- `basel_code_id` -> `basel_codes.id`

## Certificados

### `certificates`

Campos principales:

- `id`
- `certificate_number`
- `generation_type_id`
- `template_version_id`
- `issue_date`
- `service_date`
- `plate`
- `generation_source`
- `arrival_address`
- `generator_company_id`
- `transporter_company_id`
- `final_destination_company_id`
- `destination_place`
- `observations`
- `status`
- `issued_at`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

Relaciones:

- `generation_type_id` -> `certificate_generation_types.id`
- `template_version_id` -> `certificate_template_versions.id`
- `generator_company_id` -> `companies.id`
- `transporter_company_id` -> `companies.id`
- `final_destination_company_id` -> `companies.id`

Pendiente de validación:

- Si se requiere `start_date` y `end_date`, no existen en el esquema actual.
- Si se requiere `origin_place`, no existe en el esquema actual; podría estar representado por `generation_source` o `arrival_address`, pero debe validarse.

### `certificate_items`

Campos principales:

- `id`
- `certificate_id`
- `item_id`
- `quantity_type_id`
- `quantity`
- `weight`
- `price`
- `description`
- `sort_order`
- `created_at`
- `updated_at`

### `certificate_documents`

Metadata de documentos adjuntos.

Campos principales:

- `id`
- `certificate_id`
- `document_type_id`
- `file_name`
- `storage_bucket`
- `storage_path`
- `mime_type`
- `size_bytes`
- `uploaded_by`
- `created_at`

### `certificate_files`

Metadata de PDFs generados.

Campos principales:

- `id`
- `certificate_id`
- `template_version_id`
- `file_name`
- `storage_bucket`
- `storage_path`
- `version_number`
- `is_current`
- `generated_by`
- `generated_at`

### `certificate_template_versions`

Versionado de plantillas PDF.

Campos principales:

- `id`
- `certificate_generation_type_id`
- `version_number`
- `name`
- `storage_bucket`
- `storage_path`
- `uploaded_by`
- `active_from`
- `active_to`
- `is_active`
- `is_locked`
- `created_at`

## Reportes y auditoría

### `v_certificate_report`

Vista para reporte de certificados.

Campos expuestos:

- `fecha`
- `numero_ticket`
- `cliente`
- `ruc`
- `placa`
- `fuente_generacion`
- `direccion_llegada`
- `tipo`
- `cantidad`
- `unidad_medida`
- `peso`
- `codigo_basilea`
- `estado_certificado`
- `generator_company_id`

### `report_exports`

Registra exportaciones de reportes.

Campos principales:

- `id`
- `report_type`
- `filters`
- `file_name`
- `storage_bucket`
- `storage_path`
- `generated_by`
- `generated_at`

### `audit_logs`

Campos principales:

- `id`
- `user_id`
- `action`
- `table_name`
- `record_id`
- `old_data`
- `new_data`
- `created_at`

## Regla para implementación futura

Antes de implementar cualquier módulo de datos, revisar:

1. `/supabase/schema.sql`
2. `/specs/04_database_supabase.md`
3. `/specs/05_security_rbac_rls.md`
4. `/specs/modules/[modulo].md`

No inventar tablas ni columnas desde Angular.
