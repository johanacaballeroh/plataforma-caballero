# Módulo 02: Dashboard

## Propósito

Mostrar una vista inicial operativa con indicadores y accesos rápidos según permisos del usuario autenticado.

## Pantallas identificadas

- Dashboard principal.

## Campos detectados

Indicadores sugeridos por documentación existente:

- cantidad de usuarios,
- cantidad de empresas,
- cantidad de ítems,
- cantidad de certificados.

`Pendiente de validación`: métricas exactas observadas en capturas.

## Entidades relacionadas

- Usuarios.
- Empresas.
- Ítems.
- Certificados.
- Permisos.

## Reglas de negocio

- El Dashboard debe respetar permisos.
- Administrador y Gerente pueden ver métricas operativas generales.
- Cliente no debe ver métricas globales de otras empresas.
- Los accesos rápidos deben filtrarse por permisos.
- El diseño debe venir de Sakai NG.

## Validaciones sugeridas

- Validar sesión activa.
- Validar permiso `dashboard.view`.
- Manejar métricas sin datos.
- Manejar errores de RLS sin exponer detalles técnicos.

## Permisos requeridos

- `dashboard.view`

## Tablas Supabase relacionadas

- `profiles`
- `companies`
- `items`
- `certificates`
- `user_companies`

## Criterios de aceptación

- El usuario autenticado con permiso accede al dashboard.
- Las métricas se calculan desde Supabase con RLS activo.
- Cliente solo ve información permitida por sus empresas asociadas.
- Los accesos rápidos se ocultan si no hay permiso.
- La pantalla mantiene layout, cards y estilo de Sakai NG.

## Pendiente de validación

- Indicadores definitivos.
- Necesidad de gráficos.
- Rango temporal por defecto para métricas.
