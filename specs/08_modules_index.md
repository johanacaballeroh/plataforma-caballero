# Indice de modulos

## Modulos funcionales

| Orden | Modulo | Spec | Permiso base |
| --- | --- | --- | --- |
| 01 | Login | `/specs/modules/01-login.md` | Sesion Supabase |
| 02 | Dashboard | `/specs/modules/02-dashboard.md` | `dashboard.view` |
| 03 | Perfil | `/specs/modules/03-profile.md` | Usuario autenticado |
| 04 | Usuarios | `/specs/modules/04-users.md` | `users.view` |
| 05 | Roles y permisos | `/specs/modules/05-roles-permissions.md` | `roles.view` |
| 06 | Reportes | `/specs/modules/06-reports.md` | `reports.view` |
| 07 | Certificados | `/specs/modules/07-certificates.md` | `certificates.view` / `certificates.view_own` |
| 08 | Empresas | `/specs/modules/08-companies.md` | `companies.view` |
| 09 | Items | `/specs/modules/09-items.md` | `items.view` |
| 10 | Unidades | `/specs/modules/10-units.md` | `units.view` |
| 11 | Categorias | `/specs/modules/11-categories.md` | `categories.view` |
| 12 | Tipos de items | `/specs/modules/12-item-types.md` | `item_types.view` |
| 13 | Codigos Basilea | `/specs/modules/13-basel-codes.md` | `basel_codes.view` |
| 14 | Tipos de generacion de certificado | `/specs/modules/14-certificate-generation-types.md` | `certificate_generation_types.view` |
| 15 | Tipos de cantidad | `/specs/modules/15-quantity-types.md` | `quantity_types.view` |
| 16 | Tipos de documentos | `/specs/modules/16-document-types.md` | `document_types.view` |

## Modulos transversales

### Layout

Proviene de Sakai NG. No es modulo de negocio.

### Logs

No tiene spec de modulo separada en la lista original, pero debe existir como entrada operativa para Administrador usando:

- `audit_logs`
- permiso `logs.view`

Puede implementarse dentro de `reports` o como feature `audit-logs` si se decide ampliar el indice.

## Dependencias funcionales

- Certificados depende de empresas, items, tipos de generacion, tipos de cantidad, tipos de documentos y plantillas.
- Items depende de unidades, categorias, tipos de items y codigos Basilea.
- Usuarios depende de roles, permisos y empresas.
- Reportes depende de certificados y vista `v_certificate_report`.

## Regla de implementacion

Antes de implementar un modulo:

1. Leer `/specs/00_project_context.md`.
2. Leer la spec especifica del modulo.
3. Revisar `/specs/04_database_supabase.md`.
4. Revisar `/specs/05_security_rbac_rls.md`.
5. Confirmar que los campos existan en SQL o esten marcados como `Pendiente de validación`.
