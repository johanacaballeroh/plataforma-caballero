# Seguridad, RBAC y RLS

## Modelo de seguridad

La seguridad se compone de:

- Supabase Auth para identidad.
- `profiles` para datos públicos del usuario.
- `roles` y `user_roles` para asignación de roles.
- `permissions` y `role_permissions` para permisos granulares.
- `user_companies` para limitar datos de Cliente por empresa.
- RLS como validación definitiva.

## Roles base

### Administrador

- Acceso total.
- Puede ver logs.
- Puede administrar usuarios, roles, permisos, catálogos, certificados, reportes y plantillas.

### Gerente

- Acceso operativo completo.
- No puede ver logs.

### Cliente

- Acceso limitado a certificados propios.
- Puede ver certificados asociados a sus empresas mediante `user_companies`.
- Permisos iniciales esperados:
  - `certificates.view_own`
  - `certificates.print`

## Permisos

Formato:

```text
module_key.action_key
```

Ejemplos:

- `users.view`
- `users.create`
- `users.update`
- `roles.update`
- `certificates.view`
- `certificates.view_own`
- `certificates.issue`
- `certificates.print`
- `reports.export`
- `logs.view`

Los permisos iniciales se definen en `/supabase/seed.sql`.

## Funciones RLS relevantes

Definidas en `/supabase/rls-policies.sql`:

- `has_role(role_name text)`
- `has_permission(module_name text, action_name text)`
- `user_can_access_company(company_uuid uuid)`
- `user_can_access_certificate(cert_uuid uuid)`

## Reglas principales

### Usuarios y perfiles

- Un usuario puede ver su propio perfil.
- Usuarios con permiso `users.view` pueden ver otros perfiles.
- Un usuario solo puede editar su propio perfil mediante política específica.
- La gestión de roles y empresas asociadas requiere permisos de usuarios.

### Empresas

- Administrador y Gerente pueden ver empresas si tienen `companies.view`.
- Cliente solo accede a empresas asociadas por `user_companies`.
- Crear, editar o eliminar empresas requiere permisos `companies.create`, `companies.update` o `companies.delete`.

### Catálogos

- Lectura disponible para usuarios con permisos del catálogo o permisos de certificados.
- Gestión requiere permisos específicos por módulo.

### Certificados

- `certificates.view` permite ver todos los certificados.
- `certificates.view_own` permite ver certificados asociados a empresas del usuario.
- El acceso de Cliente se valida contra:
  - `generator_company_id`
  - `transporter_company_id`
  - `final_destination_company_id`
- Emitir o generar PDF requiere `certificates.issue`.
- Ver/descargar PDF se modela con `certificates.print`.

### Reportes

- Ver reportes requiere `reports.view`.
- Exportar reportes requiere `reports.export`.

### Logs

- Ver logs requiere `logs.view`.
- Solo Administrador debe recibir este permiso en seed.
- Los logs no deben editarse desde frontend.

## Storage

Buckets privados:

- `certificate-templates`
- `generated-certificates`
- `certificate-documents`

Reglas:

- Las plantillas requieren permisos `certificate_templates.*`.
- Los PDFs generados respetan acceso a certificados.
- Los documentos adjuntos respetan acceso a certificados.
- Las URLs deben manejarse como firmadas o privadas, no públicas.

## Validación frontend

El frontend debe:

- cargar permisos del usuario autenticado,
- filtrar menú lateral,
- proteger rutas con guards,
- ocultar acciones no permitidas,
- manejar respuestas de RLS como errores de autorización.

El frontend no debe:

- confiar en ocultar botones como seguridad real,
- usar `service_role`,
- saltarse RLS,
- asumir acceso por rol sin consultar permisos.
