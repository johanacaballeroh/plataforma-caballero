-- rls-policies.sql
-- Ejecutar después de schema.sql y seed.sql

-- =========================
-- Funciones de permisos
-- =========================

create or replace function public.has_role(role_name text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = role_name
      and r.status = 'active'
  );
$$;

create or replace function public.has_permission(module_name text, action_name text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and r.status = 'active'
      and p.module_key = module_name
      and p.action_key = action_name
  );
$$;

create or replace function public.user_can_access_company(company_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    public.has_role('Administrador')
    or public.has_role('Gerente')
    or exists (
      select 1
      from public.user_companies uc
      where uc.user_id = auth.uid()
        and uc.company_id = company_uuid
    );
$$;

create or replace function public.user_can_access_certificate(cert_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.certificates c
    where c.id = cert_uuid
      and (
        public.has_role('Administrador')
        or public.has_role('Gerente')
        or exists (
          select 1
          from public.user_companies uc
          where uc.user_id = auth.uid()
            and uc.company_id in (
              c.generator_company_id,
              c.transporter_company_id,
              c.final_destination_company_id
            )
        )
      )
  );
$$;

-- =========================
-- Activar RLS
-- =========================

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_companies enable row level security;
alter table public.companies enable row level security;
alter table public.company_branches enable row level security;
alter table public.company_contacts enable row level security;
alter table public.units enable row level security;
alter table public.categories enable row level security;
alter table public.item_types enable row level security;
alter table public.basel_codes enable row level security;
alter table public.quantity_types enable row level security;
alter table public.document_types enable row level security;
alter table public.certificate_generation_types enable row level security;
alter table public.certificate_template_versions enable row level security;
alter table public.items enable row level security;
alter table public.certificates enable row level security;
alter table public.certificate_items enable row level security;
alter table public.certificate_documents enable row level security;
alter table public.certificate_files enable row level security;
alter table public.report_exports enable row level security;
alter table public.audit_logs enable row level security;

-- =========================
-- Seguridad / usuarios
-- =========================

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (id = auth.uid() or public.has_permission('users', 'view'));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists profiles_update_manage on public.profiles;
create policy profiles_update_manage on public.profiles
for update to authenticated
using (public.has_permission('users', 'update'))
with check (public.has_permission('users', 'update'));

drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
for select to authenticated
using (
  public.has_permission('roles', 'view')
  or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role_id = roles.id)
);

drop policy if exists permissions_select on public.permissions;
create policy permissions_select on public.permissions
for select to authenticated
using (true);

drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles
for select to authenticated
using (user_id = auth.uid() or public.has_permission('users', 'view'));

drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions
for select to authenticated
using (true);

drop policy if exists user_companies_select on public.user_companies;
create policy user_companies_select on public.user_companies
for select to authenticated
using (user_id = auth.uid() or public.has_permission('users', 'view'));

-- Admin/Gerente gestionan usuarios, roles y permisos desde la app.
drop policy if exists user_roles_manage on public.user_roles;
create policy user_roles_manage on public.user_roles
for all to authenticated
using (public.has_permission('users', 'update'))
with check (public.has_permission('users', 'update'));

drop policy if exists user_companies_manage on public.user_companies;
create policy user_companies_manage on public.user_companies
for all to authenticated
using (public.has_permission('users', 'update'))
with check (public.has_permission('users', 'update'));

-- =========================
-- Empresas
-- =========================

drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies
for select to authenticated
using (public.has_permission('companies', 'view') or public.user_can_access_company(id));

drop policy if exists companies_insert on public.companies;
create policy companies_insert on public.companies
for insert to authenticated
with check (public.has_permission('companies', 'create'));

drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies
for update to authenticated
using (public.has_permission('companies', 'update'))
with check (public.has_permission('companies', 'update'));

drop policy if exists companies_delete on public.companies;
create policy companies_delete on public.companies
for delete to authenticated
using (public.has_permission('companies', 'delete'));

drop policy if exists company_branches_select on public.company_branches;
create policy company_branches_select on public.company_branches
for select to authenticated
using (public.has_permission('companies', 'view') or public.user_can_access_company(company_id));

drop policy if exists company_branches_manage on public.company_branches;
create policy company_branches_manage on public.company_branches
for all to authenticated
using (public.has_permission('companies', 'update'))
with check (public.has_permission('companies', 'update'));

