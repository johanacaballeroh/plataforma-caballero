# Modulo 15: Tipos de cantidad

## Proposito

Gestionar tipos de cantidad usados en items de certificados.

## Pantallas identificadas

- Listado de tipos de cantidad.
- Crear tipo de cantidad.
- Editar tipo de cantidad.
- Detalle de tipo de cantidad.

## Campos detectados

Desde `quantity_types`:

- `name`
- `show_value`
- `status`

## Entidades relacionadas

- Items de certificado.
- Certificados.

## Reglas de negocio

- `name` debe ser unico.
- `show_value` indica si el formulario debe solicitar o mostrar valor/cantidad asociada.
- Tipos inactivos no deberian seleccionarse en nuevos certificados.

## Validaciones sugeridas

- Nombre obligatorio y unico.
- `show_value` obligatorio.
- Estado permitido: `active`, `inactive`.

## Permisos requeridos

- `quantity_types.view`
- `quantity_types.create`
- `quantity_types.update`
- `quantity_types.delete`

## Tablas Supabase relacionadas

- `quantity_types`
- `certificate_items`

## Criterios de aceptacion

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, editar y ver detalle.
- `show_value` queda disponible para formularios de certificado.
- RLS impide acciones sin permisos.

## Pendiente de validación

- Reglas exactas que `show_value` debe activar en certificados.
- Catalogo inicial definitivo.
