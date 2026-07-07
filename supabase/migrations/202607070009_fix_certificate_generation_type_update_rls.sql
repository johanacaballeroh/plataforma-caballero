-- Corrige la edicion de Tipos de generacion.
-- PostgREST devuelve [] en PATCH cuando la fila actualizada no puede leerse
-- por RLS, y la policy anterior no incluia certificate_generation_types.update
-- dentro de la lectura.

drop policy if exists certificate_generation_types_select on public.certificate_generation_types;
create policy certificate_generation_types_select on public.certificate_generation_types
for select to authenticated
using (
  public.has_permission('certificate_generation_types','view')
  or public.has_permission('certificate_generation_types','create')
  or public.has_permission('certificate_generation_types','update')
  or public.has_permission('certificate_generation_types','delete')
  or public.has_permission('certificates','view')
  or public.has_permission('certificates','view_own')
  or public.has_permission('certificates','create')
  or public.has_permission('certificates','update')
  or public.has_permission('certificates','issue')
);

drop policy if exists certificate_generation_types_manage on public.certificate_generation_types;

drop policy if exists certificate_generation_types_insert on public.certificate_generation_types;
create policy certificate_generation_types_insert on public.certificate_generation_types
for insert to authenticated
with check (
  public.has_permission('certificate_generation_types','create')
  or public.has_role('Administrador')
  or public.has_role('Gerente')
);

drop policy if exists certificate_generation_types_update on public.certificate_generation_types;
create policy certificate_generation_types_update on public.certificate_generation_types
for update to authenticated
using (
  public.has_permission('certificate_generation_types','update')
  or public.has_role('Administrador')
  or public.has_role('Gerente')
)
with check (
  public.has_permission('certificate_generation_types','update')
  or public.has_role('Administrador')
  or public.has_role('Gerente')
);

drop policy if exists certificate_generation_types_delete on public.certificate_generation_types;
create policy certificate_generation_types_delete on public.certificate_generation_types
for delete to authenticated
using (
  public.has_permission('certificate_generation_types','delete')
  or public.has_role('Administrador')
  or public.has_role('Gerente')
);
