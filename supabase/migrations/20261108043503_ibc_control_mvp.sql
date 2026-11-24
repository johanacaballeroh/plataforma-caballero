-- Contrato aditivo del MVP IBC. Aplicar despues de los SQL base.
-- La migracion versionada contiene este mismo contrato.
create schema if not exists private;

-- Auditoria propia del modulo: no depende de funciones del esquema base remoto.
-- Solo se ejecuta como trigger; clientes no pueden invocarla directamente.
create function private.ibc_audit_changes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_logs(user_id,action,table_name,record_id,old_data,new_data)
  values (
    auth.uid(),lower(tg_op),tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.ibc_audit_changes() from public,anon,authenticated;

create table public.ibc_chemicals (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 160),
  description text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index ibc_chemical_name on public.ibc_chemicals (lower(btrim(name)));

create sequence public.ibc_code_seq;
create table public.ibc_containers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('IBC-' || lpad(nextval('public.ibc_code_seq')::text,8,'0')),
  original_number text not null check (length(btrim(original_number)) between 1 and 80),
  notes text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ibc_original_number on public.ibc_containers(original_number);

create table public.ibc_service_cycles (
  id uuid primary key default gen_random_uuid(),
  container_id uuid not null references public.ibc_containers(id),
  company_id uuid not null references public.companies(id),
  chemical_id uuid not null references public.ibc_chemicals(id),
  company_name text not null,
  chemical_name text not null,
  received_at timestamptz not null,
  gre_entry text,
  purchase_order text,
  notes text,
  legacy_rotation integer check (legacy_rotation >= 0),
  source_reference text,
  is_demo boolean not null default false,
  status text not null default 'received' check (status in ('received','awaiting_test','retained','ready_for_delivery','delivered')),
  requires_release boolean not null default false,
  delivered_at timestamptz,
  recipient_company_id uuid references public.companies(id),
  gre_exit text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'delivered') = (delivered_at is not null)),
  check (delivered_at is null or delivered_at >= received_at)
);
create unique index ibc_one_open_cycle on public.ibc_service_cycles(container_id) where status <> 'delivered';
create index ibc_cycles_received on public.ibc_service_cycles(received_at desc,id);
create index ibc_cycles_company on public.ibc_service_cycles(company_id,received_at desc);
create index ibc_cycles_chemical on public.ibc_service_cycles(chemical_id);
create index ibc_cycles_status on public.ibc_service_cycles(status,received_at desc);
create index ibc_cycles_recipient on public.ibc_service_cycles(recipient_company_id);

create table public.ibc_service_events (
  id uuid primary key default gen_random_uuid(),
  sequence bigint generated always as identity unique,
  cycle_id uuid not null references public.ibc_service_cycles(id),
  kind text not null check (kind in ('receive','wash','test','repair','release','deliver','note')),
  happened_at timestamptz not null,
  result text check (result in ('approved','leak')),
  notes text,
  recipient_company_id uuid references public.companies(id),
  gre_exit text,
  resulting_status text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check ((kind = 'test') = (result is not null))
);
create index ibc_events_cycle on public.ibc_service_events(cycle_id,sequence desc);
create index ibc_events_actor on public.ibc_service_events(created_by);
create index ibc_events_recipient on public.ibc_service_events(recipient_company_id);

create table public.ibc_documents (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.ibc_service_cycles(id),
  document_kind text not null check (document_kind in ('gre_entry','gre_exit','purchase_order','evidence')),
  file_name text not null,
  storage_bucket text not null default 'ibc-documents' check (storage_bucket = 'ibc-documents'),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf','image/png','image/jpeg','image/webp')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now(),
  check (split_part(storage_path,'/',1) = cycle_id::text)
);
create index ibc_documents_cycle on public.ibc_documents(cycle_id);

-- Metadatos de autoria; snapshots de nombres para preservar el servicio historico.
create function private.ibc_stamp() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
  end if;
  new.updated_by := auth.uid();
  new.updated_at := now();
  if tg_table_name = 'ibc_service_cycles' then
    if tg_op = 'INSERT' or new.company_id is distinct from old.company_id then
      select business_name into new.company_name from public.companies where id = new.company_id and status = 'active';
      if new.company_name is null then raise exception 'Selecciona una empresa activa.'; end if;
    end if;
    if tg_op = 'INSERT' or new.chemical_id is distinct from old.chemical_id then
      select name into new.chemical_name from public.ibc_chemicals where id = new.chemical_id and status = 'active';
      if new.chemical_name is null then raise exception 'Selecciona un quimico activo.'; end if;
    end if;
    if tg_op = 'INSERT' then
      if new.received_at > now() then raise exception 'El ingreso no puede tener fecha futura.'; end if;
      perform 1 from public.ibc_containers where id = new.container_id and status = 'active' for update;
      if not found then raise exception 'Selecciona un envase activo.'; end if;
    end if;
  elsif tg_table_name = 'ibc_containers' and tg_op = 'UPDATE' and new.status = 'inactive' then
    if exists (select 1 from public.ibc_service_cycles where container_id = new.id and status <> 'delivered') then
      raise exception 'No se puede inactivar un envase con un servicio abierto.';
    end if;
  end if;
  return new;
