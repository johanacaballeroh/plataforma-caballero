// npm install --prefix tmp/ibc-validation --no-save --package-lock=false @electric-sql/pglite@0.5.15
// node scripts/test-ibc-database.mjs
// PostgreSQL local en memoria. No usa claves ni modifica Supabase remoto.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(path.resolve('tmp/ibc-validation/package.json'));
const { PGlite } = require('@electric-sql/pglite');
const db = new PGlite();
const sql = (file) => readFile(path.resolve(file), 'utf8');

try {
    await db.exec(`
        create role anon; create role authenticated; create role service_role bypassrls;
        create schema auth;
        create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
        create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
        grant usage on schema public,auth to anon,authenticated;
        grant execute on function auth.uid() to anon,authenticated;
        create schema storage;
        create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
        create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);
        alter table storage.objects enable row level security;
        grant usage on schema storage to authenticated;
        grant select,insert,delete on storage.objects to authenticated;
    `);
    await db.exec((await sql('supabase/schema.sql')).replace(/create extension if not exists "pgcrypto";/, ''));
    if (process.argv.includes('--without-base-audit')) {
        // Reproduce la base remota: tabla audit_logs presente, funcion generica ausente.
        await db.exec('drop function public.audit_table_changes() cascade;');
    }
    await db.exec(await sql('supabase/rls-policies.sql'));
    await db.exec(`
        grant select on public.profiles,public.roles,public.user_roles,public.role_permissions,public.permissions,public.companies,public.report_exports to authenticated;
        grant insert on public.report_exports to authenticated;
        insert into auth.users(id,email,raw_user_meta_data) values
          ('10000000-0000-4000-8000-000000000001','ibc-admin@example.invalid','{"full_name":"Admin prueba"}'),
          ('10000000-0000-4000-8000-000000000002','ibc-client@example.invalid','{"full_name":"Cliente prueba"}'),
          ('10000000-0000-4000-8000-000000000003','ibc-manager@example.invalid','{"full_name":"Gerente prueba"}');
        insert into public.roles(name,is_system_role) values('Administrador',true),('Cliente',true),('Gerente',true);
        insert into public.user_roles(user_id,role_id)
          select '10000000-0000-4000-8000-000000000001',id from public.roles where name='Administrador';
        insert into public.user_roles(user_id,role_id)
          select '10000000-0000-4000-8000-000000000002',id from public.roles where name='Cliente';
        insert into public.user_roles(user_id,role_id)
          select '10000000-0000-4000-8000-000000000003',id from public.roles where name='Gerente';
    `);
    assert.equal(await sql('supabase/migrations/20261108043503_ibc_control_mvp.sql'), await sql('supabase/ibc.sql'), 'migracion y contrato sincronizados');
    await db.exec(await sql('supabase/setup-ibc-mvp.sql'));
    await db.exec(await sql('supabase/ibc-demo.sql'));
    const demo = await db.query(`select count(*)::integer as count from public.ibc_service_cycles where is_demo`);
    assert.equal(demo.rows[0].count, 8, 'seed idempotente de ocho ejemplos');
    const audit = await db.query(`select count(*)::integer as count from public.audit_logs where table_name like 'ibc_%'`);
    assert.ok(audit.rows[0].count > 0, 'los eventos IBC registran auditoria');
    const protection = await db.query(`select bool_and(relrowsecurity) as enabled from pg_class where relnamespace = 'public'::regnamespace and relname in ('ibc_containers','ibc_chemicals','ibc_service_cycles','ibc_service_events','ibc_documents')`);
    assert.equal(protection.rows[0].enabled, true, 'RLS activo en las cinco tablas');
    await db.exec(await sql('supabase/tests/ibc-workflow.sql'));
    console.log(`OK: migracion, auditoria, seed idempotente y pruebas de flujo/RLS/Storage en PostgreSQL local${process.argv.includes('--without-base-audit') ? ' sin funcion generica de auditoria' : ''}.`);
} finally {
    await db.close();
}
