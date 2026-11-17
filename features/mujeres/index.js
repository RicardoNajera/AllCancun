/**
 * All Cancún — Solo Mujeres · Vista
 * Esta vista es exclusiva de Solo Mujeres. Los cambios que hagas aquí
 * no afectan a ninguna otra categoría.
 */

import { hero, sectionTitle } from "../shared/ui.js";
import { building } from "../shared/building.js";
import { content } from "./content.js";

export default {
  id: "mujeres",
  accent: "mujeres",
  styles: "features/mujeres/view.css",
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

      <div class="fv-body muj-body">
        ${sectionTitle("En construcción")}
        ${building("Un equipo de desarrollo está construyendo esta sección. Lo que ves se actualiza cada semana.")}
      </div>
    `;

    return { html };
  },
};
