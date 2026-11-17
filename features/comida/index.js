/**
 * All Cancún — Comida · Vista
 * Esta vista es exclusiva de Comida. Los cambios que hagas aquí
 * no afectan a ninguna otra categoría.
 */

import { hero, sectionTitle } from "../shared/ui.js";
import { building } from "../shared/building.js";
import { content } from "./content.js";

export default {
  id: "comida",
  accent: "comida",
  styles: "features/comida/view.css",
  content,

  render({ category, ...rest }) {
    const data = { ...content, ...rest };
    const cover = (category?.images || [])[0];

    const html = `
      ${hero({
        cover,
        eyebrow: data.eyebrow,
        title: data.title,
        lead: data.lead,
      })}

      <div class="fv-body ali-body">
        ${sectionTitle("En construcción")}
        ${building("Nuestro equipo de programadores está trabajando en esto. Próximamente disponible.")}
      </div>
    `;

    return { html };
  },
};
