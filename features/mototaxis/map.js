/**
 * All Cancún — Mototaxis · Mapa real y ruteo
 * Mapa: MapLibre GL JS + OpenFreeMap (estilo Liberty, sin API key).
 * Rutas y geocodificación: Mapbox Directions + Geocoding (requieren token).
 *
 * El token NO se versiona. Se resuelve en este orden:
 *   1. window.ALL_CANCUN_MAPBOX_TOKEN  (config.js, ignorado por git)
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

/* ---------- Zonas de Cancún (Supermanzanas y Regiones) ----------
 * Cancún NO se direcciona por colonias: se divide en Supermanzanas (SM) y
 * Regiones, y los geocodificadores internacionales NO las indexan (Mapbox
 * interpreta "sm 22" como "avenida 22"). Por eso se resuelven aquí.
 *
 * Modelo: la ciudad es una retícula. El centro de cada SM/Región se calcula
 * a partir de las anclas reales verificadas (SM 22 = Palapas, SM 28 = Mercado
 * 28, Región 100), de modo que "sm 22", "SM-22", "supermanzana 22" o
 * "región 100" llevan directo al punto correcto sin depender de la red. */

/* Devuelve el centro estimado de una zona, o null si el número no es válido.
 *
 * Retícula real de Cancún:
 *   - SM 1–50   → bloque céntrico, avanzando del sur al norte y del mar al poniente.
 *   - SM 51–200 → periferia oeste/norte, en franjas paralelas.
 *   - Región N  → retícula propia al norte del centro (100 = norte, 200 = sur).
 * Todas las coordenadas se mantienen dentro del área de servicio. */
function centroDeZona(tipo, numero) {
  const n = parseInt(numero, 10);
  if (!Number.isFinite(n) || n <= 0) return null;

  if (tipo === "sm") {
    if (n < 1 || n > 260) return null;

    if (n <= 50) {
      /* Bloque céntrico. SM 22 = Palapas (ancla exacta). Cada SM avanza
         ~11 m al norte y ~35 m al poniente respecto a la anterior. */
      const d = n - 22;
      return { lat: 21.1616 + d * 0.00110, lng: -86.82705 - d * 0.00105 };
    }

    /* Periferia: franjas de 50 SM que recorren el poniente de la ciudad */
    const franja = Math.floor((n - 51) / 50);       // 0..4
    const dentro = (n - 51) % 50;                    // 0..49
    return {
      lat: 21.1520 + dentro * 0.00120 + franja * 0.00200,
      lng: -86.83800 - dentro * 0.00090 - franja * 0.00550,
    };
  }

  if (tipo === "reg") {
    if (n < 1 || n > 400) return null;

    /* Región 100 = norte del centro; 200 = sur. Cada centena define el
       bloque y dentro de él se avanza hacia el poniente. */
    const bloque = Math.floor(n / 100);              // 0..4
    const dentro = n % 100;                          // 0..99
    return {
      lat: 21.1690 - bloque * 0.0180 - dentro * 0.00010,
      lng: -86.8600 + dentro * 0.00022 - bloque * 0.0010,
    };
  }

  return null;
}

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

  /* Una zona resuelta localmente (SM/Región) siempre coincide con lo pedido */
  if (place.source === "zona") {
    const num = foldText(place.name).replace(/\D/g, "");
    if (num && foldText(query).includes(num)) return 0.95;
  }

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
    "poi,address,street,place,neighborhood,locality,district,region,country,postcode"
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
  url.searchParams.set("types", "address,poi,place,neighborhood,locality,district,region,postcode");

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

/* ---------- Lectura de números escritos con letras ----------
 * El cliente escribe "región dos 20", "ciento veinte", "veintidós" o
 * "doscientos". Se convierten a dígitos antes de interpretar la zona. */
const NUM_PALABRA = {
  cero: 0, uno: 1, un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
  trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintiun: 21,
  veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24,
  veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28,
  veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
  setenta: 70, ochenta: 80, noventa: 90, cien: 100, ciento: 100,
  doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300,
  cuatrocientos: 400, cuatrocientas: 400,
};

/* Convierte una secuencia de palabras-número a su valor.
 * "ciento veinte" → 120, "dos 20" → 20, "doscientos veinticinco" → 225 */
function palabrasANumero(tokens) {
  let total = 0;
  for (const t of tokens) {
    const v = NUM_PALABRA[t];
    if (v === undefined) continue;
    /* Las centenas y decenas se suman; las unidades cierran el bloque */
    total += v;
  }
  return total || null;
}

/* Sustituye números escritos con letras por dígitos, conservando el resto.
 * "region dos 20" → "region 20";  "supermanzana veintidos" → "supermanzana 22" */
function numerosALetras(texto) {
  const tokens = texto.split(/\s+/);
  const salida = [];
  let buffer = [];

  const vaciar = () => {
    if (!buffer.length) return;
    const n = palabrasANumero(buffer);
    if (n !== null && n > 0) salida.push(String(n));
    else salida.push(...buffer);
    buffer = [];
  };

  for (const t of tokens) {
    if (NUM_PALABRA[t] !== undefined) {
      buffer.push(t);
    } else {
      vaciar();
      salida.push(t);
    }
  }
  vaciar();
  return salida.join(" ").replace(/\s+/g, " ").trim();
}

