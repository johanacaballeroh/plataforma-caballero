# Modulo 07: Certificados

## Proposito

Gestionar certificados de valorizacion de residuos, sus items, documentos adjuntos, emision y PDF generado.

## Pantallas identificadas

- Listado de certificados.
- Crear certificado.
- Editar certificado.
- Detalle de certificado.
- Gestion de items del certificado.
- Gestion de documentos adjuntos.
- Vista o descarga de PDF.
- Emision de certificado.

## Campos detectados

Desde `certificates`:

- `certificate_number`
- `generation_type_id`
- `template_version_id`
- `issue_date`
- `service_date`
- `plate`
- `generation_source`
- `arrival_address`
- `generator_company_id`
- `transporter_company_id`
- `final_destination_company_id`
- `destination_place`
- `observations`
- `status`
- `issued_at`

Items:

- `item_id`
- `quantity_type_id`
- `quantity`
- `weight`
- `price`
- `description`
- `sort_order`

Documentos:

- `document_type_id`
- `file_name`
- `storage_path`
- `mime_type`
- `size_bytes`

## Entidades relacionadas

- Empresas.
- Items.
- Unidades.
- Categorias.
- Tipos de items.
- Codigos Basilea.
- Tipos de cantidad.
- Tipos de documentos.
- Tipos de generacion.
- Plantillas PDF.
- Archivos generados.

## Reglas de negocio

- Un certificado puede tener multiples items.
- Un certificado puede tener multiples documentos adjuntos.
- El PDF debe generarse desde una plantilla versionada.
- La plantilla usada debe quedar registrada.
- Cliente solo ve certificados asociados a sus empresas.
- Emitir certificado requiere permiso especifico.
- El estado `issued` debe preservar trazabilidad.

## Validaciones sugeridas

- Numero obligatorio y unico.
- Tipo de generacion obligatorio.
- Fecha de emision obligatoria.
- Empresa generadora obligatoria.
- Empresas seleccionadas deben estar activas.
- Al menos un item antes de emitir: `Pendiente de validación`.
- Cantidades, pesos y precios no negativos.
- Documentos con tipo valido y tamano permitido.

## Permisos requeridos

- `certificates.view`
- `certificates.view_own`
- `certificates.create`
- `certificates.update`
- `certificates.delete`
- `certificates.issue`
- `certificates.print`

## Tablas Supabase relacionadas

- `certificates`
- `certificate_items`
- `certificate_documents`
- `certificate_files`
- `certificate_template_versions`
- `certificate_generation_types`
- `companies`
- `items`
- `quantity_types`
- `document_types`

## Criterios de aceptacion

- El listado usa paginado, filtros y ordenamiento por servidor.
- Cliente solo ve certificados permitidos por RLS.
- Se puede crear certificado con datos minimos.
- Se pueden administrar items relacionados.
- Se pueden adjuntar documentos en Storage.
- Se puede emitir certificado si cumple validaciones.
- Se genera PDF registrando metadata en `certificate_files`.
- Se conserva `template_version_id`.

## Pendiente de validación

- Reglas de numeracion.
- Estados y transiciones exactas.
- Obligatoriedad de transportista y destino final por tipo de generacion.
- Campos `start_date`, `end_date` u `origin_place` mencionados en documentacion previa no existen en esquema actual.
