# Arquitectura técnica

## Tipo de aplicación

Angular 21 SPA sin SSR.

El frontend debe construirse a partir de Sakai NG, template gratuito de PrimeFaces:

https://github.com/primefaces/sakai-ng

Sakai NG debe ser el punto de partida del workspace frontend. No debe tratarse como una dependencia instalable encima de un proyecto Angular vacío.

Flujo correcto:

1. Clonar/copiar Sakai NG.
2. Mantener su configuración Angular, PrimeNG, TailwindCSS, layout y login.
3. Adaptar el template al dominio del backoffice.
4. Incorporar el SDD y los scripts Supabase del proyecto.
5. Implementar features de negocio dentro de una arquitectura modular.

## Capas

### Presentación

Tecnologías:

- Angular 21.
- PrimeNG.
- Sakai NG.
- TailwindCSS.

Responsabilidades:

- conservar y adaptar layout, login, sidebar, topbar y estilos base de Sakai NG,
- crear pantallas de negocio con componentes PrimeNG,
- usar TailwindCSS para spacing, grids y ajustes responsive,
- mostrar u ocultar acciones según permisos,
- mantener experiencia consistente.

### Aplicación frontend

Responsabilidades:

- guards de autenticación y permisos,
- servicios por dominio,
- modelos TypeScript,
- formularios reactivos,
- normalización de filtros de tabla,
- manejo centralizado de errores,
- integración con Supabase JS Client.

### Datos

Tecnologías:

- Supabase PostgreSQL.
- RLS.
- Functions SQL cuando corresponda.
- Views para reportes.

Responsabilidades:

- persistencia,
- relaciones,
- constraints,
- índices,
- auditoría,
- autorización real mediante RLS.

### Archivos

Tecnología:

- Supabase Storage.

Buckets definidos:

- `certificate-templates`,
- `generated-certificates`,
- `certificate-documents`.

Responsabilidades:

- almacenar plantillas PDF,
- almacenar PDFs generados,
- almacenar documentos adjuntos,
- aplicar políticas de acceso por bucket.

## Estructura Angular sugerida

La estructura final debe respetar primero la estructura real de Sakai NG y separar el negocio dentro de ella.

Si Sakai NG ya usa carpetas como `src/app/layout`, `src/app/pages`, `src/app/pages/auth` o rutas propias, esas carpetas se conservan y se adaptan. La estructura de negocio puede ubicarse en `features` o en la convención equivalente que mejor encaje con el template, siempre que quede separada de demos y layout.

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

## Patrón para tablas server-side

Todas las tablas administrativas deben trabajar con carga lazy.

El frontend debe enviar:

- `page`,
- `pageSize`,
- `sortField`,
- `sortOrder`,
- `filters`.

Supabase debe resolver:

- `.range(from, to)`,
- `.order(field, { ascending })`,
- filtros,
- conteo total con `count: 'exact'`.

## Contratos con Supabase

El frontend no debe inventar columnas. Debe usar el esquema definido en:

- `/supabase/schema.sql`

Si una spec de módulo menciona un campo pendiente que no existe en el SQL, debe tratarse como `Pendiente de validación` antes de implementar.

## Integración con Sakai NG

Como Sakai NG es la base inicial, se debe conservar:

- app layout,
- sidebar,
- topbar,
- menú responsive,
- configuración visual,
- tema base,
- estructura de login,
- estilos globales.

Se debe adaptar:

- menú lateral por permisos,
- login a Supabase Auth,
- rutas protegidas,
- dashboard,
- páginas CRUD,
- perfil de usuario.

No se debe crear un layout desde cero si Sakai NG ya provee uno funcional.

## Reinicio desde Sakai NG

Si el proyecto actual fue iniciado con `ng new` y no desde Sakai NG, la acción recomendada es reiniciar el frontend:

1. Resguardar `/AGENTS.md`, `/specs`, `/reference` y `/supabase`.
2. Borrar la instalación Angular incorrecta.
3. Clonar/copiar Sakai NG.
4. Reincorporar los archivos resguardados.
5. Repetir la configuración inicial sobre la estructura real de Sakai NG.
