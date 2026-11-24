-- Pruebas transaccionales. No dejan registros. Requieren migracion + seed demo.
begin;
select set_config('request.jwt.claim.sub',(select ur.user_id::text from public.user_roles ur join public.roles r on r.id = ur.role_id join public.profiles p on p.id=ur.user_id where r.name='Administrador' and p.status='active' limit 1),true);
set local role authenticated;
do $$
declare
 company uuid; chemical uuid; cycle uuid; envase uuid; next_cycle uuid; normal_cycle uuid; rewash_cycle uuid; base timestamptz := now() - interval '1 day';
 blocked boolean; count_before integer; affected integer;
begin
 select id into company from public.companies where ruc='20999999991';
 select id into chemical from public.ibc_chemicals where name='NOVA PQ 1220';
 normal_cycle := public.ibc_receive(null,'PRUEBA SIN FUGA',company,chemical,base,null,null,null);
 insert into public.ibc_service_events(cycle_id,kind,happened_at) values(normal_cycle,'wash',base+interval '1 minute');
 assert (select status='awaiting_test' from public.v_ibc_services where id=normal_cycle), 'lavado deja hermeticidad pendiente';
 insert into public.ibc_service_events(cycle_id,kind,happened_at,result) values(normal_cycle,'test',base+interval '2 minutes','approved');
 assert (select status='ready_for_delivery' and wash_count=1 from public.v_ibc_services where id=normal_cycle), 'aprobacion conserva lavado y habilita entrega';
 insert into public.ibc_service_events(cycle_id,kind,happened_at,recipient_company_id) values(normal_cycle,'deliver',base+interval '3 minutes',company);
 assert (select status='delivered' from public.v_ibc_services where id=normal_cycle), 'entrega directa sin liberacion';
 assert (select array_agg(kind order by sequence)=array['receive','wash','test','deliver'] from public.ibc_service_events where cycle_id=normal_cycle), 'historial normal completo';

 rewash_cycle := public.ibc_receive(null,'PRUEBA SEGUNDO LAVADO',company,chemical,base,null,null,null);
 insert into public.ibc_service_events(cycle_id,kind,happened_at) values(rewash_cycle,'wash',base+interval '1 minute');
 insert into public.ibc_service_events(cycle_id,kind,happened_at,result) values(rewash_cycle,'test',base+interval '2 minutes','approved');
 insert into public.ibc_service_events(cycle_id,kind,happened_at) values(rewash_cycle,'wash',base+interval '3 minutes');
 assert (select status='awaiting_test' and wash_count=2 and latest_test_result='approved' from public.v_ibc_services where id=rewash_cycle), 'el segundo lavado conserva la prueba anterior y reactiva hermeticidad';
 blocked := false;
 begin
   insert into public.ibc_service_events(cycle_id,kind,happened_at,recipient_company_id) values(rewash_cycle,'deliver',base+interval '4 minutes',company);
 exception when raise_exception then
   if sqlerrm <> 'El IBC no esta habilitado para entrega.' then raise; end if;
   blocked := true;
 end;
 assert blocked, 'la prueba anterior no habilita entrega despues del segundo lavado';
 insert into public.ibc_service_events(cycle_id,kind,happened_at,result) values(rewash_cycle,'test',base+interval '5 minutes','approved');
 insert into public.ibc_service_events(cycle_id,kind,happened_at,recipient_company_id) values(rewash_cycle,'deliver',base+interval '6 minutes',company);
 assert (select array_agg(kind order by sequence)=array['receive','wash','test','wash','test','deliver'] from public.ibc_service_events where cycle_id=rewash_cycle), 'segundo lavado conserva ambos lavados y ambas pruebas';

 cycle := public.ibc_receive(null,'PRUEBA TRANSACCIONAL',company,chemical,base,'GRE-TEST','OC-TEST','Prueba con rollback');
 select container_id into envase from public.ibc_service_cycles where id=cycle;
 assert (select status='received' from public.ibc_service_cycles where id=cycle), 'ingreso';
 insert into storage.objects(bucket_id,name,owner_id) values('ibc-documents',cycle::text||'/test.pdf',auth.uid()::text);
 insert into public.ibc_documents(cycle_id,document_kind,file_name,storage_path,mime_type,size_bytes)
   values(cycle,'evidence','test.pdf',cycle::text||'/test.pdf','application/pdf',100);
 assert (select count(*)=1 from storage.objects where name=cycle::text||'/test.pdf'), 'documento privado legible por interno';
 delete from storage.objects where name=cycle::text||'/test.pdf';
 get diagnostics affected = row_count;
 assert affected=0, 'no borra documentos con metadata';
 blocked := false;
 begin
   perform public.ibc_receive(envase,'',company,chemical,base,null,null,null);
 exception when unique_violation then blocked := true; end;
 assert blocked, 'no permite dos servicios abiertos';
 blocked := false;
 begin
   update public.ibc_service_cycles set status='delivered' where id=cycle;
 exception when insufficient_privilege then blocked := true; end;
 assert blocked, 'no permite cambiar estado directamente';
 blocked := false;
 begin
   insert into public.ibc_service_events(cycle_id,kind,happened_at,recipient_company_id) values(cycle,'deliver',base+interval '1 minute',company);
 exception when raise_exception then blocked := true; end;
 assert blocked, 'no entrega sin prueba';
 blocked := false;
 begin
   insert into public.ibc_service_events(cycle_id,kind,happened_at,result) values(cycle,'test',base+interval '1 minute','approved');
 exception when raise_exception then blocked := true; end;
 assert blocked, 'no prueba sin lavado';
 insert into public.ibc_service_events(cycle_id,kind,happened_at) values(cycle,'wash',base+interval '2 minutes');
 insert into public.ibc_service_events(cycle_id,kind,happened_at,result) values(cycle,'test',base+interval '3 minutes','leak');
 assert (select status='retained' and requires_release from public.ibc_service_cycles where id=cycle), 'fuga retiene';
 blocked := false;
 begin
   insert into public.ibc_service_events(cycle_id,kind,happened_at) values(cycle,'release',base+interval '4 minutes');
 exception when raise_exception then blocked := true; end;
 assert blocked, 'no libera fuga';
 insert into public.ibc_service_events(cycle_id,kind,happened_at) values(cycle,'wash',base+interval '4 minutes');
 blocked := false;
 begin
   insert into public.ibc_service_events(cycle_id,kind,happened_at,result) values(cycle,'test',base+interval '5 minutes','approved');
 exception when raise_exception then blocked := true; end;
 assert blocked, 'lavado no sustituye reparacion tras fuga';
 insert into public.ibc_service_events(cycle_id,kind,happened_at,notes) values(cycle,'repair',base+interval '5 minutes','Reparacion de prueba');
 blocked := false;
 begin
   insert into public.ibc_service_events(cycle_id,kind,happened_at) values(cycle,'release',base+interval '6 minutes');
 exception when raise_exception then blocked := true; end;
 assert blocked, 'reparar no libera';
 insert into public.ibc_service_events(cycle_id,kind,happened_at,result) values(cycle,'test',base+interval '6 minutes','leak');
 assert (select status='retained' and requires_release from public.v_ibc_services where id=cycle), 'segunda fuga conserva la retencion';
 insert into public.ibc_service_events(cycle_id,kind,happened_at,notes) values(cycle,'repair',base+interval '6 minutes 20 seconds','Segunda reparacion de prueba');
 insert into public.ibc_service_events(cycle_id,kind,happened_at,result) values(cycle,'test',base+interval '6 minutes 40 seconds','approved');
 assert (select status='retained' from public.ibc_service_cycles where id=cycle), 'nueva prueba requiere liberacion';
 insert into public.ibc_service_events(cycle_id,kind,happened_at) values(cycle,'release',base+interval '7 minutes');
 assert (select status='ready_for_delivery' from public.ibc_service_cycles where id=cycle), 'liberacion';
 insert into public.ibc_service_events(cycle_id,kind,happened_at,recipient_company_id,gre_exit) values(cycle,'deliver',base+interval '8 minutes',company,'GRE-SALIDA-TEST');
 assert (select status='delivered' and delivered_at is not null from public.ibc_service_cycles where id=cycle), 'entrega';
 blocked := false;
 begin
   insert into public.ibc_documents(cycle_id,document_kind,file_name,storage_path,mime_type,size_bytes)
     values(cycle,'evidence','closed.pdf',cycle::text||'/closed.pdf','application/pdf',100);
 exception when insufficient_privilege then blocked := true; end;
 assert blocked, 'no adjunta despues de cerrar';
 assert (select wash_count=2 from public.v_ibc_services where id=cycle), 'conteo por lavados reales';
 assert (select array_agg(result order by sequence)=array['leak','leak','approved'] from public.ibc_service_events where cycle_id=cycle and kind='test'), 'se conservan las tres pruebas de hermeticidad';
 select count(*) into count_before from public.ibc_service_events where cycle_id=cycle;
 next_cycle := public.ibc_receive(envase,'',company,chemical,base+interval '9 minutes',null,null,null);
 assert next_cycle<>cycle, 'reingreso crea otro ciclo';
 assert (select count(*)=count_before from public.ibc_service_events where cycle_id=cycle), 'historial conservado';
 blocked := false;
 begin
   insert into public.ibc_service_events(cycle_id,kind,happened_at) values(next_cycle,'wash',now()+interval '1 day');
 exception when raise_exception then blocked := true; end;
 assert blocked, 'fechas futuras rechazadas';
 blocked := false;
 begin
   insert into public.ibc_service_events(cycle_id,kind,happened_at) values(next_cycle,'wash',base);
 exception when raise_exception then blocked := true; end;
 assert blocked, 'cronologia rechazada';
 blocked := false;
 begin
   update public.ibc_service_events set notes='alterado' where cycle_id=cycle;
 exception when insufficient_privilege then blocked := true; end;
 assert blocked, 'eventos inmutables';
 insert into public.report_exports(report_type,file_name,filters,generated_by) values('ibc_services','test.csv','{}',auth.uid());
