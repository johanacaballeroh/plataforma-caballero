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

-- Datos de ejemplo para catalogos y operacion.
-- Estos registros son idempotentes y estan pensados para entorno seed/dev.

insert into public.units (id, code, name, abbreviation, status)
values
('00000000-0000-4000-8000-000000000101', 'KG', 'Kilogramo', 'kg', 'active'),
('00000000-0000-4000-8000-000000000102', 'TM', 'Tonelada metrica', 't', 'active'),
('00000000-0000-4000-8000-000000000103', 'UND', 'Unidad', 'und', 'active'),
('00000000-0000-4000-8000-000000000104', 'M3', 'Metro cubico', 'm3', 'active'),
('00000000-0000-4000-8000-000000000105', 'L', 'Litro', 'l', 'active'),
('00000000-0000-4000-8000-000000000106', 'GLN', 'Galon', 'gal', 'inactive')
on conflict (code) do update
set name = excluded.name,
    abbreviation = excluded.abbreviation,
    status = excluded.status;

insert into public.categories (id, name, description, status)
values
('00000000-0000-4000-8000-000000000201', 'Residuos aprovechables', 'Materiales con potencial de valorizacion y reincorporacion a cadena productiva.', 'active'),
('00000000-0000-4000-8000-000000000202', 'Residuos no peligrosos', 'Residuos de manejo regular que no presentan caracteristicas peligrosas.', 'active'),
('00000000-0000-4000-8000-000000000203', 'Residuos peligrosos', 'Residuos que requieren control especial por riesgo ambiental o sanitario.', 'active'),
('00000000-0000-4000-8000-000000000204', 'RAEE', 'Residuos de aparatos electricos y electronicos.', 'active'),
('00000000-0000-4000-8000-000000000205', 'Metales y chatarra', 'Materiales metalicos valorizables, ferrosos y no ferrosos.', 'active'),
('00000000-0000-4000-8000-000000000206', 'Historico no vigente', 'Categoria de referencia conservada para datos antiguos.', 'inactive')
on conflict (name) do update
set description = excluded.description,
    status = excluded.status;

insert into public.item_types (id, name, status)
values
('00000000-0000-4000-8000-000000000301', 'Plastico', 'active'),
('00000000-0000-4000-8000-000000000302', 'Papel y carton', 'active'),
('00000000-0000-4000-8000-000000000303', 'Metal', 'active'),
('00000000-0000-4000-8000-000000000304', 'Vidrio', 'active'),
('00000000-0000-4000-8000-000000000305', 'Organico', 'active'),
('00000000-0000-4000-8000-000000000306', 'Electronico', 'active'),
('00000000-0000-4000-8000-000000000307', 'Aceite usado', 'active'),
('00000000-0000-4000-8000-000000000308', 'Textil', 'inactive')
on conflict (name) do update
set status = excluded.status;

insert into public.basel_codes (id, code, description, status)
values
('00000000-0000-4000-8000-000000000401', 'B1010', 'Desechos de metales y aleaciones metalicas en forma no dispersable.', 'active'),
('00000000-0000-4000-8000-000000000402', 'B1110', 'Ensamblajes electricos y electronicos destinados a recuperacion de componentes.', 'active'),
('00000000-0000-4000-8000-000000000403', 'B3020', 'Desechos de papel, carton y productos de papel.', 'active'),
('00000000-0000-4000-8000-000000000404', 'B3011', 'Desechos plasticos no peligrosos destinados a reciclaje.', 'active'),
('00000000-0000-4000-8000-000000000405', 'A1180', 'Desechos de montajes electricos y electronicos con componentes peligrosos.', 'active'),
('00000000-0000-4000-8000-000000000406', 'Y8', 'Desechos de aceites minerales no aptos para el uso previsto originalmente.', 'active'),
('00000000-0000-4000-8000-000000000407', 'Y12', 'Desechos resultantes de tintas, colorantes, pigmentos, pinturas o barnices.', 'inactive')
on conflict (code) do update
set description = excluded.description,
    status = excluded.status;

