/**
 * All Cancún — Estudiantes · Vista
 * Esta vista es exclusiva de Estudiantes. Los cambios que hagas aquí
 * no afectan a ninguna otra categoría.
 */

import { hero, sectionTitle } from "../shared/ui.js";
import { building } from "../shared/building.js";
import { content } from "./content.js";

export default {
  id: "estudiantes",
  accent: "estudiantes",
  styles: "features/estudiantes/view.css",
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

      <div class="fv-body est-body">
        ${sectionTitle("En construcción")}
        ${building("Nuestro equipo de programadores está trabajando en esto. Próximamente disponible.")}
      </div>
    `;

    return { html };
  },
};
