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

/* ---------- Buscador inteligente multi-fuente ----------
 * Fusiona varias fuentes y las ordena por relevancia geográfica, como Google Maps:
 *
 *   1. Mapbox SearchBox /forward  → POIs reales (negocios, parques, plazas)
 *   2. Mapbox Geocoding v5        → direcciones y colonias (respaldo)
 *   3. Nominatim / OSM            → lugares que Mapbox no indexa
 *
 * Reglas de ranking:
 *   - Solo se aceptan resultados dentro del área de servicio (Cancún + ZH + Pto Juárez).
 *   - Se prioriza lo que está cerca del usuario y lo que coincide con la consulta.
 *   - Se deduplica por nombre + distancia.
 */

/* Área de servicio: Cancún, Zona Hotelera, Puerto Juárez */
const SERVICE_BBOX = { west: -87.15, south: 21.02, east: -86.65, north: 21.35 };
const SERVICE_BBOX_STR = `${SERVICE_BBOX.west},${SERVICE_BBOX.south},${SERVICE_BBOX.east},${SERVICE_BBOX.north}`;

/* Lugares emblemáticos que las fuentes devuelven fragmentados.
 * Se inyectan como resultado directo para que "parque de las palapas"
 * lleve al parque y no a un puesto de esquites dentro de él. */
const LANDMARKS = [
  {
    id: "landmark:palapas",
    name: "Parque de las Palapas",
    address: "SM 22, 77500 Cancún, Quintana Roo",
    placeType: "poi",
    center: { lng: -86.82705, lat: 21.1616 },
    aliases: ["palapas", "parque de las palapas", "plaza de las palapas", "parque palapas", "las palapas"],
  },
  {
    id: "landmark:mercado28",
    name: "Mercado 28",
    address: "Av. Xel-Há SM 28, 77500 Cancún, Quintana Roo",
    placeType: "poi",
    center: { lng: -86.83346, lat: 21.1686 },
    aliases: ["mercado 28", "mercado28", "mercado veintiocho"],
  },
  {
    id: "landmark:kabah",
    name: "Parque Kabah",
    address: "Av. Kabah SM 53, 77533 Cancún, Quintana Roo",
    placeType: "poi",
    center: { lng: -86.84707, lat: 21.1396 },
    aliases: ["parque kabah", "kabah", "parque ecologico kabah"],
  },
];

/* Utilidades de texto para comparar consultas */
const foldText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const STOPWORDS = new Set(["de", "del", "la", "las", "el", "los", "en", "y", "a", "al"]);
const tokenize = (value) =>
  foldText(value)
    .replace(/[^\w\s]/g, " ")
    .split(" ")
    .filter((word) => word && !STOPWORDS.has(word));

