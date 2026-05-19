# Módulo 05: Roles y permisos

## Propósito

Administrar roles del sistema y su matriz de permisos.

## Pantallas identificadas

- Listado de roles.
- Crear rol.
- Detalle de rol.
- Editar rol.
- Matriz de permisos.

## Campos detectados

Roles:

- `name`
- `description`
- `is_system_role`
- `status`

Permisos:

- `module_key`
- `action_key`
- `description`

## Entidades relacionadas

- Roles.
- Permisos.
- Usuarios asociados a roles.

## Reglas de negocio

- Los roles base no se eliminan.
- Los roles con `is_system_role = true` están protegidos.
- Los permisos se agrupan por módulo.
- Crear o editar roles debe registrar auditoría.
- Gerente no debe tener permiso `logs.view`.
- Cliente debe quedar limitado a certificados propios.

## Validaciones sugeridas

- Nombre obligatorio.
- Nombre único.
- Estado obligatorio.
- Al menos un permiso para roles operativos.
- No permitir modificar protección de roles base desde UI.

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

## Criterios de aceptación

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se pueden crear roles personalizados.
- Se pueden editar permisos por módulo.
- No se pueden eliminar roles base.
- No se puede quitar accidentalmente protección de roles base.
- Los cambios impactan navegación y guards luego de recargar permisos.

## Pendiente de validación

- Si roles base pueden editar descripción o permisos.
- Si se requiere clonación de roles.
