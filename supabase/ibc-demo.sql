-- SOLO DEMOSTRACION. Datos base transcritos de la captura aportada por la usuaria.
-- Estados, empresa y eventos son simulados; no acreditan hechos operativos reales.
-- Ejecutar una vez despues de la migracion IBC. Reejecucion no duplica los ejemplos.
begin;
do $$
declare
  actor uuid;
  demo_company uuid;
  chem uuid;
  envase uuid;
  cycle uuid;
  row_data record;
  received timestamptz;
begin
  select ur.user_id into actor from public.user_roles ur
    join public.roles r on r.id = ur.role_id join public.profiles p on p.id = ur.user_id
    where r.name = 'Administrador' and r.status = 'active' and p.status = 'active' order by p.created_at limit 1;
  if actor is null then raise exception 'Se requiere un Administrador activo para el seed de demostracion.'; end if;
  perform set_config('request.jwt.claim.sub', actor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub',actor,'role','authenticated')::text, true);

  insert into public.companies(company_type,ruc,business_name,trade_name,status)
    values ('generator','20999999991','Empresa ficticia · Demostracion IBC','DEMO IBC','active')
    on conflict (ruc) do nothing;
  select id into demo_company from public.companies where ruc = '20999999991' and trade_name = 'DEMO IBC';
  if demo_company is null then raise exception 'El RUC de demo ya esta usado por otra empresa; no se modifico.'; end if;

  for row_data in select * from (values
    ('936','NOVA PQ 1220','2026-02-15','EG07-00008454',1,'delivered'),
    ('180','SPECTRUM RX9800','2026-02-15','EG07-00008454',2,'ready'),
    ('531','AKD GI 23 FLAT','2026-02-15','EG07-00008454',2,'washed'),
    ('14','AKD GI 23 FLAT','2026-02-15','EG07-00008454',4,'leak'),
    ('278','GI POLYCHEM CC 303','2026-02-19','EG07-00008479',2,'retested'),
    ('26','VIOLET GI 100','2026-02-19','EG07-00008479',2,'received'),
    ('972','AKD GI 23 FLAT','2026-02-19','EG07-00008479',1,'leak'),
    ('976','PERFORM PC1279F','2026-02-19','EG07-00008479',1,'leak')
  ) as t(number,chemical,entry_date,gre,rotation,scenario) loop
    insert into public.ibc_chemicals(name,description)
      values (row_data.chemical,'Nombre transcrito de la captura para demostracion.') on conflict do nothing;
    select id into chem from public.ibc_chemicals where lower(btrim(name)) = lower(row_data.chemical);
    insert into public.ibc_containers(code,original_number,notes)
      values ('IBC-DEMO-'||row_data.number,row_data.number,'Ficha de demostracion basada en la imagen. No se interpretaron colores.') on conflict(code) do nothing;
    select id into envase from public.ibc_containers where code = 'IBC-DEMO-'||row_data.number;
    if exists(select 1 from public.ibc_service_cycles where container_id = envase) then continue; end if;
    received := (row_data.entry_date || ' 08:00:00-05')::timestamptz;
    insert into public.ibc_service_cycles(container_id,company_id,chemical_id,received_at,gre_entry,legacy_rotation,source_reference,is_demo,notes)
      values (envase,demo_company,chem,received,row_data.gre,row_data.rotation,'Captura de hoja IBC compartida en el chat; colores y Columna 1 pendientes de validacion.',true,'DEMO: empresa, horas y eventos simulados. Fecha, numero, quimico, GRE y rotacion transcritos.') returning id into cycle;
    insert into public.ibc_service_events(cycle_id,kind,happened_at,notes) values (cycle,'receive',received,'DEMO: recepcion simulada.');
    if row_data.scenario <> 'received' then
      insert into public.ibc_service_events(cycle_id,kind,happened_at,notes) values (cycle,'wash',received + interval '1 hour','DEMO: lavado simulado; no proviene de un registro historico confirmado.');
    end if;
    if row_data.scenario in ('ready','delivered','leak','retested') then
      insert into public.ibc_service_events(cycle_id,kind,happened_at,result,notes)
        values (cycle,'test',received + interval '2 hours',case when row_data.scenario in ('leak','retested') then 'leak' else 'approved' end,'DEMO: resultado de prueba simulado.');
    end if;
    if row_data.scenario = 'delivered' then
      insert into public.ibc_service_events(cycle_id,kind,happened_at,recipient_company_id,notes)
        values (cycle,'deliver',received + interval '3 hours',demo_company,'DEMO: entrega simulada.');
    elsif row_data.scenario = 'retested' then
      insert into public.ibc_service_events(cycle_id,kind,happened_at,notes) values(cycle,'repair',received + interval '3 hours','DEMO: reparacion simulada.');
      insert into public.ibc_service_events(cycle_id,kind,happened_at,result,notes) values(cycle,'test',received + interval '4 hours','approved','DEMO: nueva prueba aprobada. Pendiente de liberacion.');
    end if;
  end loop;
end $$;
commit;
