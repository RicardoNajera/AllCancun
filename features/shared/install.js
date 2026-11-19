/**
 * All Cancún — Instalar la app
 * Si el dispositivo permite instalación nativa (Android/Chrome/Edge), un
 * botón hace todo. Si no (iPhone, Safari, escritorio), se muestran los pasos
 * exactos, en lenguaje que entiende cualquiera.
 */

const HIDE_KEY = "allcancun.install.hidden";
let deferredPrompt = null;
const subscribers = new Set();
let listening = false;

/* ---- Detección de plataforma ---- */

export function platform() {
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isFirefox = /Firefox|FxiOS/.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
  const mac = /Macintosh/.test(ua) && !isIOS;
  const windows = /Windows/.test(ua);
  return { isIOS, isAndroid, isFirefox, isSafari, mac, windows };
}

export const isInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

export const canPrompt = () => Boolean(deferredPrompt);

/**
 * Instala el listener UNA sola vez por carga de página y notifica a todos los
 * suscriptores. Antes se perdía el evento si el header se volvía a pintar,
 * y por eso caíamos en las instrucciones manuales en Android.
 */
function ensureListener() {
  if (listening) return;
  listening = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    /* Sin preventDefault el navegador muestra su propio banner y no podemos
       dispararlo desde nuestro botón. */
    event.preventDefault();
    deferredPrompt = event;
    subscribers.forEach((fn) => fn());
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    subscribers.forEach((fn) => fn());
  });

  window
    .matchMedia("(display-mode: standalone)")
    .addEventListener?.("change", () => subscribers.forEach((fn) => fn()));
}

/** Escucha cambios de disponibilidad. Devuelve la función para desuscribirse. */
export function watchInstall(onChange) {
  ensureListener();
  if (onChange) subscribers.add(onChange);
  return () => subscribers.delete(onChange);
}

/**
 * Se llama lo antes posible en el arranque: el evento beforeinstallprompt
 * llega antes de que React/el header exista, y si no hay listener en ese
 * momento el navegador nunca vuelve a emitirlo.
 */
export function primeInstall() {
  ensureListener();
}

/* Espera a que el navegador entregue el evento (Chrome lo emite tarde). */
export function waitForPrompt(timeout = 800) {
  if (deferredPrompt) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      subscribers.delete(done);
      resolve(Boolean(deferredPrompt));
    }, timeout);
    const done = () => {
      clearTimeout(timer);
      resolve(Boolean(deferredPrompt));
    };
    subscribers.add(done);
  });
}

/** Lanza la instalación nativa. Devuelve "ok" | "dismissed" | "unavailable". */
export async function promptInstall() {
  if (!deferredPrompt) return "unavailable";
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === "accepted" ? "ok" : "dismissed";
}

/**
 * Safari en Mac no expone beforeinstallprompt, pero sí un menú nativo.
 * Esta función intenta abrirlo; si el navegador no lo soporta, devuelve false.
 */
export function tryNativeMenu() {
  if (typeof navigator.install !== "function") return false;
  try {
    navigator.install({
      preferRelatedApplications: false,
    });
    return true;
  } catch {
    return false;
  }
}

/** Safari de escritorio: Archivo → Agregar al Dock (macOS Sonoma+). */
export const canAddToDock = () => {
  const p = platform();
  return p.mac && p.isSafari;
};

/* ---- Instrucciones por dispositivo ---- */

