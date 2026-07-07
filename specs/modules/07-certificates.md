# Modulo 07: Certificados

## Proposito

Gestionar certificados de valorizacion de residuos, sus items, documentos adjuntos y PDF generado.

## Pantallas identificadas

- Listado de certificados.
- Crear certificado.
- Editar certificado.
- Detalle de certificado.
- Gestion de items del certificado.
- Gestion de documentos adjuntos.
- Vista o descarga del unico PDF del certificado.

## Campos detectados en capturas

Listado:

- ID visual de fila.
- Numero.
- Empresa generadora.
- Empresa transportista.
- Fecha de emision.
- Estado.
- Acciones.

Formulario:

- Numero de documento generado automaticamente.
- Tipo de generacion.
- Fecha de operacion.
- Fecha de emision.
- Numero de guia.
- Empresa generadora.
- Direccion de empresa generadora.
- Origen de la generacion.
- Empresa transportista.
- Direccion de empresa transportista.
- Informacion adicional de operacion.
- Items del certificado dentro del mismo formulario.
- Documentos adjuntos dentro del mismo formulario.

Items:

- Item.
- Unidad derivada del item.
- Codigo Basilea derivado del item.
- Tipo de cantidad.
- Cantidad.
- Peso.
- Descripcion.

Documentos adjuntos:

- Tipo de documento.
- Archivo.
- Estado del archivo.
- Accion ver o descargar.

PDF del certificado:

- Cada certificado corresponde a un unico PDF generado.
- El boton para ver o descargar el PDF solo se muestra en la pantalla de detalle.
- No existe una seccion visible de PDFs generados dentro del formulario.

## Campos de datos

Desde `certificates`:

- `certificate_number` generado automaticamente con formato `YYYY - NNNN`.
- `generation_type_id`.
- `template_version_id` resuelto automaticamente desde la plantilla activa del tipo de generacion.
- `issue_date`.
- `operation_date`.
- `guide_number`.
- `generation_source`.
- `generator_address`.
- `transporter_address`.
- `generator_company_id`.
- `transporter_company_id`.
- `final_destination_company_id`.
- `destination_place`.
- `observations`.
- `status`.
- `issued_at`.

Items:

- `item_id`.
- `quantity_type_id`.
- `quantity`.
- `weight`.
- `description`.
- `sort_order`.

Documentos:

- `document_type_id`.
- `file_name`.
- `storage_path`.
- `mime_type`.
- `size_bytes`.

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
- La ficha, items y documentos adjuntos conforman un unico formulario de certificado para alta y edicion.
- El PDF debe generarse desde una plantilla versionada.
- La plantilla usada debe quedar registrada.
- Un certificado tiene un solo PDF generado asociado.
- Al guardar un certificado nuevo se genera el PDF y luego se muestra la pantalla de detalle.
- Al editar y guardar un certificado se regenera el PDF snapshot con el contenido vigente.
- Cada tipo de generacion esta ligado a una plantilla activa especifica.
- El numero de certificado no se ingresa manualmente; se genera por anio de emision.
- Cliente solo ve certificados asociados a sus empresas.

## Validaciones sugeridas

- Numero obligatorio y unico, generado por sistema.
- Tipo de generacion obligatorio.
- Fecha de operacion obligatoria.
- Fecha de emision obligatoria.
- Numero de guia obligatorio.
- Empresa generadora obligatoria.
- Empresa transportista obligatoria.
- Empresas seleccionadas deben estar activas.
- Al menos un item antes de generar PDF: `Pendiente de validacion`.
- Cantidades y pesos no negativos.
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
- Se puede consultar o descargar el unico PDF generado desde Ver Certificado.
- Se genera PDF al crear y al editar, registrando metadata en `certificate_files`.
- Se conserva `template_version_id`.

## Pendiente de validacion

- Transiciones exactas para activar/inactivar certificados.
- Obligatoriedad de destino final por tipo de generacion.
- Campos `start_date`, `end_date` u `origin_place` mencionados en documentacion previa no existen en esquema actual.
