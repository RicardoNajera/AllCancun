/**
 * All Cancún — Instalar la app
 * Si el dispositivo permite instalación nativa (Android/Chrome/Edge), un
 * botón hace todo. Si no (iPhone, Safari, escritorio), se muestran los pasos
 * exactos, en lenguaje que entiende cualquiera.
 */

const HIDE_KEY = "allcancun.install.hidden";
let deferredPrompt = null;
let listenersReady = false;

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

/** Escucha el evento del navegador. Devuelve una función para desuscribirse. */
export function watchInstall(onChange) {
  if (listenersReady) return () => {};
  listenersReady = true;

  const onPrompt = (event) => {
    event.preventDefault();
    deferredPrompt = event;
    onChange?.();
  };
  const onInstalled = () => {
    deferredPrompt = null;
    onChange?.();
  };

  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);

  return () => {
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
    listenersReady = false;
  };
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
