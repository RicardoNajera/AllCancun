/**
 * All Cancún — Asistente · Motor de razonamiento
 * Sin dependencias ni llamadas de red: todo se resuelve en el dispositivo.
 *
 * Flujo de una consulta:
 *   1. `readIntent(texto)`  → extrae señales (hambre, antojo, dinero, ánimo…)
 *   2. `mergeContext()`     → acumula con lo ya sabido de la conversación
 *   3. `rankPlaces()`       → puntúa cada lugar y devuelve el top N con motivos
 *   4. `composeReply()`     → (en reply.js) convierte el ranking en habla
 *
 * El motor nunca inventa un negocio: solo ordena lo que está en catalog.js
 * y explica por qué lo ordenó así.
 */

import { places } from "./catalog.js";
import { MOODS, readMood } from "./mood.js";

/* ---- Utilidades de texto ---- */

export const norm = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasAny = (text, list) => list.some((word) => text.includes(word));

/* ---- Vocabulario: señales que el motor entiende ---- */

const LEX = {
  hunger: [
    "hambre", "hambreado", "hambriento", "muero de hambre", "no he comido",
    "no he desayunado", "traigo hambre", "tengo mucha hambre", "fameli",
    "vengo de trabajar", "sali de trabajar", "largo el dia",
  ],
  satiety: ["llene", "llenador", "lleno", "bastante", "sustancioso", "fuerte", "pesado", "abra"],
  light: ["ligero", "poquito", "algo suave", "no tan pesado", "botana", "tentempie"],
  healthy: [
    "saludable", "dieta", "cuidarme", "cuidar", "ensalada", "verde", "proteina",
    "sin grasa", "bajo en grasa", "fresco", "natural", "no quiero grasa",
  ],
  budget: [
    "barato", "economico", "no traigo", "poco dinero", "sin lana", "no tengo mucho",
    "ando corto", "ajustado", "de a peso", "gratis",
  ],
  craving: ["antojo", "se me antoja", "quiero", "traigo ganas", "deseo", "provoca"],
  urgent: ["urge", "urgente", "rapido", "ahorita", "al rato", "pronto", "en cinco"],
  comfort: [
    "triste", "cansado", "cansada", "estresado", "estresada", "estres", "cruda", "crudo",
    "deprimido", "deprimida", "mal dia", "dia pesado", "nostalgia", "feliz", "contento",
    "celebrar", "aburrido", "aburrida", "enojado", "enojada", "nervioso", "ansiedad",
  ],
  company: ["para dos", "para 2", "para tres", "para 3", "para cuatro", "con mi", "familia", "amigos", "pareja"],
  late: ["noche", "medianoche", "madrugada", "trasnoche", "ya es noche", "de noche", "esta noche"],
  drinking: ["de tomar", "tomar algo", "bebida", "refresco", "agua fresca", "jugo", "licuado", "soda", "coca"],
  morning: ["desayuno", "desayunar", "temprano", "al amanecer"],
  transport: ["mototaxi", "transporte", "traslado", "que me lleve", "llevarme", "como llego", "taxi"],
  repair: ["aire acondicionado", "el clima", "reparar", "arreglar", "tecnico", "fuga", "se descompuso"],
  health: ["farmacia", "medicina", "me duele", "me siento mal", "pastilla"],
};

/* Dinero en pesos: "$80", "80 pesos", "con 150" */
export function readBudget(text) {
  const withPeso = text.match(/\$?\s*(\d{2,4})\s*(?:pesos|mxn|varos|lana)/);
  const withDollar = text.match(/\$\s*(\d{2,4})/);
  const withCon = text.match(/\bcon\s+(\d{2,4})\b/);
  const raw = withPeso?.[1] || withDollar?.[1] || withCon?.[1];
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 20 ? value : null;
}

/* ¿Nombró un platillo? Se compara por prefijo de palabra */
const escapeRe = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function readTags(text) {
  const found = new Set();
  for (const place of places) {
    for (const tag of place.tags) {
      const t = norm(tag);
      if (t.length < 3) continue;
      if (new RegExp(`\\b${escapeRe(t)}`).test(text)) found.add(t);
    }
  }
  return [...found];
}

