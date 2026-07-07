-- schema.sql
-- Sistema de Gestión y Trazabilidad de Certificados
-- Angular SPA + Supabase Auth + PostgreSQL + Storage

create extension if not exists "pgcrypto";

-- Limpieza de trigger antiguo incompatible, si existiera.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- Seguridad / usuarios
-- =========================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_system_role boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_roles_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  action_key text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (module_key, action_key)
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================
-- Empresas
-- =========================

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  company_type text not null check (company_type in ('generator', 'transporter', 'final_destination', 'both')),
  ruc varchar(11) not null unique,
  business_name text not null,
  trade_name text,
  fiscal_address text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_companies_ruc_length check (char_length(ruc) = 11)
);

create trigger trg_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

-- Relación usuario-empresa para rol Cliente.
create table if not exists public.user_companies (
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

create table if not exists public.company_branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_type text not null check (branch_type in ('deposit', 'fiscal_address', 'office', 'branch')),
  name text,
  address text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_company_branches_updated_at
before update on public.company_branches
for each row execute function public.set_updated_at();

create table if not exists public.company_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  position text,
  email text,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_company_contacts_updated_at
before update on public.company_contacts
for each row execute function public.set_updated_at();

-- =========================
-- Catálogos
-- =========================

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  abbreviation text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_units_updated_at before update on public.units for each row execute function public.set_updated_at();

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();

create table if not exists public.item_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_item_types_updated_at before update on public.item_types for each row execute function public.set_updated_at();

create table if not exists public.basel_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_basel_codes_updated_at before update on public.basel_codes for each row execute function public.set_updated_at();

create table if not exists public.quantity_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  show_value boolean not null default true,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_quantity_types_updated_at before update on public.quantity_types for each row execute function public.set_updated_at();

create table if not exists public.document_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_document_types_updated_at before update on public.document_types for each row execute function public.set_updated_at();

-- =========================
-- Tipos de certificado y templates
-- =========================

create table if not exists public.certificate_generation_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  show_final_destination_company boolean not null default true,
  show_destination_place boolean not null default true,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_certificate_generation_types_updated_at before update on public.certificate_generation_types for each row execute function public.set_updated_at();

create table if not exists public.certificate_template_versions (
  id uuid primary key default gen_random_uuid(),
  certificate_generation_type_id uuid not null references public.certificate_generation_types(id) on delete restrict,
  version_number integer not null,
  name text not null,
  storage_bucket text not null default 'certificate-templates',
  storage_path text not null,
  uploaded_by uuid references public.profiles(id),
  active_from timestamptz not null default now(),
  active_to timestamptz,
  is_active boolean not null default true,
  is_locked boolean not null default true,
  created_at timestamptz not null default now(),
  unique (certificate_generation_type_id, version_number)
);

create unique index if not exists uq_active_template_by_generation_type
on public.certificate_template_versions(certificate_generation_type_id)
where is_active = true;

-- =========================
-- Items
-- =========================

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  unit_id uuid not null references public.units(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  item_type_id uuid not null references public.item_types(id) on delete restrict,
  basel_code_id uuid references public.basel_codes(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_items_updated_at before update on public.items for each row execute function public.set_updated_at();

-- =========================
-- Certificados
-- =========================

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_number text not null unique,
  generation_type_id uuid not null references public.certificate_generation_types(id) on delete restrict,
  template_version_id uuid references public.certificate_template_versions(id) on delete restrict,
  issue_date date not null,
  operation_date date not null,
  guide_number text not null,
  service_date date,
  plate text,
  generation_source text,
  generator_address text,
  arrival_address text,
  generator_company_id uuid not null references public.companies(id) on delete restrict,
  transporter_company_id uuid references public.companies(id) on delete restrict,
  transporter_address text,
  final_destination_company_id uuid references public.companies(id) on delete restrict,
  destination_place text,
  observations text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  issued_at timestamptz,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_certificates_updated_at before update on public.certificates for each row execute function public.set_updated_at();

create table if not exists public.certificate_items (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.certificates(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete restrict,
  quantity_type_id uuid references public.quantity_types(id) on delete restrict,
  quantity numeric(14,4),
  weight numeric(14,4),
  price numeric(14,4),
  description text,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (quantity is null or quantity >= 0),
  check (weight is null or weight >= 0),
  check (price is null or price >= 0)
);
create trigger trg_certificate_items_updated_at before update on public.certificate_items for each row execute function public.set_updated_at();

create table if not exists public.certificate_documents (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.certificates(id) on delete cascade,
  document_type_id uuid not null references public.document_types(id) on delete restrict,
  file_name text not null,
  storage_bucket text not null default 'certificate-documents',
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.certificate_files (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.certificates(id) on delete cascade,
  template_version_id uuid references public.certificate_template_versions(id) on delete restrict,
  file_name text not null,
  storage_bucket text not null default 'generated-certificates',
  storage_path text not null,
  version_number integer not null default 1,
  is_current boolean not null default true,
  generated_by uuid references public.profiles(id),
  generated_at timestamptz not null default now(),
  unique (certificate_id, version_number)
);

create unique index if not exists uq_current_certificate_file
on public.certificate_files(certificate_id)
where is_current = true;

-- =========================
-- Reportes y logs
-- =========================

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null,
  filters jsonb not null default '{}'::jsonb,
  file_name text,
  storage_bucket text,
  storage_path text,
  generated_by uuid references public.profiles(id),
  generated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create or replace view public.v_certificate_report as
select
  c.issue_date as fecha,
  c.certificate_number as numero_ticket,
  gen.business_name as cliente,
  gen.ruc as ruc,
  c.plate as placa,
  c.generation_source as fuente_generacion,
  c.arrival_address as direccion_llegada,
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

-- =========================
-- Índices
-- =========================

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_roles_name on public.roles(name);
create index if not exists idx_companies_ruc on public.companies(ruc);
create index if not exists idx_companies_business_name on public.companies(business_name);
create index if not exists idx_companies_type on public.companies(company_type);
create index if not exists idx_companies_status on public.companies(status);
create index if not exists idx_items_code on public.items(code);
create index if not exists idx_items_name on public.items(name);
create index if not exists idx_items_unit_id on public.items(unit_id);
create index if not exists idx_items_category_id on public.items(category_id);
create index if not exists idx_items_item_type_id on public.items(item_type_id);
create index if not exists idx_items_basel_code_id on public.items(basel_code_id);
create index if not exists idx_certificates_number on public.certificates(certificate_number);
create index if not exists idx_certificates_issue_date on public.certificates(issue_date);
create index if not exists idx_certificates_status on public.certificates(status);
create index if not exists idx_certificates_generator_company on public.certificates(generator_company_id);
create index if not exists idx_certificates_transporter_company on public.certificates(transporter_company_id);
create index if not exists idx_certificates_final_destination_company on public.certificates(final_destination_company_id);
create index if not exists idx_certificate_items_certificate_id on public.certificate_items(certificate_id);
create index if not exists idx_certificate_documents_certificate_id on public.certificate_documents(certificate_id);
create index if not exists idx_certificate_files_certificate_id on public.certificate_files(certificate_id);
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_table_name on public.audit_logs(table_name);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);

-- =========================
-- Protección de roles base
-- =========================

create or replace function public.prevent_delete_system_roles()
returns trigger
language plpgsql
as $$
begin
  if old.is_system_role = true then
    raise exception 'No se puede eliminar un rol base del sistema';
  end if;
  return old;
end;
$$;

create trigger trg_prevent_delete_system_roles
before delete on public.roles
for each row execute function public.prevent_delete_system_roles();

-- =========================
-- Auditoría genérica
-- =========================

create or replace function public.audit_table_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record_id uuid;
begin
  if tg_op = 'INSERT' then
    v_record_id := new.id;
    insert into public.audit_logs(user_id, action, table_name, record_id, old_data, new_data)
    values (auth.uid(), lower(tg_op), tg_table_name, v_record_id, null, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    v_record_id := new.id;
    insert into public.audit_logs(user_id, action, table_name, record_id, old_data, new_data)
    values (auth.uid(), lower(tg_op), tg_table_name, v_record_id, to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    v_record_id := old.id;
    insert into public.audit_logs(user_id, action, table_name, record_id, old_data, new_data)
    values (auth.uid(), lower(tg_op), tg_table_name, v_record_id, to_jsonb(old), null);
    return old;
  end if;
  return null;
end;
$$;

-- Triggers de auditoría para tablas principales
create or replace function public.audit_role_permissions_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs(user_id, action, table_name, record_id, old_data, new_data)
    values (
      auth.uid(),
      lower(tg_op),
      tg_table_name,
      new.role_id,
      null,
      jsonb_build_object('role_id', new.role_id, 'permission_id', new.permission_id)
    );
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs(user_id, action, table_name, record_id, old_data, new_data)
    values (
      auth.uid(),
      lower(tg_op),
      tg_table_name,
      old.role_id,
      jsonb_build_object('role_id', old.role_id, 'permission_id', old.permission_id),
      null
    );
    return old;
  end if;

  return null;
end;
$$;

create trigger audit_roles after insert or update or delete on public.roles for each row execute function public.audit_table_changes();
create trigger audit_role_permissions after insert or delete on public.role_permissions for each row execute function public.audit_role_permissions_changes();
create trigger audit_companies after insert or update or delete on public.companies for each row execute function public.audit_table_changes();
create trigger audit_company_branches after insert or update or delete on public.company_branches for each row execute function public.audit_table_changes();
create trigger audit_company_contacts after insert or update or delete on public.company_contacts for each row execute function public.audit_table_changes();
create trigger audit_units after insert or update or delete on public.units for each row execute function public.audit_table_changes();
create trigger audit_categories after insert or update or delete on public.categories for each row execute function public.audit_table_changes();
create trigger audit_item_types after insert or update or delete on public.item_types for each row execute function public.audit_table_changes();
create trigger audit_basel_codes after insert or update or delete on public.basel_codes for each row execute function public.audit_table_changes();
create trigger audit_quantity_types after insert or update or delete on public.quantity_types for each row execute function public.audit_table_changes();
create trigger audit_document_types after insert or update or delete on public.document_types for each row execute function public.audit_table_changes();
create trigger audit_certificate_generation_types after insert or update or delete on public.certificate_generation_types for each row execute function public.audit_table_changes();
create trigger audit_certificate_template_versions after insert or update or delete on public.certificate_template_versions for each row execute function public.audit_table_changes();
create trigger audit_items after insert or update or delete on public.items for each row execute function public.audit_table_changes();
create trigger audit_certificates after insert or update or delete on public.certificates for each row execute function public.audit_table_changes();
create trigger audit_certificate_items after insert or update or delete on public.certificate_items for each row execute function public.audit_table_changes();
create trigger audit_certificate_documents after insert or update or delete on public.certificate_documents for each row execute function public.audit_table_changes();
create trigger audit_certificate_files after insert or update or delete on public.certificate_files for each row execute function public.audit_table_changes();
