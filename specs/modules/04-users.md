# Modulo 04: Usuarios

## Proposito

Gestionar usuarios del sistema, sus perfiles, roles y asociaciones con empresas.

## Pantallas identificadas

- Listado de usuarios.
- Crear usuario.
- Editar usuario.
- Detalle de usuario.
- Asignacion de roles.
- Asociacion con empresas.

## Campos detectados

Desde `profiles`:

- `full_name`
- `email`
- `phone`
- `avatar_url`
- `status`

Relaciones:

- `role_id` mediante `user_roles`
- `company_id` mediante `user_companies`

Campos de creacion Auth:

- contrasena inicial: `Pendiente de validación`.

## Entidades relacionadas

- Perfiles.
- Roles.
- Permisos.
- Empresas.
- Supabase Auth.

## Reglas de negocio

- Un usuario puede tener uno o mas roles.
- Un usuario Cliente debe asociarse a una o mas empresas para ver certificados propios.
- El usuario administrador inicial existe en seed/dev con email configurable y contrasena inicial `123456`.
- La gestion de usuarios no debe exponer claves privilegiadas en frontend.
- Inactivar usuario debe impedir operacion futura.

## Validaciones sugeridas

- Nombre obligatorio.
- Email obligatorio, unico y con formato valido.
- Rol obligatorio.
- Empresa obligatoria si el rol efectivo es Cliente: `Pendiente de validación`.
- Estado permitido: `active`, `inactive`.

## Permisos requeridos

- `users.view`
- `users.create`
- `users.update`
- `users.delete`

## Tablas Supabase relacionadas

- `profiles`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `companies`
- `user_companies`

## Criterios de aceptacion

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede consultar detalle de usuario.
- Se pueden asignar roles mediante `user_roles`.
- Se pueden asociar empresas mediante `user_companies`.
- RLS impide gestionar usuarios sin permisos.
- No se usa `service_role` en frontend.

## Pendiente de validación

- Mecanismo final de alta de usuarios Auth desde frontend.
- Si se permite eliminar o solo inactivar usuarios.
- Flujo de reseteo de contrasena.
