# Constitución del proyecto

## Principios obligatorios

### 1. Seguridad primero

Todo acceso a datos sensibles debe estar protegido con Supabase RLS.

El frontend puede ocultar botones, rutas o acciones para mejorar la experiencia, pero la protección real debe vivir en PostgreSQL/Supabase.

### 2. Reconstrucción funcional, no visual

El backoffice anterior se usa para entender negocio, datos y flujos.

La interfaz visual final debe provenir de Sakai NG. No se debe reproducir la apariencia del sistema anterior.

### 3. Modularidad

Cada módulo funcional debe quedar aislado por feature en Angular.

Los módulos no deben depender directamente entre sí salvo mediante servicios, modelos o componentes compartidos.

### 4. Coherencia con Supabase

La documentación y la implementación deben respetar el esquema real:

- `/supabase/schema.sql`
- `/supabase/rls-policies.sql`
- `/supabase/storage-policies.sql`
- `/supabase/seed.sql`

Si una pantalla requiere un campo que no existe en el esquema, debe registrarse como inconsistencia o `Pendiente de validación`.

### 5. Trazabilidad

El sistema debe registrar operaciones importantes:

- creación,
- edición,
- cambio de estado,
- eliminación,
- emisión de certificado,
- generación de PDF,
- carga de documentos,
- cambio de permisos,
- asignación de roles,
- asociación de usuarios con empresas.

### 6. Datos normalizados

Los catálogos deben mantenerse en tablas independientes:

- `units`,
- `categories`,
- `item_types`,
- `basel_codes`,
- `quantity_types`,
- `document_types`,
- `certificate_generation_types`.

### 7. Experiencia administrativa clara

Todo módulo CRUD debe incluir:

- listado,
- filtros,
- paginado por servidor,
- ordenamiento por servidor,
- creación,
- edición,
- vista detalle,
- estado activo/inactivo cuando aplique,
- confirmación para acciones críticas,
- feedback con toast.

### 8. Historial documental

Las plantillas PDF deben versionarse.

Un certificado histórico debe conservar la referencia a la plantilla usada en el momento de emisión.

Una nueva plantilla no debe modificar certificados históricos.

## Decisiones no negociables

- No usar SSR.
- No usar Firebase.
- No usar `service_role` en frontend.
- No desactivar RLS para simplificar.
- No guardar PDFs como base64 en tablas.
- No crear backend Node propio salvo decisión explícita.
- No hardcodear IDs de roles salvo en seeds controlados.
- No eliminar físicamente roles base.
- No permitir que Cliente vea datos de empresas no asociadas.
- No copiar el diseño visual de las capturas.

## Roles base protegidos

Los roles base son:

- Administrador.
- Gerente.
- Cliente.

En base de datos se protegen mediante `roles.is_system_role`.

## Criterio de incertidumbre

Cuando el PDF de capturas o el esquema no permita confirmar un dato, se debe escribir:

`Pendiente de validación`.

Esto evita convertir suposiciones en contrato técnico.
