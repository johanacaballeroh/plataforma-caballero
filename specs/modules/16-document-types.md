# Módulo 16: Tipos de documentos

## Propósito

Administrar tipos de documentos adjuntos que pueden asociarse a certificados.

## Pantallas identificadas

- Listado de tipos de documentos.
- Crear tipo de documento.
- Detalle de tipo de documento.
- Editar tipo de documento.

## Campos detectados

- `name`
- `status`

## Entidades relacionadas

- Documentos adjuntos de certificados.
- Supabase Storage.

## Reglas de negocio

- El nombre debe ser único.
- Tipos inactivos no deben aparecer al adjuntar nuevos documentos.
- No debe eliminarse un tipo usado por documentos adjuntos: `Pendiente de validación`; el esquema restringe por FK.

## Validaciones sugeridas

- Nombre obligatorio.
- Estado obligatorio.

## Permisos requeridos

- `document_types.view`
- `document_types.create`
- `document_types.update`
- `document_types.delete`

## Tablas Supabase relacionadas

- `document_types`
- `certificate_documents`

## Criterios de aceptación

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, ver y editar tipos.
- No se duplican nombres.
- El estado se muestra con tag.
- RLS protege operaciones.

## Pendiente de validación

- Catálogo inicial de tipos de documento.
- Si cada tipo limita extensiones o tamaño.