insert into public.quantity_types (id, name, show_value, status)
values
('00000000-0000-4000-8000-000000000501', 'Peso verificado', true, 'active'),
('00000000-0000-4000-8000-000000000502', 'Peso estimado', true, 'active'),
('00000000-0000-4000-8000-000000000503', 'Cantidad por unidades', true, 'active'),
('00000000-0000-4000-8000-000000000504', 'Servicio sin valorizacion cuantificada', false, 'active'),
('00000000-0000-4000-8000-000000000505', 'Referencia historica', false, 'inactive')
on conflict (name) do update
set show_value = excluded.show_value,
    status = excluded.status;

insert into public.document_types (id, name, status)
values
('00000000-0000-4000-8000-000000000601', 'Guia de remision', 'active'),
('00000000-0000-4000-8000-000000000602', 'Manifiesto de residuos', 'active'),
('00000000-0000-4000-8000-000000000603', 'Orden de servicio', 'active'),
('00000000-0000-4000-8000-000000000604', 'Acta de entrega', 'active'),
('00000000-0000-4000-8000-000000000605', 'Evidencia fotografica', 'active'),
('00000000-0000-4000-8000-000000000606', 'Constancia de disposicion final', 'active'),
('00000000-0000-4000-8000-000000000607', 'Documento legado', 'inactive')
on conflict (name) do update
set status = excluded.status;

insert into public.certificate_generation_types (
  id,
  name,
  description,
  show_final_destination_company,
  show_destination_place,
  status
)
values
('00000000-0000-4000-8000-000000000701', 'Certificado de valorizacion', 'Certifica la valorizacion de residuos aprovechables entregados por el generador.', true, true, 'active'),
('00000000-0000-4000-8000-000000000702', 'Certificado de transporte', 'Registra el traslado de residuos hacia operador o destino final autorizado.', true, true, 'active'),
('00000000-0000-4000-8000-000000000703', 'Certificado de disposicion final', 'Certifica la disposicion o tratamiento final de residuos gestionados.', true, true, 'active'),
('00000000-0000-4000-8000-000000000704', 'Constancia de recoleccion', 'Constancia operativa de recojo sin destino final visible en el formato.', false, false, 'active'),
('00000000-0000-4000-8000-000000000705', 'Formato anterior', 'Tipo conservado solo para certificados historicos.', false, true, 'inactive')
on conflict (name) do update
set description = excluded.description,
    show_final_destination_company = excluded.show_final_destination_company,
    show_destination_place = excluded.show_destination_place,
    status = excluded.status;

insert into public.certificate_template_versions (
  id,
  certificate_generation_type_id,
  version_number,
  name,
  storage_bucket,
  storage_path,
  uploaded_by,
  active_from,
  active_to,
  is_active,
  is_locked
)
values
(
  '00000000-0000-4000-8000-000000000711',
  (select id from public.certificate_generation_types where name = 'Certificado de valorizacion'),
  1,
  'Plantilla valorizacion v1',
  'certificate-templates',
  'seed/plantilla-valorizacion-v1.pdf',
  (select id from public.profiles where email = 'admin@caballero.com'),
  '2026-01-01 00:00:00+00',
  null,
  true,
  true
),
(
  '00000000-0000-4000-8000-000000000712',
  (select id from public.certificate_generation_types where name = 'Certificado de transporte'),
  1,
  'Plantilla transporte v1',
  'certificate-templates',
  'seed/plantilla-transporte-v1.pdf',
  (select id from public.profiles where email = 'admin@caballero.com'),
  '2026-01-01 00:00:00+00',
  null,
  true,
  true
),
(
  '00000000-0000-4000-8000-000000000713',
  (select id from public.certificate_generation_types where name = 'Certificado de disposicion final'),
  1,
  'Plantilla disposicion final v1',
  'certificate-templates',
  'seed/plantilla-disposicion-final-v1.pdf',
  (select id from public.profiles where email = 'admin@caballero.com'),
  '2026-01-01 00:00:00+00',
  null,
  true,
  true
),
(
  '00000000-0000-4000-8000-000000000714',
  (select id from public.certificate_generation_types where name = 'Constancia de recoleccion'),
  1,
  'Plantilla recoleccion v1',
  'certificate-templates',
  'seed/plantilla-recoleccion-v1.pdf',
  (select id from public.profiles where email = 'admin@caballero.com'),
  '2026-01-01 00:00:00+00',
  null,
  true,
  true
)
on conflict (certificate_generation_type_id, version_number) do update
set name = excluded.name,
    storage_bucket = excluded.storage_bucket,
    storage_path = excluded.storage_path,
    uploaded_by = excluded.uploaded_by,
    active_from = excluded.active_from,
    active_to = excluded.active_to,
    is_active = excluded.is_active,
    is_locked = excluded.is_locked;