drop policy if exists company_contacts_select on public.company_contacts;
create policy company_contacts_select on public.company_contacts
for select to authenticated
using (public.has_permission('companies', 'view') or public.user_can_access_company(company_id));

drop policy if exists company_contacts_manage on public.company_contacts;
create policy company_contacts_manage on public.company_contacts
for all to authenticated
using (public.has_permission('companies', 'update'))
with check (public.has_permission('companies', 'update'));

-- =========================
-- Catálogos
-- =========================

-- Lectura: se permite si el usuario puede ver el catálogo o certificados.
drop policy if exists units_select on public.units;
create policy units_select on public.units for select to authenticated
using (public.has_permission('units','view') or public.has_permission('certificates','view') or public.has_permission('certificates','view_own'));

drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories for select to authenticated
using (public.has_permission('categories','view') or public.has_permission('certificates','view') or public.has_permission('certificates','view_own'));

drop policy if exists item_types_select on public.item_types;
create policy item_types_select on public.item_types for select to authenticated
using (public.has_permission('item_types','view') or public.has_permission('certificates','view') or public.has_permission('certificates','view_own'));

drop policy if exists basel_codes_select on public.basel_codes;
create policy basel_codes_select on public.basel_codes for select to authenticated
using (public.has_permission('basel_codes','view') or public.has_permission('certificates','view') or public.has_permission('certificates','view_own'));

drop policy if exists quantity_types_select on public.quantity_types;
create policy quantity_types_select on public.quantity_types for select to authenticated
using (public.has_permission('quantity_types','view') or public.has_permission('certificates','view') or public.has_permission('certificates','view_own'));

drop policy if exists document_types_select on public.document_types;
create policy document_types_select on public.document_types for select to authenticated
using (public.has_permission('document_types','view') or public.has_permission('certificates','view'));

-- Gestión de catálogos.
drop policy if exists units_manage on public.units;
create policy units_manage on public.units for all to authenticated using (public.has_permission('units','update') or public.has_permission('units','create') or public.has_permission('units','delete')) with check (public.has_permission('units','update') or public.has_permission('units','create'));

drop policy if exists categories_manage on public.categories;
create policy categories_manage on public.categories for all to authenticated using (public.has_permission('categories','update') or public.has_permission('categories','create') or public.has_permission('categories','delete')) with check (public.has_permission('categories','update') or public.has_permission('categories','create'));

drop policy if exists item_types_manage on public.item_types;
create policy item_types_manage on public.item_types for all to authenticated using (public.has_permission('item_types','update') or public.has_permission('item_types','create') or public.has_permission('item_types','delete')) with check (public.has_permission('item_types','update') or public.has_permission('item_types','create'));

drop policy if exists basel_codes_manage on public.basel_codes;
create policy basel_codes_manage on public.basel_codes for all to authenticated using (public.has_permission('basel_codes','update') or public.has_permission('basel_codes','create') or public.has_permission('basel_codes','delete')) with check (public.has_permission('basel_codes','update') or public.has_permission('basel_codes','create'));

drop policy if exists quantity_types_manage on public.quantity_types;
create policy quantity_types_manage on public.quantity_types for all to authenticated using (public.has_permission('quantity_types','update') or public.has_permission('quantity_types','create') or public.has_permission('quantity_types','delete')) with check (public.has_permission('quantity_types','update') or public.has_permission('quantity_types','create'));

drop policy if exists document_types_manage on public.document_types;
create policy document_types_manage on public.document_types for all to authenticated using (public.has_permission('document_types','update') or public.has_permission('document_types','create') or public.has_permission('document_types','delete')) with check (public.has_permission('document_types','update') or public.has_permission('document_types','create'));

-- =========================
-- Items
-- =========================

drop policy if exists items_select on public.items;
create policy items_select on public.items
for select to authenticated
using (public.has_permission('items','view') or public.has_permission('certificates','view') or public.has_permission('certificates','view_own'));

drop policy if exists items_manage on public.items;
create policy items_manage on public.items
for all to authenticated
using (public.has_permission('items','update') or public.has_permission('items','create') or public.has_permission('items','delete'))
with check (public.has_permission('items','update') or public.has_permission('items','create'));