end;
$$;

create trigger ibc_stamp before insert or update on public.ibc_chemicals for each row execute function private.ibc_stamp();
create trigger ibc_stamp before insert or update on public.ibc_containers for each row execute function private.ibc_stamp();
create trigger ibc_stamp before insert or update on public.ibc_service_cycles for each row execute function private.ibc_stamp();

-- Definer exclusivamente para trigger: las columnas de estado no son escribibles por la API.
-- No es RPC publica. Valida identidad y permiso antes de cualquier escritura privilegiada.
create function private.ibc_apply_event() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  c public.ibc_service_cycles;
  previous_event public.ibc_service_events;
  latest_process public.ibc_service_events;
  latest_leak bigint;
  action_name text;
  new_status text;
begin
  action_name := case new.kind when 'receive' then 'create' when 'note' then 'update' else new.kind end;
  if auth.uid() is null or not exists (select 1 from public.profiles where id = auth.uid() and status = 'active')
     or not public.has_permission('ibc',action_name) then
    raise exception 'No autorizado para esta accion IBC.' using errcode = '42501';
  end if;
  select * into c from public.ibc_service_cycles where id = new.cycle_id for update;
  if not found then raise exception 'Servicio no encontrado.'; end if;
  if c.status = 'delivered' then raise exception 'El servicio ya fue entregado.'; end if;
  select * into previous_event from public.ibc_service_events where cycle_id = c.id order by sequence desc limit 1;
  if new.happened_at < c.received_at or new.happened_at > now()
     or (previous_event.id is not null and new.happened_at < previous_event.happened_at) then
    raise exception 'La fecha debe ser posterior al ingreso y al ultimo evento, sin ser futura.';
  end if;
  if previous_event.id is null and new.kind <> 'receive' then raise exception 'Primero registra la recepcion.'; end if;
  new_status := c.status;
  select * into latest_process from public.ibc_service_events
    where cycle_id = c.id and kind in ('wash','repair','test') order by sequence desc limit 1;
  case new.kind
    when 'receive' then
      if previous_event.id is not null then raise exception 'La recepcion ya fue registrada.'; end if;
    when 'wash' then
      new_status := case when c.requires_release then 'retained' else 'awaiting_test' end;
    when 'repair' then
      if c.status <> 'retained' or nullif(btrim(new.notes),'') is null then
        raise exception 'La reparacion requiere un envase retenido y una descripcion.';
      end if;
    when 'test' then
      if new.result not in ('approved','leak') or new.result is null then raise exception 'Selecciona el resultado de hermeticidad.'; end if;
      if latest_process.kind not in ('wash','repair') or latest_process.id is null then
        raise exception 'Registra un lavado o reparacion antes de una nueva prueba.';
      end if;
      if not exists (select 1 from public.ibc_service_events where cycle_id = c.id and kind = 'wash') then
        raise exception 'El servicio debe tener un lavado registrado.';
      end if;
      select max(sequence) into latest_leak from public.ibc_service_events where cycle_id = c.id and kind = 'test' and result = 'leak';
      if latest_leak is not null and not exists (select 1 from public.ibc_service_events where cycle_id = c.id and kind = 'repair' and sequence > latest_leak) then
        raise exception 'Registra la reparacion posterior a la ultima fuga antes de repetir la prueba.';
      end if;
      if new.result = 'leak' then
        c.requires_release := true;
        new_status := 'retained';
      else
        new_status := case when c.requires_release then 'retained' else 'ready_for_delivery' end;
      end if;
    when 'release' then
      if c.status <> 'retained' or latest_process.kind <> 'test' or latest_process.result <> 'approved' then
        raise exception 'La liberacion requiere una nueva prueba aprobada.';
      end if;
      c.requires_release := false;
      new_status := 'ready_for_delivery';
    when 'deliver' then
      if c.status <> 'ready_for_delivery' or c.requires_release or latest_process.kind <> 'test' or latest_process.result <> 'approved' then
        raise exception 'El IBC no esta habilitado para entrega.';
      end if;
      if new.recipient_company_id is null or not exists (select 1 from public.companies where id = new.recipient_company_id and status = 'active') then
        raise exception 'Selecciona la empresa receptora activa.';
      end if;
      c.delivered_at := new.happened_at;
      c.recipient_company_id := new.recipient_company_id;
      c.gre_exit := new.gre_exit;
      new_status := 'delivered';
    when 'note' then
      if nullif(btrim(new.notes),'') is null then raise exception 'Escribe la observacion o correccion.'; end if;
    else raise exception 'Accion no valida.';
  end case;
  new.created_by := auth.uid();
  new.created_at := now();
  new.resulting_status := new_status;
  update public.ibc_service_cycles set status = new_status, requires_release = c.requires_release,
    delivered_at = c.delivered_at, recipient_company_id = c.recipient_company_id, gre_exit = c.gre_exit
    where id = c.id;
  return new;