/* Distancia aproximada en metros */
function metersBetween(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function insideServiceArea({ lng, lat }) {
  return (
    lng >= SERVICE_BBOX.west &&
    lng <= SERVICE_BBOX.east &&
    lat >= SERVICE_BBOX.south &&
    lat <= SERVICE_BBOX.north
  );
}

/* Puntúa qué tan bien el nombre del lugar responde a la consulta (0..1) */
function textScore(query, place) {
  const q = foldText(query);
  const name = foldText(place.name);
  const haystack = foldText(`${place.name} ${place.address || ""}`);
  if (!q) return 0;

  if (name === q) return 1;
  if (name.startsWith(q)) return 0.95;
  if (name.includes(q)) return 0.88;
  if (haystack.includes(q)) return 0.7;

  const qWords = tokenize(query);
  if (!qWords.length) return 0;
  const hWords = new Set(tokenize(haystack));
  const hits = qWords.filter(
    (word) => hWords.has(word) || [...hWords].some((h) => h.startsWith(word))
  ).length;
  const ratio = hits / qWords.length;
  return ratio >= 0.5 ? 0.35 + ratio * 0.35 : ratio * 0.3;
}


/* ---------- Fuente 1: Mapbox SearchBox (la más potente) ---------- */
async function searchboxForward(query, token, { near, signal, limit = 10 } = {}) {
  const url = new URL("https://api.mapbox.com/search/searchbox/v1/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", token);
  url.searchParams.set("language", "es");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("bbox", SERVICE_BBOX_STR);
  const center = near || CANCUN;
  url.searchParams.set("proximity", `${center.lng},${center.lat}`);
  url.searchParams.set(
    "types",
    "poi,address,street,place,neighborhood,locality,district,region,country"
  );

  const res = await fetch(url, { signal });
  if (!res.ok) {
    if (res.status === 401) throw new Error("token");
    throw new Error(`searchbox ${res.status}`);
  }
  const data = await res.json();
  return (data.features || [])
    .map((f) => {
      const p = f.properties || {};
      const coords = p.coordinates || {};
      const lng = coords.longitude ?? f.geometry?.coordinates?.[0];
      const lat = coords.latitude ?? f.geometry?.coordinates?.[1];
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
      return {
        id: p.mapbox_id || `sb:${lng},${lat}`,
        name: p.name_preferred || p.name || p.full_address || "",
        address: p.full_address || p.place_formatted || "",
        placeType: p.feature_type || "poi",
        maki: p.maki || "",
        center: { lng, lat },
        source: "searchbox",
      };
    })
    .filter(Boolean);
}

/* ---------- Fuente 2: Mapbox Geocoding (direcciones y colonias) ---------- */
async function geocodingForward(query, token, { near, signal, limit = 6 } = {}) {
  const url = new URL(
    "https://api.mapbox.com/geocoding/v5/mapbox.places/" + encodeURIComponent(query) + ".json"
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("language", "es");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("bbox", SERVICE_BBOX_STR);
  const center = near || CANCUN;
  url.searchParams.set("proximity", `${center.lng},${center.lat}`);
  url.searchParams.set("types", "address,poi,place,neighborhood,locality");

  const res = await fetch(url, { signal });
  if (!res.ok) {
    if (res.status === 401) throw new Error("token");
    throw new Error(`geocoding ${res.status}`);
  }
  const data = await res.json();
  return (data.features || []).map((f) => ({
    id: f.id,
    name: f.text || f.place_name,
    address: f.place_name,
    placeType: f.place_type?.[0] || "place",
    maki: "",
    center: { lng: f.center[0], lat: f.center[1] },
    source: "geocoding",
  }));
}

/* ---------- Fuente 3: Nominatim / OpenStreetMap ---------- */
async function nominatimForward(query, { signal, limit = 6 } = {}) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set(
    "viewbox",
    `${SERVICE_BBOX.west},${SERVICE_BBOX.north},${SERVICE_BBOX.east},${SERVICE_BBOX.south}`
  );
  url.searchParams.set("bounded", "1");
  url.searchParams.set("accept-language", "es");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .map((f) => {
      const lat = Number(f.lat);
      const lng = Number(f.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const parts = String(f.display_name || "").split(",").map((s) => s.trim());
      const isPoi = ["amenity", "shop", "leisure", "tourism", "building"].includes(f.class);
      return {
        id: `osm:${f.osm_type || "x"}:${f.osm_id || `${lng},${lat}`}`,
        name: f.name || parts[0] || "Lugar",
        address: parts.slice(1).join(", "),
        placeType: isPoi ? "poi" : f.class === "highway" ? "address" : "place",
        maki: "",
        center: { lng, lat },
        source: "osm",
      };
    })
    .filter(Boolean);
}

/* ---------- Coincidencias de lugares emblemáticos ---------- */
function landmarkMatches(query) {
  const q = foldText(query);
  if (q.length < 4) return [];
  const qWords = tokenize(query);
  return LANDMARKS.filter((lm) =>
    lm.aliases.some((alias) => {
      const a = foldText(alias);
      if (q === a) return true;
      if (q.length >= 6 && (q.includes(a) || a.includes(q))) return true;
      const aWords = tokenize(alias);
      return qWords.length >= 2 && aWords.every((w) => qWords.includes(w));
    })
  ).map((lm) => ({ ...lm, source: "landmark" }));
}

/* Distancia de Levenshtein acotada: cuántas ediciones separan dos palabras */
function editDistance(a, b) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 99;
  const prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1, // borrar
        prev[j - 1] + 1, // insertar
        diag + (a[i - 1] === b[j - 1] ? 0 : 1) // sustituir
      );
      diag = tmp;
    }
  }
  return prev[b.length];
}

/* Términos frecuentes en Cancún: sirven para corregir erratas de escritura
 * ("ozxo" → "oxxo", "walmrt" → "walmart") sin depender de otra API. */
const KNOWN_TERMS = [
  "oxxo", "walmart", "soriana", "chedraui", "costco", "sam's club", "la comer",
  "farmacia", "ahorro", "guadalajara", "similares", "hospital", "clinica", "imss",
  "mercado", "parque", "playa", "delfines", "coco", "bongo", "senor", "frogs",
  "mandala", "dady", "oyo", "the", "city", "plaza", "las", "americas", "tulum",
  "kabah", "palapas", "tajamar", "aeropuerto", "terminal", "ado", "crucero",
  "puerto", "juarez", "hotelera", "kukulcan", "bonampak", "yaxchilan", "uxmal",
  "nichupte", "chichen", "itza", "restaurante", "pizza", "hut", "dominos",
  "burger", "king", "mcdonald", "starbucks", "cafe", "tacos", "marquesitas",
  "cenote", "muelle", "ferry", "isla", "mujeres", "elektra", "coppel", "liverpool",
  "sears", "suburbia", "cinepolis", "cinemex", "gimnasio", "gym", "banco",
  "banorte", "bbva", "santander", "hsbc", "scotiabank", "gasolina", "pemex",
];