insert into public.companies (id, company_type, ruc, business_name, trade_name, fiscal_address, status)
values
('00000000-0000-4000-8000-000000000801', 'generator', '20547896321', 'Industrias Orion S.A.C.', 'Orion Alimentos', 'Av. Los Frutales 245, Ate, Lima', 'active'),
('00000000-0000-4000-8000-000000000802', 'generator', '20601587432', 'Textiles del Pacifico S.A.', 'Textiles Pacifico', 'Calle Las Hilanderas 120, San Juan de Lurigancho, Lima', 'active'),
('00000000-0000-4000-8000-000000000803', 'transporter', '20489561234', 'Transportes Ambientales Andinos S.R.L.', 'TAA', 'Av. Argentina 1845, Callao', 'active'),
('00000000-0000-4000-8000-000000000804', 'final_destination', '20599874126', 'Planta de Valorizacion Lima Verde S.A.C.', 'Lima Verde', 'Carretera Central Km 17.5, Lurigancho-Chosica', 'active'),
('00000000-0000-4000-8000-000000000805', 'both', '20611234567', 'Operadora Ambiental Caballero S.A.C.', 'Caballero Ambiental', 'Av. Industrial 500, Villa El Salvador, Lima', 'active'),
('00000000-0000-4000-8000-000000000806', 'generator', '20555111222', 'Clinica Santa Emilia S.A.C.', 'Santa Emilia', 'Jr. Los Alamos 330, San Isidro, Lima', 'inactive')
on conflict (ruc) do update
set company_type = excluded.company_type,
    business_name = excluded.business_name,
    trade_name = excluded.trade_name,
    fiscal_address = excluded.fiscal_address,
    status = excluded.status;

insert into public.company_branches (id, company_id, branch_type, name, address, status)
values
('00000000-0000-4000-8000-000000000811', (select id from public.companies where ruc = '20547896321'), 'fiscal_address', 'Direccion fiscal', 'Av. Los Frutales 245, Ate, Lima', 'active'),
('00000000-0000-4000-8000-000000000812', (select id from public.companies where ruc = '20547896321'), 'deposit', 'Almacen de acopio Orion', 'Mz. B Lt. 8 Parque Industrial, Ate, Lima', 'active'),
('00000000-0000-4000-8000-000000000813', (select id from public.companies where ruc = '20601587432'), 'branch', 'Planta confecciones', 'Av. Canto Grande 1550, San Juan de Lurigancho, Lima', 'active'),
('00000000-0000-4000-8000-000000000814', (select id from public.companies where ruc = '20489561234'), 'office', 'Base Callao', 'Av. Argentina 1845, Callao', 'active'),
('00000000-0000-4000-8000-000000000815', (select id from public.companies where ruc = '20599874126'), 'deposit', 'Patio de segregacion', 'Carretera Central Km 17.5, Lurigancho-Chosica', 'active'),
('00000000-0000-4000-8000-000000000816', (select id from public.companies where ruc = '20611234567'), 'deposit', 'Centro de operaciones sur', 'Av. Industrial 500, Villa El Salvador, Lima', 'active')
on conflict (id) do update
set company_id = excluded.company_id,
    branch_type = excluded.branch_type,
    name = excluded.name,
    address = excluded.address,
    status = excluded.status;

