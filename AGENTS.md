# AGENTS.md

## Proyecto

Sistema web para la gestion y trazabilidad de certificados de valorizacion de residuos.

El objetivo es reconstruir funcionalmente un backoffice existente a partir de capturas, modernizandolo con:

- Angular 21 SPA.
- Sin SSR.
- Supabase como backend.
- Supabase Auth.
- Supabase PostgreSQL.
- Supabase Storage.
- Row Level Security.
- PrimeNG como libreria UI.
- Sakai NG como template visual oficial.
- TailwindCSS para pantallas nuevas y ajustes visuales.
- Paginado por servidor.
- Ordenamiento por servidor.
- Filtros por servidor.
- Arquitectura modular y mantenible.

## Stack obligatorio

- Angular 21.
- TypeScript.
- PrimeNG.
- Sakai NG como template base gratuito.
- TailwindCSS para nuevas pantallas y ajustes visuales.
- Supabase JS Client.
- PostgreSQL en Supabase.
- UUID como primary key.
- RLS obligatorio en tablas sensibles.
- No usar SSR.
- No usar Firebase.
- No usar backend Node propio salvo que se indique explicitamente.
- No usar mocks permanentes si ya existe contrato de Supabase.

## Fuentes de verdad

### Fuente visual

Sakai NG es la fuente visual oficial del proyecto. El workspace ya esta basado en Sakai NG, por lo que se debe adaptar su estructura real.

Se debe reutilizar:

- pagina de login,
- layout principal,
- sidebar,
- topbar,
- estructura visual base,
- configuracion de PrimeNG,
- estilos globales,
- soporte de TailwindCSS.

No se debe crear un layout desde cero si Sakai NG ya provee uno funcional.

### Fuente funcional

Las capturas del backoffice anterior son una fuente de ingenieria inversa funcional.

Ruta indicada originalmente:

- `/docs/reference/00_capturas_completas_backoffice.pdf`

Ruta encontrada en este workspace:

- `/reference/00_capturas_completas_backoffice.pdf`

Las capturas se usan unicamente para identificar:

- modulos existentes,
- pantallas,
- formularios,
- campos,
- acciones,
- relaciones,
- reglas de negocio,
- flujos CRUD,
- comportamiento esperado.

No se deben usar como referencia de diseno visual.

### Fuente tecnica

La base de datos Supabase ya esta definida en:

- `/supabase/schema.sql`
- `/supabase/rls-policies.sql`
- `/supabase/storage-policies.sql`
- `/supabase/seed.sql`

Si un documento SDD entra en conflicto con el SQL real, prevalece el SQL.

## Reglas generales de desarrollo

1. No implementar funcionalidades fuera del SDD sin dejarlo documentado.
2. No cambiar nombres de tablas, columnas o rutas sin actualizar la especificacion.
3. No saltarse validaciones de permisos en frontend.
4. No depender solo del frontend para seguridad; la seguridad real debe estar en RLS.
5. Todo modulo CRUD debe incluir:
   - listado,
   - filtros por servidor,
   - paginado por servidor,
   - ordenamiento por servidor,
   - creacion,
   - edicion,
   - vista detalle,
   - estado activo/inactivo cuando aplique.
6. Toda accion critica debe registrar auditoria o metadata.
7. El rol Cliente solo puede ver certificados asociados a sus empresas.
8. Los roles base no deben eliminarse:
   - Administrador,
   - Gerente,
   - Cliente.
9. El usuario administrador inicial debe existir con:
   - email configurable,
   - contrasena inicial `123456` solo para entorno seed/dev,
   - todos los permisos.
10. Las plantillas PDF deben versionarse. Una nueva plantilla no debe modificar certificados historicos.

## Reglas de Angular

