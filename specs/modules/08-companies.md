# Módulo 08: Empresas

## Propósito

Gestionar empresas involucradas en certificados como generadoras, transportistas o destino final.

## Pantallas identificadas

- Listado de empresas.
- Crear empresa.
- Detalle de empresa.
- Editar empresa.
- Sucursales.
- Contactos.

## Campos detectados

Empresa:

- `company_type`
- `ruc`
- `business_name`
- `trade_name`
- `fiscal_address`
- `status`

Sucursal:

- `branch_type`
- `name`
- `address`
- `status`

Contacto:

- `full_name`
- `position`
- `email`
- `phone`
- `status`

## Entidades relacionadas

- Certificados.
- Usuarios Cliente.
- Sucursales.
- Contactos.

## Reglas de negocio

- El RUC debe ser único.
- Una empresa puede tener muchas sucursales.
- Una empresa puede tener muchos contactos.
- Usuarios Cliente acceden a certificados mediante `user_companies`.
- Empresas inactivas no deberían seleccionarse en nuevos certificados.

## Validaciones sugeridas

- Tipo de empresa obligatorio.
- RUC obligatorio de 11 caracteres.
- Razón social obligatoria.
- Dirección fiscal sugerida.
- Email de contacto con formato válido.
- Sucursal debe tener dirección.

## Permisos requeridos

- `companies.view`
- `companies.create`
- `companies.update`
- `companies.delete`

## Tablas Supabase relacionadas

- `companies`
- `company_branches`
- `company_contacts`
- `user_companies`
- `certificates`

## Criterios de aceptación

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear y editar empresa.
- Se pueden gestionar sucursales y contactos.
- No se duplican RUC.
- Empresas inactivas se identifican visualmente.
- RLS limita acceso de Cliente a empresas asociadas.

## Pendiente de validación

- Catálogo exacto de tipos de empresa visible en capturas.
- Campos adicionales legales o comerciales.
- Reglas de baja si la empresa tiene certificados.
