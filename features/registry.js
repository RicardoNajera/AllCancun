/**
 * All Cancún — Registro de features
 * ÚNICO archivo que hay que tocar para conectar una categoría nueva.
 * Cada entrada carga su módulo solo cuando el usuario la abre.
 *
 * Para crear una categoría nueva:
 *   1. Copia una carpeta existente de features/ (ej. features/mototaxis).
 *   2. Renómbrala con el id de la categoría.
 *   3. Ajusta su content.js y su view.css.
 *   4. Agrégala aquí con el mismo id que usa data/categories.js.
 */

export const registry = {
  mototaxis: () => import("./mototaxis/index.js"),
  tianguis: () => import("./tianguis/index.js"),
  comercios: () => import("./comercios/index.js"),
  mantenimiento: () => import("./mantenimiento/index.js"),
  mujeres: () => import("./mujeres/index.js"),
  hombres: () => import("./hombres/index.js"),
  estudiantes: () => import("./estudiantes/index.js"),
  salud: () => import("./salud/index.js"),
  comida: () => import("./comida/index.js"),
};

export const hasFeature = (id) => Object.prototype.hasOwnProperty.call(registry, id);
export const featureIds = Object.keys(registry);
