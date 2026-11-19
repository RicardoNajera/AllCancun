/**
 * All Cancún — En curso · Vista
 * Contrato estándar de features (ver features/shared/shell.js).
 */

import { hero, sectionTitle, steps } from "../../shared/ui.js";
import { content } from "./content.js";

export default {
  id: "en-curso",
  accent: "viajes",
  styleBase: "features/shared/feature-view.css",
  styles: "features/tabs/shared/tab-view.css",

  render({ navigate }) {
    const html = `
      ${hero({
        eyebrow: content.eyebrow,
        title: content.title,
        lead: content.lead,
        status: content.status,
      })}

      <div class="tv-body">
        ${sectionTitle(content.emptyTitle)}
        <p class="tv-lead">${content.emptyText}</p>
        ${sectionTitle(content.stepsTitle)}
        ${steps(content.steps)}
        <button type="button" class="tv-cta" data-tab-go="inicio">
          ${content.ctaLabel}
        </button>
      </div>
    `;

    return {
      html,
      onMount(root) {
        const cta = root.querySelector("[data-tab-go]");
        if (!cta) return;
        const onClick = () => navigate?.(cta.dataset.tabGo);
        cta.addEventListener("click", onClick);
        return () => cta.removeEventListener("click", onClick);
      },
    };
  },
};
