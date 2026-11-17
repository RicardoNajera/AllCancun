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
├── router.js                ← abre/cierra la vista (no se edita)
├── shared/                  ← piezas comunes a todas las vistas
│   ├── shell.js             ← estructura y montaje
│   ├── ui.js                ← hero, tarjetas, pasos, equipo
│   ├── content.js           ← textos repetidos
│   └── feature-view.css     ← estilos base (prefijo fv-)
├── mototaxis/
│   ├── index.js             ← vista exclusiva de mototaxis
│   ├── content.js           ← textos de mototaxis
│   └── view.css             ← estilos exclusivos de mototaxis
├── tianguis/ …
└── comida/ …
```

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

## Reglas

- El CSS compartido usa prefijo `fv-`. El CSS de cada feature usa el prefijo
  de su categoría (ej. `mt-` para mototaxis) para no filtrar estilos.
- Nunca importar de `features/<otra>/`. Si algo se comparte, va en `shared/`.
- `content.js` no contiene etiquetas HTML: el escapado lo hace `ui.js`.
