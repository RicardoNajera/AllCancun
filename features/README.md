/* ==========================================================================
   All Cancún — Guía de features
   Cómo agregar o editar una categoría sin romper las demás.
   ========================================================================== */

# Features

Cada categoría del home tiene su **propia carpeta** en `features/`.
Trabajar una categoría = tocar solo su carpeta. Nada más.

```
features/
├── registry.js              ← conecta id de categoría con su módulo
├── tabs.js                  ← conecta pestaña del dock con su módulo
├── router.js                ← abre/cierra vistas y escribe la URL (no se edita)
├── shared/                  ← piezas comunes a todas las vistas
│   ├── shell.js             ← estructura y montaje
│   ├── ui.js                ← hero, tarjetas, pasos, equipo
│   ├── content.js           ← textos repetidos
│   └── feature-view.css     ← estilos base (prefijo fv-)
├── tabs/                    ← vistas de la barra inferior
│   ├── shared/tab-view.css  ← estilos base (prefijo tv-)
│   ├── inicio/              ← home (reutiliza components/category-grid.js)
│   ├── carrito/
│   ├── en-curso/
│   └── perfil/
├── mototaxis/
│   ├── index.js             ← vista exclusiva de mototaxis
│   ├── content.js           ← textos de mototaxis
│   └── view.css             ← estilos exclusivos de mototaxis
├── tianguis/ …
└── comida/ …
```

## Navegación (una sola regla)

**Toda** navegación pasa por `features/router.js`. Nadie más escribe la URL.

- `nav.go(destino)` → `#mototaxis`, `#carrito`, `#perfil`, `#en-curso`
- `nav.go("inicio")` o `nav.goHome()` → home (URL limpia, sin `#`)

El destino se resuelve en `resolve()`: primero busca en `tabs.js`
(pestañas) y luego en `registry.js` (categorías). Para agregar un destino
nuevo basta con registrarlo en **uno** de esos dos archivos.

El dock **no decide** qué se muestra: emite `dock:navigate` con la ruta y la
app llama a `nav.go()`. Al terminar, la app marca la pestaña activa con
`dock.setActive()`. En una categoría no se marca ninguna pestaña, así el
usuario nunca ve "una pestaña encendida" en un lugar que no corresponde.

## Editar una categoría (ejemplo: mototaxis)

1. **Textos** → `features/mototaxis/content.js`. Solo texto, cero HTML.
2. **Estilos propios** → `features/mototaxis/view.css`.
3. **Estructura de la vista** → `features/mototaxis/index.js`.

Los tres archivos son de mototaxis y no los importa nadie más, así que
cualquier cambio queda contenido en esa categoría.

## Contrato de una feature

Cada `features/<id>/index.js` exporta por defecto:

```js
export default {
  id: "mototaxis",                    // igual al id de data/categories.js
  accent: "viajes",                   // token de color (--accent-*)
  styles: "features/mototaxis/view.css", // CSS que se carga al abrirla
  content,                            // se inyecta en render()

  render({ category, ...content }) {  // category = entrada del home
    return {
      html: "<...>",                  // obligatorio
      onMount(root) {},               // opcional, devuelve cleanup
      onDestroy(root) {},             // opcional
    };
  },
};
```

## Agregar una categoría nueva

1. Copia `features/mototaxis/` → `features/<nuevo-id>/`.
2. Cambia `id`, `accent` y los textos en `content.js`.
3. Agrega la entrada en `data/categories.js` (tarjeta del home).
4. Agrega una línea en `features/registry.js`:
   ```js
   "<nuevo-id>": () => import("./<nuevo-id>/index.js"),
   ```
5. Sube `CACHE_VERSION` en `sw.js`.

No hay que tocar `app.js`, `router.js` ni ninguna otra categoría.

## Agregar una pestaña nueva

1. Copia `features/tabs/perfil/` → `features/tabs/<nuevo-id>/`.
2. Cambia `id`, `accent` y los textos en `content.js`.
3. Agrega una línea en `features/tabs.js`:
   ```js
   "<nuevo-id>": { route: "<nuevo-id>", label: "…", loader: () => import("./tabs/<nuevo-id>/index.js") },
   ```
4. Agrega el botón en `components/dock.js` (`TABS`).
5. Sube `CACHE_VERSION` en `sw.js`.

No hay que tocar `app.js` ni `router.js`.

## Reglas

- El CSS compartido usa prefijo `fv-` (vistas) y `tv-` (pestañas). El CSS de
  cada feature usa el prefijo de su categoría (ej. `mt-` para mototaxis) para
  no filtrar estilos.
- Una vista de pestaña declara **dos** hojas: `styleBase` (la base `fv-`) y
  `styles` (la suya). No usar `@import` dentro de una hoja inyectada por JS.
- Nunca importar de `features/<otra>/`. Si algo se comparte, va en `shared/`.
- `content.js` no contiene etiquetas HTML: el escapado lo hace `ui.js`.