/** A qué se refiere la consulta: comida, traslado, reparación, salud o mixto */
function signalDomain(s) {
  if (s.transport) return "transport";
  if (s.repair) return "repair";
  if (s.health) return "health";
  if (s.tags.length > 0) return "food";
  if (s.hunger || s.healthy || s.craving || s.wantSatiety || s.wantLight) return "food";
  return "generic";
}

/**
 * Lee un mensaje del usuario y devuelve las señales detectadas.
 * Todo es aproximado a propósito: el asistente pregunta cuando duda.
 */
export function readIntent(raw = "") {
  const text = norm(raw);

  const signals = {
    hunger: hasAny(text, LEX.hunger) ? 1 : 0,
    wantSatiety: hasAny(text, LEX.satiety) ? 1 : 0,
    wantLight: hasAny(text, LEX.light) ? 1 : 0,
    healthy: hasAny(text, LEX.healthy) ? 1 : 0,
    budget: readBudget(text),
    craving: hasAny(text, LEX.craving) ? 1 : 0,
    urgent: hasAny(text, LEX.urgent) ? 1 : 0,
    comfort: hasAny(text, LEX.comfort) ? 1 : 0,
    company: hasAny(text, LEX.company) ? 2 : 1,
    late: hasAny(text, LEX.late) ? 1 : 0,
    drinking: hasAny(text, LEX.drinking) ? 1 : 0,
    morning: hasAny(text, LEX.morning) ? 1 : 0,
    transport: hasAny(text, LEX.transport) ? 1 : 0,
    repair: hasAny(text, LEX.repair) ? 1 : 0,
    health: hasAny(text, LEX.health) ? 1 : 0,
    tags: readTags(text),
    words: text.split(" ").filter(Boolean).length,
    /* Cómo viene la persona. Va primero en la respuesta, antes del antojo. */
    mood: readMood(raw),
  };

  signals.domain = signalDomain(signals);
  return signals;
}



/**
 * Acumula el contexto de la conversación. Lo nuevo gana en lo explícito,
 * pero no se pierde lo anterior: si dijiste "tengo mucha hambre" y luego
 * "con 80 pesos", el motor conserva ambas cosas.
 */
export function mergeContext(previous = {}, signals = {}) {
  const next = { ...previous };

  next.hunger = Math.max(previous.hunger || 0, signals.hunger || 0);
  next.wantSatiety = Math.max(previous.wantSatiety || 0, signals.wantSatiety || 0);
  next.wantLight = signals.wantLight ?? previous.wantLight ?? 0;
  next.healthy = signals.healthy ?? previous.healthy ?? 0;
  next.urgent = Math.max(previous.urgent || 0, signals.urgent || 0);
  next.comfort = Math.max(previous.comfort || 0, signals.comfort || 0);
  next.late = Math.max(previous.late || 0, signals.late || 0);
  next.drinking = Math.max(previous.drinking || 0, signals.drinking || 0);
  next.morning = signals.morning ?? previous.morning ?? 0;

  if (signals.budget) next.budget = signals.budget;
  next.company = Math.max(previous.company || 1, signals.company || 1);

  if (signals.tags?.length) {
    next.tags = [...new Set([...(previous.tags || []), ...signals.tags])];
  }

  if (signals.domain && signals.domain !== "generic") next.domain = signals.domain;
  else if (!next.domain) next.domain = "food";

  /* El ánimo manda sobre el dominio: si alguien dice "ando aburrido, quiero
     algo para jugar", no tiene caso llevarlo a la sección de comida. */
  if (signals.mood && MOODS[signals.mood]) {
    next.mood = signals.mood;
    if (signals.mood === "aburrido" || signals.mood === "mascota") next.domain = "leisure";
    if (signals.mood === "enfermo") next.domain = "health";
    if (!next.tags?.length && MOODS[signals.mood].want === "food") {
      next.tags = MOODS[signals.mood].tags.slice(0, 2);
    }
  }

  /* Hambre fuerte = quiere llenar, salvo que pida algo ligero */
  if (next.hunger && !next.wantLight) next.wantSatiety = Math.max(next.wantSatiety, 1);
  if (next.wantLight) next.wantSatiety = 0;

  return next;
}

