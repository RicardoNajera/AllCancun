/**
 * All Cancún — Perfil · Vista
 * Contrato estándar de features (ver features/shared/shell.js).
 */

import { hero, sectionTitle, note, escape } from "../../shared/ui.js";
import { icons } from "../../../components/icons.js";
import { content } from "./content.js";

/* Fila del menú: icono + título + detalle + flecha */
function row(item) {
  return `
    <li class="tv-row">
      <span class="tv-row__icon" aria-hidden="true">${icons[item.icon] || icons.check}</span>
      <span class="tv-row__text">
        <span class="tv-row__label">${escape(item.label)}</span>
        <span class="tv-row__detail">${escape(item.detail)}</span>
      </span>
      ${icons.arrowLeft}
    </li>
  `;
}

export default {
  id: "perfil",
  accent: "mujeres",
  styleBase: "features/shared/feature-view.css",
  styles: "features/tabs/shared/tab-view.css",

  render() {
    const html = `
      ${hero({
        eyebrow: content.eyebrow,
        title: content.title,
        lead: content.lead,
        status: content.status,
      })}

      <div class="tv-body">
        <div class="tv-account">
          <span class="tv-account__avatar" aria-hidden="true">${icons.team}</span>
          <div class="tv-account__info">
            <span class="tv-account__name">${escape(content.guestName)}</span>
            <span class="tv-account__hint">${escape(content.guestHint)}</span>
          </div>
        </div>

        <button type="button" class="tv-cta">${escape(content.ctaLabel)}</button>

        ${sectionTitle(content.sectionTitle)}
        <ul class="tv-rows">
          ${content.rows.map(row).join("")}
        </ul>

        ${note(content.note)}
      </div>
    `;

    return { html };
  },
};
