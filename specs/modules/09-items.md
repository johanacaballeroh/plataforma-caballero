# Modulo 09: Items

## Proposito

Gestionar items valorizables o residuos que pueden asociarse a certificados.

## Pantallas identificadas

- Listado de items.
- Crear item.
- Editar item.
- Detalle de item.

## Campos detectados

Desde `items`:

- `code`
- `name`
- `description`
- `unit_id`
- `category_id`
- `item_type_id`
- `basel_code_id`
- `status`

## Entidades relacionadas

- Unidades.
- Categorias.
- Tipos de items.
- Codigos Basilea.
- Certificados.
- Items de certificado.

## Reglas de negocio

- `code` debe ser unico.
- Item debe tener unidad, categoria y tipo.
- Codigo Basilea es opcional segun esquema.
- Items inactivos no deberian seleccionarse en nuevos certificados.
- No eliminar items usados en certificados sin validar impacto.

## Validaciones sugeridas

- Codigo obligatorio y unico.
- Nombre obligatorio.
- Unidad obligatoria.
- Categoria obligatoria.
- Tipo de item obligatorio.
- Estado permitido: `active`, `inactive`.

## Permisos requeridos

- `items.view`
- `items.create`
- `items.update`
- `items.delete`

## Tablas Supabase relacionadas

- `items`
- `units`
- `categories`
- `item_types`
- `basel_codes`
- `certificate_items`

## Criterios de aceptacion

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, editar y ver detalle.
- Los selects cargan catalogos activos desde Supabase.
- RLS impide acciones sin permisos.
- Los items inactivos se muestran con tag de estado.

## Pendiente de validación

- Regla final para eliminar items relacionados con certificados.
- Formato exacto del codigo de item.
