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
  if (loadedStyles.has(href)) return;
  loadedStyles.add(href);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.featureStyle = href;
  document.head.appendChild(link);
}

export function mountFeature(mount, feature, context = {}) {
  if (feature.styles) loadStyle(feature.styles);

  const accent = feature.accent || context.category?.accent || "viajes";
  const result = feature.render({
    category: context.category,
    navigate: context.navigate,
    back: context.back,
    ...feature.content,
  });

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
}