end;
$$;
revoke all on function private.ibc_apply_event() from public,anon,authenticated;
revoke all on function private.ibc_stamp() from public,anon,authenticated;
create trigger ibc_apply_event before insert on public.ibc_service_events for each row execute function private.ibc_apply_event();

create function public.ibc_receive(p_container_id uuid, p_original_number text, p_company_id uuid,
 p_chemical_id uuid, p_received_at timestamptz, p_gre_entry text default null, p_purchase_order text default null, p_notes text default null)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_container uuid := p_container_id; v_cycle uuid;
begin
  if v_container is null then
    insert into public.ibc_containers(original_number) values (btrim(p_original_number)) returning id into v_container;
  end if;
  insert into public.ibc_service_cycles(container_id,company_id,chemical_id,received_at,gre_entry,purchase_order,notes)
    values (v_container,p_company_id,p_chemical_id,p_received_at,nullif(btrim(p_gre_entry),''),nullif(btrim(p_purchase_order),''),p_notes) returning id into v_cycle;
  insert into public.ibc_service_events(cycle_id,kind,happened_at,notes)
    values (v_cycle,'receive',p_received_at,p_notes);
  return v_cycle;
end;
$$;
revoke all on function public.ibc_receive(uuid,text,uuid,uuid,timestamptz,text,text,text) from public,anon;
grant execute on function public.ibc_receive(uuid,text,uuid,uuid,timestamptz,text,text,text) to authenticated;

-- Lecturas de bandeja y ficha con RLS de las tablas subyacentes.
create view public.v_ibc_services with (security_invoker = true) as
select c.*, b.code as container_code, b.original_number,
  (select count(*)::integer from public.ibc_service_events e where e.cycle_id = c.id and e.kind = 'wash') as wash_count,
  (select e.result from public.ibc_service_events e where e.cycle_id = c.id and e.kind = 'test' order by e.sequence desc limit 1) as latest_test_result
from public.ibc_service_cycles c join public.ibc_containers b on b.id = c.container_id;
create view public.v_ibc_containers with (security_invoker = true) as
select b.*,
 (select count(*)::integer from public.ibc_service_cycles c where c.container_id = b.id) as cycle_count,
 (select count(*)::integer from public.ibc_service_events e join public.ibc_service_cycles c on c.id = e.cycle_id where c.container_id = b.id and e.kind = 'wash') as wash_count
from public.ibc_containers b;

insert into public.permissions(module_key,action_key,description)
select 'ibc',a,'Control IBC: '||a from unnest(array['view','create','update','wash','test','repair','release','deliver','documents','export']) a
on conflict do nothing;
insert into public.permissions(module_key,action_key,description)
select 'ibc_chemicals',a,'Quimicos IBC: '||a from unnest(array['view','create','update']) a
on conflict do nothing;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name in ('Administrador','Gerente') and p.module_key in ('ibc','ibc_chemicals') on conflict do nothing;

-- Revocar privilegios implicitos antes de conceder columnas permitidas.
revoke all on public.ibc_containers,public.ibc_chemicals,public.ibc_service_cycles,public.ibc_service_events,public.ibc_documents,public.v_ibc_services,public.v_ibc_containers from anon,authenticated;
grant select on public.ibc_containers,public.ibc_chemicals,public.ibc_service_cycles,public.ibc_service_events,public.ibc_documents,public.v_ibc_services,public.v_ibc_containers to authenticated;
grant usage on sequence public.ibc_code_seq,public.ibc_service_events_sequence_seq to authenticated;
grant insert(original_number,notes,status),update(original_number,notes,status) on public.ibc_containers to authenticated;
grant insert(name,description,status),update(name,description,status) on public.ibc_chemicals to authenticated;
grant insert(container_id,company_id,chemical_id,received_at,gre_entry,purchase_order,notes),update(company_id,chemical_id,gre_entry,purchase_order,notes) on public.ibc_service_cycles to authenticated;
grant insert(cycle_id,kind,happened_at,result,notes,recipient_company_id,gre_exit) on public.ibc_service_events to authenticated;
grant insert(cycle_id,document_kind,file_name,storage_bucket,storage_path,mime_type,size_bytes) on public.ibc_documents to authenticated;