/* ---- Horario ---- */

export const HOUR = new Date().getHours();

export function isOpenAt(place, hour = HOUR) {
  const [from, to] = place.open;
  if (from === 0 && to === 24) return true;
  if (from <= to) return hour >= from && hour < to;
  /* Cruza medianoche: 17 → 2 */
  return hour >= from || hour < to;
}

export function periodOfDay(hour = HOUR) {
  if (hour >= 5 && hour < 11) return "manana";
  if (hour >= 11 && hour < 15) return "mediodia";
  if (hour >= 15 && hour < 20) return "tarde";
  if (hour >= 20) return "noche";
  return "madrugada";
}

/** Hora legible de un rango: [17, 2] → "5 pm a 2 am" */
export function formatHours(place) {
  const fmt = (h) => {
    const hour = ((h % 24) + 24) % 24;
    const suffix = hour < 12 ? "am" : "pm";
    const display = hour % 12 === 0 ? 12 : hour % 12;
    return `${display} ${suffix}`;
  };
  if (place.open[0] === 0 && place.open[1] === 24) return "todo el día";
  return `${fmt(place.open[0])} a ${fmt(place.open[1])}`;
}


/* ---- Puntaje ---- */

/**
 * Puntúa un lugar contra el contexto. Devuelve { score, reasons }.
 * El hambre y el dinero pesan más que el antojo: son restricciones físicas.
 * Un lugar cerrado a esta hora o fuera de presupuesto se descarta (-99).
 */
export function scorePlace(place, ctx, hour = HOUR) {
  let score = 0;
  const reasons = [];

  const inDomain =
    ctx.domain === "transport" ? place.category === "mototaxis"
    : ctx.domain === "repair" ? place.category === "mantenimiento"
    : ctx.domain === "health" ? place.category === "salud"
    : true; /* food y generic aceptan todo */

  if (!inDomain) return { score: -99, reasons: [] };

  /* Empujón de dominio: no mezclar tacos con aire acondicionado */
  if (ctx.domain === "transport" && place.id === "mototaxi") score += 6;
  if (ctx.domain === "repair" && place.id === "tecnico-aire") score += 6;
  if (ctx.domain === "health" && place.id === "farmacia-guardia") score += 6;

  /* Hambre: lo que llena gana */
  if (ctx.hunger) {
    score += place.satiety * 4.4;
    if (place.satiety >= 0.85) reasons.push("llena de verdad");
  }
  if (ctx.wantSatiety) {
    score += place.satiety * 2.6;
    if (place.satiety >= 0.8 && !reasons.includes("llena de verdad")) reasons.push("es de las llenadoras");
  }

  /* Quiere algo ligero */
  if (ctx.wantLight || ctx.healthy) {
    score += (1 - place.satiety) * 2.2;
    if (place.satiety <= 0.55) reasons.push("no cae pesado");
  }
  if (ctx.healthy) {
    if (place.tags.includes("saludable") || place.tags.includes("ligero")) {
      score += 3.2;
      reasons.push("va con lo que pides");
    } else if (place.satiety >= 0.85) {
      score -= 2.6; /* un plato enorme no es lo que pidió */
    }
  }

  /* Antojos concretos: papas, taco, ensalada… */
  const wanted = dishTags(ctx.tags || []);
  const matches = wanted.filter((tag) => place.tags.includes(tag));
  if (matches.length) {
    score += 2.4 * matches.length;
    reasons.push(`tiene ${matches.slice(0, 2).join(" y ")}`);
  } else if (wanted.length && (ctx.craving || ctx.hunger)) {
    score -= 1.4;
  }

  /* Dinero: si el mínimo no alcanza, se descarta */
  if (ctx.budget) {
    if (place.price[0] > ctx.budget) return { score: -99, reasons: [] };
    if (place.price[1] <= ctx.budget) {
      score += 2.2;
      reasons.push(`cabe en $${ctx.budget}`);
    } else {
      score += 0.8;
      reasons.push(`desde $${place.price[0]}`);
    }
  }

  /* Urgencia */
  if (ctx.urgent) {
    if (place.kind === "stall") {
      score += 1.8;
      reasons.push("te lo dan rápido");
    }
    if (place.tags.includes("rapido")) score += 1.2;
    if (place.category === "mantenimiento" || place.category === "mototaxis") score += 1.4;
  }

  /* Ánimo: lo reconfortante sube, salvo que ya pidió ligero */
  if (ctx.comfort) {
    if (place.satiety >= 0.8 && !ctx.wantLight) {
      score += 1.9;
      reasons.push("reconforta");
    }
    if (place.tags.includes("dulce") || place.tags.includes("postre")) score += 0.9;
  }

  /* Ánimo declarado: escucha cómo viene la persona y luego piensa qué
     comercio acompaña esa tensión. No es diagnóstico: es criterio. */
  if (ctx.mood) {
    const mood = MOODS[ctx.mood];
    if (mood) {
      if (place.category && mood.boost.includes(place.category)) score += 1.6;
      const shared = [...new Set(dishTags(place.tags))].filter((tag) => mood.tags.includes(tag));
      if (shared.length) {
        score += Math.min(2.4, shared.length * 1.2);
        reasons.push(`va con ${shared.slice(0, 2).join(" y ")}`);
      }
    }
  }

  /* Cerrado no existe */
  if (!isOpenAt(place, hour)) return { score: -99, reasons: [] };

  /* De noche, lo nocturno pega más */
  if (ctx.late || hour >= 21 || hour < 5) {
    if (place.tags.includes("noche") || place.tags.includes("24 horas")) {
      score += 2.0;
      reasons.push("a esta hora sí está abierto");
    }
  }
  if (ctx.morning && place.tags.includes("manana")) {
    score += 1.6;
    reasons.push("abre temprano");
  }

  /* Lo local primero: puestos y comerciantes de la zona */
  if (place.kind === "stall") score += 0.7;

  return { score, reasons };
}

