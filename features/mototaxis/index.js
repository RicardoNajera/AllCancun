/**
 * All Cancún — Mototaxis · Vista
 * Vista propia de mototaxis. Misma base animada que las demás categorías.
 */

import { hero } from "../shared/ui.js";
import { building } from "../shared/building.js";
import { content } from "./content.js";

export default {
  id: "mototaxis",
  accent: "viajes",
  styles: "features/mototaxis/view.css",
  content,

  render({ category }) {
    const cover = (category?.images || [])[0];

    const html = `
      ${hero({
        cover,
        eyebrow: content.eyebrow,
        title: content.title,
        lead: content.lead,
      })}
      <div class="fv-body mt-body">
        ${building(content.message)}
      </div>
    `;

    return { html };
  },
};
