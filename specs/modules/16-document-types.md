# Modulo 16: Tipos de documentos

## Proposito

Gestionar tipos de documentos adjuntos que pueden asociarse a certificados.

## Pantallas identificadas

- Listado de tipos de documentos.
- Crear tipo de documento.
- Editar tipo de documento.
- Detalle de tipo de documento.

## Campos detectados

Desde `document_types`:

- `name`
- `status`

## Entidades relacionadas

- Documentos adjuntos de certificados.
- Supabase Storage.

## Reglas de negocio

- `name` debe ser unico.
- Tipos inactivos no deberian seleccionarse al adjuntar nuevos documentos.
- Los archivos reales se almacenan en `certificate-documents`.
- La tabla `certificate_documents` guarda metadata.

## Validaciones sugeridas

- Nombre obligatorio y unico.
- Estado permitido: `active`, `inactive`.
- Tipos de archivo permitidos segun `storage-policies.sql`.

## Permisos requeridos

- `document_types.view`
- `document_types.create`
- `document_types.update`
- `document_types.delete`

## Tablas Supabase relacionadas

- `document_types`
- `certificate_documents`

## Criterios de aceptacion

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, editar y ver detalle.
- Se puede activar/inactivar.
- RLS impide acciones sin permisos.

## Pendiente de validación

- Catalogo inicial definitivo de tipos de documentos.
- Si cada tipo debe restringir MIME types o tamanos adicionales.
