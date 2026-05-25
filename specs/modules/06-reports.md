# Modulo 06: Reportes

## Proposito

Consultar y exportar informacion operacional de certificados respetando permisos y alcance por empresa.

## Pantallas identificadas

- Reporte de certificados.
- Filtros de busqueda.
- Resultado tabular.
- Exportacion.

## Campos detectados

Desde `v_certificate_report`:

- `fecha`
- `numero_ticket`
- `cliente`
- `ruc`
- `placa`
- `fuente_generacion`
- `direccion_llegada`
- `tipo`
- `cantidad`
- `unidad_medida`
- `peso`
- `codigo_basilea`
- `estado_certificado`
- `generator_company_id`

Desde `report_exports`:

- `report_type`
- `filters`
- `file_name`
- `storage_bucket`
- `storage_path`
- `generated_by`
- `generated_at`

## Entidades relacionadas

- Certificados.
- Empresas.
- Items.
- Unidades.
- Codigos Basilea.
- Exportaciones.

## Reglas de negocio

- Los reportes deben respetar RLS.
- Cliente solo ve informacion asociada a sus empresas.
- Exportar requiere permiso especifico.
- Toda exportacion debe registrar metadata en `report_exports`.

## Validaciones sugeridas

- Rango de fechas valido.
- Limitar tamano maximo de exportacion: `Pendiente de validación`.
- Mostrar estado vacio cuando no existan resultados.
- Validar formato de exportacion permitido.

## Permisos requeridos

- `reports.view`
- `reports.export`

## Tablas Supabase relacionadas

- `v_certificate_report`
- `report_exports`
- `certificates`
- `certificate_items`
- `companies`
- `items`

## Criterios de aceptacion

- El reporte usa filtros, paginado y ordenamiento por servidor.
- La vista respeta RLS y alcance por empresa.
- La exportacion solo aparece con `reports.export`.
- Cada exportacion crea registro en `report_exports`.
- La UI respeta Sakai NG y PrimeNG.

## Pendiente de validación

- Formatos de exportacion requeridos.
- Columnas finales visibles.
- Reportes adicionales fuera del reporte de certificados.
