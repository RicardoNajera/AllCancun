/**
 * All Cancún — Feature: shared/shell
 * Envoltura estándar de toda vista de categoría. Define el contrato:
 * la feature solo aporta contenido; el shell aporta estructura, acento
 * y las animaciones de entrada.
 *
 * Contrato de una feature (features/<id>/index.js):
 *   export default {
 *     id: "mototaxis",
 *     accent: "viajes",
 *     render(context) { return { html, onMount?, onDestroy? } }
 *   }
 */

import { escape } from "./ui.js";

/* Carga (una sola vez) el CSS propio de la feature */
const loadedStyles = new Set();
function loadStyle(href) {
  if (loadedStyles.has(href)) return null;
  loadedStyles.add(href);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  const existing = document.querySelector(`link[data-feature-style="${href}"]`);
  if (existing) {
    /* Ya venía del <head> (precargado): se reutiliza, sin descarga extra */
    loadedStyles.add(href);
    return existing.sheet ? Promise.resolve() : waitForSheet(existing);
  }
  // Sello anti-caché estable por versión: ?v=Date.now() forzaba una descarga
  // nueva en cada vista y el HTML se pintaba sin estilos (iconos gigantes).
  link.href = href;
  link.dataset.featureStyle = href;
  document.head.appendChild(link);
  return waitForSheet(link);
}

/* Resuelve cuando la hoja ya está aplicada, para no pintar sin estilos */
function waitForSheet(link) {
  return new Promise((resolve) => {
    if (link.sheet) return resolve();
    const done = () => {
      link.removeEventListener("load", done);
      link.removeEventListener("error", done);
      resolve();
    };
    link.addEventListener("load", done);
    link.addEventListener("error", done);
    /* Red de seguridad: nunca bloquea la vista más de 400ms */
    setTimeout(done, 400);
  });
}

export function mountFeature(mount, feature, context = {}) {
  const pending = [];
  if (feature.styleBase) pending.push(loadStyle(feature.styleBase));
  if (feature.styles) pending.push(loadStyle(feature.styles));

  const accent = feature.accent || context.category?.accent || "viajes";
  const result = feature.render({
    category: context.category,
    navigate: context.navigate,
    back: context.back,
    ...feature.content,
  });

  /* Se pinta con el CSS ya aplicado: así nunca aparece el SVG a tamaño
     nativo (300x150) por un instante al cambiar de vista. */
  const paint = () => {
    mount.innerHTML = `
      <section class="feature-view" data-accent="${escape(accent)}" data-feature="${escape(feature.id)}">
        ${result.html}
      </section>
    `;

    const root = mount.querySelector(".feature-view");

    // El botón de regreso es estándar en todas las features
    root?.querySelector('[data-action="back"]')?.addEventListener("click", () => {
      context.back?.();
    });

    let cleanup;
    if (typeof result.onMount === "function") cleanup = result.onMount(root);

    return () => {
      if (typeof cleanup === "function") cleanup();
      if (typeof result.onDestroy === "function") result.onDestroy(root);
    };
  };

  /* Sin CSS pendiente se pinta al instante; con CSS pendiente se espera a que
     aplique para no mostrar la vista a medio estilizar. */
  return Promise.all(pending).then(paint);
}