insert into public.company_contacts (id, company_id, full_name, position, email, phone, status)
values
('00000000-0000-4000-8000-000000000821', (select id from public.companies where ruc = '20547896321'), 'Mariela Rojas Salazar', 'Jefa de SSOMA', 'mrojas@orion.example', '999111222', 'active'),
('00000000-0000-4000-8000-000000000822', (select id from public.companies where ruc = '20601587432'), 'Hector Vargas Medina', 'Coordinador ambiental', 'hvargas@textilespacifico.example', '999222333', 'active'),
('00000000-0000-4000-8000-000000000823', (select id from public.companies where ruc = '20489561234'), 'Lucia Paredes Quinones', 'Supervisora de flota', 'lparedes@taa.example', '999333444', 'active'),
('00000000-0000-4000-8000-000000000824', (select id from public.companies where ruc = '20599874126'), 'Daniel Herrera Ramos', 'Responsable de planta', 'dherrera@limaverde.example', '999444555', 'active'),
('00000000-0000-4000-8000-000000000825', (select id from public.companies where ruc = '20611234567'), 'Andrea Castillo Vega', 'Ejecutiva de operaciones', 'acastillo@caballeroambiental.example', '999555666', 'active')
on conflict (id) do update
set company_id = excluded.company_id,
    full_name = excluded.full_name,
    position = excluded.position,
    email = excluded.email,
    phone = excluded.phone,
    status = excluded.status;

insert into public.items (id, code, name, description, unit_id, category_id, item_type_id, basel_code_id, status)
values
(
  '00000000-0000-4000-8000-000000000901',
  'ITM-PL-001',
  'Botellas PET transparentes',
  'Plastico PET segregado, compactado y limpio para valorizacion.',
  (select id from public.units where code = 'KG'),
  (select id from public.categories where name = 'Residuos aprovechables'),
  (select id from public.item_types where name = 'Plastico'),
  (select id from public.basel_codes where code = 'B3011'),
  'active'
),
(
  '00000000-0000-4000-8000-000000000902',
  'ITM-CA-001',
  'Carton corrugado',
  'Carton prensado proveniente de embalajes y acondicionamiento.',
  (select id from public.units where code = 'KG'),
  (select id from public.categories where name = 'Residuos aprovechables'),
  (select id from public.item_types where name = 'Papel y carton'),
  (select id from public.basel_codes where code = 'B3020'),
  'active'
),
(
  '00000000-0000-4000-8000-000000000903',
  'ITM-ME-001',
  'Chatarra ferrosa',
  'Retazos y piezas metalicas ferrosas separadas para reciclaje.',
  (select id from public.units where code = 'TM'),
  (select id from public.categories where name = 'Metales y chatarra'),
  (select id from public.item_types where name = 'Metal'),
  (select id from public.basel_codes where code = 'B1010'),
  'active'
),
(
  '00000000-0000-4000-8000-000000000904',
  'ITM-RA-001',
  'Equipos electronicos en desuso',
  'RAEE separado para desmontaje y recuperacion de componentes.',
  (select id from public.units where code = 'UND'),
  (select id from public.categories where name = 'RAEE'),
  (select id from public.item_types where name = 'Electronico'),
  (select id from public.basel_codes where code = 'B1110'),
  'active'
),
(
  '00000000-0000-4000-8000-000000000905',
  'ITM-AC-001',
  'Aceite lubricante usado',
  'Aceite mineral residual recolectado en contenedores cerrados.',
  (select id from public.units where code = 'L'),
  (select id from public.categories where name = 'Residuos peligrosos'),
  (select id from public.item_types where name = 'Aceite usado'),
  (select id from public.basel_codes where code = 'Y8'),
  'active'
),
(
  '00000000-0000-4000-8000-000000000906',
  'ITM-VI-001',
  'Vidrio mixto',
  'Envases y fragmentos de vidrio segregados para reciclaje.',
  (select id from public.units where code = 'KG'),
  (select id from public.categories where name = 'Residuos no peligrosos'),
  (select id from public.item_types where name = 'Vidrio'),
  null,
  'inactive'
)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    unit_id = excluded.unit_id,
    category_id = excluded.category_id,
    item_type_id = excluded.item_type_id,
    basel_code_id = excluded.basel_code_id,
    status = excluded.status;

