/**
 * All Cancún — Comercios · Estados de la vista
 * Cargando, vacío y error. Van aquí para que la vista principal se lea
 * de corrido y no se llene de condicionales.
 */

import { escape } from "../shared/ui.js";

export const cargando = () => `
  <div class="co-estado" role="status" aria-live="polite">
    <span class="co-spin" aria-hidden="true"></span>
    <p class="co-estado__txt">Buscando negocios…</p>
  </div>
`;

/**
 * Sin nada que mostrar.
 *
 * Dos casos distintos a propósito: que no haya negocios aún (normal, el
 * proyecto está arrancando) o que el filtro no devuelva nada.
 */
export const vacio = (filtrado = false) => `
  <div class="co-estado">
    <p class="co-estado__title">${
      filtrado ? "Nada en esta categoría" : "Todavía no hay negocios"
    }</p>
    <p class="co-estado__txt">${
      filtrado
        ? "Prueba con otra categoría."
        : "Los negocios aparecen aquí en cuanto se publican."
    }</p>
  </div>
`;

export const error = (mensaje) => `
  <div class="co-estado">
    <p class="co-estado__title">No se pudo cargar</p>
    <p class="co-estado__txt">${escape(mensaje || "Revisa tu conexión.")}</p>
    <button class="co-mas" type="button" data-accion="reintentar">Reintentar</button>
  </div>
`;
