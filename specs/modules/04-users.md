# Módulo 04: Usuarios

## Propósito

Administrar usuarios del sistema, sus perfiles, roles y empresas asociadas.

## Pantallas identificadas

- Listado de usuarios.
- Crear usuario.
- Detalle de usuario.
- Editar usuario.
- Asignación de roles.
- Asociación con empresas para Cliente.

## Campos detectados

Desde esquema:

- `full_name`
- `email`
- `phone`
- `avatar_url`
- `status`

Relaciones:

- roles asociados.
- empresas asociadas.

Campos de creación Auth:

- contraseña inicial: `Pendiente de validación`.

## Entidades relacionadas

- Perfil.
- Roles.
- Permisos.
- Empresas.

## Reglas de negocio

- El email debe ser único.
- Un usuario Cliente debe asociarse al menos a una empresa para poder ver certificados.
- Los roles se asignan con `user_roles`.
- Las empresas se asignan con `user_companies`.
- No mostrar contraseñas en detalle.
- Inactivar usuario debe impedir operación normal.

## Validaciones sugeridas

- Nombre obligatorio.
- Email obligatorio y válido.
- Email único.
- Al menos un rol.
- Empresa obligatoria si el rol asignado es Cliente.
- Estado obligatorio.

## Permisos requeridos

- `users.view`
- `users.create`
- `users.update`
- `users.delete` o cambio de estado según decisión final.

## Tablas Supabase relacionadas

- `profiles`
- `user_roles`
- `roles`
- `user_companies`
- `companies`

## Criterios de aceptación

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear o registrar usuario según flujo Supabase validado.
- Se pueden asignar roles.
- Se pueden asociar empresas.
- Cliente sin empresa asociada no queda operativo.
- No se exponen contraseñas.
- RLS protege la gestión.

## Pendiente de validación

- Flujo exacto para crear usuarios Auth desde SPA sin backend propio.
- Si Administrador puede resetear contraseña.
- Si se permite más de un rol por usuario en UI.