-- =========================
-- Tipos de certificado y templates
-- =========================

drop policy if exists certificate_generation_types_select on public.certificate_generation_types;
create policy certificate_generation_types_select on public.certificate_generation_types
for select to authenticated
using (public.has_permission('certificate_generation_types','view') or public.has_permission('certificates','view') or public.has_permission('certificates','view_own'));

drop policy if exists certificate_generation_types_manage on public.certificate_generation_types;
create policy certificate_generation_types_manage on public.certificate_generation_types
for all to authenticated
using (public.has_permission('certificate_generation_types','update') or public.has_permission('certificate_generation_types','create') or public.has_permission('certificate_generation_types','delete'))
with check (public.has_permission('certificate_generation_types','update') or public.has_permission('certificate_generation_types','create'));

drop policy if exists certificate_template_versions_select on public.certificate_template_versions;
create policy certificate_template_versions_select on public.certificate_template_versions
for select to authenticated
using (public.has_permission('certificate_templates','view') or public.has_permission('certificates','view') or public.has_permission('certificates','view_own'));

drop policy if exists certificate_template_versions_manage on public.certificate_template_versions;
create policy certificate_template_versions_manage on public.certificate_template_versions
for all to authenticated
using (public.has_permission('certificate_templates','update') or public.has_permission('certificate_templates','create'))
with check (public.has_permission('certificate_templates','update') or public.has_permission('certificate_templates','create'));

-- =========================
-- Certificados
-- =========================

drop policy if exists certificates_select on public.certificates;
create policy certificates_select on public.certificates
for select to authenticated
using (
  public.has_permission('certificates','view')
  or (public.has_permission('certificates','view_own') and public.user_can_access_certificate(id))
);

drop policy if exists certificates_insert on public.certificates;
create policy certificates_insert on public.certificates
for insert to authenticated
with check (public.has_permission('certificates','create'));

drop policy if exists certificates_update on public.certificates;
create policy certificates_update on public.certificates
for update to authenticated
using (public.has_permission('certificates','update'))
with check (public.has_permission('certificates','update'));

drop policy if exists certificates_delete on public.certificates;
create policy certificates_delete on public.certificates
for delete to authenticated
using (public.has_permission('certificates','delete'));

drop policy if exists certificate_items_select on public.certificate_items;
create policy certificate_items_select on public.certificate_items
for select to authenticated
using (public.has_permission('certificates','view') or (public.has_permission('certificates','view_own') and public.user_can_access_certificate(certificate_id)));

drop policy if exists certificate_items_manage on public.certificate_items;
create policy certificate_items_manage on public.certificate_items
for all to authenticated
using (public.has_permission('certificates','update') or public.has_permission('certificates','create'))
with check (public.has_permission('certificates','update') or public.has_permission('certificates','create'));

drop policy if exists certificate_documents_select on public.certificate_documents;
create policy certificate_documents_select on public.certificate_documents
for select to authenticated
using (public.has_permission('certificates','view') or (public.has_permission('certificates','view_own') and public.user_can_access_certificate(certificate_id)));

drop policy if exists certificate_documents_manage on public.certificate_documents;
create policy certificate_documents_manage on public.certificate_documents
for all to authenticated
using (public.has_permission('certificates','update'))
with check (public.has_permission('certificates','update'));

drop policy if exists certificate_files_select on public.certificate_files;
create policy certificate_files_select on public.certificate_files
for select to authenticated
using (public.has_permission('certificates','view') or (public.has_permission('certificates','view_own') and public.user_can_access_certificate(certificate_id)));

drop policy if exists certificate_files_insert on public.certificate_files;
create policy certificate_files_insert on public.certificate_files
for insert to authenticated
with check (public.has_permission('certificates','issue'));

-- =========================
-- Reportes y logs
-- =========================

drop policy if exists report_exports_select on public.report_exports;
create policy report_exports_select on public.report_exports
for select to authenticated
using (public.has_permission('reports','view'));

drop policy if exists report_exports_insert on public.report_exports;
create policy report_exports_insert on public.report_exports
for insert to authenticated
with check (public.has_permission('reports','export'));

drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
for select to authenticated
using (public.has_permission('logs','view'));

drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
for insert to authenticated
with check (auth.uid() is not null);
