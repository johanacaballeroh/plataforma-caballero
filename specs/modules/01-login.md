# Módulo 01: Login

## Propósito

Permitir el acceso seguro al backoffice mediante Supabase Auth, reutilizando la pantalla de login de Sakai NG como base visual.

## Pantallas identificadas

- Login.
- Recuperación de contraseña: `Pendiente de validación`.

## Campos detectados

- `email`
- `password`

## Entidades relacionadas

- Usuario autenticado de Supabase Auth.
- Perfil público.
- Roles y permisos del usuario.

## Reglas de negocio

- El login debe usar Supabase Auth.
- Después de autenticarse, el usuario debe ser redirigido a `/dashboard`.
- Si el perfil está inactivo, no debe permitirse continuar.
- El menú posterior debe depender de permisos.
- La pantalla debe verse como Sakai NG, no como las capturas antiguas.

## Validaciones sugeridas

- Email obligatorio.
- Email con formato válido.
- Contraseña obligatoria.
- Mostrar error si credenciales son inválidas.
- Mostrar error si el usuario no tiene perfil o permisos válidos.

## Permisos requeridos

- No requiere permiso previo.
- Requiere sesión válida para navegar al resto del sistema.

## Tablas Supabase relacionadas

- `auth.users`
- `profiles`
- `user_roles`
- `roles`
- `role_permissions`
- `permissions`
- `user_companies`

## Criterios de aceptación

- El usuario puede iniciar sesión con email y contraseña válidos.
- El sistema bloquea credenciales inválidas.
- El sistema bloquea perfiles inactivos.
- Al iniciar sesión se cargan perfil, roles, permisos y empresas asociadas.
- El usuario autenticado llega a `/dashboard`.
- La pantalla reutiliza la estructura visual de login de Sakai NG.
- No se usa `service_role` en frontend.

## Pendiente de validación

- Flujo de recuperación de contraseña.
- Política de doble factor.
- Mensaje exacto para usuario inactivo.
