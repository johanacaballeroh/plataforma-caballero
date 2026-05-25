# Modulo 11: Categorias

## Proposito

Gestionar categorias de items para clasificacion operacional y reportes.

## Pantallas identificadas

- Listado de categorias.
- Crear categoria.
- Editar categoria.
- Detalle de categoria.

## Campos detectados

Desde `categories`:

- `name`
- `description`
- `status`

## Entidades relacionadas

- Items.
- Certificados.
- Reportes.

## Reglas de negocio

- `name` debe ser unico.
- Categorias inactivas no deberian seleccionarse en nuevos items.
- Una categoria usada por items no deberia eliminarse sin validar impacto.

## Validaciones sugeridas

- Nombre obligatorio y unico.
- Descripcion opcional.
- Estado permitido: `active`, `inactive`.

## Permisos requeridos

- `categories.view`
- `categories.create`
- `categories.update`
- `categories.delete`

## Tablas Supabase relacionadas

- `categories`
- `items`

## Criterios de aceptacion

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, editar y ver detalle.
- Se puede activar/inactivar.
- RLS impide acciones sin permisos.

## Pendiente de validación

- Catalogo inicial definitivo de categorias.
- Si se permite eliminar categorias con items asociados.
