-- Permite que el flujo de creacion/edicion de certificados lea la plantilla
-- PDF activa del tipo de generacion seleccionado.

drop policy if exists certificate_generation_types_select on public.certificate_generation_types;
create policy certificate_generation_types_select on public.certificate_generation_types
for select to authenticated
using (
  public.has_permission('certificate_generation_types','view')
  or public.has_permission('certificates','view')
  or public.has_permission('certificates','view_own')
  or public.has_permission('certificates','create')
  or public.has_permission('certificates','update')
  or public.has_permission('certificates','issue')
);

drop policy if exists certificate_template_versions_select on public.certificate_template_versions;
create policy certificate_template_versions_select on public.certificate_template_versions
for select to authenticated
using (
  public.has_permission('certificate_templates','view')
  or public.has_permission('certificates','view')
  or public.has_permission('certificates','view_own')
  or public.has_permission('certificates','create')
  or public.has_permission('certificates','update')
  or public.has_permission('certificates','issue')
);

drop policy if exists storage_certificate_templates_select on storage.objects;
create policy storage_certificate_templates_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'certificate-templates'
  and (
    public.has_permission('certificate_templates', 'view')
    or public.has_permission('certificates', 'view')
    or public.has_permission('certificates', 'view_own')
    or public.has_permission('certificates', 'create')
    or public.has_permission('certificates', 'update')
    or public.has_permission('certificates', 'issue')
  )
);
