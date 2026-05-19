# Reinicio desde Sakai NG

## Motivo

Sakai NG no debe integrarse como si fuera una dependencia instalable encima de un proyecto Angular vacío.

Para este proyecto, Sakai NG debe ser la base inicial real del frontend. El backoffice se adapta sobre su estructura, layout, login, estilos, rutas y configuración PrimeNG/TailwindCSS.

## Qué conservar antes de borrar la instalación actual

Conservar estos archivos y carpetas:

- `/AGENTS.md`
- `/specs/**`
- `/reference/**`
- `/supabase/**`

Conservar también cualquier nota local sin secretos que documente decisiones del proyecto.

## Qué no es necesario conservar

Si la instalación actual fue creada con Angular vacío y luego modificada manualmente, no es necesario conservar:

- `/src/**`
- `/node_modules/**`
- `/dist/**`
- `/package.json`
- `/package-lock.json`
- `/angular.json`
- `/tsconfig*.json`
- configuración generada por el scaffold Angular vacío.

La fuente correcta para esos archivos debe ser Sakai NG.

## Flujo correcto

1. Borrar manualmente la instalación frontend incorrecta.
2. Clonar/copiar Sakai NG:

   ```text
   https://github.com/primefaces/sakai-ng
   ```

3. Verificar Angular 21.
4. Verificar dependencias propias de Sakai NG:
   - Angular,
   - PrimeNG,
   - PrimeIcons,
   - `@primeuix/themes`,
   - TailwindCSS,
   - `tailwindcss-primeui`.
5. Copiar de vuelta:
   - `/AGENTS.md`
   - `/specs`
   - `/reference`
   - `/supabase`
6. Adaptar el proyecto Sakai NG:
   - nombre del proyecto,
   - login a Supabase Auth,
   - layout autenticado,
   - menú lateral con módulos del SDD,
   - rutas protegidas,
   - guards,
   - Supabase client,
   - environments.

## Regla para próximos prompts

El prompt de implementación inicial debe decir explícitamente:

```text
El workspace ya está basado en Sakai NG. No crees un proyecto Angular nuevo. Adapta la estructura existente de Sakai NG.
```

Si el workspace no está basado en Sakai NG, se debe detener la implementación frontend y corregir el punto de partida.

## Supabase

Supabase sigue siendo backend principal:

- Supabase Auth.
- Supabase PostgreSQL.
- Supabase Storage.
- RLS.
- Supabase JS Client desde Angular.

La URL de proyecto y publishable key pueden ir en environments del frontend.

La connection string directa de PostgreSQL no debe ir en Angular.
