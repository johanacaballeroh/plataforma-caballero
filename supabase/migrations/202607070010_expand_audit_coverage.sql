-- Amplia la cobertura de auditoria para cambios administrativos sensibles
-- que no tienen una columna id simple o no estaban cubiertos por el esquema base.

create or replace function public.audit_user_roles_changes()
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
      new.user_id,
      null,
      jsonb_build_object('user_id', new.user_id, 'role_id', new.role_id)
    );
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs(user_id, action, table_name, record_id, old_data, new_data)
    values (
      auth.uid(),
      lower(tg_op),
      tg_table_name,
      old.user_id,
      jsonb_build_object('user_id', old.user_id, 'role_id', old.role_id),
      null
    );
    return old;
  end if;

  return null;
end;
$$;

create or replace function public.audit_user_companies_changes()
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
      new.user_id,
      null,
      jsonb_build_object('user_id', new.user_id, 'company_id', new.company_id)
    );
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs(user_id, action, table_name, record_id, old_data, new_data)
    values (
      auth.uid(),
      lower(tg_op),
      tg_table_name,
      old.user_id,
      jsonb_build_object('user_id', old.user_id, 'company_id', old.company_id),
      null
    );
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles
after insert or update or delete on public.profiles
for each row execute function public.audit_table_changes();

drop trigger if exists audit_user_roles on public.user_roles;
create trigger audit_user_roles
after insert or delete on public.user_roles
for each row execute function public.audit_user_roles_changes();

drop trigger if exists audit_user_companies on public.user_companies;
create trigger audit_user_companies
after insert or delete on public.user_companies
for each row execute function public.audit_user_companies_changes();

drop trigger if exists audit_report_exports on public.report_exports;
create trigger audit_report_exports
after insert or update or delete on public.report_exports
for each row execute function public.audit_table_changes();
