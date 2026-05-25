# Modulo 12: Tipos de items

## Proposito

Gestionar tipos de items para clasificar residuos o materiales valorizables.

## Pantallas identificadas

- Listado de tipos de items.
- Crear tipo de item.
- Editar tipo de item.
- Detalle de tipo de item.

## Campos detectados

Desde `item_types`:

- `name`
- `status`

## Entidades relacionadas

- Items.
- Certificados.
- Reportes.

## Reglas de negocio

- `name` debe ser unico.
- Tipos inactivos no deberian seleccionarse en nuevos items.
- Un tipo usado por items no deberia eliminarse sin validar impacto.

## Validaciones sugeridas

- Nombre obligatorio y unico.
- Estado permitido: `active`, `inactive`.

## Permisos requeridos

- `item_types.view`
- `item_types.create`
- `item_types.update`
- `item_types.delete`

## Tablas Supabase relacionadas

- `item_types`
- `items`

## Criterios de aceptacion

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, editar y ver detalle.
- Se puede activar/inactivar.
- RLS impide acciones sin permisos.

## Pendiente de validación

- Catalogo inicial definitivo de tipos de items.
- Si se permite eliminar tipos con items asociados.
