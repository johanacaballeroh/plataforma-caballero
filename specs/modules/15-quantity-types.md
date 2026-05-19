# Módulo 15: Tipos de cantidad

## Propósito

Administrar tipos de cantidad aplicables a ítems dentro de certificados.

## Pantallas identificadas

- Listado de tipos de cantidad.
- Crear tipo de cantidad.
- Detalle de tipo de cantidad.
- Editar tipo de cantidad.

## Campos detectados

- `name`
- `show_value`
- `status`

## Entidades relacionadas

- Ítems de certificado.
- Certificados.

## Reglas de negocio

- El nombre debe ser único.
- `show_value` define si el formulario debe mostrar o requerir valor asociado: `Pendiente de validación` para comportamiento exacto.
- Tipos inactivos no deben aparecer en nuevos certificados.

## Validaciones sugeridas

- Nombre obligatorio.
- `show_value` obligatorio.
- Estado obligatorio.

## Permisos requeridos

- `quantity_types.view`
- `quantity_types.create`
- `quantity_types.update`
- `quantity_types.delete`

## Tablas Supabase relacionadas

- `quantity_types`
- `certificate_items`

## Criterios de aceptación

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, ver y editar tipos.
- No se duplican nombres.
- El flag `show_value` se puede configurar.
- RLS protege operaciones.

## Pendiente de validación

- Significado funcional exacto de `show_value`.
- Si existen fórmulas o unidades asociadas por tipo.
