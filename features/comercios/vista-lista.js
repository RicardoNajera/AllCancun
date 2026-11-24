/**
 * All Cancún — Comercios · Vista de la lista
 */

import { escape } from "../shared/ui.js";
import { nombreCategoria, fotoNegocio, img, iniciales } from "./bits.js";

/** Una tarjeta de negocio. Nada se pinta sin pasar por escape(). */
export function tarjeta(negocio) {
  const foto = fotoNegocio(negocio);

  const media = foto
    ? img(foto, { clase: "co-card__img", alt: negocio.nombre })
    : `<span class="co-card__ini">${escape(iniciales(negocio.nombre))}</span>`;

  return `
    <a class="co-card" href="#comercios/${escape(negocio.slug)}">
      <span class="co-card__media">${media}</span>
      <span class="co-card__body">
        <span class="co-card__name">${escape(negocio.nombre)}</span>
        <span class="co-card__meta">
          ${escape(nombreCategoria(negocio.categoria))}${
            negocio.colonia ? ` · ${escape(negocio.colonia)}` : ""
          }
        </span>
      </span>
      <span class="co-card__go" aria-hidden="true">›</span>
    </a>
  `;
}

/** Lista completa en una sola columna. */
export function lista(negocios, hayMas = false) {
  return `
    <div class="co-lista">
      ${negocios.map(tarjeta).join("")}
    </div>
    ${
      hayMas
        ? `<button class="co-mas" type="button" data-accion="mas">Ver más negocios</button>`
        : ""
    }
  `;
}
