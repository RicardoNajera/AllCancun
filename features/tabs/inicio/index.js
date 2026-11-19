/**
 * All Cancún — Inicio · Vista
 * Reconstruye el home (hero + mosaico de categorías) cuando se vuelve
 * desde el dock. Reutiliza el módulo del home: cero duplicación.
 */

import { renderCategoryGrid } from "../../../components/category-grid.js";

export default {
  id: "inicio",
  accent: "viajes",
  styleBase: "features/shared/feature-view.css",
  styles: "features/tabs/shared/tab-view.css",

  render({ navigate }) {
    const html = `<div class="tv-body tv-home" data-tab-home></div>`;

    return {
      html,
      /* El grid del home es un componente con sus propios listeners:
       * se monta después de insertar el HTML. */
      onMount(root) {
        const host = root.querySelector("[data-tab-home]");
        if (!host) return;

        renderCategoryGrid(host);

        // El grid avisa qué categoría se tocó: el router abre esa vista
        const onSelect = (event) => navigate?.(event.detail?.id);
        host.addEventListener("category:select", onSelect);

        return () => host.removeEventListener("category:select", onSelect);
      },
    };
  },
};
