-- Migracion incremental para bases existentes.
-- Alinea certificados con los campos identificados en capturas sin recrear tablas.

begin;

alter table public.certificates
  add column if not exists operation_date date,
  add column if not exists guide_number text,
  add column if not exists generator_address text,
  add column if not exists transporter_address text;

update public.certificates
set operation_date = coalesce(operation_date, service_date, issue_date)
where operation_date is null;

update public.certificates
set guide_number = coalesce(nullif(guide_number, ''), certificate_number)
where guide_number is null or guide_number = '';

update public.certificates
set generator_address = coalesce(nullif(generator_address, ''), arrival_address)
where generator_address is null or generator_address = '';

do $$
declare
  status_constraint_name text;
begin
  select conname
  into status_constraint_name
  from pg_constraint
  where conrelid = 'public.certificates'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%'
  limit 1;

  if status_constraint_name is not null then
    execute format('alter table public.certificates drop constraint %I', status_constraint_name);
  end if;
end $$;

update public.certificates
set status = case
  when status in ('active', 'issued', 'draft') then 'active'
  when status in ('inactive', 'cancelled') then 'inactive'
  else 'active'
end;

alter table public.certificates
  alter column operation_date set not null,
  alter column guide_number set not null,
  alter column status set default 'active',
  add constraint certificates_status_check check (status in ('active', 'inactive'));

create index if not exists idx_certificates_operation_date on public.certificates(operation_date);
create index if not exists idx_certificates_guide_number on public.certificates(guide_number);

create or replace view public.v_certificate_report as
select
  coalesce(c.operation_date, c.issue_date) as fecha,
  c.certificate_number as numero_ticket,
  gen.business_name as cliente,
  gen.ruc as ruc,
  c.plate as placa,
  c.generation_source as fuente_generacion,
  coalesce(c.generator_address, c.arrival_address) as direccion_llegada,
  it.name as tipo,
  ci.quantity as cantidad,
  u.name as unidad_medida,
  ci.weight as peso,
  bc.code as codigo_basilea,
  c.status as estado_certificado,
  c.generator_company_id
from public.certificates c
join public.companies gen on gen.id = c.generator_company_id
join public.certificate_items ci on ci.certificate_id = c.id
join public.items i on i.id = ci.item_id
left join public.item_types it on it.id = i.item_type_id
left join public.units u on u.id = i.unit_id
left join public.basel_codes bc on bc.id = i.basel_code_id;

commit;
