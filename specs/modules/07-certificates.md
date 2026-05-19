# Módulo 07: Certificados

## Propósito

Gestionar certificados de valorización de residuos, sus ítems, documentos adjuntos, emisión y PDF generado.

## Pantallas identificadas

- Listado de certificados.
- Crear certificado.
- Detalle de certificado.
- Editar certificado.
- Gestión de ítems del certificado.
- Gestión de documentos adjuntos.
- Vista o descarga de PDF.

## Campos detectados

Desde esquema actual:

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

Ítems:

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
- Ítems.
- Unidades.
- Categorías.
- Tipos de ítems.
- Códigos Basilea.
- Tipos de cantidad.
- Tipos de documentos.
- Tipos de generación.
- Plantillas PDF.
- Archivos generados.

## Reglas de negocio

- Un certificado puede tener múltiples ítems.
- Un certificado puede tener múltiples documentos adjuntos.
- El PDF debe generarse desde una plantilla versionada.
- La plantilla usada debe quedar registrada.
- Cliente solo ve certificados asociados a sus empresas.
- Emitir certificado requiere permiso específico.
- El estado `issued` debe preservar trazabilidad.

## Validaciones sugeridas

- Número obligatorio y único.
- Tipo de generación obligatorio.
- Fecha de emisión obligatoria.
- Empresa generadora obligatoria.
- Empresas seleccionadas deben estar activas.
- Al menos un ítem antes de emitir: `Pendiente de validación`.
- Cantidades, pesos y precios no negativos.
- Documentos con tipo válido y tamaño permitido.

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

## Criterios de aceptación

- El listado usa paginado, filtros y ordenamiento por servidor.
- Cliente solo ve certificados permitidos por RLS.
- Se puede crear certificado con datos mínimos.
- Se pueden administrar ítems relacionados.
- Se pueden adjuntar documentos en Storage.
- Se puede emitir certificado si cumple validaciones.
- Se genera PDF registrando metadata en `certificate_files`.
- Se conserva `template_version_id`.

## Pendiente de validación

- Reglas de numeración.
- Estados y transiciones exactas.
- Obligatoriedad de transportista y destino final por tipo de generación.
- Campos `start_date`, `end_date` u `origin_place` mencionados en documentación previa no existen en esquema actual.
