/**
 * All Cancún — Entry point
 * Orquesta el montaje de componentes, la navegación y el Service Worker.
 *
 * Regla de oro: TODA navegación pasa por `nav` (features/router.js).
 * Nadie más escribe la URL ni sincroniza el dock.
 */

import { renderHeader } from "./components/header.js";
import { renderCategoryGrid } from "./components/category-grid.js";
import { renderDock, dock } from "./components/dock.js";
import { createNavigator, resolve } from "./features/router.js";
import { categories } from "./data/categories.js";

const $ = (selector, scope = document) => scope.querySelector(selector);

let nav = null;

/* Home: el grid de categorías dentro del mismo `#app-screen` */
function renderHome(screen) {
  renderCategoryGrid(screen);
  screen.scrollTop = 0;
}

/* Pestaña del dock que corresponde a un destino */
function tabFor(route) {
  if (!route) return "inicio";
  if (["inicio", "carrito", "en-curso", "perfil", "asistente"].includes(route)) return route;
  return null; // una categoría no resalta ninguna pestaña
}

/* Vistas que se abren a pantalla completa: sin header ni dock.
   El asistente tiene su propia cabecera y su propio composer. */
const IMMERSIVE = new Set(["asistente"]);

function setImmersive(on) {
  document.body.classList.toggle("is-immersive", on);
}

function mountApp() {
  const headerMount = $("#app-header-slot");
  const screen = $("#app-screen");
  const dockMount = $("#app-dock-slot");

  if (!headerMount || !screen) return;

  renderHeader(headerMount);
  if (dockMount) renderDock(dockMount);

  nav = createNavigator(screen, {
    onHome: () => renderHome(screen),
    onChange: (route) => {
      const tabId = tabFor(route);
      // En una categoría el dock no marca pestaña activa: evita la
      // sensación de "estar en un lugar que no se entiende".
      dock.setActive(tabId);
      // El asistente ocupa toda la pantalla: adiós header y barra inferior.
      setImmersive(IMMERSIVE.has(route));
    },
  });

  // Punto único de entrada desde el home
  screen.addEventListener("category:select", (event) => {
    const id = event.detail?.id;
    if (id && resolve(id)) nav.go(id);
  });

  // Único punto de entrada desde el dock
  document.addEventListener("dock:navigate", (event) => {
    const route = event.detail?.route;
    if (route) nav.go(route);
  });

  // El botón del asistente del dock abre la vista inmersiva
  document.addEventListener("dock:ai", () => nav.go("asistente"));

  // Botón "atrás" del navegador / gesto del sistema
  window.addEventListener("popstate", () => {
    const route = location.hash.replace("#", "");
    nav.go(route || "inicio", { history: false });
  });

  window.addEventListener("keydown", (event) => {
    // En el asistente, Escape lo maneja su propia vista: primero corta el
    // dictado y solo después cierra. Aquí se ignora para no robarle el gesto.
    if (event.key === "Escape" && !document.body.classList.contains("is-immersive")) {
      nav.go("inicio");
    }
  });

  // Arranque: si la URL trae una ruta válida, se abre directo
  const initial = location.hash.replace("#", "");
  nav.go(resolve(initial) ? initial : "inicio", { history: false, replace: true });
}

/* Service Worker (PWA) */
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // En local (dev-server) el SW solo estorba: sirve archivos viejos cacheados.
  // Se desregistra y se vacía todo para ver siempre la última versión.
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (isLocal) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
    if (window.caches?.keys) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => {
        // Busca una versión nueva del SW en cada apertura
        reg.update().catch(() => {});
      })
      .catch(() => {
        /* Sin SW la app sigue funcionando en línea */
      });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountApp, { once: true });
} else {
  mountApp();
}

registerServiceWorker();
