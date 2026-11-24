/**
 * All Cancún — Router de features
 * Único punto de navegación: sabe qué feature corresponde a cada destino,
 * la carga bajo demanda (import dinámico) y monta/desmonta la vista.
 *
 * Combina dos espacios de nombres:
 *   - categorías: #mototaxis, #comida, …        (registry.js)
 *   - pestañas:   #inicio, #carrito, #en-curso, #perfil (tabs.js)
 *
 * Una ruta puede llevar un segundo tramo con `/`: "#comercios/hilo-y-trapillo".
 * La feature dueña de la primera parte decide qué hacer con él (su ficha,
 * su producto, etc.). El router no interpreta ese tramo, solo lo deja pasar.
 */

import { mountFeature } from "./shared/shell.js";
import { registry } from "./registry.js";
import { tabs } from "./tabs.js";

let disposeCurrent = null;
let currentId = null;
let currentKind = null;

export const getCurrentFeature = () => currentId;
export const getCurrentView = () => ({ id: currentId, kind: currentKind });

/* "#comercios/hilo-y-trapillo" → { base: "comercios", resto: "hilo-y-trapillo" } */
export function partesDeRuta(target) {
  const limpio = String(target || "").replace(/^#/, "");
  const corte = limpio.indexOf("/");
  if (corte === -1) return { base: limpio, resto: "" };
  return { base: limpio.slice(0, corte), resto: limpio.slice(corte + 1) };
}

/* Resuelve cualquier destino a su definición. null = no navegable. */
export function resolve(target) {
  if (!target) return null;

  // Se mira solo la primera parte: una ficha sigue siendo su categoría.
  const { base } = partesDeRuta(target);

  if (tabs[base]) {
    const { meta, ...rest } = tabs[base];
    return { ...rest, id: base, kind: "tab", meta };
  }
  if (registry[base]) {
    return { id: base, kind: "category", loader: registry[base] };
  }
  return null;
}

/* Abre cualquier vista (categoría o pestaña) dentro de `mount` */
export async function openView(mount, target, context = {}) {
  const view = resolve(target);
  if (!view) {
    console.warn(`[router] Destino sin registrar: ${target}`);
    return false;
  }

  const feature = await view.loader();
  const def = feature.default || feature;

  disposeCurrent?.();
  disposeCurrent = null;

  currentId = view.id;
  currentKind = view.kind;

  // Se pasa la ruta completa ("comercios/hilo-y-trapillo") para que la
  // feature sepa si es la lista o una ficha. `view.id` es solo la base.
  disposeCurrent = await mountFeature(mount, def, {
    route: String(target).replace(/^#/, ""),
    base: view.id,
    kind: view.kind,
    category: context.category || view.meta,
    ...context,
  });
  mount.scrollTop = 0;
  return true;
}

/* Compatibilidad con llamadas previas */
export const openFeature = (mount, id, context = {}) => openView(mount, id, context);

/* Libera la vista actual (sin tocar el home) */
export function closeFeature() {
  disposeCurrent?.();
  disposeCurrent = null;
  currentId = null;
  currentKind = null;
}

/**
 * Navegador de alto nivel: única API que usan app.js y el dock.
 * Mantiene URL, historial y pestaña activa en un solo lugar.
 */
export function createNavigator(mount, hooks = {}) {
  const onHome = hooks.onHome || (() => {});
  const onChange = hooks.onChange || (() => {});

  function writeUrl(route, replace) {
    const url = route ? `#${route}` : location.pathname + location.search;
    try {
      if (replace) history.replaceState({ route }, "", url);
      else history.pushState({ route }, "", url);
    } catch {
      /* Sin historial la app sigue funcionando */
    }
  }

  async function go(target, options = {}) {
    const { history: useHistory = true, replace = false } = options;

    // Inicio / sin destino = home
    if (!target || target === "inicio") {
      closeFeature();
      onHome();
      if (useHistory) writeUrl(null, replace);
      onChange(null);
      return true;
    }

    const ok = await openView(mount, target, {
      back: () => go("inicio"),
      navigate: (next) => go(next),
    });
    if (!ok) return false;

    if (useHistory) writeUrl(target, replace);
    onChange(target);
    return true;
  }

  const goHome = (options = {}) => go("inicio", options);

  return { go, goHome, writeUrl };
}