/* Corrige una palabra mal escrita si está a 1 edición de un término conocido */
function correctWord(word) {
  if (word.length < 3) return word;
  if (KNOWN_TERMS.includes(word)) return word;
  let best = null;
  let bestDist = 3;
  for (const term of KNOWN_TERMS) {
    if (Math.abs(term.length - word.length) > 2) continue;
    const d = editDistance(word, term);
    if (d < bestDist) {
      bestDist = d;
      best = term;
    }
  }
  // Solo se corrige con 1 edición y palabra de 4+ letras (evita falsos positivos)
  if (best && bestDist === 1 && word.length >= 4) return best;
  return word;
}

/* Devuelve la consulta corregida (o la original si ya era correcta) */
function autocorrect(query) {
  const raw = String(query || "").trim();
  const words = raw.split(/\s+/);
  const fixed = words.map((w) => {
    const clean = w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const corrected = correctWord(clean);
    if (corrected === clean) return w;
    // Conserva la capitalización original de la primera letra
    return w[0] === w[0].toUpperCase()
      ? corrected[0].toUpperCase() + corrected.slice(1)
      : corrected;
  });
  return fixed.join(" ");
}

/* ---------- Orquestador: fusiona y ordena ---------- */
export async function searchPlaces(query, token, { near, signal } = {}) {
  const raw = String(query || "").trim();
  if (raw.length < 2) return [];

  /* Si la escritura tiene una errata evidente, se busca también la versión
   * corregida y luego se prefiere la que devuelva mejores resultados. */
  const corrected = autocorrect(raw);
  const variants = corrected !== raw && foldText(corrected) !== foldText(raw) ? [raw, corrected] : [raw];
  const primary = variants[variants.length - 1]; // la corregida manda

  const text = primary;
  const center = near || CANCUN;
  const landmarks = landmarkMatches(text);

  /* Cada variante (original + corregida) consulta las tres fuentes en paralelo;
   * si una falla no tumba al resto. */
  const settleFor = (q) =>
    Promise.allSettled([
      token ? searchboxForward(q, token, { near, signal }) : Promise.resolve([]),
      token ? geocodingForward(q, token, { near, signal }) : Promise.resolve([]),
      nominatimForward(q, { signal }),
    ]);

  const settledGroups = await Promise.all(variants.map(settleFor));
  const settled = settledGroups.flat();

  const errors = settled.filter((r) => r.status === "rejected").map((r) => r.reason);
  const aborted = errors.some(
    (e) => e?.name === "AbortError" || String(e?.message || "").includes("aborted")
  );
  if (aborted) throw Object.assign(new Error("aborted"), { name: "AbortError" });

  const collected = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  /* Sin token: solo se pudo consultar OSM. */
  if (!token && !collected.length && !landmarks.length) {
    const onlyOsmFailed = errors.length > 0;
    if (onlyOsmFailed) throw new Error("network");
    return [];
  }

  /* Con token pero todas las fuentes de Mapbox rechazaron la credencial. */
  if (token && errors.some((e) => e?.message === "token") && !collected.length && !landmarks.length) {
    throw new Error("token");
  }

  /* Ranking: coincidencia de texto + cercanía + tipo + fuente */
  const rank = (place) => {
    const score = textScore(text, place);
    const dist = metersBetween(center, place.center);
    const proximity = 1 - Math.min(dist / 25000, 1); // influencia de 25 km
    const typeBoost = place.placeType === "poi" ? 0.12 : place.placeType === "address" ? 0.04 : 0;
    const sourceBoost =
      place.source === "landmark" ? 0.5 : place.source === "searchbox" ? 0.08 : 0;
    return score * 0.62 + proximity * 0.26 + typeBoost + sourceBoost;
  };

  const dedupe = new Map();
  const push = (place) => {
    if (!place?.name) return;
    if (!insideServiceArea(place.center)) return;
    const key = `${foldText(place.name)}|${Math.round(place.center.lat * 2000)}|${Math.round(
      place.center.lng * 2000
    )}`;
    const entry = { ...place, _score: rank(place) };
    const prev = dedupe.get(key);
    if (!prev || entry._score > prev._score) dedupe.set(key, entry);
  };

  landmarks.forEach(push);
  collected.forEach(push);

  const results = [...dedupe.values()]
    .filter((p) => p._score >= 0.28)
    .sort((a, b) => b._score - a._score)
    .slice(0, 8)
    .map(({ _score, ...rest }) => rest);

  /* La UI puede leer `results.corrected` para avisar "mostrando resultados
   * para …". Es no enumerable, así que no contamina el array. */
  if (corrected !== raw && foldText(corrected) !== foldText(raw) && results.length) {
    Object.defineProperty(results, "corrected", {
      value: corrected,
      enumerable: false,
    });
  }

  return results;
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