insert into public.certificates (
  id,
  certificate_number,
  generation_type_id,
  template_version_id,
  issue_date,
  operation_date,
  guide_number,
  service_date,
  plate,
  generation_source,
  generator_address,
  arrival_address,
  generator_company_id,
  transporter_company_id,
  transporter_address,
  final_destination_company_id,
  destination_place,
  observations,
  status,
  issued_at,
  created_by,
  updated_by
)
values
(
  '00000000-0000-4000-8000-000000001001',
  '2026 - 0001',
  (select id from public.certificate_generation_types where name = 'Certificado de valorizacion'),
  (select ctv.id from public.certificate_template_versions ctv join public.certificate_generation_types cgt on cgt.id = ctv.certificate_generation_type_id where cgt.name = 'Certificado de valorizacion' and ctv.version_number = 1),
  '2026-05-08',
  '2026-05-07',
  'EG07-00001001',
  '2026-05-07',
  null,
  'Planta de produccion Orion',
  'Av. Los Frutales 245, Ate, Lima',
  'Av. Los Frutales 245, Ate, Lima',
  (select id from public.companies where ruc = '20547896321'),
  (select id from public.companies where ruc = '20489561234'),
  'Calle Las Artes Mz. A Lote 05 y 06, Parque industrial Anexo 08 Jicamarca, Lurigancho - Chosica',
  (select id from public.companies where ruc = '20599874126'),
  'Patio de segregacion Lima Verde',
  'Material recibido segregado y pesado en balanza de planta.',
  'active',
  '2026-05-08 16:20:00+00',
  (select id from public.profiles where email = 'admin@caballero.com'),
  (select id from public.profiles where email = 'admin@caballero.com')
),
(
  '00000000-0000-4000-8000-000000001002',
  '2026 - 0002',
  (select id from public.certificate_generation_types where name = 'Certificado de valorizacion'),
  (select ctv.id from public.certificate_template_versions ctv join public.certificate_generation_types cgt on cgt.id = ctv.certificate_generation_type_id where cgt.name = 'Certificado de valorizacion' and ctv.version_number = 1),
  '2026-05-18',
  '2026-05-17',
  'EG07-00001002',
  '2026-05-17',
  null,
  'Planta confecciones Textiles Pacifico',
  'Av. Canto Grande 1550, San Juan de Lurigancho, Lima',
  'Av. Canto Grande 1550, San Juan de Lurigancho, Lima',
  (select id from public.companies where ruc = '20601587432'),
  (select id from public.companies where ruc = '20489561234'),
  'Calle Las Artes Mz. A Lote 05 y 06, Parque industrial Anexo 08 Jicamarca, Lurigancho - Chosica',
  (select id from public.companies where ruc = '20611234567'),
  'Centro de operaciones sur',
  'Recoleccion programada con acta de conformidad del cliente.',
  'active',
  '2026-05-18 18:05:00+00',
  (select id from public.profiles where email = 'admin@caballero.com'),
  (select id from public.profiles where email = 'admin@caballero.com')
),
(
  '00000000-0000-4000-8000-000000001003',
  '2026 - 0003',
  (select id from public.certificate_generation_types where name = 'Certificado de transporte'),
  (select ctv.id from public.certificate_template_versions ctv join public.certificate_generation_types cgt on cgt.id = ctv.certificate_generation_type_id where cgt.name = 'Certificado de transporte' and ctv.version_number = 1),
  '2026-06-03',
  '2026-06-03',
  'EG07-00001003',
  '2026-06-03',
  null,
  'Almacen de acopio Orion',
  'Mz. B Lt. 8 Parque Industrial, Ate, Lima',
  'Mz. B Lt. 8 Parque Industrial, Ate, Lima',
  (select id from public.companies where ruc = '20547896321'),
  (select id from public.companies where ruc = '20489561234'),
  'Calle Las Artes Mz. A Lote 05 y 06, Parque industrial Anexo 08 Jicamarca, Lurigancho - Chosica',
  (select id from public.companies where ruc = '20599874126'),
  'Carretera Central Km 17.5',
  'Unidad autorizada para traslado segun guia adjunta.',
  'active',
  null,
  (select id from public.profiles where email = 'admin@caballero.com'),
  (select id from public.profiles where email = 'admin@caballero.com')
),
(
  '00000000-0000-4000-8000-000000001004',
  '2026 - 0004',
  (select id from public.certificate_generation_types where name = 'Certificado de disposicion final'),
  (select ctv.id from public.certificate_template_versions ctv join public.certificate_generation_types cgt on cgt.id = ctv.certificate_generation_type_id where cgt.name = 'Certificado de disposicion final' and ctv.version_number = 1),
  '2026-06-11',
  '2026-06-10',
  'EG07-00001004',
  '2026-06-10',
  null,
  'Taller de mantenimiento Caballero',
  'Av. Industrial 500, Villa El Salvador, Lima',
  'Av. Industrial 500, Villa El Salvador, Lima',
  (select id from public.companies where ruc = '20611234567'),
  (select id from public.companies where ruc = '20489561234'),
  'Calle Las Artes Mz. A Lote 05 y 06, Parque industrial Anexo 08 Jicamarca, Lurigancho - Chosica',
  (select id from public.companies where ruc = '20599874126'),
  'Zona de tratamiento autorizada',
  'Residuo peligroso gestionado con documentacion de soporte.',
  'active',
  '2026-06-11 15:40:00+00',
  (select id from public.profiles where email = 'admin@caballero.com'),
  (select id from public.profiles where email = 'admin@caballero.com')
),
(
  '00000000-0000-4000-8000-000000001005',
  '2026 - 0005',
  (select id from public.certificate_generation_types where name = 'Constancia de recoleccion'),
  (select ctv.id from public.certificate_template_versions ctv join public.certificate_generation_types cgt on cgt.id = ctv.certificate_generation_type_id where cgt.name = 'Constancia de recoleccion' and ctv.version_number = 1),
  '2026-06-20',
  '2026-06-20',
  'EG07-00001005',
  '2026-06-20',
  null,
  'Recojo extraordinario Santa Emilia',
  'Jr. Los Alamos 330, San Isidro, Lima',
  'Jr. Los Alamos 330, San Isidro, Lima',
  (select id from public.companies where ruc = '20555111222'),
  (select id from public.companies where ruc = '20489561234'),
  'Calle Las Artes Mz. A Lote 05 y 06, Parque industrial Anexo 08 Jicamarca, Lurigancho - Chosica',
  null,
  null,
  'Registro cancelado por reprogramacion del servicio.',
  'inactive',
  null,
  (select id from public.profiles where email = 'admin@caballero.com'),
  (select id from public.profiles where email = 'admin@caballero.com')
)
on conflict (certificate_number) do update
set generation_type_id = excluded.generation_type_id,
    template_version_id = excluded.template_version_id,
    issue_date = excluded.issue_date,
    operation_date = excluded.operation_date,
    guide_number = excluded.guide_number,
    service_date = excluded.service_date,
    plate = excluded.plate,
    generation_source = excluded.generation_source,
    generator_address = excluded.generator_address,
    arrival_address = excluded.arrival_address,
    generator_company_id = excluded.generator_company_id,
    transporter_company_id = excluded.transporter_company_id,
    transporter_address = excluded.transporter_address,
    final_destination_company_id = excluded.final_destination_company_id,
    destination_place = excluded.destination_place,
    observations = excluded.observations,
    status = excluded.status,
    issued_at = excluded.issued_at,
    created_by = excluded.created_by,
    updated_by = excluded.updated_by;

