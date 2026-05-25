# Modulo 02: Dashboard

## Proposito

Mostrar una vista inicial con indicadores y accesos rapidos segun rol y permisos, sin exponer datos no autorizados.

## Pantallas identificadas

- Dashboard principal.
- Widgets de indicadores.
- Accesos rapidos a modulos permitidos.

## Campos detectados

No se identifican campos de captura como contrato cerrado.

Metricas candidatas desde el esquema:

- total de certificados.
- certificados por estado.
- certificados recientes.
- empresas activas.
- items activos.

Todo indicador final queda `Pendiente de validación` hasta confirmar con negocio.

## Entidades relacionadas

- Certificados.
- Empresas.
- Items.
- Reportes.
- Usuario autenticado.
- Permisos.

## Reglas de negocio

- Cada widget debe consultar solo informacion permitida por RLS.
- Cliente no debe ver indicadores globales si solo tiene permiso `certificates.view_own`.
- Gerente puede ver metricas operativas, excepto logs.
- Administrador puede ver indicadores completos.
- El diseno debe partir de widgets y estilos Sakai NG.

## Validaciones sugeridas

- No mostrar widgets sin datos o sin permiso.
- Mostrar estado de carga y estado vacio.
- Manejar errores de RLS como acceso no autorizado.

## Permisos requeridos

- `dashboard.view`
- Permisos especificos de cada fuente consultada, por ejemplo:
  - `certificates.view`
  - `certificates.view_own`
  - `companies.view`
  - `items.view`
  - `reports.view`

## Tablas Supabase relacionadas

- `certificates`
- `companies`
- `items`
- `v_certificate_report`

## Criterios de aceptacion

- El dashboard carga solo para usuarios autenticados.
- Los widgets se muestran segun permisos.
- Cliente no ve datos de otras empresas.
- La presentacion visual respeta Sakai NG.
- Los datos vienen de Supabase, no de mocks permanentes.

## Pendiente de validación

- Indicadores definitivos.
- Periodos por defecto para metricas.
- Si debe existir grafico de tendencia o solo KPIs.
