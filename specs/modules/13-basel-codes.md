# Módulo 13: Códigos Basilea

## Propósito

Administrar códigos Basilea asociados a ítems para clasificación normativa.

## Pantallas identificadas

- Listado de códigos Basilea.
- Crear código Basilea.
- Detalle de código Basilea.
- Editar código Basilea.

## Campos detectados

- `code`
- `description`
- `status`

## Entidades relacionadas

- Ítems.
- Reporte de certificados.

## Reglas de negocio

- El código debe ser único.
- La descripción es obligatoria en el esquema.
- Códigos inactivos no deben aparecer para nuevos ítems.
- No debe eliminarse un código usado por ítems: `Pendiente de validación`; el esquema restringe por FK.

## Validaciones sugeridas

- Código obligatorio.
- Descripción obligatoria.
- Estado obligatorio.

## Permisos requeridos

- `basel_codes.view`
- `basel_codes.create`
- `basel_codes.update`
- `basel_codes.delete`

## Tablas Supabase relacionadas

- `basel_codes`
- `items`

## Criterios de aceptación

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, ver y editar códigos.
- No se duplican códigos.
- El estado se muestra con tag.
- RLS protege operaciones.

## Pendiente de validación

- Formato exacto del código Basilea.
- Catálogo inicial oficial.
