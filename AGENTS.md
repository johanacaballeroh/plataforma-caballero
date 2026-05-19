# AGENTS.md

## Proyecto

Sistema web para la gestión y trazabilidad de certificados de valorización de residuos.

El objetivo es reconstruir funcionalmente un backoffice existente a partir de capturas, pero modernizado con:

- Angular SPA.
- Sin SSR.
- Supabase como backend.
- Supabase Auth.
- Supabase PostgreSQL.
- Supabase Storage.
- Row Level Security.
- PrimeNG como librería UI.
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
- No usar backend Node propio salvo que se indique explícitamente.
- No usar mocks permanentes si ya existe contrato de Supabase.

## Reglas generales de desarrollo

1. No implementar funcionalidades fuera del SDD sin dejarlo documentado.
2. No cambiar nombres de tablas, columnas o rutas sin actualizar la especificación.
3. No saltarse validaciones de permisos en frontend.
4. No depender solo del frontend para seguridad; la seguridad real debe estar en RLS.
5. Todo módulo CRUD debe incluir:
   - listado,
   - filtros,
   - paginado por servidor,
   - ordenamiento por servidor,
   - creación,
   - edición,
   - vista detalle,
   - estado activo/inactivo cuando aplique.
6. Toda acción crítica debe registrar auditoría.
7. El rol Cliente solo puede ver certificados asociados a su empresa.
8. Los roles base no deben eliminarse:
   - Administrador,
   - Gerente,
   - Cliente.
9. El usuario administrador inicial debe existir con:
   - email configurable,
   - contraseña inicial 123456 solo para entorno seed/dev,
   - todos los permisos.
10. Las plantillas PDF deben versionarse. Una nueva plantilla no debe modificar certificados históricos.

## Reglas de Angular

- Usar arquitectura por features compatible con la estructura de Angular 21 y Sakai NG.
- Usar standalone components si el proyecto base Sakai NG ya trabaja con ese enfoque.
- Mantener la estructura original del template cuando sea conveniente, pero separar claramente las features del negocio.
- Cada módulo debe estar aislado en su carpeta.
- Usar servicios para acceso a Supabase.
- Usar guards para autenticación y permisos.
- Usar interceptores o servicios globales para manejo de errores.
- Usar componentes reutilizables para:
  - tablas,
  - formularios,
  - filtros,
  - confirmaciones,
  - badges de estado,
  - botones de acciones.
- Evitar lógica de negocio compleja dentro de componentes.
- Preferir formularios reactivos.
- Usar interfaces TypeScript para cada entidad.

## Estructura sugerida Angular

src/app/
  core/
    auth/
    guards/
    interceptors/
    layout/
    services/
  shared/
    components/
    pipes/
    directives/
    models/
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

## Convenciones de nombres

- Tablas PostgreSQL en snake_case.
- Interfaces TypeScript en PascalCase.
- Servicios Angular con sufijo Service.
- Componentes Angular con sufijo Component.
- Rutas en kebab-case.
- Campos fecha:
  - created_at
  - updated_at
  - deleted_at cuando aplique soft delete.
- Campos auditoría:
  - created_by
  - updated_by

## Seguridad

- Toda tabla de negocio debe tener RLS.
- El frontend puede ocultar botones según permisos, pero la validación definitiva debe estar en Supabase.
- El usuario Cliente no puede acceder a datos de otras empresas.
- El Administrador puede acceder a todo.
- El Gerente puede acceder a todo excepto logs/auditoría.
- Los logs deben ser solo lectura para Administrador.

## Cómo trabajar cada tarea

Antes de implementar:

1. Leer `/specs/00_project_context.md`.
2. Leer el archivo específico del módulo.
3. Revisar `/specs/04_database_supabase.md`.
4. Revisar `/specs/05_security_rbac_rls.md`.
5. Proponer plan breve.
6. Implementar.
7. Verificar:
   - build,
   - lint,
   - tipos TypeScript,
   - consultas Supabase,
   - permisos,
   - paginado,
   - ordenamiento.

## Prohibiciones

- No crear lógica duplicada por módulo si puede ir en shared.
- No hardcodear IDs de roles salvo en seeds controlados.
- No exponer claves secretas de Supabase.
- No usar service_role key en frontend.
- No desactivar RLS para simplificar.
- No guardar archivos PDF como base64 en tablas.
- No generar PDFs sin registrar metadata.

## Template UI obligatorio

El proyecto debe partir del template gratuito Sakai NG de PrimeFaces como base real del frontend:

Repositorio:
https://github.com/primefaces/sakai-ng

Decisión importante:

- Sakai NG no debe tratarse como una librería que se instala después sobre un Angular vacío.
- El flujo correcto es clonar/copiar Sakai NG como base inicial del proyecto y adaptar esa estructura.
- Si el workspace actual fue creado con `ng new` sin Sakai NG, debe reiniciarse usando Sakai NG como punto de partida antes de implementar pantallas.

Se debe reutilizar de Sakai NG:

- página de login,
- layout principal,
- sidebar,
- topbar,
- estructura visual base,
- configuración de PrimeNG,
- estilos globales,
- soporte de TailwindCSS.

Las nuevas pantallas del sistema deben respetar el diseño visual del template.

No se debe crear un layout desde cero si Sakai NG ya provee uno funcional.
No se debe reconstruir manualmente Sakai NG desde fragmentos salvo como solución temporal documentada.

## Reglas de UI con Sakai NG

1. La página de login debe adaptarse desde la página existente en Sakai NG.
2. El layout autenticado debe usar la estructura de Sakai NG.
3. El menú lateral debe adaptarse a los módulos del sistema:
   - Dashboard,
   - Certificados,
   - Empresas,
   - Ítems,
   - Unidades,
   - Categorías,
   - Tipos de ítems,
   - Códigos Basilea,
   - Tipos de generación de certificado,
   - Tipos de cantidad,
   - Tipos de documentos,
   - Usuarios,
   - Roles,
   - Reportes,
   - Logs.
4. Las nuevas páginas deben usar PrimeNG para componentes funcionales:
   - p-table,
   - p-dialog,
   - p-button,
   - p-inputText,
   - p-dropdown o p-select,
   - p-calendar o datepicker equivalente,
   - p-toast,
   - p-confirmDialog,
   - p-tag.
5. TailwindCSS se usará para layout fino, spacing, grids y ajustes visuales.
6. No mezclar estilos inconsistentes fuera del sistema visual de Sakai.
7. No reemplazar PrimeNG por otra librería UI.

## Uso de capturas del backoffice

Las capturas del sistema anterior son una fuente de ingeniería inversa funcional.

Se usan únicamente para identificar:

- módulos existentes,
- pantallas,
- formularios,
- campos,
- acciones,
- relaciones,
- reglas de negocio,
- flujos CRUD,
- comportamiento esperado.

No se deben usar como referencia de diseño visual.

El diseño visual oficial del nuevo sistema viene del template Sakai NG.

Por tanto:

- No copiar colores del sistema anterior.
- No copiar layout del sistema anterior.
- No copiar sidebar del sistema anterior.
- No copiar estilos antiguos.
- No recrear pantallas visualmente idénticas a las capturas.
- Sí respetar los campos y reglas funcionales detectadas en las capturas.
- Sí modernizar la experiencia usando Sakai NG, PrimeNG y TailwindCSS.
