// Empaqueta los SQL revisados para ejecutar en Supabase SQL Editor.
import { readFile, writeFile } from 'node:fs/promises';

const migration = await readFile('supabase/ibc.sql', 'utf8');
const demo = (await readFile('supabase/ibc-demo.sql', 'utf8')).replace(/^begin;\s*$/m, '').replace(/^commit;\s*$/m, '');
const preamble = `-- CONTROL IBC · MVP · INSTALACION + OCHO ENVASES DE DEMOSTRACION
-- Ejecutar UNA VEZ en el SQL Editor del proyecto Plataforma Caballero.
-- Requiere el esquema base, RLS y un Administrador activo ya existentes.
-- Empresa y eventos de demostracion son ficticios. No modifica certificados.
-- Todo el archivo es una transaccion: si falla, no se instala parcialmente.
-- Despues de ejecutar, cerrar sesion y volver a ingresar en la aplicacion.
begin;
`;

await writeFile('supabase/migrations/20261108043503_ibc_control_mvp.sql', migration);
await writeFile('supabase/setup-ibc-mvp.sql', `${preamble}\n${migration}\n${demo}\ncommit;\n`);
console.log('Generado supabase/setup-ibc-mvp.sql');
