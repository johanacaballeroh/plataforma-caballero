# Módulo 12: Tipos de ítems

## Propósito

Administrar tipos de ítems para clasificación funcional y reportes.

## Pantallas identificadas

- Listado de tipos de ítems.
- Crear tipo de ítem.
- Detalle de tipo de ítem.
- Editar tipo de ítem.

## Campos detectados

- `name`
- `status`

## Entidades relacionadas

- Ítems.
- Reporte de certificados.

## Reglas de negocio

- El nombre debe ser único.
- Tipos inactivos no deben aparecer para nuevos ítems.
- No debe eliminarse un tipo usado por ítems: `Pendiente de validación`; el esquema restringe por FK.

## Validaciones sugeridas

- Nombre obligatorio.
- Estado obligatorio.

## Permisos requeridos

- `item_types.view`
- `item_types.create`
- `item_types.update`
- `item_types.delete`

## Tablas Supabase relacionadas

- `item_types`
- `items`

## Criterios de aceptación

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, ver y editar tipos.
- No se duplican nombres.
- El estado se muestra con tag.
- RLS protege operaciones.

## Pendiente de validación

- Si el backoffice anterior usaba descripción o código para tipos.
