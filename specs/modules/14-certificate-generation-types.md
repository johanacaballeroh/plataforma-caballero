# Modulo 14: Tipos de generacion de certificado

## Proposito

Gestionar tipos de generacion de certificado y reglas visuales/funcionales asociadas a campos de destino.

## Pantallas identificadas

- Listado de tipos de generacion.
- Crear tipo de generacion.
- Editar tipo de generacion.
- Detalle de tipo de generacion.
- Asociacion con plantilla PDF activa para generacion de certificados.

## Campos detectados

Desde `certificate_generation_types`:

- `name`
- `description` (Declaracion Legal usada como texto del certificado PDF)
- `show_final_destination_company`
- `show_destination_place`
- `status`

Relaciones indirectas:

- plantillas en `certificate_template_versions`.

## Entidades relacionadas

- Certificados.
- Plantillas PDF.
- Empresas destino final.

## Reglas de negocio

- `name` debe ser unico.
- `show_final_destination_company` controla si el formulario de certificado debe mostrar destino final.
- `show_destination_place` controla si el formulario de certificado debe mostrar lugar de destino.
- Tipos inactivos no deberian seleccionarse en nuevos certificados.
- Las plantillas PDF se versionan por tipo de generacion.
- Cada tipo de generacion debe tener una plantilla PDF asociada.
- Al adjuntar un nuevo PDF desde el formulario se crea una nueva version activa en `certificate_template_versions`.
- La plantilla activa anterior debe quedar inactiva para no modificar certificados historicos.
- En el detalle debe existir un boton `Ver PDF` para abrir la plantilla de certificado activa mediante URL firmada.
- En las vistas de editar y detalle debe mostrarse el historial de plantillas con version, fecha de subida, cantidad de certificados asociados y accion para ver el PDF.

## Validaciones sugeridas

- Nombre obligatorio y unico.
- Declaracion Legal opcional.
- Flags booleanos obligatorios.
- Estado permitido: `active`, `inactive`.

## Permisos requeridos

- `certificate_generation_types.view`
- `certificate_generation_types.create`
- `certificate_generation_types.update`
- `certificate_generation_types.delete`
- `certificate_templates.view`
- `certificate_templates.create`
- `certificate_templates.update`

## Tablas Supabase relacionadas

- `certificate_generation_types`
- `certificate_template_versions`
- `certificates`

## Criterios de aceptacion

- El listado usa paginado, filtros y ordenamiento por servidor.
- Se puede crear, editar y ver detalle.
- El formulario permite adjuntar la plantilla de certificado en PDF.
- La vista detalle permite abrir la plantilla activa con `Ver PDF`.
- Las vistas de editar y detalle muestran el historial de plantillas versionadas.
- Cada plantilla historica muestra cuantos certificados usan esa version.
- Los flags afectan formularios futuros de certificados.
- RLS impide acciones sin permisos.
- No se modifican certificados historicos al cambiar plantillas.

## Pendiente de validación

- Si existen mas flags funcionales observados en capturas que aun no estan en SQL.
