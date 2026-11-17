/**
 * All Cancún — Entry point
 * Orquesta el montaje de componentes y el registro del Service Worker.
 */

import { renderHeader } from "./components/header.js";
import { renderCategoryGrid } from "./components/category-grid.js";
import { openFeature, closeFeature } from "./features/router.js";
import { hasFeature } from "./features/registry.js";
import { categories } from "./data/categories.js";

const $ = (selector, scope = document) => scope.querySelector(selector);

let currentScreen = null;

/* Vuelve al home con el grid de categorías */
function showHome(screen) {
  closeFeature();
  currentScreen = null;
  renderCategoryGrid(screen);
  screen.scrollTop = 0;
}

/* Abre la vista exclusiva de la categoría seleccionada */
async function showCategory(screen, category) {
  const opened = await openFeature(screen, category.id, {
    category,
    back: () => goHome(screen),
  });
  if (!opened) return;
  currentScreen = category.id;
}

/* Regresa al home limpiando URL e historial */
function goHome(screen) {
  showHome(screen);
  if (location.hash) {
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch {
      /* Ignorado: solo es limpieza de la URL */
    }
  }
}

function mountApp() {
  const headerMount = $("#app-header-slot");
  const screen = $("#app-screen");

  if (!headerMount || !screen) return;

  renderHeader(headerMount);
  showHome(screen);

  // El grid emite la selección de una categoría
  screen.addEventListener("category:select", (event) => {
    const category = event.detail;
    if (!category || !hasFeature(category.id)) return;

    showCategory(screen, category);
    try {
      history.pushState({ category: category.id }, "", `#${category.id}`);
    } catch {
      /* Sin historial la app sigue funcionando */
    }
  });

  // Botón "atrás" del navegador / gesto del sistema sin recargar
  window.addEventListener("popstate", () => {
    if (currentScreen) goHome(screen);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && currentScreen) goHome(screen);
  });

  // Si se abre la app con un hash de categoría, entra directo
  const hashId = location.hash.replace("#", "");
  const hashCategory = categories.find((item) => item.id === hashId);
  if (hashCategory && hasFeature(hashId)) showCategory(screen, hashCategory);
}

/* Service Worker (PWA) */
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // En local (dev-server) el SW es un estorbo: sirve archivos viejos cacheados.
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
    navigator.serviceWorker.register("sw.js").catch(() => {
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
