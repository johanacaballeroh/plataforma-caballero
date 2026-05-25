# Plan de tareas

## Estado actual

El workspace esta basado en Sakai NG con Angular 21, PrimeNG y TailwindCSS. La base de datos Supabase ya cuenta con scripts en `/supabase`.

Esta etapa documenta el SDD. No implementa codigo Angular ni SQL.

## Tareas de documentacion SDD

- Revisar estructura del repositorio.
- Revisar archivos `.md` existentes.
- Completar specs generales.
- Completar specs de modulos.
- Alinear tablas, columnas y permisos con `/supabase`.
- Definir Sakai NG como fuente visual oficial.
- Definir capturas como fuente funcional.
- Marcar incertidumbres como `Pendiente de validación`.

## Tareas futuras de base frontend

1. Limpiar demos de Sakai NG solo cuando las referencias ya no sean necesarias.
2. Crear estructura `core`, `shared` y `features` sin romper layout Sakai.
3. Configurar cliente Supabase con variables publicas.
4. Implementar `AuthService`.
5. Implementar carga de perfil, roles, permisos y empresas.
6. Implementar guards de autenticacion y permisos.
7. Adaptar login de Sakai a Supabase Auth.
8. Adaptar menu lateral por permisos.

## Tareas futuras por modulo

Orden sugerido:

1. Login.
2. Perfil.
3. Roles y permisos.
4. Usuarios.
5. Catalogos base:
   - unidades,
   - categorias,
   - tipos de items,
   - codigos Basilea,
   - tipos de cantidad,
   - tipos de documentos,
   - tipos de generacion de certificado.
6. Empresas.
7. Items.
8. Certificados.
9. Reportes.
10. Logs.
11. Dashboard final con metricas reales.

## Checklist tecnico para cada CRUD

- Modelo TypeScript.
- Servicio Supabase.
- Listado con `p-table`.
- Paginado por servidor.
- Ordenamiento por servidor.
- Filtros por servidor.
- Formulario reactivo.
- Dialogo o pagina de detalle.
- Validaciones.
- Confirmacion para acciones criticas.
- Toast de resultado.
- Control de permisos frontend.
- Verificacion de RLS.

## Verificacion requerida por tarea futura

- Build Angular.
- Lint.
- Tipos TypeScript.
- Consultas Supabase.
- Permisos.
- Paginado.
- Ordenamiento.
- Filtros.
- Responsive.

## Restricciones vigentes

- No implementar fuera del SDD sin documentarlo.
- No cambiar nombres de tablas o columnas sin actualizar specs y SQL.
- No crear mocks permanentes si ya existe contrato Supabase.
- No instalar dependencias sin tarea explicita.
- No modificar `package.json` sin tarea explicita.
