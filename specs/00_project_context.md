# Contexto del proyecto

## Nombre

Sistema web para la gestion y trazabilidad de certificados de valorizacion de residuos.

## Objetivo

Reconstruir funcionalmente un backoffice existente como una SPA administrativa moderna, usando Angular 21, PrimeNG, Sakai NG, TailwindCSS y Supabase.

La reconstruccion debe conservar el comportamiento funcional observado en el sistema anterior:

- modulos disponibles,
- pantallas,
- formularios,
- campos,
- acciones,
- relaciones entre entidades,
- reglas de negocio,
- flujos CRUD,
- restricciones por rol.

La reconstruccion no debe copiar la interfaz visual del backoffice anterior.

## Fuentes del proyecto

### Fuente funcional

Las capturas del backoffice anterior son una fuente de ingenieria inversa funcional.

Ruta indicada en la tarea:

- `/docs/reference/00_capturas_completas_backoffice.pdf`

Ruta encontrada en este workspace:

- `/reference/00_capturas_completas_backoffice.pdf`

Uso permitido de las capturas:

- identificar modulos,
- identificar pantallas,
- identificar formularios,
- identificar campos,
- identificar acciones,
- identificar relaciones,
- identificar reglas de negocio,
- identificar flujos CRUD,
- identificar casos que deben quedar como `Pendiente de validación`.

Uso prohibido de las capturas:

- copiar colores,
- copiar layout,
- copiar sidebar,
- copiar estilos,
- recrear pantallas visualmente identicas,
- usarlas como fuente del sistema visual.

### Fuente visual oficial

La fuente visual oficial y base real del frontend es Sakai NG, template gratuito de PrimeFaces:

https://github.com/primefaces/sakai-ng

Decision confirmada:

- El workspace ya esta basado en Sakai NG.
- Sakai NG no se trata como libreria agregada encima de un Angular vacio.
- El login, layout autenticado, sidebar, topbar, estilos globales, configuracion PrimeNG y soporte TailwindCSS deben partir de Sakai NG.
- Las nuevas pantallas deben verse como una extension natural del template.

### Fuente tecnica de datos

El esquema Supabase existente es la fuente tecnica principal para tablas, columnas, relaciones, indices, triggers, politicas y seeds:

- `/supabase/schema.sql`
- `/supabase/rls-policies.sql`
- `/supabase/storage-policies.sql`
- `/supabase/seed.sql`

Si un documento SDD entra en conflicto con el SQL real, prevalece el SQL y el documento debe corregirse.

## Stack obligatorio

- Angular 21.
- TypeScript.
- PrimeNG.
- Sakai NG como template base.
- TailwindCSS para nuevas pantallas y ajustes visuales.
- Supabase JS Client.
- Supabase Auth.
- Supabase PostgreSQL.
- Supabase Storage.
- Row Level Security.
- UUID como primary key.
- SPA sin SSR.
- Paginado por servidor.
- Ordenamiento por servidor.
- Filtros por servidor.

No se permite Firebase, backend Node propio ni `service_role` en frontend salvo decision explicita posterior.

## Modulos identificados

1. Login.
2. Dashboard.
3. Perfil.
4. Usuarios.
5. Roles y permisos.
6. Reportes.
7. Certificados.
8. Empresas.
9. Items.
10. Unidades.
11. Categorias.
12. Tipos de items.
13. Codigos Basilea.
14. Tipos de generacion de certificado.
15. Tipos de cantidad.
16. Tipos de documentos.

El layout, sidebar y topbar pertenecen a la base Sakai NG y no son modulos de negocio separados.

## Roles base

- Administrador: acceso total, incluyendo logs.
- Gerente: acceso operativo completo, excepto logs.
- Cliente: acceso limitado a certificados asociados a sus empresas.

## Principio de incertidumbre

Cuando una captura confirme un dato, se documenta como requerimiento funcional.

Cuando una captura, el SQL o la documentacion disponible no permitan confirmar un dato, se debe marcar como:

`Pendiente de validación`

No se deben inventar campos, tablas ni columnas para completar formularios.

## Alcance de este SDD

Este SDD prepara la implementacion futura. No autoriza por si solo cambios de codigo Angular, dependencias, SQL o scripts cuando la tarea activa solicita solo documentacion.
