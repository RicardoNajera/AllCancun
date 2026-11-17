/**
 * All Cancún — Router de features
 * Único punto de navegación: sabe qué feature corresponde a cada categoría,
 * la carga bajo demanda (import dinámico) y monta/desmonta la vista.
 */

import { mountFeature } from "./shared/shell.js";
import { registry } from "./registry.js";

let disposeCurrent = null;
let currentId = null;

export const getCurrentFeature = () => currentId;

/* Abre la vista de una categoría dentro de `mount` */
export async function openFeature(mount, categoryId, context = {}) {
  const load = registry[categoryId];
  if (!load) {
    console.warn(`[router] Categoría sin feature registrada: ${categoryId}`);
    return false;
  }

  const feature = await load();

  disposeCurrent?.();
  disposeCurrent = null;

  currentId = categoryId;
  disposeCurrent = mountFeature(mount, feature.default || feature, context);
  mount.scrollTop = 0;
  return true;
}

/* Regresa al home y libera la vista actual */
export function closeFeature() {
  disposeCurrent?.();
  disposeCurrent = null;
  currentId = null;
}
