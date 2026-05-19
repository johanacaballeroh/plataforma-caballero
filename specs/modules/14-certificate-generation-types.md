# Módulo 14: Tipos de generación de certificado

## Propósito

Administrar tipos de generación de certificado y reglas de visibilidad de campos relacionadas.

## Pantallas identificadas

- Listado de tipos de generación.
- Crear tipo de generación.
- Detalle de tipo de generación.
- Editar tipo de generación.

## Campos detectados

Desde esquema:

- `name`
- `description`
- `show_final_destination_company`
- `show_destination_place`
- `status`

## Entidades relacionadas

- Certificados.
- Plantillas PDF versionadas.

## Reglas de negocio

- El nombre debe ser único.
- El tipo de generación puede controlar si se muestra empresa destino final.
- El tipo de generación puede controlar si se muestra lugar de destino.
- Tipos inactivos no deben aparecer para nuevos certificados.
- Las plantillas se versionan por tipo de generación.

## Validaciones sugeridas

- Nombre obligatorio.
- Estado obligatorio.
- Flags booleanos con valor explícito.

## Permisos requeridos

- `certificate_generation_types.view`
- `certificate_generation_types.create`
- `certificate_generation_types.update`
- `certificate_generation_types.delete`

## Tablas Supabase relacionadas

- `certificate_generation_types`
- `certificate_template_versions`
- `certificates`

## Criterios de aceptación

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, ver y editar tipos.
- No se duplican nombres.
- Los flags impactan formularios futuros de certificado.
- RLS protege operaciones.

## Pendiente de validación

- Si debe existir `show_value`; no está en el esquema actual.
- Reglas exactas de campos obligatorios por tipo.
- Plantillas iniciales por tipo.