insert into public.certificate_items (id, certificate_id, item_id, quantity_type_id, quantity, weight, price, description, sort_order)
values
('00000000-0000-4000-8000-000000001101', (select id from public.certificates where certificate_number = '2026 - 0001'), (select id from public.items where code = 'ITM-PL-001'), (select id from public.quantity_types where name = 'Peso verificado'), 1280.0000, 1280.0000, 0.0000, 'PET prensado y embalado.', 1),
('00000000-0000-4000-8000-000000001102', (select id from public.certificates where certificate_number = '2026 - 0001'), (select id from public.items where code = 'ITM-CA-001'), (select id from public.quantity_types where name = 'Peso verificado'), 860.0000, 860.0000, 0.0000, 'Carton corrugado seco.', 2),
('00000000-0000-4000-8000-000000001103', (select id from public.certificates where certificate_number = '2026 - 0002'), (select id from public.items where code = 'ITM-CA-001'), (select id from public.quantity_types where name = 'Peso estimado'), 540.0000, 535.5000, 0.0000, 'Carton y papel mezclado.', 1),
('00000000-0000-4000-8000-000000001104', (select id from public.certificates where certificate_number = '2026 - 0002'), (select id from public.items where code = 'ITM-RA-001'), (select id from public.quantity_types where name = 'Cantidad por unidades'), 24.0000, 310.0000, 0.0000, 'Equipos de computo dados de baja.', 2),
('00000000-0000-4000-8000-000000001105', (select id from public.certificates where certificate_number = '2026 - 0003'), (select id from public.items where code = 'ITM-ME-001'), (select id from public.quantity_types where name = 'Peso estimado'), 2.7500, 2750.0000, 0.0000, 'Chatarra cargada para traslado.', 1),
('00000000-0000-4000-8000-000000001106', (select id from public.certificates where certificate_number = '2026 - 0004'), (select id from public.items where code = 'ITM-AC-001'), (select id from public.quantity_types where name = 'Peso verificado'), 420.0000, 382.0000, 0.0000, 'Aceite usado en cilindros sellados.', 1),
('00000000-0000-4000-8000-000000001107', (select id from public.certificates where certificate_number = '2026 - 0005'), (select id from public.items where code = 'ITM-RA-001'), (select id from public.quantity_types where name = 'Cantidad por unidades'), 12.0000, 95.0000, null, 'Recojo reprogramado.', 1)
on conflict (id) do update
set certificate_id = excluded.certificate_id,
    item_id = excluded.item_id,
    quantity_type_id = excluded.quantity_type_id,
    quantity = excluded.quantity,
    weight = excluded.weight,
    price = excluded.price,
    description = excluded.description,
    sort_order = excluded.sort_order;

