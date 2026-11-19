/**
 * All Cancún — Componente Dock
 * Barra inferior translúcida + esfera flotante de IA.
 * Sin dependencias externas: SVG nativos, animación 100% CSS.
 *
 * Navegación: cada pestaña tiene un `route` que el router resuelve
 * (features/tabs.js). El dock NO decide qué se muestra: solo avisa
 * del destino y refleja la pestaña activa que le indique la app.
 */

import { dockIcons } from "./dock-icons.js";

const TABS = [
  { id: "inicio", label: "Inicio", icon: "home", route: "inicio" },
  { id: "carrito", label: "Carrito", icon: "cart", route: "carrito" },
  { id: "en-curso", label: "En curso", icon: "live", route: "en-curso" },
  { id: "perfil", label: "Perfil", icon: "profile", route: "perfil" },
];

const state = { active: "inicio", cart: 0, live: 0 };

const NAV_KEY = "all-cancun:dock";
const listeners = new Set();

function persist() {
  try {
    sessionStorage.setItem(NAV_KEY, JSON.stringify({ cart: state.cart, live: state.live }));
  } catch {
    /* Sin almacenamiento el dock sigue funcionando */
  }
}

function restore() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(NAV_KEY) || "null");
    if (!raw) return;
    if (Number.isInteger(raw.cart)) state.cart = Math.max(0, raw.cart);
    if (Number.isInteger(raw.live)) state.live = Math.max(0, raw.live);
  } catch {
    /* Datos corruptos: se ignoran */
  }
}

function tab(item) {
  const badge =
    item.id === "en-curso"
      ? `<span class="dock__badge" data-dock-badge hidden></span>`
      : "";
  return `
    <button type="button" class="dock__tab" data-dock-tab="${item.id}"
            data-route="${item.route}"
            aria-label="${item.label}" aria-selected="false" role="tab">
      <span class="dock__icon">
        ${dockIcons[item.icon]}
        ${badge}
      </span>
      <span class="dock__label">${item.label}</span>
    </button>`;
}

// Asistente: botón del centro, dentro de la barra.
function aiButton() {
  return `
    <button type="button" class="dock__ai" id="dock-ai" data-dock-ai
      aria-label="Abrir el asistente All Cancún">
      <span class="dock__ai-disc" aria-hidden="true">
        <span class="dock__ai-halo"></span>
        <span class="dock__ai-ring"></span>
        <span class="dock__ai-core">${dockIcons.spark}</span>
      </span>
      <span class="dock__ai-label" aria-hidden="true">Asistente</span>
    </button>`;
}

export function renderDock(mount) {
  restore();

  mount.innerHTML = `
    <div class="dock" id="app-dock">
      <nav class="dock__bar" role="tablist" aria-label="Navegación principal">
        ${TABS.slice(0, 2).map(tab).join("")}
        ${aiButton()}
        ${TABS.slice(2).map(tab).join("")}
      </nav>
    </div>
  `;

  const root = mount.querySelector("#app-dock");
  if (!root) return () => {};

  bindTabs(root);
  bindAi(root);
  sync(root);

  return () => {
    listeners.clear();
    root.remove();
  };
}

/* ---- Interacción ---- */

function bindTabs(root) {
  root.querySelectorAll("[data-dock-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      // Volver a tocar la pestaña activa lleva al inicio
      const id = button.dataset.dockTab;
      const route = id === state.active ? "inicio" : button.dataset.route;
      emit("navigate", { tab: id, route });
    });
  });
}

function bindAi(root) {
  const button = root.querySelector("#dock-ai");
  if (!button) return;

  // Un solo listener: el elemento existe desde el montaje y no se recrea
  button.addEventListener("click", () => emit("ai", { active: state.active }));

  // Pulso de atención cuando hay actividad en curso
  button.dataset.alert = state.live > 0 ? "true" : "false";
}

/* ---- Render sincronizado ---- */

function sync(root) {
  root.querySelectorAll("[data-dock-tab]").forEach((button) => {
    const on = state.active === button.dataset.dockTab;
    button.setAttribute("aria-selected", on ? "true" : "false");
    button.dataset.active = on ? "true" : "false";
  });

  const liveTab = root.querySelector('[data-dock-tab="en-curso"]');
  const badge = liveTab?.querySelector("[data-dock-badge]");
  if (badge) {
    const count = state.live;
    badge.hidden = count <= 0;
    badge.textContent = count > 9 ? "9+" : String(count);
  }

  const ai = root.querySelector("#dock-ai");
  if (ai) ai.dataset.alert = state.live > 0 ? "true" : "false";
}

/* ---- API pública ---- */

function emit(name, detail) {
  document.dispatchEvent(new CustomEvent(`dock:${name}`, { detail }));
  listeners.forEach((fn) => fn(name, detail));
}

function refresh() {
  const root = document.querySelector("#app-dock");
  if (root) sync(root);
}

export const dock = {
  /* Cambia la pestaña activa (la app la fija tras navegar) */
  setActive(id) {
    state.active = id || "inicio";
    persist();
    refresh();
  },

  /* Carrito */
  setCart(count) {
    state.cart = Math.max(0, Number(count) || 0);
    persist();
    refresh();
  },

  /* Actividad en curso (viajes / pedidos activos) */
  setLive(count) {
    state.live = Math.max(0, Number(count) || 0);
    persist();
    refresh();
  },

  getState: () => ({ ...state }),

  /* Suscripción: devuelve la función para darse de baja */
  on(handler) {
    listeners.add(handler);
    return () => listeners.delete(handler);
  },
};
