-- storage-policies.sql
-- Ejecutar después de schema.sql, seed.sql y rls-policies.sql

-- =========================
-- Buckets privados
-- =========================

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

-- =========================
-- certificate-templates
-- =========================

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

-- =========================
-- generated-certificates
-- =========================

drop policy if exists storage_generated_certificates_select on storage.objects;
create policy storage_generated_certificates_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'generated-certificates'
  and (
    public.has_permission('certificates', 'view')
    or public.has_permission('certificates', 'create')
    or public.has_permission('certificates', 'update')
    or public.has_permission('certificates', 'issue')
    or exists (
      select 1
      from public.certificate_files cf
      where cf.storage_bucket = storage.objects.bucket_id
        and cf.storage_path = storage.objects.name
        and public.user_can_access_certificate(cf.certificate_id)
    )
  )
);

drop policy if exists storage_generated_certificates_insert on storage.objects;
create policy storage_generated_certificates_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'generated-certificates'
  and (
    public.has_permission('certificates', 'create')
    or public.has_permission('certificates', 'update')
    or public.has_permission('certificates', 'issue')
  )
);

drop policy if exists storage_generated_certificates_update on storage.objects;
create policy storage_generated_certificates_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'generated-certificates'
  and (
    public.has_permission('certificates', 'create')
    or public.has_permission('certificates', 'update')
    or public.has_permission('certificates', 'issue')
  )
)
with check (
  bucket_id = 'generated-certificates'
  and (
    public.has_permission('certificates', 'create')
    or public.has_permission('certificates', 'update')
    or public.has_permission('certificates', 'issue')
  )
);

-- =========================
-- certificate-documents
-- =========================

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

drop policy if exists storage_certificate_documents_delete on storage.objects;
create policy storage_certificate_documents_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'certificate-documents'
  and (
    public.has_permission('certificates', 'update')
    or public.has_permission('certificates', 'delete')
  )
);