/** Ordena el catálogo para un contexto dado. Devuelve el top N. */
export function rankPlaces(ctx, { limit = 3, hour = HOUR } = {}) {
  const wantsMeal = ctx.hunger || ctx.wantSatiety;

  return places
    .map((place) => {
      const { score, reasons } = scorePlace(place, ctx, hour);
      let extra = 0;

      /* Hambre real: un postre no resuelve la cena. Se queda como opción,
         pero nunca arriba de algo que llena. */
      if (wantsMeal && place.satiety < 0.45) extra -= 3.2;
      /* Servicios: solo cuando el usuario habla de servicios */
      if (ctx.domain === "food" && place.kind === "service") extra -= 3;

      return { ...place, score: score + extra, reasons: reasons.slice(0, 3) };
    })
    .filter((place) => place.score > -50)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Qué dato falta para dar una mejor respuesta. Solo devuelve UNO:
 * el asistente no interroga, pregunta lo que de verdad cambia la respuesta.
 */
export function missingData(ctx, signals = {}) {
  if ((signals.words || 0) >= 8) return null; /* ya contó mucho: no interrumpir */
  if (ctx.domain === "generic" && !ctx.tags?.length && !ctx.hunger) return "craving";
  if (ctx.hunger && !ctx.budget) return "budget";
  if (ctx.domain === "food" && !ctx.budget && !ctx.tags?.length) return "budget";
  return null;
}

/* ---- Señales frente a platillos ---- */

/**
 * Algunos tags del catálogo describen estados ("hambre", "noche"), no
 * platillos. Si el usuario dijo "tengo hambre", eso no significa que quiera
 * un lugar etiquetado "hambre": significa que necesita llenar.
 */
const STATE_TAGS = new Set([
  "hambre", "noche", "manana", "mediodia", "urgencia", "antojo", "barato",
  "fresco", "local", "rapido", "cancun", "region", "completa",
]);

/** Solo los tags que son comida/servicio concreto: "papas", "taco", "ensalada" */
export const dishTags = (tags = []) => tags.filter((tag) => !STATE_TAGS.has(tag));
