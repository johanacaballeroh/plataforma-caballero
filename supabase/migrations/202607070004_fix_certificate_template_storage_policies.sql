-- Corrige politicas de Storage para plantillas de certificado.
-- Sin estas policies, Supabase Storage rechaza la carga con:
-- "new row violates row-level security policy".

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificate-templates',
  'certificate-templates',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

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
  )
);

drop policy if exists storage_certificate_templates_insert on storage.objects;
create policy storage_certificate_templates_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'certificate-templates'
  and (
    public.has_permission('certificate_templates', 'create')
    or public.has_permission('certificate_templates', 'update')
  )
);

drop policy if exists storage_certificate_templates_update on storage.objects;
create policy storage_certificate_templates_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'certificate-templates'
  and public.has_permission('certificate_templates', 'update')
)
with check (
  bucket_id = 'certificate-templates'
  and public.has_permission('certificate_templates', 'update')
);