insert into public.certificate_documents (
  id,
  certificate_id,
  document_type_id,
  file_name,
  storage_bucket,
  storage_path,
  mime_type,
  size_bytes,
  uploaded_by
)
values
('00000000-0000-4000-8000-000000001201', (select id from public.certificates where certificate_number = '2026 - 0001'), (select id from public.document_types where name = 'Guia de remision'), 'guia-remision-2026-0001.pdf', 'certificate-documents', 'seed/2026-0001/guia-remision.pdf', 'application/pdf', 185420, (select id from public.profiles where email = 'admin@caballero.com')),
('00000000-0000-4000-8000-000000001202', (select id from public.certificates where certificate_number = '2026 - 0001'), (select id from public.document_types where name = 'Evidencia fotografica'), 'evidencia-2026-0001.jpg', 'certificate-documents', 'seed/2026-0001/evidencia.jpg', 'image/jpeg', 842110, (select id from public.profiles where email = 'admin@caballero.com')),
('00000000-0000-4000-8000-000000001203', (select id from public.certificates where certificate_number = '2026 - 0002'), (select id from public.document_types where name = 'Acta de entrega'), 'acta-entrega-2026-0002.pdf', 'certificate-documents', 'seed/2026-0002/acta-entrega.pdf', 'application/pdf', 221540, (select id from public.profiles where email = 'admin@caballero.com')),
('00000000-0000-4000-8000-000000001204', (select id from public.certificates where certificate_number = '2026 - 0003'), (select id from public.document_types where name = 'Guia de remision'), 'guia-remision-2026-0003.pdf', 'certificate-documents', 'seed/2026-0003/guia-remision.pdf', 'application/pdf', 177310, (select id from public.profiles where email = 'admin@caballero.com')),
('00000000-0000-4000-8000-000000001205', (select id from public.certificates where certificate_number = '2026 - 0004'), (select id from public.document_types where name = 'Manifiesto de residuos'), 'manifiesto-2026-0004.pdf', 'certificate-documents', 'seed/2026-0004/manifiesto.pdf', 'application/pdf', 248900, (select id from public.profiles where email = 'admin@caballero.com')),
('00000000-0000-4000-8000-000000001206', (select id from public.certificates where certificate_number = '2026 - 0004'), (select id from public.document_types where name = 'Constancia de disposicion final'), 'constancia-disposicion-2026-0004.pdf', 'certificate-documents', 'seed/2026-0004/constancia-disposicion.pdf', 'application/pdf', 196780, (select id from public.profiles where email = 'admin@caballero.com'))
on conflict (id) do update
set certificate_id = excluded.certificate_id,
    document_type_id = excluded.document_type_id,
    file_name = excluded.file_name,
    storage_bucket = excluded.storage_bucket,
    storage_path = excluded.storage_path,
    mime_type = excluded.mime_type,
    size_bytes = excluded.size_bytes,
    uploaded_by = excluded.uploaded_by;

