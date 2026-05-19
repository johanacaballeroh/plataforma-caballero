# Certificados PDF

## Propósito

Definir reglas para generación, almacenamiento y trazabilidad de PDFs de certificados.

## Principio principal

Los certificados históricos deben conservar la plantilla usada al momento de emisión.

Una nueva plantilla no debe modificar PDFs ya generados ni alterar el significado histórico de certificados emitidos.

## Tablas relacionadas

### `certificate_template_versions`

Versiona plantillas.

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

### `certificates`

Guarda la referencia a la plantilla usada:

- `template_version_id`

### `certificate_files`

Registra cada PDF generado.

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

## Buckets

- `certificate-templates`: plantillas PDF privadas.
- `generated-certificates`: PDFs generados privados.

## Reglas de generación

1. El certificado debe tener datos mínimos válidos.
2. Debe existir una plantilla activa para el tipo de generación.
3. Al emitir o generar PDF, se debe registrar `template_version_id`.
4. El PDF generado debe guardarse en Storage.
5. La metadata debe guardarse en `certificate_files`.
6. Si se regenera un PDF, debe incrementarse `certificate_files.version_number`.
7. Solo un archivo por certificado debe tener `is_current = true`.

## Permisos

- Ver plantillas: `certificate_templates.view`.
- Crear plantillas: `certificate_templates.create`.
- Actualizar plantillas: `certificate_templates.update`.
- Emitir/generar certificado: `certificates.issue`.
- Ver/descargar PDF: `certificates.print` o acceso por RLS al certificado.

## Pendientes de validación

- Motor final de generación PDF en frontend o servicio externo.
- Plantillas exactas por tipo de generación.
- Campos variables dentro de cada plantilla.
- Reglas de numeración visible en PDF.
- Si se requiere firma digital, sello o código QR.
- Si el PDF debe bloquearse después de emitido.

## Restricciones

- No guardar PDFs como base64 en tablas.
- No usar buckets públicos.
- No sobrescribir plantillas históricas.
- No generar PDFs sin metadata.
- No permitir a Cliente acceder a PDFs de certificados no asociados a sus empresas.
