/**
 * All Cancún — Mototaxis · Vista EXCLUSIVA
 * Rediseño inmersivo. Solo toca archivos de esta carpeta.
 */

import { hero } from "../shared/ui.js";
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
        status: content.status,
      })}

      <div class="fv-body mt-body">
        <div class="mt-street" aria-hidden="true">
          <span class="mt-street__line"></span>
          <span class="mt-street__line mt-street__line--2"></span>
          <span class="mt-street__glow"></span>
        </div>

        <div class="mt-panel">
          <svg class="mt-route" viewBox="0 0 320 120" aria-hidden="true">
            <path id="mt-route-path" class="mt-route__path" d="M6 96C58 96 62 34 118 34s62 56 116 56 62-58 80-58" />
            <circle class="mt-route__dot" r="5">
              <animateMotion dur="4.6s" repeatCount="indefinite">
                <mpath href="#mt-route-path" />
              </animateMotion>
            </circle>
          </svg>

          <span class="mt-ping mt-ping--a"></span>
          <span class="mt-ping mt-ping--b"></span>
          <span class="mt-ping mt-ping--c"></span>

          <div class="mt-card">
            <span class="mt-card__badge">En ruta</span>
            <h2 class="mt-card__title">${content.cardTitle}</h2>
            <p class="mt-card__text">${content.message}</p>
            <div class="mt-card__more">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    `;

    return { html };
  },
};
