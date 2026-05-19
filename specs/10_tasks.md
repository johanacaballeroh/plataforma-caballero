# Plan de tareas

## Estado de este SDD

Este plan organiza la implementación futura. La tarea actual solo autoriza documentación SDD.

## Fase 0: Validación documental

- Revisar capturas como fuente funcional.
- Mantener Sakai NG como fuente visual.
- Validar specs contra `/supabase/schema.sql`.
- Marcar incertidumbres como `Pendiente de validación`.
- Mantener índice de módulos actualizado.

## Fase 1: Setup del proyecto

- Clonar o copiar Sakai NG como base inicial del frontend.
- No usar un proyecto Angular vacío como punto de partida.
- Reincorporar `/AGENTS.md`, `/specs`, `/reference` y `/supabase` al workspace basado en Sakai NG.
- Verificar Angular 21.
- Verificar PrimeNG compatible.
- Mantener la configuración PrimeNG/TailwindCSS original de Sakai NG.
- Configurar Supabase JS Client.
- Configurar environments sin secretos.
- Configurar rutas base.
- Adaptar login de Sakai NG a Supabase Auth.
- Adaptar layout principal de Sakai NG.
- Configurar guards de autenticación y permisos.
- Crear estructura `core/shared/features`.

## Fase 2: Supabase

- Revisar `schema.sql`.
- Ejecutar o validar `seed.sql`.
- Ejecutar o validar `rls-policies.sql`.
- Ejecutar o validar `storage-policies.sql`.
- Confirmar buckets privados.
- Confirmar usuario administrador inicial solo para entorno seed/dev.

## Fase 3: Autenticación y sesión

- Implementar login.
- Implementar logout.
- Implementar carga de perfil.
- Implementar carga de roles.
- Implementar carga de permisos.
- Implementar asociaciones de empresa para Cliente.

## Fase 4: Layout y navegación

- Reutilizar el layout real de Sakai NG clonado.
- Adaptar sidebar a módulos del sistema.
- Filtrar menú por permisos.
- Adaptar topbar.
- Agregar menú de perfil.

## Fase 5: RBAC

- Implementar usuarios.
- Implementar roles y permisos.
- Bloquear eliminación de roles base.
- Validar permisos en guards.
- Validar permisos visuales en acciones.

## Fase 6: Catálogos

Implementar CRUDs:

- unidades,
- categorías,
- tipos de ítems,
- códigos Basilea,
- tipos de cantidad,
- tipos de documentos,
- tipos de generación de certificado.

## Fase 7: Empresas

- CRUD empresas.
- Sucursales.
- Contactos.
- Asociación con usuarios Cliente.

## Fase 8: Ítems

- CRUD ítems.
- Relación con catálogos.
- Validar solo catálogos activos en selects.

## Fase 9: Certificados

- Listado server-side.
- Creación.
- Edición.
- Detalle.
- Ítems del certificado.
- Documentos adjuntos.
- Emisión.
- Generación y descarga PDF.

## Fase 10: Reportes

- Reporte de certificados sobre `v_certificate_report`.
- Filtros por fecha y campos disponibles.
- Exportación si se confirma formato.
- Registro en `report_exports` si se genera archivo.

## Fase 11: Auditoría

- Vista de logs solo para Administrador.
- Confirmar triggers en tablas críticas.
- Definir filtros de logs.

## Fase 12: Hardening

- Verificar build.
- Verificar lint.
- Verificar tipos TypeScript.
- Verificar RLS.
- Verificar paginado, filtros y ordenamiento.
- Verificar responsive.
- Verificar errores y loaders.

## Dependencias de implementación

Antes de implementar cada módulo:

1. Leer `/specs/00_project_context.md`.
2. Leer `/specs/04_database_supabase.md`.
3. Leer `/specs/05_security_rbac_rls.md`.
4. Leer la spec del módulo.
5. Confirmar campos contra `/supabase/schema.sql`.

## Reinicio del frontend si se partió de Angular vacío

Si el workspace actual no proviene de Sakai NG:

1. Resguardar:
   - `/AGENTS.md`
   - `/specs/**`
   - `/reference/**`
   - `/supabase/**`
2. Borrar manualmente la instalación Angular incorrecta.
3. Clonar/copiar Sakai NG desde `https://github.com/primefaces/sakai-ng`.
4. Copiar de vuelta los archivos resguardados.
5. Repetir los prompts de configuración inicial, indicando explícitamente que el workspace ya parte de Sakai NG.
6. Adaptar, no reconstruir, login/layout/sidebar/topbar.
