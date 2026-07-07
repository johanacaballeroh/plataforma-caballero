-- Permite generar/actualizar el PDF snapshot al guardar o editar certificados.
-- Ejecutar en Supabase SQL Editor sobre bases existentes.

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
  public.has_permission('certificates','update')
  or public.has_permission('certificates','issue')
)
with check (
  public.has_permission('certificates','update')
  or public.has_permission('certificates','issue')
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
    public.has_permission('certificates', 'update')
    or public.has_permission('certificates', 'issue')
  )
)
with check (
  bucket_id = 'generated-certificates'
  and (
    public.has_permission('certificates', 'update')
    or public.has_permission('certificates', 'issue')
  )
);
