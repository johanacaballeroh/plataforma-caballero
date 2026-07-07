-- Corrige plantillas activas que apuntan a archivos inexistentes en Storage.
-- Caso tipico: registros seed/plantilla-*.pdf quedan activos, pero el archivo
-- real fue reemplazado por una version subida al bucket certificate-templates.

update public.certificate_template_versions ctv
set
  is_active = false,
  active_to = coalesce(active_to, now())
where ctv.is_active = true
  and not exists (
    select 1
    from storage.objects objects
    where objects.bucket_id = ctv.storage_bucket
      and objects.name = ctv.storage_path
  );

with usable_templates as (
  select
    ctv.id,
    row_number() over (
      partition by ctv.certificate_generation_type_id
      order by ctv.version_number desc, ctv.created_at desc
    ) as sort_order
  from public.certificate_template_versions ctv
  join storage.objects objects
    on objects.bucket_id = ctv.storage_bucket
   and objects.name = ctv.storage_path
  where not exists (
    select 1
    from public.certificate_template_versions active_ctv
    where active_ctv.certificate_generation_type_id = ctv.certificate_generation_type_id
      and active_ctv.is_active = true
  )
)
update public.certificate_template_versions ctv
set
  is_active = true,
  active_from = coalesce(active_from, now()),
  active_to = null
from usable_templates usable
where usable.id = ctv.id
  and usable.sort_order = 1;
