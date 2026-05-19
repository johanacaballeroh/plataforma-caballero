# Módulo 09: Ítems

## Propósito

Gestionar los ítems usados en certificados, vinculándolos con unidades, categorías, tipos de ítem y códigos Basilea.

## Pantallas identificadas

- Listado de ítems.
- Crear ítem.
- Detalle de ítem.
- Editar ítem.

## Campos detectados

- `code`
- `name`
- `description`
- `unit_id`
- `category_id`
- `item_type_id`
- `basel_code_id`
- `status`

## Entidades relacionadas

- Unidades.
- Categorías.
- Tipos de ítems.
- Códigos Basilea.
- Certificados.

## Reglas de negocio

- El código debe ser único.
- Un ítem debe tener unidad, categoría y tipo.
- El código Basilea es nullable en esquema, pero funcionalmente puede ser requerido según negocio.
- Ítems inactivos no deberían seleccionarse en nuevos certificados.

## Validaciones sugeridas

- Código obligatorio.
- Nombre obligatorio.
- Unidad obligatoria.
- Categoría obligatoria.
- Tipo de ítem obligatorio.
- Código Basilea: `Pendiente de validación` si debe ser obligatorio.

## Permisos requeridos

- `items.view`
- `items.create`
- `items.update`
- `items.delete`

## Tablas Supabase relacionadas

- `items`
- `units`
- `categories`
- `item_types`
- `basel_codes`
- `certificate_items`

## Criterios de aceptación

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, ver y editar ítems.
- Los selects muestran catálogos activos.
- No se duplican códigos.
- El estado se muestra con tag.
- RLS protege operaciones.

## Pendiente de validación

- Obligatoriedad de `basel_code_id`.
- Campos adicionales del backoffice anterior.
- Reglas para eliminar o inactivar ítems usados en certificados.
