# Módulo 11: Categorías

## Propósito

Administrar categorías para clasificar ítems.

## Pantallas identificadas

- Listado de categorías.
- Crear categoría.
- Detalle de categoría.
- Editar categoría.

## Campos detectados

- `name`
- `description`
- `status`

## Entidades relacionadas

- Ítems.

## Reglas de negocio

- El nombre debe ser único.
- Categorías inactivas no deben aparecer para nuevos ítems.
- No debe eliminarse una categoría usada por ítems: `Pendiente de validación`; el esquema restringe por FK.

## Validaciones sugeridas

- Nombre obligatorio.
- Descripción opcional.
- Estado obligatorio.

## Permisos requeridos

- `categories.view`
- `categories.create`
- `categories.update`
- `categories.delete`

## Tablas Supabase relacionadas

- `categories`
- `items`

## Criterios de aceptación

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, ver y editar categorías.
- No se duplican nombres.
- El estado se muestra con tag.
- RLS protege operaciones.

## Pendiente de validación

- Taxonomía final de categorías.
- Si requiere código adicional.
