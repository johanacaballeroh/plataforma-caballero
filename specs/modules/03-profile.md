# Modulo 03: Perfil

## Proposito

Permitir que el usuario autenticado consulte y actualice sus datos personales permitidos.

## Pantallas identificadas

- Vista de perfil.
- Edicion de datos personales.
- Cambio de contrasena.
- Empresas asociadas en modo lectura para Cliente.

## Campos detectados

Desde `profiles`:

- `full_name`
- `email`
- `phone`
- `avatar_url`
- `status`

Campos de Auth:

- contrasena actual: `Pendiente de validación`.
- nueva contrasena: `Pendiente de validación`.

## Entidades relacionadas

- Perfil.
- Roles.
- Empresas asociadas.
- Supabase Auth.

## Reglas de negocio

- Un usuario puede ver su propio perfil.
- Un usuario puede actualizar solo los campos permitidos de su perfil.
- El email esta sincronizado con Auth y no debe cambiarse sin flujo confirmado.
- Roles y empresas asociadas se muestran como informacion, no se editan desde Perfil.

## Validaciones sugeridas

- Nombre obligatorio.
- Email visible y con formato valido, preferentemente solo lectura.
- Telefono opcional con longitud razonable.
- Avatar opcional mediante Storage: `Pendiente de validación`.
- Nueva contrasena con longitud minima definida por Supabase/proyecto.

## Permisos requeridos

- Usuario autenticado.
- La actualizacion propia se controla por RLS en `profiles_update_own`.

## Tablas Supabase relacionadas

- `profiles`
- `roles`
- `user_roles`
- `companies`
- `user_companies`

## Criterios de aceptacion

- El usuario ve sus datos actuales.
- El usuario actualiza solo campos permitidos.
- Roles y empresas asociadas se muestran en modo lectura.
- El formulario muestra validaciones.
- RLS impide editar perfiles ajenos.

## Pendiente de validación

- Cambio de email.
- Carga de avatar.
- Flujo exacto de cambio de contrasena.
