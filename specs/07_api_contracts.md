# Contratos de acceso a datos

## Alcance

El frontend se comunica directamente con Supabase mediante Supabase JS Client. No existe backend Node propio para estos contratos.

Los contratos documentan patrones de consulta, no endpoints HTTP custom.

## Patron server-side para tablas

Entrada comun desde UI:

```ts
interface ServerTableQuery {
  page: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}
```

Salida comun hacia UI:

```ts
interface ServerTableResult<T> {
  data: T[];
  total: number;
}
```

Reglas:

- `page` es base 1.
- `pageSize` debe tener limite maximo definido por UI.
- `sortField` solo puede mapear a columnas permitidas.
- Los filtros deben aplicarse en Supabase, no en memoria.
- Usar `count: 'exact'` cuando el listado requiera total.

## Mapeo Supabase

Para listados:

- `select(columns, { count: 'exact' })`
- `range(from, to)`
- `order(field, { ascending })`
- filtros con `eq`, `ilike`, `gte`, `lte`, `in` segun el caso

No se deben exponer filtros arbitrarios que permitan consultar columnas no previstas.

## Contratos por dominio

### Control IBC

Contrato de tablas, tipos de eventos y consultas descrito en `/specs/modules/18-ibc.md`; fuente SQL `/supabase/ibc.sql`. Consultas a `v_ibc_services`, `v_ibc_containers` y `ibc_chemicals`; RPC `ibc_receive` para ingreso atomico. Inserciones de eventos validadas mediante trigger; estados no actualizables directamente desde el cliente. Exportacion CSV paginada completa y registrada en `report_exports`.

Reportes IBC consulta exclusivamente `summary` para los indicadores; la exportacion reutiliza `exportCsv` y su paginado completo. La unica bandeja individual esta en Servicios y usa `listServices`. El filtro virtual `status: 'open'` excluye `delivered` en Supabase. `summary` cuenta cada estado en servidor mediante peticiones HEAD. Los enlaces de Reportes a Servicios transmiten `companyId`, `chemicalId`, `dateFrom`, `dateTo` y `status` aplicados como query params. No cambia tablas ni politicas.

### Auth

- Login: Supabase Auth email/password.
- Logout: Supabase Auth signOut.
- Perfil actual: `profiles` + `user_roles` + `role_permissions` + `user_companies`.

### Usuarios

Tablas:

- `profiles`
- `user_roles`
- `roles`
- `user_companies`
- `companies`

Operaciones:

- listar perfiles,
- consultar detalle,
- crear usuario,
- actualizar perfil,
- asignar roles,
- asociar empresas,
- activar/inactivar.

Pendiente de validacion:

- Flujo exacto para crear usuarios de Auth desde frontend sin exponer claves privilegiadas.

### Catalogos

Tablas:

- `units`
- `categories`
- `item_types`
- `basel_codes`
- `quantity_types`
- `document_types`
- `certificate_generation_types`

Operaciones:

- listar,
- consultar detalle,
- crear,
- actualizar,
- activar/inactivar,
- eliminar solo cuando RLS y reglas de negocio lo permitan.

### Empresas

Tablas:

- `companies`
- `company_branches`
- `company_contacts`

Operaciones:

- listar,
- consultar detalle,
- crear,
- actualizar,
- activar/inactivar,
- gestionar sedes,
- gestionar contactos.

### Items

Tablas:

- `items`
- `units`
- `categories`
- `item_types`
- `basel_codes`

Operaciones:

- listar,
- consultar detalle,
- crear,
- actualizar,
- activar/inactivar.

### Certificados

Tablas:

- `certificates`
- `certificate_items`
- `certificate_documents`
- `certificate_files`
- `certificate_template_versions`
- `certificate_generation_types`
- `companies`
- `items`
- `quantity_types`
- `document_types`

Operaciones:

- listar certificados,
- consultar detalle,
- crear borrador,
- actualizar borrador,
- administrar items,
- adjuntar documentos,
- emitir,
- registrar PDF generado,
- descargar PDF con acceso privado.

### Reportes

Fuente:

- `v_certificate_report`
- `report_exports`

Operaciones:

- listar reporte con filtros,
- exportar,
- registrar metadata de exportacion.

### Logs

Fuente:

- `audit_logs`

Operaciones:

- listar en modo solo lectura.

## Manejo de errores

El frontend debe traducir errores comunes:

- sesion expirada,
- acceso denegado por RLS,
- constraint unica,
- constraint check,
- relacion inexistente,
- error de Storage,
- error de red.

No se deben mostrar mensajes tecnicos crudos al usuario final salvo en entorno de desarrollo.
