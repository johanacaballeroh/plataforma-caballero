-- seed.sql
-- Ejecutar después de schema.sql

insert into public.permissions (module_key, action_key, description)
values
('dashboard', 'view', 'Ver dashboard'),
('users', 'view', 'Ver usuarios'), ('users', 'create', 'Crear usuarios'), ('users', 'update', 'Editar usuarios'), ('users', 'delete', 'Eliminar usuarios'),
('roles', 'view', 'Ver roles'), ('roles', 'create', 'Crear roles'), ('roles', 'update', 'Editar roles'), ('roles', 'delete', 'Eliminar roles'),
('companies', 'view', 'Ver empresas'), ('companies', 'create', 'Crear empresas'), ('companies', 'update', 'Editar empresas'), ('companies', 'delete', 'Eliminar empresas'),
('items', 'view', 'Ver items'), ('items', 'create', 'Crear items'), ('items', 'update', 'Editar items'), ('items', 'delete', 'Eliminar items'),
('units', 'view', 'Ver unidades'), ('units', 'create', 'Crear unidades'), ('units', 'update', 'Editar unidades'), ('units', 'delete', 'Eliminar unidades'),
('categories', 'view', 'Ver categorías'), ('categories', 'create', 'Crear categorías'), ('categories', 'update', 'Editar categorías'), ('categories', 'delete', 'Eliminar categorías'),
('item_types', 'view', 'Ver tipos de items'), ('item_types', 'create', 'Crear tipos de items'), ('item_types', 'update', 'Editar tipos de items'), ('item_types', 'delete', 'Eliminar tipos de items'),
('basel_codes', 'view', 'Ver códigos Basilea'), ('basel_codes', 'create', 'Crear códigos Basilea'), ('basel_codes', 'update', 'Editar códigos Basilea'), ('basel_codes', 'delete', 'Eliminar códigos Basilea'),
('certificate_generation_types', 'view', 'Ver tipos de certificado'), ('certificate_generation_types', 'create', 'Crear tipos de certificado'), ('certificate_generation_types', 'update', 'Editar tipos de certificado'), ('certificate_generation_types', 'delete', 'Eliminar tipos de certificado'),
('certificate_templates', 'view', 'Ver templates de certificado'), ('certificate_templates', 'create', 'Subir templates de certificado'), ('certificate_templates', 'update', 'Actualizar templates de certificado'),
('quantity_types', 'view', 'Ver tipos de cantidad'), ('quantity_types', 'create', 'Crear tipos de cantidad'), ('quantity_types', 'update', 'Editar tipos de cantidad'), ('quantity_types', 'delete', 'Eliminar tipos de cantidad'),
('document_types', 'view', 'Ver tipos de documentos'), ('document_types', 'create', 'Crear tipos de documentos'), ('document_types', 'update', 'Editar tipos de documentos'), ('document_types', 'delete', 'Eliminar tipos de documentos'),
('certificates', 'view', 'Ver certificados'), ('certificates', 'view_own', 'Ver certificados propios'), ('certificates', 'create', 'Crear certificados'), ('certificates', 'update', 'Editar certificados'), ('certificates', 'delete', 'Eliminar certificados'), ('certificates', 'print', 'Ver PDF certificado'), ('certificates', 'issue', 'Emitir certificado'),
('reports', 'view', 'Ver reportes'), ('reports', 'export', 'Exportar reportes'),
('logs', 'view', 'Ver logs de auditoría')
on conflict (module_key, action_key) do nothing;

insert into public.roles (name, description, is_system_role, status)
values
('Administrador', 'Acceso total al sistema, incluyendo logs', true, 'active'),
('Gerente', 'Acceso operativo completo excepto logs', true, 'active'),
('Cliente', 'Solo visualización de certificados ligados a su empresa', true, 'active')
on conflict (name) do update set description = excluded.description, is_system_role = true, status = 'active';

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.name = 'Administrador'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.name = 'Gerente' and p.module_key <> 'logs'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.module_key = 'certificates' and p.action_key in ('view_own', 'print')
where r.name = 'Cliente'
on conflict do nothing;

-- Usuario admin inicial: admin@caballero.com / 123456
-- Cambiar la contraseña luego del primer login.
do $$
declare
  admin_user_id uuid := gen_random_uuid();
  admin_role_id uuid;
begin
  if not exists (select 1 from auth.users where email = 'admin@caballero.com') then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    )
    values (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@caballero.com',
      crypt('123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrador"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    )
    values (
      gen_random_uuid(),
      admin_user_id,
      jsonb_build_object('sub', admin_user_id::text, 'email', 'admin@caballero.com'),
      'email',
      admin_user_id::text,
      now(), now(), now()
    );

    insert into public.profiles (id, full_name, email, status)
    values (admin_user_id, 'Administrador', 'admin@caballero.com', 'active')
    on conflict (id) do update set full_name = excluded.full_name, email = excluded.email, status = excluded.status;

    select id into admin_role_id from public.roles where name = 'Administrador';

    insert into public.user_roles (user_id, role_id)
    values (admin_user_id, admin_role_id)
    on conflict do nothing;
  end if;
end $$;
