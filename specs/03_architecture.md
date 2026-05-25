# Arquitectura tecnica

## Tipo de aplicacion

Angular 21 SPA sin SSR.

El frontend ya esta basado en Sakai NG, template gratuito de PrimeFaces:

https://github.com/primefaces/sakai-ng

Sakai NG debe conservarse como base real de la aplicacion. El trabajo de negocio debe adaptar esa estructura, no reemplazarla.

## Capas

### Presentacion

Tecnologias:

- Angular 21.
- PrimeNG.
- Sakai NG.
- TailwindCSS.

Responsabilidades:

- conservar y adaptar layout, login, sidebar, topbar y estilos base de Sakai NG,
- crear pantallas de negocio con componentes PrimeNG,
- usar TailwindCSS para spacing, grids y ajustes responsive,
- mostrar u ocultar acciones segun permisos,
- mantener experiencia consistente con el template.

### Aplicacion frontend

Responsabilidades:

- guards de autenticacion y permisos,
- servicios por dominio,
- modelos TypeScript,
- formularios reactivos,
- normalizacion de filtros de tabla,
- manejo centralizado de errores,
- integracion con Supabase JS Client.

### Datos

Tecnologias:

- Supabase PostgreSQL.
- RLS.
- Functions SQL cuando corresponda.
- Views para reportes.

Responsabilidades:

- persistencia,
- relaciones,
- constraints,
- indices,
- auditoria,
- autorizacion real mediante RLS.

### Archivos

Tecnologia:

- Supabase Storage.

Buckets definidos:

- `certificate-templates`,
- `generated-certificates`,
- `certificate-documents`.

Responsabilidades:

- almacenar plantillas PDF,
- almacenar PDFs generados,
- almacenar documentos adjuntos,
- aplicar politicas de acceso por bucket.

## Estructura Angular sugerida

La estructura final debe respetar primero la estructura real de Sakai NG y separar el negocio dentro de ella.

```text
src/app/
  layout/
    // layout original/adaptado de Sakai NG
  core/
    auth/
    guards/
    interceptors/
    services/
    supabase/
  shared/
    components/
    directives/
    models/
    pipes/
    utils/
  features/
    dashboard/
    profile/
    users/
    roles/
    companies/
    certificates/
    items/
    units/
    categories/
    item-types/
    basel-codes/
    certificate-generation-types/
    quantity-types/
    document-types/
    reports/
    audit-logs/
```

No se debe borrar el layout de Sakai NG para reemplazarlo por uno propio.

## Servicios sugeridos

- `AuthService`
- `ProfileService`
- `PermissionService`
- `UsersService`
- `RolesService`
- `CompaniesService`
- `ItemsService`
- `CatalogService`
- `CertificatesService`
- `ReportsService`
- `StorageService`
- `AuditService`

## Patron para tablas server-side

Todas las tablas administrativas deben trabajar con carga lazy.

El frontend debe enviar:

- `page`
- `pageSize`
- `sortField`
- `sortOrder`
- `filters`

Supabase debe resolver:

- `.range(from, to)`
- `.order(field, { ascending })`
- filtros por columnas permitidas,
- conteo total con `count: 'exact'`.

El contrato de filtros y ordenamiento por modulo se documenta en `/specs/07_api_contracts.md`.

## Contratos con Supabase

El frontend no debe inventar columnas. Debe usar el esquema definido en:

- `/supabase/schema.sql`

Si una spec de modulo menciona un campo pendiente que no existe en SQL, debe tratarse como `Pendiente de validación` antes de implementar.

## Integracion con Sakai NG

Se debe conservar:

- app layout,
- sidebar,
- topbar,
- menu responsive,
- configuracion visual,
- tema base,
- estructura de login,
- estilos globales.

Se debe adaptar:

- menu lateral por permisos,
- login a Supabase Auth,
- rutas protegidas,
- dashboard,
- paginas CRUD,
- perfil de usuario.

No se debe crear un layout desde cero si Sakai NG ya provee uno funcional.
