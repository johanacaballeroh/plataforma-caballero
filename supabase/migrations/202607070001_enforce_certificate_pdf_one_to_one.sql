-- Enforce one generated PDF metadata row per certificate.
-- If this fails, resolve duplicated certificate_files rows before re-running.

begin;

do $$
begin
  if exists (
    select 1
    from public.certificate_files
    group by certificate_id
    having count(*) > 1
  ) then
    raise exception 'certificate_files has certificates with more than one PDF row. Resolve duplicates before enforcing 1:1.';
  end if;
end $$;

create unique index if not exists uq_certificate_file_one_per_certificate
on public.certificate_files(certificate_id);

commit;