-- Declaraciones explicitas para que el editor tambien detecte RLS al instalar.
alter table public.ibc_containers enable row level security;
alter table public.ibc_service_cycles enable row level security;
alter table public.ibc_service_events enable row level security;
alter table public.ibc_documents enable row level security;
alter table public.ibc_chemicals enable row level security;

do $$ declare t text; begin
  foreach t in array array['ibc_containers','ibc_service_cycles','ibc_service_events','ibc_documents','ibc_chemicals'] loop
    execute format('create policy ibc_active_user on public.%I as restrictive for all to authenticated using (exists(select 1 from public.profiles where id = (select auth.uid()) and status = ''active'')) with check (exists(select 1 from public.profiles where id = (select auth.uid()) and status = ''active''))',t);
    execute format('create trigger ibc_audit after insert or update or delete on public.%I for each row execute function private.ibc_audit_changes()',t);
  end loop;
end $$;
create policy ibc_read on public.ibc_containers for select to authenticated using ((select public.has_permission('ibc','view')));
create policy ibc_read on public.ibc_service_cycles for select to authenticated using ((select public.has_permission('ibc','view')));
create policy ibc_read on public.ibc_service_events for select to authenticated using ((select public.has_permission('ibc','view')));
create policy ibc_read on public.ibc_documents for select to authenticated using ((select public.has_permission('ibc','view')));
create policy ibc_read on public.ibc_chemicals for select to authenticated using ((select public.has_permission('ibc','view')) or (select public.has_permission('ibc_chemicals','view')));
create policy ibc_create on public.ibc_containers for insert to authenticated with check ((select public.has_permission('ibc','create')));
create policy ibc_update on public.ibc_containers for update to authenticated using ((select public.has_permission('ibc','update'))) with check ((select public.has_permission('ibc','update')));
create policy ibc_create on public.ibc_service_cycles for insert to authenticated with check ((select public.has_permission('ibc','create')));
create policy ibc_update on public.ibc_service_cycles for update to authenticated using ((select public.has_permission('ibc','update')) and status <> 'delivered') with check ((select public.has_permission('ibc','update')) and status <> 'delivered');
create policy ibc_create on public.ibc_chemicals for insert to authenticated with check ((select public.has_permission('ibc_chemicals','create')));
create policy ibc_update on public.ibc_chemicals for update to authenticated using ((select public.has_permission('ibc_chemicals','update'))) with check ((select public.has_permission('ibc_chemicals','update')));
create policy ibc_event on public.ibc_service_events for insert to authenticated with check (public.has_permission('ibc',case kind when 'receive' then 'create' when 'note' then 'update' else kind end));
create policy ibc_document on public.ibc_documents for insert to authenticated with check ((select public.has_permission('ibc','documents')) and exists(select 1 from public.ibc_service_cycles c where c.id = cycle_id and c.status <> 'delivered'));
create policy ibc_export_log on public.report_exports for insert to authenticated with check (
  report_type = 'ibc_services' and generated_by = (select auth.uid()) and (select public.has_permission('ibc','export'))
  and exists(select 1 from public.profiles where id = (select auth.uid()) and status = 'active')
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('ibc-documents','ibc-documents',false,20971520,array['application/pdf','image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
create policy ibc_storage_read on storage.objects for select to authenticated using (
 bucket_id = 'ibc-documents' and (select public.has_permission('ibc','view')) and exists(select 1 from public.ibc_service_cycles c where c.id::text = split_part(name,'/',1))
);
create policy ibc_storage_create on storage.objects for insert to authenticated with check (
 bucket_id = 'ibc-documents' and (select public.has_permission('ibc','documents')) and exists(select 1 from public.ibc_service_cycles c where c.id::text = split_part(name,'/',1) and c.status <> 'delivered')
);
-- Permite limpiar una subida sin metadata si la segunda operacion falla; nunca borrar adjuntos registrados.
create policy ibc_storage_cleanup on storage.objects for delete to authenticated using (
 bucket_id = 'ibc-documents' and (select public.has_permission('ibc','documents'))
 and owner_id = (select auth.uid())::text
 and not exists(select 1 from public.ibc_documents d where d.storage_path = name)
);
notify pgrst, 'reload schema';
