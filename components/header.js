/**
 * All Cancún — Componente Header
 * Marca + botón de instalación PWA.
 *
 * El botón SIEMPRE está visible:
 *   - Android / Chrome / Edge → instala con un toque (prompt nativo).
 *   - iPhone, iPad, Mac, otros → abre los pasos exactos, en lenguaje simple.
 *   - Si ya está instalada → el botón no se muestra.
 */

import { icons } from "./icons.js";
import {
  watchInstall,
  promptInstall,
  canPrompt,
  isInstalled,
  isHidden,
  hide,
  stepsFor,
} from "../features/shared/install.js";

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
        aria-label="Instalar All Cancún en este dispositivo"
      >
        ${icons.install}
        <span>Instalar</span>
      </button>
    </header>
    <div class="install-sheet" id="install-sheet" hidden>
      <div class="install-sheet__backdrop" data-install-close></div>
      <div class="install-sheet__panel" role="dialog" aria-modal="true"
           aria-labelledby="install-title">
        <div class="install-sheet__grab" aria-hidden="true"></div>
        <h2 class="install-sheet__title" id="install-title"></h2>
        <p class="install-sheet__note" id="install-note"></p>
        <ol class="install-sheet__steps" id="install-steps"></ol>
        <p class="install-sheet__hint" id="install-hint"></p>
        <button type="button" class="install-sheet__cta" data-install-close>
          Entendido
        </button>
        <button type="button" class="install-sheet__later" id="install-later">
          No mostrar de nuevo
        </button>
      </div>
    </div>
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
  const sheet = mount.querySelector("#install-sheet");
  if (!button || !sheet) return;

  const title = mount.querySelector("#install-title");
  const note = mount.querySelector("#install-note");
  const steps = mount.querySelector("#install-steps");
  const hint = mount.querySelector("#install-hint");
  const later = mount.querySelector("#install-later");

  /* Sincroniza la visibilidad del botón. El texto siempre dice "Instalar". */
  const sync = () => {
    button.hidden = isInstalled();
  };

  const openSheet = () => {
    const info = stepsFor();
    title.textContent = info.title;
    note.textContent = info.note;
    steps.innerHTML = info.steps
      .map((step) => `<li>${escape(step)}</li>`)
      .join("");
    hint.textContent = info.hint;
    hint.hidden = !info.hint;
    later.hidden = false;
    sheet.hidden = false;
    /* fuerza el reflow para que la transición corra */
    void sheet.offsetWidth;
    sheet.classList.add("is-open");
    document.body.classList.add("is-install-open");
    sheet.querySelector(".install-sheet__panel").focus?.();
  };

  const closeSheet = () => {
    sheet.classList.remove("is-open");
    document.body.classList.remove("is-install-open");
    setTimeout(() => {
      sheet.hidden = true;
    }, 220);
  };

  watchInstall(sync);
  sync();
  if (isHidden()) button.classList.add("is-optional-hidden");

  button.addEventListener("click", async () => {
    if (canPrompt()) {
      const result = await promptInstall();
      sync();
      if (result === "ok") return;
      if (result === "dismissed") return;
    }
    openSheet();
  });

  sheet.addEventListener("click", (event) => {
    if (event.target.closest("[data-install-close]")) closeSheet();
  });

  later.addEventListener("click", () => {
    hide();
    closeSheet();
    button.classList.add("is-optional-hidden");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !sheet.hidden) closeSheet();
  });
}
