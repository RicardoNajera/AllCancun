/**
 * All Cancún — Componente Header
 * Marca + botón de instalación PWA (se muestra solo si el navegador lo permite).
 */

import { icons } from "./icons.js";

const escape = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });

export function renderHeader(mount) {
  mount.innerHTML = `
    <header class="app-header" id="app-header">
      <div class="brand">
        <div class="brand__text">
          <span class="brand__name">All Cancún</span>
          <span class="brand__tagline">${escape("Todo lo local, en un solo lugar")}</span>
        </div>
      </div>
      <button
        type="button"
        class="install-button"
        id="install-button"
        data-available="false"
        aria-label="Instalar All Cancún en este dispositivo"
      >
        ${icons.install}
        <span>Instalar</span>
      </button>
    </header>
  `;

  initHeaderScrollState(mount);
  return initInstallButton(mount);
}

/* Borde inferior del header al hacer scroll */
function initHeaderScrollState(mount) {
  const header = mount.querySelector("#app-header");
  const screen = document.querySelector(".screen");
  if (!header || !screen) return;

  let ticking = false;
  const update = () => {
    header.classList.toggle("is-scrolled", screen.scrollTop > 4);
    ticking = false;
  };

  screen.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );
}

/* Instalación PWA */
function initInstallButton(mount) {
  const button = mount.querySelector("#install-button");
  if (!button) return;

  let deferredPrompt = null;

  const show = () => button.setAttribute("data-available", "true");
  const hide = () => button.setAttribute("data-available", "false");

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    show();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hide();
  });

  button.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    hide();
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } finally {
      deferredPrompt = null;
    }
  });

  // Si ya está instalada, no mostrar el botón
  if (window.matchMedia("(display-mode: standalone)").matches) hide();
}
