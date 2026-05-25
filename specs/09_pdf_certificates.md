# Certificados PDF

## Objetivo

Gestionar la generacion y trazabilidad de PDFs de certificados sin perder historial documental.

## Principios

- Las plantillas PDF deben versionarse.
- Un certificado emitido debe conservar la plantilla usada.
- Una plantilla nueva no debe modificar certificados historicos.
- Los PDFs generados no se guardan como base64 en tablas.
- Los archivos viven en Supabase Storage.
- Las tablas guardan metadata y referencias.

## Tablas relacionadas

### `certificate_template_versions`

Representa versiones de plantillas.

Campos clave:

- `certificate_generation_type_id`
- `version_number`
- `name`
- `storage_bucket`
- `storage_path`
- `uploaded_by`
- `active_from`
- `active_to`
- `is_active`
- `is_locked`

### `certificate_files`

Representa PDFs generados para certificados.

Campos clave:

- `certificate_id`
- `template_version_id`
- `file_name`
- `storage_bucket`
- `storage_path`
- `version_number`
- `is_current`
- `generated_by`
- `generated_at`

### `certificates`

Debe conservar:

- `template_version_id`
- `status`
- `issued_at`

## Buckets

- `certificate-templates`: plantillas PDF.
- `generated-certificates`: PDFs generados.
- `certificate-documents`: documentos adjuntos.

Los buckets son privados.

## Flujo esperado

1. Administrador o Gerente con permiso sube una plantilla PDF.
2. Se crea una fila en `certificate_template_versions`.
3. Solo una plantilla activa por tipo de generacion puede quedar vigente.
4. Al emitir un certificado, se selecciona la plantilla activa correspondiente.
5. Se genera el PDF.
6. Se guarda el archivo en `generated-certificates`.
7. Se crea metadata en `certificate_files`.
8. Se conserva `template_version_id` en `certificates` o en `certificate_files`.

## Permisos

- Ver plantillas: `certificate_templates.view`
- Crear/subir plantillas: `certificate_templates.create`
- Actualizar plantillas: `certificate_templates.update`
- Emitir/generar PDF: `certificates.issue`
- Ver/descargar PDF: `certificates.print`

## Reglas de negocio

- No modificar una plantilla historica usada por certificados emitidos.
- Una nueva plantilla debe crear nueva version.
- Al reemplazar una plantilla activa, la anterior debe quedar cerrada mediante `active_to` o `is_active = false`.
- Un certificado emitido no debe perder su PDF anterior si se regenera; debe versionarse en `certificate_files`.

## Pendiente de validacion

- Herramienta exacta para rellenar plantillas PDF.
- Campos exactos que debe contener cada plantilla.
- Si la emision bloquea completamente la edicion posterior del certificado.
- Si se permite regenerar PDF de un certificado emitido y bajo que permisos.