- Usar arquitectura por features compatible con Angular 21 y Sakai NG.
- Usar standalone components si el proyecto base Sakai NG ya trabaja con ese enfoque.
- Mantener la estructura original del template cuando sea conveniente, separando claramente las features del negocio.
- Cada modulo debe estar aislado en su carpeta.
- Usar servicios para acceso a Supabase.
- Usar guards para autenticacion y permisos.
- Usar interceptores o servicios globales para manejo de errores.
- Usar componentes reutilizables para tablas, formularios, filtros, confirmaciones, badges de estado y botones de acciones.
- Evitar logica de negocio compleja dentro de componentes.
- Preferir formularios reactivos.
- Usar interfaces TypeScript para cada entidad.

## Estructura sugerida Angular

```text
src/app/
  layout/
  core/
    auth/
    guards/
    interceptors/
    services/
    supabase/
  shared/
    components/
    pipes/
    directives/
    models/
    utils/
  features/
    dashboard/
    users/
    roles/
    companies/
    certificates/
    items/
    units/
    categories/
    item-types/
    basel-codes/
    quantity-types/
    document-types/
    certificate-generation-types/
    reports/
    profile/
    audit-logs/
```

## Convenciones de nombres

- Tablas PostgreSQL en `snake_case`.
- Interfaces TypeScript en `PascalCase`.
- Servicios Angular con sufijo `Service`.
- Componentes Angular con sufijo `Component`.
- Rutas en `kebab-case`.
- Campos fecha: `created_at`, `updated_at`, `deleted_at` cuando aplique soft delete.
- Campos auditoria: `created_by`, `updated_by`.

## Seguridad

- Toda tabla de negocio debe tener RLS.
- El frontend puede ocultar botones segun permisos, pero la validacion definitiva debe estar en Supabase.
- El usuario Cliente no puede acceder a datos de otras empresas.
- El Administrador puede acceder a todo.
- El Gerente puede acceder a todo excepto logs/auditoria.
- Los logs deben ser solo lectura para Administrador.

## Como trabajar cada tarea

Antes de implementar:

1. Leer `/specs/00_project_context.md`.
2. Leer el archivo especifico del modulo.
3. Revisar `/specs/04_database_supabase.md`.
4. Revisar `/specs/05_security_rbac_rls.md`.
5. Proponer plan breve.
6. Implementar.
7. Verificar build, lint, tipos TypeScript, consultas Supabase, permisos, paginado, ordenamiento y filtros.

## Reglas de UI con Sakai NG

1. La pagina de login debe adaptarse desde la pagina existente en Sakai NG.
2. El layout autenticado debe usar la estructura de Sakai NG.
3. El menu lateral debe adaptarse a los modulos del sistema:
   - Dashboard,
   - Certificados,
   - Empresas,
   - Items,
   - Unidades,
   - Categorias,
   - Tipos de items,
   - Codigos Basilea,
   - Tipos de generacion de certificado,
   - Tipos de cantidad,
   - Tipos de documentos,
   - Usuarios,
   - Roles,
   - Reportes,
   - Logs.
4. Las nuevas paginas deben usar PrimeNG para componentes funcionales:
   - `p-table`,
   - `p-dialog`,
   - `p-button`,
   - `p-inputText`,
   - `p-dropdown` o `p-select`,
   - `p-datepicker` o calendario equivalente,
   - `p-toast`,
   - `p-confirmDialog`,
   - `p-tag`.
5. TailwindCSS se usara para layout fino, spacing, grids y ajustes visuales.
6. No mezclar estilos inconsistentes fuera del sistema visual de Sakai.
7. No reemplazar PrimeNG por otra libreria UI.

## Prohibiciones

- No crear logica duplicada por modulo si puede ir en shared.
- No hardcodear IDs de roles salvo en seeds controlados.
- No exponer claves secretas de Supabase.
- No usar `service_role` key en frontend.
- No desactivar RLS para simplificar.
- No guardar archivos PDF como base64 en tablas.
- No generar PDFs sin registrar metadata.
- No copiar colores, layout, sidebar ni estilos del sistema anterior.
- No recrear pantallas visualmente identicas a las capturas.

## Incertidumbre

Si una captura, el SQL o el contexto disponible no confirman un dato, marcarlo como:

`Pendiente de validación`