insert into public.certificate_files (
  id,
  certificate_id,
  template_version_id,
  file_name,
  storage_bucket,
  storage_path,
  version_number,
  is_current,
  generated_by,
  generated_at
)
values
('00000000-0000-4000-8000-000000001301', (select id from public.certificates where certificate_number = '2026 - 0001'), (select template_version_id from public.certificates where certificate_number = '2026 - 0001'), '2026-0001.pdf', 'generated-certificates', 'seed/2026-0001/2026-0001-v1.pdf', 1, true, (select id from public.profiles where email = 'admin@caballero.com'), '2026-05-08 16:25:00+00'),
('00000000-0000-4000-8000-000000001302', (select id from public.certificates where certificate_number = '2026 - 0002'), (select template_version_id from public.certificates where certificate_number = '2026 - 0002'), '2026-0002.pdf', 'generated-certificates', 'seed/2026-0002/2026-0002-v1.pdf', 1, true, (select id from public.profiles where email = 'admin@caballero.com'), '2026-05-18 18:10:00+00'),
('00000000-0000-4000-8000-000000001303', (select id from public.certificates where certificate_number = '2026 - 0004'), (select template_version_id from public.certificates where certificate_number = '2026 - 0004'), '2026-0004.pdf', 'generated-certificates', 'seed/2026-0004/2026-0004-v1.pdf', 1, true, (select id from public.profiles where email = 'admin@caballero.com'), '2026-06-11 15:45:00+00')
on conflict (id) do update
set certificate_id = excluded.certificate_id,
    template_version_id = excluded.template_version_id,
    file_name = excluded.file_name,
    storage_bucket = excluded.storage_bucket,
    storage_path = excluded.storage_path,
    version_number = excluded.version_number,
    is_current = excluded.is_current,
    generated_by = excluded.generated_by,
    generated_at = excluded.generated_at;
