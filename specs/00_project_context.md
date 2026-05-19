# Contexto del proyecto

## Nombre

Sistema web para la gestión y trazabilidad de certificados de valorización de residuos.

## Objetivo

Reconstruir funcionalmente un backoffice existente a partir de capturas del sistema anterior, modernizándolo como una SPA administrativa sobre Angular 21, PrimeNG, Sakai NG, TailwindCSS y Supabase.

La reconstrucción debe conservar el comportamiento funcional observado:

- módulos disponibles,
- formularios,
- campos,
- acciones,
- relaciones entre entidades,
- reglas de negocio,
- flujos CRUD,
- restricciones por rol.

No debe copiar la interfaz visual del backoffice anterior.

## Fuentes del proyecto

### Fuente funcional

Las capturas del backoffice anterior son una fuente de ingeniería inversa funcional.

Ruta indicada originalmente:

- `/docs/reference/00_capturas_completas_backoffice.pdf`

Ruta real encontrada en este workspace:

- `/reference/00_capturas_completas_backoffice.pdf`

Uso permitido de las capturas:

- identificar módulos,
- identificar pantallas,
- identificar campos,
- identificar relaciones,
- identificar acciones disponibles,
- identificar reglas de negocio,
- identificar flujos CRUD.

Uso prohibido de las capturas:

- copiar colores,
- copiar layout,
- copiar sidebar,
- copiar estilos,
- recrear pantallas visualmente idénticas,
- usarlas como sistema visual de referencia.

### Fuente visual

La fuente visual oficial y base inicial real del frontend es Sakai NG, template gratuito de PrimeFaces:

https://github.com/primefaces/sakai-ng

Decisión corregida:

- Sakai NG debe clonarse o copiarse como base del proyecto.
- No se debe crear primero un Angular vacío y luego intentar "instalar Sakai NG" encima.
- PrimeNG, PrimeIcons, TailwindCSS y los estilos del template forman parte de esa base.
- El trabajo del backoffice debe consistir en adaptar Sakai NG, no reconstruir su layout manualmente.

Sakai NG define:

- login,
- layout autenticado,
- sidebar,
- topbar,
- estructura responsive,
- estilos globales,
- integración visual con PrimeNG,
- base de TailwindCSS.

Toda pantalla nueva debe verse como una extensión natural de Sakai NG.

## Estrategia de arranque frontend

El frontend debe iniciarse desde el repositorio Sakai NG:

1. Clonar o copiar `https://github.com/primefaces/sakai-ng`.
2. Verificar que la versión base sea compatible con Angular 21.
3. Renombrar metadatos del proyecto al nombre de este sistema.
4. Conservar layout, login, estilos globales, configuración PrimeNG y TailwindCSS.
5. Eliminar o aislar demos del template solo cuando ya esté claro que no se necesitan.
6. Incorporar `AGENTS.md`, `/specs`, `/reference` y `/supabase` del proyecto.
7. Adaptar login a Supabase Auth.
8. Adaptar menú y rutas a los módulos del SDD.

No se debe repetir el intento de integrar Sakai NG sobre un scaffold Angular vacío.

### Fuente técnica de datos

El esquema Supabase existente es la fuente técnica principal para tablas, columnas, relaciones, índices, triggers y constraints:

- `/supabase/schema.sql`
- `/supabase/rls-policies.sql`
- `/supabase/storage-policies.sql`
- `/supabase/seed.sql`

Los documentos SDD deben mantenerse alineados con esos archivos.

## Decisiones técnicas confirmadas

- Angular 21.
- SPA sin SSR.
- TypeScript.
- PrimeNG.
- Sakai NG como template base.
- TailwindCSS para pantallas nuevas y ajustes visuales.
- Supabase JS Client.
- Supabase Auth.
- Supabase PostgreSQL.
- Supabase Storage.
- Row Level Security obligatorio.
- UUID como primary key.
- Paginado por servidor.
- Ordenamiento por servidor.
- Filtros por servidor.
- Sin Firebase.
- Sin backend Node propio, salvo decisión explícita posterior.

## Módulos identificados

1. Login.
2. Dashboard.
3. Perfil.
4. Usuarios.
5. Roles y permisos.
6. Reportes.
7. Certificados.
8. Empresas.
9. Ítems.
10. Unidades.
11. Categorías.
12. Tipos de ítems.
13. Códigos Basilea.
14. Tipos de generación de certificado.
15. Tipos de cantidad.
16. Tipos de documentos.

El layout, sidebar y topbar se toman de Sakai NG y no se documentan como módulos de negocio separados.

## Roles base

- Administrador: acceso total, incluyendo logs.
- Gerente: acceso operativo completo, excepto logs.
- Cliente: acceso limitado a certificados asociados a sus empresas.

## Principio de reconstrucción

Cuando una captura confirme un campo o acción, se documenta como requerimiento funcional.

Cuando una captura no permita confirmar un dato, se marca como `Pendiente de validación`.

No se deben inventar campos solo para completar formularios.

## Estado actual del SDD

Este SDD prepara la implementación futura. No autoriza por sí solo cambios de código, dependencias, SQL o componentes Angular si la tarea activa solicita únicamente documentación.

## Archivos a rescatar si se reinicia el workspace

Antes de borrar una instalación incorrecta, conservar:

- `/AGENTS.md`
- `/specs/**`
- `/reference/**`
- `/supabase/**`
- cualquier `.env.example` o nota local sin secretos si existe.

No es necesario conservar:

- `src/**` generado desde un Angular vacío,
- `node_modules/**`,
- `dist/**`,
- `package.json` si no proviene de Sakai NG,
- `package-lock.json` si no proviene de Sakai NG,
- `angular.json` si no proviene de Sakai NG.