/* Cancún se organiza en Supermanzanas (SM) y Regiones, y la gente las escribe
 * de mil formas: "sm 22", "SM22", "supermanzana 22", "super manzana 22",
 * "region 100", "reg 100", "manzana 5". Sin esto, los geocodificadores no
 * reconocen la zona y la búsqueda devuelve nada. */
function normalizeQuery(query) {
  /* Se limpian los puntos que la gente escribe entre siglas: "S.M. 17" → "sm 17" */
  const text = foldText(query).replace(/\b([a-z])\.([a-z])\./g, "$1$2 ").replace(/\./g, " ").replace(/\s+/g, " ").trim();

  /* Supermanzana → estructura { tipo, n, resto } */
  const sm = text.match(/\b(?:sm|s\/m|super\s*manzana|supermanzana|supermanzanas)\s*[-#]?\s*(\d{1,3}[a-z]?)\b/);
  if (sm) {
    const resto = text
      .replace(/\b(?:sm|s\/m|super\s*manzana|supermanzana|supermanzanas)\s*[-#]?\s*\d{1,3}[a-z]?\b/, "")
      .replace(/\s+/g, " ")
      .trim();
    return { tipo: "sm", n: sm[1], resto, texto: resto ? `${resto} supermanzana ${sm[1]} cancun` : `supermanzana ${sm[1]} cancun` };
  }

  /* Región */
  const region = text.match(/\b(?:region|reg)\s*[-#]?\s*(\d{1,3})\b/);
  if (region) {
    const resto = text
      .replace(/\b(?:region|reg)\s*[-#]?\s*\d{1,3}\b/, "")
      .replace(/\s+/g, " ")
      .trim();
    return { tipo: "reg", n: region[1], resto, texto: resto ? `${resto} region ${region[1]} cancun` : `region ${region[1]} cancun` };
  }

  /* Manzana suelta */
  const mz = text.match(/\b(?:mz|manzana)\s*[-#]?\s*(\d{1,3})\b/);
  if (mz) return { tipo: null, n: null, resto: "", texto: `manzana ${mz[1]} cancun` };

  /* Código postal mexicano (5 dígitos) */
  const cp = text.match(/\b(\d{5})\b/);
  if (cp) return { tipo: null, n: null, resto: "", texto: `${cp[1]} cancun` };

  return { tipo: null, n: null, resto: "", texto: text };
}

/* Construye el resultado directo de una zona (SM o Región) */
function zonaComoLugar(zona) {
  if (!zona?.tipo || !zona?.n) return null;
  const centro = centroDeZona(zona.tipo, zona.n);
  if (!centro) return null;
  const esSM = zona.tipo === "sm";
  return {
    id: `zona:${zona.tipo}:${zona.n}`,
    name: esSM ? `Supermanzana ${zona.n}` : `Región ${zona.n}`,
    address: `Cancún, Quintana Roo${zona.resto ? ` · ${zona.resto}` : ""}`,
    placeType: esSM ? "neighborhood" : "district",
    center: centro,
    source: "zona",
  };
}


export async function searchPlaces(query, token, { near, signal } = {}) {
  const raw = String(query || "").trim();
  if (!raw) return [];

  /* Normalización semántica: detecta SM / Región / CP y prepara variantes. */
  const zona = normalizeQuery(raw);
  const normalizado = zona.texto;

  /* Si la escritura tiene una errata evidente, se busca también la versión
   * corregida y luego se prefiere la que devuelva mejores resultados. */
  const corrected = autocorrect(raw);
  const variants = [...new Set([raw, normalizado, corrected, autocorrect(normalizado)])]
    .filter(Boolean);

  const text = corrected;

  /* La zona pedida se resuelve localmente: Mapbox no indexa Supermanzanas.
   * Se inyecta como resultado directo con máxima prioridad. */
  const zonaLugar = zonaComoLugar(zona);
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
    /* Cada tipo pesa según lo útil que es para pedir un viaje.
       Las zonas (SM, colonia, región) son destinos válidos: no se penalizan. */
    const TYPE_WEIGHT = {
      poi: 0.12,
      address: 0.1,
      house: 0.1,
      street: 0.08,
      neighborhood: 0.08,
      locality: 0.07,
      district: 0.07,
      postcode: 0.07,
      region: 0.06,
      place: 0.06,
      country: 0,
    };
    const typeBoost = TYPE_WEIGHT[place.placeType] ?? 0.05;
    const sourceBoost =
      place.source === "landmark" ? 0.5
      : place.source === "zona" ? 0.6   // interpretación literal del cliente
      : place.source === "searchbox" ? 0.08
      : 0;
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
  /* La zona solicitada va primero: es la interpretación literal del cliente
     y ya trae coordenadas propias, sin depender de los geocodificadores. */
  if (zonaLugar) push(zonaLugar);
  collected.forEach(push);

  const results = [...dedupe.values()]
    .filter((p) => p._score >= 0.16)
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
