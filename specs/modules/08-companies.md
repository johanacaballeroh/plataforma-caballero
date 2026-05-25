# Modulo 08: Empresas

## Proposito

Gestionar empresas que participan en certificados como generadoras, transportistas o destino final, incluyendo sedes y contactos.

## Pantallas identificadas

- Listado de empresas.
- Crear empresa.
- Editar empresa.
- Detalle de empresa.
- Gestion de sedes o direcciones.
- Gestion de contactos.

## Campos detectados

Desde `companies`:

- `company_type`
- `ruc`
- `business_name`
- `trade_name`
- `fiscal_address`
- `status`

Desde `company_branches`:

- `branch_type`
- `name`
- `address`
- `status`

Desde `company_contacts`:

- `full_name`
- `position`
- `email`
- `phone`
- `status`

## Entidades relacionadas

- Certificados.
- Usuarios Cliente.
- Sedes.
- Contactos.

## Reglas de negocio

- `ruc` debe ser unico y tener 11 caracteres.
- La empresa puede actuar como generadora, transportista, destino final o ambos segun `company_type`.
- Cliente accede solo a empresas asociadas mediante `user_companies`.
- Empresas inactivas no deberian seleccionarse en nuevos certificados.

## Validaciones sugeridas

- RUC obligatorio, unico y de 11 digitos.
- Razon social obligatoria.
- Tipo de empresa obligatorio.
- Direccion fiscal opcional segun esquema.
- Email de contacto con formato valido.

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

## Criterios de aceptacion

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, editar y ver detalle de empresa.
- Se pueden gestionar sedes y contactos.
- RLS limita empresas visibles para Cliente.
- Las acciones se muestran segun permisos.

## Pendiente de validación

- Catalogo final de tipos de empresa.
- Si se permite eliminar empresas usadas en certificados o solo inactivar.
