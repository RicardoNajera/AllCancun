/**
 * All Cancún — Tianguis · Vista
 * Esta vista es exclusiva de Tianguis. Los cambios que hagas aquí
 * no afectan a ninguna otra categoría.
 */

import { hero, sectionTitle } from "../shared/ui.js";
import { building } from "../shared/building.js";
import { content } from "./content.js";

export default {
  id: "tianguis",
  accent: "tianguis",
  styles: "features/tianguis/view.css",
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

      <div class="fv-body tia-body">
        ${sectionTitle("En construcción")}
        ${building("Un equipo de desarrollo está construyendo esta sección. Lo que ves se actualiza cada semana.")}
      </div>
    `;

    return { html };
  },
};
