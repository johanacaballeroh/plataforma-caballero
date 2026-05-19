# Guía UI/UX

## Fuente visual oficial

La fuente visual oficial del sistema y base inicial del frontend es Sakai NG:

https://github.com/primefaces/sakai-ng

Las capturas del backoffice anterior no son referencia visual.

Sakai NG debe clonarse/copiarse como template base. No se debe intentar instalarlo luego como si fuera una librería de componentes sobre un Angular vacío.

## Reglas base

Sakai NG define y aporta físicamente:

- login,
- layout autenticado,
- sidebar,
- topbar,
- estructura responsive,
- estilos globales,
- patrones visuales base.

PrimeNG define los componentes funcionales.

TailwindCSS se usa para ajustes finos de layout, spacing, grids y responsive.

## Prohibiciones visuales

- No copiar colores del sistema anterior.
- No copiar sidebar del sistema anterior.
- No copiar layout del sistema anterior.
- No copiar estilos antiguos.
- No recrear pantallas visualmente idénticas a las capturas.
- No reemplazar PrimeNG por otra librería UI.
- No crear un layout desde cero si Sakai NG ya provee uno funcional.
- No recrear manualmente el layout de Sakai NG si se puede partir del template clonado.
- No continuar sobre un scaffold Angular vacío para implementar la UI final del backoffice.

## Componentes PrimeNG esperados

- `p-table`
- `p-dialog`
- `p-button`
- `p-inputText`
- `p-select` o `p-dropdown`
- `p-datepicker` o calendario equivalente de PrimeNG
- `p-toast`
- `p-confirmDialog`
- `p-tag`
- `p-toolbar`
- `p-fileUpload` cuando aplique
- `p-password` cuando aplique

## Layout autenticado

Debe partir del layout real incluido en Sakai NG.

Adaptaciones:

- menú según permisos,
- nombre de usuario,
- menú de perfil,
- logout,
- comportamiento responsive,
- rutas protegidas.

## Login

Debe partir del login real incluido en Sakai NG.

Adaptaciones:

- Supabase Auth,
- validación de email y contraseña,
- mensajes de error,
- redirección a Dashboard,
- bloqueo de rutas internas sin sesión.

## Tablas administrativas

Toda tabla CRUD debe incluir:

- carga lazy,
- paginado por servidor,
- ordenamiento por servidor,
- filtros por servidor,
- columna de acciones,
- estado con `p-tag`,
- loading state,
- empty state,
- confirmación para acciones críticas.

## Formularios

Los formularios deben usar Reactive Forms y PrimeNG.

Deben incluir:

- validaciones visibles,
- mensajes de error,
- botón Guardar,
- botón Cancelar,
- estado loading,
- prevención de doble envío.

## Estados visuales sugeridos

### Estados generales

- `active`: Activo.
- `inactive`: Inactivo.

### Estados de certificado

- `draft`: Borrador.
- `issued`: Emitido.
- `cancelled`: Anulado.
- `inactive`: Inactivo.

## Accesibilidad y UX

- Los botones de acción deben tener labels o tooltips claros.
- Los mensajes de error deben explicar la causa.
- Las pantallas deben conservar navegación predecible.
- Las acciones destructivas deben requerir confirmación.
- Los filtros deben ser visibles o fácilmente accesibles.

## Criterio de consistencia

Si una pantalla nueva no parece parte de Sakai NG, debe ajustarse antes de considerarse terminada.