const STEPS = {
  ios: {
    title: "Instalar en tu iPhone o iPad",
    note: "Toma 10 segundos y no necesita App Store.",
    steps: [
      "Abre esta página en Safari.",
      'Toca el botón Compartir (el cuadro con la flecha hacia arriba).',
      'Baja y elige "Agregar a pantalla de inicio".',
      'Toca "Agregar" arriba a la derecha. Listo.',
    ],
    hint: "Si no ves Compartir, asegúrate de estar en Safari y no en Chrome.",
  },
  android: {
    title: "Instalar en tu Android",
    note: "Chrome y Edge lo hacen solos.",
    steps: [
      'Toca el menú de tres puntos arriba a la derecha.',
      'Elige "Instalar aplicación" o "Agregar a pantalla principal".',
      "Confirma. Ya aparece como app.",
    ],
    hint: "Si no aparece la opción, abre la página en Chrome.",
  },
  mac: {
    title: "Instalar en tu Mac",
    note: "Funciona en Safari y en Chrome.",
    steps: [
      "Safari: menú Archivo → Agregar al Dock.",
      "Chrome o Edge: icono de instalar en la barra de direcciones.",
      "Se abre como ventana propia, sin barra del navegador.",
    ],
    hint: "En Safari necesitas macOS Sonoma o más nuevo.",
  },
  windows: {
    title: "Instalar en tu computadora",
    note: "Chrome y Edge.",
    steps: [
      "Mira la barra de direcciones: aparece un icono de instalar a la derecha.",
      'O abre el menú de tres puntos y elige "Instalar All Cancún".',
      "Se abre como app aparte, con su propio ícono.",
    ],
    hint: "Si usas Firefox, no hay instalación: usa Chrome o Edge.",
  },
  other: {
    title: "Guardar la app en tu inicio",
    note: "Funciona en cualquier navegador moderno.",
    steps: [
      "Busca en el menú del navegador la opción Instalar o Agregar a inicio.",
      "Si no aparece, guarda esta página en favoritos.",
    ],
    hint: "Para instalarla de verdad, usa Chrome, Edge, Safari u Opera.",
  },
};

export function stepsFor() {
  const p = platform();
  if (p.isIOS) return { key: "ios", ...STEPS.ios };
  if (p.isAndroid) return { key: "android", ...STEPS.android };
  if (p.mac) return { key: "mac", ...STEPS.mac };
  if (p.windows) return { key: "windows", ...STEPS.windows };
  return { key: "other", ...STEPS.other };
}

/* ---- Diagnóstico de instalabilidad ---- */

/**
 * Revisa los criterios que Chrome exige y devuelve qué falta. Sirve para
 * mostrar un motivo real en vez de instrucciones genéricas.
 */
export async function diagnose() {
  const problems = [];
  const p = platform();

  if (!window.isSecureContext) problems.push("La página debe abrirse con https.");

  try {
    const link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      problems.push("Falta el archivo de configuración de la app (manifest).");
    } else {
      const res = await fetch(link.href, { cache: "no-store" });
      if (!res.ok) problems.push("El manifest no carga.");
      else {
        const m = await res.json();
        if (!m.name || !m.short_name) problems.push("El manifest no tiene nombre.");
        if (!m.start_url) problems.push("El manifest no tiene start_url.");
        if (!["standalone", "fullscreen", "minimal-ui"].includes(m.display))
          problems.push("display debe ser standalone.");
        const big = (m.icons || []).filter((i) => /192|512/.test(i.sizes || ""));
        if (!big.length) problems.push("Falta un ícono de 192 o 512 px.");
      }
    }
  } catch {
    problems.push("No se pudo leer el manifest.");
  }

  if (!("serviceWorker" in navigator)) {
    problems.push("Este navegador no soporta apps instalables.");
  } else {
    const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
    const active = regs.some((r) => r.active || r.waiting || r.installing);
    if (!active) problems.push("El service worker aún no está activo. Recarga la página.");
  }

  if (p.isIOS) problems.push("iPhone y iPad no permiten instalar desde un botón.");
  if (p.isFirefox) problems.push("Firefox no permite instalar apps web.");

  return problems;
}

/* ---- Preferencia de ocultar ---- */

export const isHidden = () => {
  try {
    return localStorage.getItem(HIDE_KEY) === "1";
  } catch {
    return false;
  }
};

export const hide = () => {
  try {
    localStorage.setItem(HIDE_KEY, "1");
  } catch {
    /* modo privado: se ignora */
  }
};

export const show = () => {
  try {
    localStorage.removeItem(HIDE_KEY);
  } catch {
    /* modo privado: se ignora */
  }
};
