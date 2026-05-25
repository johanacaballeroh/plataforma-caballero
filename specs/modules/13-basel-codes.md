# Modulo 13: Codigos Basilea

## Proposito

Gestionar codigos Basilea asociados a items y reportes de certificados.

## Pantallas identificadas

- Listado de codigos Basilea.
- Crear codigo Basilea.
- Editar codigo Basilea.
- Detalle de codigo Basilea.

## Campos detectados

Desde `basel_codes`:

- `code`
- `description`
- `status`

## Entidades relacionadas

- Items.
- Certificados.
- Reportes.

## Reglas de negocio

- `code` debe ser unico.
- Codigo Basilea es opcional en `items` segun esquema actual.
- Codigos inactivos no deberian seleccionarse en nuevos items.

## Validaciones sugeridas

- Codigo obligatorio y unico.
- Descripcion obligatoria.
- Estado permitido: `active`, `inactive`.

## Permisos requeridos

- `basel_codes.view`
- `basel_codes.create`
- `basel_codes.update`
- `basel_codes.delete`

## Tablas Supabase relacionadas

- `basel_codes`
- `items`
- `v_certificate_report`

## Criterios de aceptacion

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, editar y ver detalle.
- Se puede activar/inactivar.
- RLS impide acciones sin permisos.

## Pendiente de validación

- Catalogo inicial oficial de codigos.
- Formato exacto permitido para `code`.
