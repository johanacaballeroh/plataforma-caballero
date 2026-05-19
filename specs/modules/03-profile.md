# Módulo 03: Perfil

## Propósito

Permitir que el usuario autenticado consulte y actualice datos básicos de su cuenta.

## Pantallas identificadas

- Ver perfil.
- Editar perfil.
- Cambiar contraseña.

## Campos detectados

Campos existentes en esquema:

- `full_name`
- `email`
- `phone`
- `avatar_url`
- `status`

Campos de autenticación:

- contraseña actual: `Pendiente de validación` según flujo Supabase.
- nueva contraseña.
- confirmación de nueva contraseña.

## Entidades relacionadas

- Perfil.
- Roles.
- Empresas asociadas.

## Reglas de negocio

- Cada usuario puede ver su propio perfil.
- Cada usuario puede editar solo los campos permitidos de su propio perfil.
- El email proviene de Supabase Auth y debe tratarse con cuidado.
- La contraseña se actualiza mediante Supabase Auth.
- Los roles y empresas se muestran como información, no se editan desde Perfil.

## Validaciones sugeridas

- Nombre obligatorio.
- Email solo lectura salvo decisión posterior.
- Teléfono opcional.
- Nueva contraseña con longitud mínima definida por Supabase/proyecto.
- Confirmación de contraseña debe coincidir.

## Permisos requeridos

- Sesión autenticada.
- No requiere permiso administrativo para perfil propio.

## Tablas Supabase relacionadas

- `profiles`
- `user_roles`
- `roles`
- `user_companies`
- `companies`

## Criterios de aceptación

- El usuario ve su información personal.
- El usuario actualiza su nombre y teléfono si están permitidos.
- El usuario puede cambiar contraseña mediante Supabase Auth.
- No puede editar roles ni empresas desde esta pantalla.
- RLS permite acceso al perfil propio.
- La UI respeta Sakai NG.

## Pendiente de validación

- Edición de avatar.
- Edición de email.
- Doble factor.
