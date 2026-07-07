-- Permite eliminar documentos adjuntos y sus archivos fisicos en Storage.
-- Ejecutar en Supabase SQL Editor sobre bases existentes.

drop policy if exists certificate_documents_manage on public.certificate_documents;
create policy certificate_documents_manage
on public.certificate_documents
for all
to authenticated
using (
  public.has_permission('certificates','update')
  or public.has_permission('certificates','delete')
)
with check (
  public.has_permission('certificates','create')
  or public.has_permission('certificates','update')
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
