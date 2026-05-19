# Módulo 06: Reportes

## Propósito

Consultar información consolidada de certificados para análisis operativo y eventual exportación.

## Pantallas identificadas

- Reporte de certificados.
- Exportación de reporte: `Pendiente de validación`.

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

## Entidades relacionadas

- Certificados.
- Empresas.
- Ítems.
- Unidades.
- Tipos de ítems.
- Códigos Basilea.
- Exportaciones.

## Reglas de negocio

- El reporte debe respetar RLS.
- Cliente no debe ver datos de empresas no asociadas.
- Los filtros deben ejecutarse por servidor.
- Si se exporta un archivo, debe registrarse en `report_exports`.

## Validaciones sugeridas

- Rango de fechas válido.
- Fecha inicial menor o igual a fecha final.
- Filtros opcionales por estado, cliente, RUC, placa o tipo si se habilitan.
- Controlar exportaciones sin resultados.

## Permisos requeridos

- `reports.view`
- `reports.export` para exportar.

## Tablas Supabase relacionadas

- `v_certificate_report`
- `report_exports`
- `certificates`
- `companies`

## Criterios de aceptación

- El reporte carga datos desde `v_certificate_report`.
- Aplica filtros por servidor.
- Aplica paginado y ordenamiento por servidor.
- Respeta restricciones de Cliente.
- Exportar requiere permiso específico.
- Las exportaciones quedan registradas si generan archivo.

## Pendiente de validación

- Formato de exportación.
- Columnas visibles finales.
- Filtros exactos observados en capturas.
