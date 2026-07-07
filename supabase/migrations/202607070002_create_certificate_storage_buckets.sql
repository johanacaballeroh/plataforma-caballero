-- Crea/actualiza buckets privados requeridos por certificados en una base existente.
-- Ejecutar en Supabase SQL Editor si Storage responde "Bucket not found".

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
(
  'certificate-templates',
  'certificate-templates',
  false,
  10485760,
  array['application/pdf']
),
(
  'generated-certificates',
  'generated-certificates',
  false,
  10485760,
  array['application/pdf']
),
(
  'certificate-documents',
  'certificate-documents',
  false,
  20971520,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists storage_certificate_documents_select on storage.objects;
create policy storage_certificate_documents_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'certificate-documents'
  and (
    public.has_permission('certificates', 'view')
    or exists (
      select 1
      from public.certificate_documents cd
      where cd.storage_bucket = storage.objects.bucket_id
        and cd.storage_path = storage.objects.name
        and public.user_can_access_certificate(cd.certificate_id)
    )
  )
);

drop policy if exists storage_certificate_documents_insert on storage.objects;
create policy storage_certificate_documents_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'certificate-documents'
  and (
    public.has_permission('certificates', 'create')
    or public.has_permission('certificates', 'update')
  )
);

drop policy if exists storage_certificate_documents_update on storage.objects;
create policy storage_certificate_documents_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'certificate-documents'
  and public.has_permission('certificates', 'update')
)
with check (
  bucket_id = 'certificate-documents'
  and (
    public.has_permission('certificates', 'create')
    or public.has_permission('certificates', 'update')
  )
);
