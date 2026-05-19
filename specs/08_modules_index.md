# Índice de módulos

## Propósito

Este índice organiza las especificaciones funcionales por módulo para implementación futura.

Cada módulo debe respetar:

- Sakai NG como fuente visual,
- capturas como fuente funcional,
- Supabase como backend,
- RLS como seguridad real,
- paginado, ordenamiento y filtros por servidor en listados.

## Módulos

| Nº | Módulo | Spec | Ruta sugerida | Tablas principales |
| --- | --- | --- | --- | --- |
| 01 | Login | `/specs/modules/01-login.md` | `/login` | `auth.users`, `profiles` |
| 02 | Dashboard | `/specs/modules/02-dashboard.md` | `/dashboard` | varias |
| 03 | Perfil | `/specs/modules/03-profile.md` | `/profile` | `profiles`, `user_roles`, `user_companies` |
| 04 | Usuarios | `/specs/modules/04-users.md` | `/users` | `profiles`, `user_roles`, `user_companies` |
| 05 | Roles y permisos | `/specs/modules/05-roles-permissions.md` | `/roles` | `roles`, `permissions`, `role_permissions` |
| 06 | Reportes | `/specs/modules/06-reports.md` | `/reports` | `v_certificate_report`, `report_exports` |
| 07 | Certificados | `/specs/modules/07-certificates.md` | `/certificates` | `certificates`, `certificate_items`, `certificate_files` |
| 08 | Empresas | `/specs/modules/08-companies.md` | `/companies` | `companies`, `company_branches`, `company_contacts` |
| 09 | Ítems | `/specs/modules/09-items.md` | `/items` | `items` |
| 10 | Unidades | `/specs/modules/10-units.md` | `/units` | `units` |
| 11 | Categorías | `/specs/modules/11-categories.md` | `/categories` | `categories` |
| 12 | Tipos de ítems | `/specs/modules/12-item-types.md` | `/item-types` | `item_types` |
| 13 | Códigos Basilea | `/specs/modules/13-basel-codes.md` | `/basel-codes` | `basel_codes` |
| 14 | Tipos de generación de certificado | `/specs/modules/14-certificate-generation-types.md` | `/certificate-generation-types` | `certificate_generation_types` |
| 15 | Tipos de cantidad | `/specs/modules/15-quantity-types.md` | `/quantity-types` | `quantity_types` |
| 16 | Tipos de documentos | `/specs/modules/16-document-types.md` | `/document-types` | `document_types` |

## Módulos de soporte

El menú puede incluir Logs para Administrador, aunque no tiene spec individual en esta tanda.

Tablas:

- `audit_logs`

Permiso:

- `logs.view`

## Reglas comunes de módulos CRUD

Todo CRUD debe incluir:

- listado,
- filtros por servidor,
- paginado por servidor,
- ordenamiento por servidor,
- creación,
- edición,
- detalle,
- cambio de estado cuando aplique,
- validaciones frontend,
- validación real por RLS,
- auditoría cuando la tabla tenga trigger.

## Regla de incertidumbre

Si una spec menciona `Pendiente de validación`, no se debe implementar la suposición sin confirmar el dato funcional o actualizar el SDD.