end $$;
reset role;
-- Cliente sin permisos IBC: ni datos ni archivos.
select set_config('request.jwt.claim.sub',(select ur.user_id::text from public.user_roles ur join public.roles r on r.id=ur.role_id where r.name='Cliente' limit 1),true);
set local role authenticated;
do $$ declare blocked boolean := false; begin
 assert (select count(*)=0 from public.v_ibc_services), 'Cliente sin servicios';
 assert (select count(*)=0 from public.ibc_chemicals), 'Cliente sin quimicos';
 assert (select count(*)=0 from storage.objects where bucket_id='ibc-documents'), 'Cliente sin documentos';
 begin
   insert into public.ibc_containers(original_number) values('NO AUTORIZADO');
 exception when insufficient_privilege then blocked:=true; end;
 assert blocked,'Cliente sin escritura';
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select ur.user_id::text from public.user_roles ur join public.roles r on r.id=ur.role_id where r.name='Gerente' limit 1),true);
set local role authenticated;
do $$ begin
 assert (select count(*)>=8 from public.v_ibc_services), 'Gerente con acceso';
 assert not public.has_permission('logs','view'), 'Gerente sin logs';
end $$;
reset role;
set local role anon;
do $$ declare blocked boolean:=false; begin
 begin perform * from public.v_ibc_services;
 exception when insufficient_privilege then blocked:=true; end;
 assert blocked, 'Anonimo sin acceso';
end $$;
rollback;
