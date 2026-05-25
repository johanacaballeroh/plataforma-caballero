# Modulo 14: Tipos de generacion de certificado

## Proposito

Gestionar tipos de generacion de certificado y reglas visuales/funcionales asociadas a campos de destino.

## Pantallas identificadas

- Listado de tipos de generacion.
- Crear tipo de generacion.
- Editar tipo de generacion.
- Detalle de tipo de generacion.
- Asociacion con plantillas PDF: `Pendiente de validación`.

## Campos detectados

Desde `certificate_generation_types`:

- `name`
- `description`
- `show_final_destination_company`
- `show_destination_place`
- `status`

Relaciones indirectas:

- plantillas en `certificate_template_versions`.

## Entidades relacionadas

- Certificados.
- Plantillas PDF.
- Empresas destino final.

## Reglas de negocio

- `name` debe ser unico.
- `show_final_destination_company` controla si el formulario de certificado debe mostrar destino final.
- `show_destination_place` controla si el formulario de certificado debe mostrar lugar de destino.
- Tipos inactivos no deberian seleccionarse en nuevos certificados.
- Las plantillas PDF se versionan por tipo de generacion.

## Validaciones sugeridas

- Nombre obligatorio y unico.
- Descripcion opcional.
- Flags booleanos obligatorios.
- Estado permitido: `active`, `inactive`.

## Permisos requeridos

- `certificate_generation_types.view`
- `certificate_generation_types.create`
- `certificate_generation_types.update`
- `certificate_generation_types.delete`
- `certificate_templates.view`
- `certificate_templates.create`
- `certificate_templates.update`

## Tablas Supabase relacionadas

- `certificate_generation_types`
- `certificate_template_versions`
- `certificates`

## Criterios de aceptacion

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, editar y ver detalle.
- Los flags afectan formularios futuros de certificados.
- RLS impide acciones sin permisos.
- No se modifican certificados historicos al cambiar plantillas.

## Pendiente de validación

- Si la gestion de plantillas vive en este modulo o en Certificados.
- Si existen mas flags funcionales observados en capturas que aun no estan en SQL.
