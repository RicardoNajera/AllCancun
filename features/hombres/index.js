/**
 * All Cancún — Solo Hombres · Vista
 * Esta vista es exclusiva de Solo Hombres. Los cambios que hagas aquí
 * no afectan a ninguna otra categoría.
 */

import { hero, sectionTitle } from "../shared/ui.js";
import { building } from "../shared/building.js";
import { content } from "./content.js";

export default {
  id: "hombres",
  accent: "hombres",
  styles: "features/hombres/view.css",
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

      <div class="fv-body hom-body">
        ${sectionTitle("En construcción")}
        ${building("Nuestro equipo de programadores está trabajando en esto. Próximamente disponible.")}
      </div>
    `;

    return { html };
  },
};
