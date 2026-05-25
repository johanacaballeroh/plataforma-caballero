# Constitucion del proyecto

## Principios obligatorios

### 1. Seguridad primero

Todo acceso a datos sensibles debe estar protegido con Supabase RLS.

El frontend puede ocultar rutas, botones o acciones para mejorar la experiencia, pero la autorizacion real debe vivir en PostgreSQL/Supabase.

### 2. Reconstruccion funcional, no visual

El backoffice anterior se usa para entender negocio, datos y flujos. La interfaz final debe provenir de Sakai NG.

Queda prohibido copiar la apariencia de las capturas.

### 3. Sakai NG como sistema visual

Sakai NG es la fuente visual oficial del producto:

- login,
- layout autenticado,
- sidebar,
- topbar,
- menu responsive,
- estilos globales,
- integracion PrimeNG,
- soporte TailwindCSS.

No se debe reemplazar el layout de Sakai NG por uno creado desde cero.

### 4. Modularidad

Cada modulo funcional debe quedar aislado por feature en Angular. La logica compartida debe ir en `core` o `shared`, no duplicarse por modulo.

### 5. Coherencia con Supabase

La documentacion y la implementacion deben respetar:

- `/supabase/schema.sql`
- `/supabase/rls-policies.sql`
- `/supabase/storage-policies.sql`
- `/supabase/seed.sql`

Si una pantalla requiere un campo que no existe en el esquema, debe registrarse como inconsistencia o `Pendiente de validación`.

### 6. Trazabilidad

Toda accion critica debe registrar auditoria o metadata suficiente:

- creacion,
- edicion,
- cambio de estado,
- eliminacion,
- emision de certificado,
- generacion de PDF,
- carga de documentos,
- cambio de permisos,
- asignacion de roles,
- asociacion de usuarios con empresas.

### 7. Datos normalizados

Los catalogos deben mantenerse en tablas independientes:

- `units`,
- `categories`,
- `item_types`,
- `basel_codes`,
- `quantity_types`,
- `document_types`,
- `certificate_generation_types`.

### 8. CRUD administrativo consistente

Todo modulo CRUD debe incluir:

- listado,
- filtros por servidor,
- paginado por servidor,
- ordenamiento por servidor,
- creacion,
- edicion,
- vista detalle,
- estado activo/inactivo cuando aplique,
- confirmacion para acciones criticas,
- feedback con `p-toast`.

### 9. Historial documental

Las plantillas PDF deben versionarse. Un certificado historico debe conservar la referencia a la plantilla usada al momento de emision.

Una nueva plantilla no debe modificar certificados historicos.

## Decisiones no negociables

- No usar SSR.
- No usar Firebase.
- No usar `service_role` en frontend.
- No desactivar RLS para simplificar.
- No guardar PDFs como base64 en tablas.
- No crear backend Node propio salvo decision explicita.
- No hardcodear IDs de roles salvo en seeds controlados.
- No eliminar fisicamente roles base.
- No permitir que Cliente vea datos de empresas no asociadas.
- No copiar el diseno visual de las capturas.

## Roles base protegidos

Los roles base son:

- Administrador.
- Gerente.
- Cliente.

En base de datos se protegen mediante `roles.is_system_role` y el trigger `prevent_delete_system_roles`.

## Criterio de incertidumbre

Cuando el PDF de capturas, el SQL o el contexto disponible no permitan confirmar un dato, se debe escribir:

`Pendiente de validación`

Esto evita convertir suposiciones en contrato tecnico.
