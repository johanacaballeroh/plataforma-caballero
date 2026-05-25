# Modulo 01: Login

## Proposito

Permitir el acceso seguro al backoffice mediante Supabase Auth, reutilizando la pantalla de login de Sakai NG como base visual.

## Pantallas identificadas

- Login.
- Recuperacion o cambio de contrasena: `Pendiente de validación`.
- Estado de acceso denegado o sesion expirada.

## Campos detectados

- `email`
- `password`

Campos auxiliares:

- recordatorio visual de errores de autenticacion.
- opcion de recuperar contrasena: `Pendiente de validación`.

## Entidades relacionadas

- Usuario autenticado de Supabase Auth.
- Perfil.
- Roles.
- Permisos.
- Empresas asociadas.

## Reglas de negocio

- El login debe usar Supabase Auth.
- Las rutas internas deben requerir sesion activa.
- Despues del login se debe cargar `profiles`, `user_roles`, `role_permissions` y `user_companies`.
- Usuarios inactivos no deben poder operar en el sistema.
- El usuario Cliente solo accede a informacion relacionada con sus empresas.
- La pantalla debe adaptar Sakai NG, no copiar capturas.

## Validaciones sugeridas

- Email obligatorio y con formato valido.
- Contrasena obligatoria.
- Mensaje claro ante credenciales invalidas.
- Mensaje claro ante usuario inactivo o sin permisos.

## Permisos requeridos

- No requiere permiso granular antes de autenticar.
- Despues del login, el menu y rutas dependen de permisos cargados desde Supabase.

## Tablas Supabase relacionadas

- `profiles`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `user_companies`
- `companies`

## Criterios de aceptacion

- El usuario puede iniciar sesion con email y contrasena validos.
- El usuario no autenticado no puede acceder a rutas internas.
- El usuario autenticado carga perfil, roles, permisos y empresas asociadas.
- La UI del login conserva estructura visual Sakai NG.
- No se usa `service_role` en frontend.

## Pendiente de validación

- Flujo final de recuperacion de contrasena.
- Politica para forzar cambio de contrasena inicial `123456` en entorno seed/dev.
