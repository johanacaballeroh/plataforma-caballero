# Lineamientos UI/UX

## Fuente visual oficial

Sakai NG es la fuente visual oficial del sistema.

El frontend debe conservar y adaptar:

- pagina de login,
- layout autenticado,
- sidebar,
- topbar,
- estructura responsive,
- estilos globales,
- tema PrimeNG,
- soporte TailwindCSS.

## Uso de capturas

Las capturas del backoffice anterior son solo fuente funcional.

Se permite usarlas para identificar:

- modulos,
- formularios,
- campos,
- acciones,
- relaciones,
- reglas de negocio,
- flujos CRUD.

No se permite usarlas para copiar:

- colores,
- layout,
- sidebar,
- estilos,
- densidad visual antigua,
- componentes visuales identicos.

## Componentes obligatorios

Las nuevas pantallas deben usar PrimeNG para controles funcionales:

- `p-table`
- `p-dialog`
- `p-button`
- `p-inputText`
- `p-select` o `p-dropdown`
- `p-datepicker` o calendario equivalente PrimeNG
- `p-toast`
- `p-confirmDialog`
- `p-tag`
- `p-fileUpload` cuando aplique

TailwindCSS se usara para:

- spacing,
- grids,
- layout fino,
- responsive,
- ajustes visuales puntuales.

## Patron de listados

Los listados CRUD deben incluir:

- titulo claro,
- acciones principales visibles segun permisos,
- tabla con carga lazy,
- filtros por servidor,
- ordenamiento por servidor,
- paginado por servidor,
- estados de carga,
- estado vacio,
- badges de estado,
- acciones por fila condicionadas por permisos.

## Formularios

Los formularios deben:

- usar formularios reactivos,
- mostrar validacion visible,
- separar secciones complejas en tabs o paneles si el formulario crece,
- usar selects remotos para relaciones,
- evitar logica de negocio compleja dentro del componente,
- confirmar acciones criticas.

## Estados visuales

Estados comunes:

- `active` -> tag positivo.
- `inactive` -> tag neutral o warning.
- `draft` -> tag informativo.
- `issued` -> tag positivo.
- `cancelled` -> tag danger.

En certificados reconstruidos desde capturas se usan `active` e `inactive` salvo que una regla posterior valide otros estados.

La severidad exacta debe elegirse usando el sistema visual de PrimeNG/Sakai.

## Menu lateral

El menu lateral debe adaptarse a los modulos:

- Dashboard
- Certificados
- Empresas
- Items
- Unidades
- Categorias
- Tipos de items
- Codigos Basilea
- Tipos de generacion de certificado
- Tipos de cantidad
- Tipos de documentos
- Usuarios
- Roles
- Reportes
- Logs

Cada entrada debe mostrarse solo si el usuario tiene permiso suficiente.

## Accesibilidad y responsive

- Mantener navegacion por teclado donde PrimeNG lo soporte.
- Usar labels visibles en formularios.
- No depender solo de color para indicar estado.
- Probar comportamiento responsive en desktop y mobile.
- Evitar textos que se desborden de botones, tablas o dialogos.

## Prohibiciones

- No reconstruir visualmente las capturas.
- No mezclar otra libreria UI.
- No reemplazar PrimeNG.
- No crear layout propio si Sakai NG ya cubre el caso.
- No introducir estilos globales inconsistentes con el template.
