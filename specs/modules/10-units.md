# Módulo 10: Unidades

## Propósito

Administrar unidades de medida usadas por ítems y reportes de certificados.

## Pantallas identificadas

- Listado de unidades.
- Crear unidad.
- Detalle de unidad.
- Editar unidad.

## Campos detectados

- `code`
- `name`
- `abbreviation`
- `status`

## Entidades relacionadas

- Ítems.
- Reportes.
- Certificados mediante `certificate_items`.

## Reglas de negocio

- El código debe ser único.
- Unidades inactivas no deben aparecer para nuevos ítems.
- No debe eliminarse una unidad si existen ítems asociados: `Pendiente de validación`; el esquema restringe por FK.

## Validaciones sugeridas

- Código obligatorio.
- Nombre obligatorio.
- Abreviatura opcional.
- Estado obligatorio.

## Permisos requeridos

- `units.view`
- `units.create`
- `units.update`
- `units.delete`

## Tablas Supabase relacionadas

- `units`
- `items`

## Criterios de aceptación

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, ver y editar unidades.
- Se impide duplicar código.
- Las unidades inactivas se identifican visualmente.
- RLS protege operaciones.

## Pendiente de validación

- Formato exacto de códigos.
- Si abreviatura debe ser obligatoria.
