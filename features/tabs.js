/**
 * All Cancún — Registro de pestañas del dock
 * Mismo patrón que registry.js: ÚNICO archivo a tocar para conectar una
 * pestaña nueva. Cada entrada se carga solo al abrirse (import dinámico).
 *
 * Para crear una pestaña nueva:
 *   1. Copia una carpeta de features/tabs/ (ej. features/tabs/perfil).
 *   2. Renómbrala con el id de la pestaña.
 *   3. Ajusta su content.js y su view.css.
 *   4. Agrégala aquí y añade su entrada en components/dock.js (TABS).
 */

export const tabs = {
  inicio: {
    route: "inicio",
    label: "Inicio",
    loader: () => import("./tabs/inicio/index.js"),
  },
  carrito: {
    route: "carrito",
    label: "Carrito",
    loader: () => import("./tabs/carrito/index.js"),
  },
  "en-curso": {
    route: "en-curso",
    label: "En curso",
    loader: () => import("./tabs/en-curso/index.js"),
  },
  asistente: {
    route: "asistente",
    label: "Asistente",
    loader: () => import("./asistente/index.js"),
  },
  perfil: {
    route: "perfil",
    label: "Perfil",
    loader: () => import("./tabs/perfil/index.js"),
  },
};

export const hasTab = (id) => Object.prototype.hasOwnProperty.call(tabs, id);
export const tabIds = Object.keys(tabs);
