-- Corrige RLS de Storage para que el PDF snapshot pueda subirse con upsert.
-- Ejecutar despues de 202607070005_enable_certificate_pdf_generation.sql.

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

drop policy if exists certificate_files_insert on public.certificate_files;
create policy certificate_files_insert on public.certificate_files
for insert
to authenticated
with check (
  public.has_permission('certificates','create')
  or public.has_permission('certificates','update')
  or public.has_permission('certificates','issue')
);

drop policy if exists certificate_files_update on public.certificate_files;
create policy certificate_files_update on public.certificate_files
for update
to authenticated
using (
  public.has_permission('certificates','create')
  or public.has_permission('certificates','update')
  or public.has_permission('certificates','issue')
)
with check (
  public.has_permission('certificates','create')
  or public.has_permission('certificates','update')
  or public.has_permission('certificates','issue')
);
