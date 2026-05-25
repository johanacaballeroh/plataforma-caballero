# Modulo 10: Unidades

## Proposito

Gestionar unidades de medida usadas por items y reportes.

## Pantallas identificadas

- Listado de unidades.
- Crear unidad.
- Editar unidad.
- Detalle de unidad.

## Campos detectados

Desde `units`:

- `code`
- `name`
- `abbreviation`
- `status`

## Entidades relacionadas

- Items.
- Certificados.
- Reportes.

## Reglas de negocio

- `code` debe ser unico.
- Una unidad usada por items no deberia eliminarse sin validar impacto.
- Unidades inactivas no deberian seleccionarse en nuevos items.

## Validaciones sugeridas

- Codigo obligatorio y unico.
- Nombre obligatorio.
- Abreviatura opcional.
- Estado permitido: `active`, `inactive`.

## Permisos requeridos

- `units.view`
- `units.create`
- `units.update`
- `units.delete`

## Tablas Supabase relacionadas

- `units`
- `items`

## Criterios de aceptacion

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, editar y ver detalle.
- Se puede activar/inactivar.
- RLS impide acciones sin permisos.

## Pendiente de validación

- Catalogo inicial definitivo de unidades.
- Si se permite eliminar unidades con items asociados.
