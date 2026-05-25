# Modulo 05: Roles y permisos

## Proposito

Gestionar roles del sistema y su matriz de permisos por modulo y accion.

## Pantallas identificadas

- Listado de roles.
- Crear rol.
- Editar rol.
- Detalle de rol.
- Matriz de permisos.

## Campos detectados

Desde `roles`:

- `name`
- `description`
- `is_system_role`
- `status`

Desde `permissions`:

- `module_key`
- `action_key`
- `description`

Relaciones:

- `permission_id` mediante `role_permissions`

## Entidades relacionadas

- Roles.
- Permisos.
- Usuarios.

## Reglas de negocio

- Los roles base Administrador, Gerente y Cliente no deben eliminarse.
- Los roles base estan marcados con `is_system_role`.
- Administrador recibe todos los permisos.
- Gerente recibe permisos operativos excepto logs.
- Cliente recibe permisos limitados a certificados propios y PDF.
- Cambiar permisos impacta el menu, rutas y acciones disponibles.

## Validaciones sugeridas

- Nombre obligatorio y unico.
- Descripcion opcional.
- Al menos un permiso para roles personalizados: `Pendiente de validación`.
- No permitir eliminar roles base.
- No permitir dejar Administrador sin permisos criticos: `Pendiente de validación`.

## Permisos requeridos

- `roles.view`
- `roles.create`
- `roles.update`
- `roles.delete`

## Tablas Supabase relacionadas

- `roles`
- `permissions`
- `role_permissions`
- `user_roles`

## Criterios de aceptacion

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se muestran permisos agrupados por modulo.
- Se impide eliminar roles base.
- Se actualiza la matriz de permisos en `role_permissions`.
- RLS impide cambios sin permisos.

## Pendiente de validación

- Si roles personalizados pueden copiar permisos desde roles base.
- Si se permite inactivar roles asignados a usuarios.
