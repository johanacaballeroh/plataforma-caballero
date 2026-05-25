# Estado de Sakai NG

## Estado actual

El workspace ya esta basado en Sakai NG con Angular 21, PrimeNG y TailwindCSS.

Este documento queda como nota historica y regla de prevencion: no se debe reiniciar el proyecto ni crear un Angular nuevo si la estructura actual de Sakai NG ya esta presente.

## Regla principal

No crear un proyecto Angular nuevo.

La implementacion futura debe adaptar la estructura existente de Sakai NG:

- `src/app/layout`
- `src/app/pages/auth`
- `src/app/pages/dashboard`
- configuracion PrimeNG
- estilos globales
- soporte TailwindCSS

## Que conservar siempre

- `/AGENTS.md`
- `/specs/**`
- `/reference/**`
- `/supabase/**`
- configuracion y estructura real de Sakai NG ya presente en el workspace.

## Cuando aplicar un reinicio

Solo aplicar reinicio si en una revision futura se confirma que el workspace dejo de estar basado en Sakai NG o se rompio su estructura base.

En ese caso, antes de borrar archivos se deben respaldar:

- `/AGENTS.md`
- `/specs/**`
- `/reference/**`
- `/supabase/**`
- cualquier nota local sin secretos.

Luego se debe restaurar desde:

```text
https://github.com/primefaces/sakai-ng
```

## Regla para proximos prompts

Todo prompt de implementacion frontend debe asumir:

```text
El workspace ya esta basado en Sakai NG. No crees un proyecto Angular nuevo. Adapta la estructura existente de Sakai NG.
```

## Supabase

Supabase sigue siendo backend principal:

- Supabase Auth.
- Supabase PostgreSQL.
- Supabase Storage.
- RLS.
- Supabase JS Client desde Angular.

La URL publica del proyecto y publishable key pueden ir en environments del frontend.

La connection string directa de PostgreSQL y cualquier clave secreta no deben ir en Angular.
