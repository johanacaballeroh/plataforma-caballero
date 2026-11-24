# Activar Control IBC

1. Abrir el SQL Editor del proyecto **Plataforma Caballero** en Supabase.
2. Copiar el contenido completo de `setup-ibc-mvp.sql` y ejecutarlo **una vez**.
3. Cerrar sesion en la plataforma y volver a ingresar para actualizar permisos.

El archivo contiene la estructura aditiva, RLS, permisos para Administrador/Gerente, bucket privado y ocho envases de demostracion. Requiere el esquema base instalado y al menos un Administrador activo. No crea usuarios ni cambia contrasenas. Empresa y eventos de ejemplo son ficticios y se identifican como demo.

La instalacion completa es transaccional; ante un error no se confirma una instalacion parcial. No volver a ejecutarla si ya existen las tablas IBC. Tampoco ejecutar despues la misma migracion mediante CLI sobre esa base sin reconciliar su historial: el SQL Editor no registra automaticamente las migraciones de la CLI.

Para instalar sin demostracion, ejecutar exclusivamente `migrations/20261108043503_ibc_control_mvp.sql` dentro de una transaccion. Para agregar los ejemplos despues, ejecutar `ibc-demo.sql` (idempotente).

## Validacion local

```powershell
npm install --prefix tmp/ibc-validation --no-save --package-lock=false @electric-sql/pglite@0.5.15
node scripts/package-ibc-setup.mjs
node scripts/test-ibc-database.mjs
node scripts/test-ibc-database.mjs --without-base-audit
```

El verificador utiliza PostgreSQL en memoria con adaptadores de Auth/Storage, aplica el script exacto de instalacion y comprueba idempotencia del seed, transiciones, historial, permisos y politicas. No accede al proyecto remoto. `tests/ibc-workflow.sql` tambien puede ejecutarse en una base de pruebas con migracion y seed; revierte sus registros mediante rollback. Las pruebas de Storage locales verifican SQL/RLS, no la transferencia de archivos por la API de Storage.

## Si fallo la instalacion por audit_table_changes

El script actualizado crea su propia funcion privada de auditoria para IBC. No requiere crear ni reemplazar la funcion generica del sistema. Si la ejecucion anterior fallo dentro de la transaccion, volver a copiar el archivo completo actualizado y ejecutarlo desde el comienzo. Se comprobo por MCP que el proyecto no tiene tablas IBC despues del error informado. Si se ejecuto parcialmente fuera de la transaccion, revisar el estado antes de repetir; no borrar tablas para forzar la instalacion.
