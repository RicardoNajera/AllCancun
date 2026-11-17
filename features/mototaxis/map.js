/**
 * All Cancún — Mototaxis · Mapa real y ruteo
 * Mapa: MapLibre GL JS + OpenFreeMap (estilo Liberty, sin API key).
 * Rutas y geocodificación: Mapbox Directions + Geocoding (requieren token).
 *
 * El token NO se versiona. Se resuelve en este orden:
 *   1. window.ALL_CANCUN_MAPBOX_TOKEN  (config.local.js, ignorado por git)
 *   2. ?mapbox=TOKEN en la URL
 *   3. localStorage["all-cancun:mapbox-token"]
 */

export const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const LIBRE_CSS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
const LIBRE_JS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";

const CANCUN = { lng: -86.8515, lat: 21.1619 };
const DETAILS = "place,address,poi,neighborhood";
const TOKEN_KEY = "all-cancun:mapbox-token";

export function getToken() {
  if (typeof window === "undefined") return "";
  const fromConfig = String(window.ALL_CANCUN_MAPBOX_TOKEN || "").trim();
  if (fromConfig) return fromConfig;
  try {
    const fromUrl = new URL(window.location.href).searchParams.get("mapbox");
    if (fromUrl) {
      localStorage.setItem(TOKEN_KEY, fromUrl.trim());
      return fromUrl.trim();
    }
    return String(localStorage.getItem(TOKEN_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, String(token || "").trim());
  } catch {
    /* modo privado */
  }
}

/* Precarga dinámica de CSS + script de MapLibre (una sola vez) */
let libPromise = null;
export function loadMapLibre() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (libPromise) return libPromise;

  libPromise = new Promise((resolve, reject) => {
    const fail = () => {
      libPromise = null;
      reject(new Error("No se pudo cargar el mapa"));
    };
    if (!document.querySelector("link[data-maplibre]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LIBRE_CSS;
      link.dataset.maplibre = "css";
      document.head.appendChild(link);
    }
    const existing = document.querySelector('script[data-maplibre="js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.maplibregl));
      existing.addEventListener("error", fail);
      return;
    }
    const script = document.createElement("script");
    script.src = LIBRE_JS;
    script.async = true;
    script.dataset.maplibre = "js";
    script.onload = () => resolve(window.maplibregl);
    script.onerror = fail;
    document.head.appendChild(script);
  });

  return libPromise;
}

/* ---------- Mapbox: Geocoding ---------- */
export async function searchPlaces(query, token, { near, signal } = {}) {
  if (!token) throw new Error("token");
  const url = new URL("https://api.mapbox.com/geocoding/v5/mapbox.places/" +
    encodeURIComponent(query) + ".json");
  url.searchParams.set("access_token", token);
  url.searchParams.set("language", "es");
  url.searchParams.set("limit", "6");
  url.searchParams.set("country", "mx");
  url.searchParams.set("proximity", near ? `${near.lng},${near.lat}` : `${CANCUN.lng},${CANCUN.lat}`);
  url.searchParams.set("types", DETAILS);

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(res.status === 401 ? "token" : `geocoding ${res.status}`);
  const data = await res.json();
  return (data.features || []).map((f) => ({
    id: f.id,
    name: f.text || f.place_name,
    address: f.place_name,
    placeType: f.place_type?.[0] || "place",
    center: { lng: f.center[0], lat: f.center[1] },
  }));
}

/* ---------- Mapbox: Directions ---------- */
export async function fetchRoute(from, to, token) {
  if (!token) throw new Error("token");
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("language", "es");
  url.searchParams.set("steps", "false");

  const res = await fetch(url);
  if (!res.ok) throw new Error(res.status === 401 ? "token" : `directions ${res.status}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error("Sin ruta disponible");
  return {
    geometry: route.geometry,
    distance: route.distance,
    duration: route.duration,
  };
}

/* ---------- Utilidades de formato ---------- */
export function formatDistance(meters) {
  if (!Number.isFinite(meters)) return "—";
  if (meters < 950) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "—";
  const min = Math.max(1, Math.round(seconds / 60));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} min`;
}

export { CANCUN };
