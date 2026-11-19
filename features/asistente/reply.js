/**
 * All Cancún — Asistente · Compositor de respuestas
 * Convierte el ranking del motor en habla natural.
 *
 * Reglas:
 *   - Nunca promete lo que no hay: si falta dato, lo dice.
 *   - Siempre explica el "por qué" (los motivos salen del score).
 *   - Cierra con un siguiente paso concreto.
 */

import { phrases, pickFrom, persona } from "./persona.js";
import { formatHours, dishTags, periodOfDay, isOpenAt } from "./brain.js";
import { places } from "./catalog.js";
import { moodFor, MOODS } from "./mood.js";

const money = (value) => `$${value}`;

/* Motivo del reconocimiento del contexto.
   El ánimo va PRIMERO: antes de hablar de precios o antojos, el asistente
   dice qué entendió de cómo viene la persona. */
function contextLine(ctx, seed, raw) {
  const mood = moodFor(ctx.mood);
  if (mood?.ask?.length) {
    /* En la primera respuesta se reconoce; en las siguientes ya no se repite
       el mismo párrafo, se usa una línea corta para no sonar a disco rayado. */
    return ctx.moodSpoken ? pickFrom(mood.ask.slice(1), seed) || mood.ask[0] : pickFrom(mood.ask, seed);
  }
  if (ctx.domain === "leisure") return "Va, algo para el rato:";
  if (ctx.domain === "transport") return "Va, traslado:";
  if (ctx.domain === "repair") return "Va, reparación:";
  if (ctx.domain === "health") return "Va, salud:";
  if (ctx.hunger && ctx.healthy) return "Hambre y ganas de cuidarte se pueden.";
  if (ctx.hunger) return pickFrom(phrases.understood.hunger, seed);
  if (ctx.healthy) return pickFrom(phrases.understood.healthy, seed);
  if (ctx.budget) return pickFrom(phrases.understood.budget, seed);
  if (dishTags(ctx.tags).length) return pickFrom(phrases.understood.craving, seed);
  if (ctx.drinking) return "Para acompañar la comida:";
  if (ctx.late) return pickFrom(phrases.understood.night, seed);
  return pickFrom(phrases.understood.generic, seed);
}

/* Ficha corta de un lugar: "$50–$85 · 6 pm a 2 am" */
function facts(place) {
  return `${money(place.price[0])}–${money(place.price[1])} · ${formatHours(place)}`;
}

/**
 * @param {object} ctx       contexto acumulado
 * @param {Array}  ranking   resultado de rankPlaces()
 * @param {object} options   { probe, seed, raw }
 * @returns {{ text: string, chips: string[], suggestions: string[] }}
 */
export function composeReply(ctx, ranking, { probe, seed = 0, raw = "" } = {}) {
  /* Sin resultados: honestidad y un dato más */
  if (!ranking.length) {
    const base = contextLine(ctx, seed, raw);
    const extra = ctx.budget
      ? `con ${money(ctx.budget)} no encontré algo abierto a esta hora. Si me das más margen, abro otras opciones.`
      : "a esta hora no encontré algo abierto que te sirva.";
    return {
      text: `${base} ${extra}`,
      chips: [],
      suggestions: ["¿Qué está abierto ahorita?", "Algo barato", "Abrir Comida"],
    };
  }

  const [first, second, third] = ranking;
  const parts = [];

  /* 1. Reconocer + la recomendación principal con su porqué */
  const why = first.reasons.length ? ` Lo pongo primero porque ${first.reasons.join(" y ")}.` : "";
  parts.push(`${contextLine(ctx, seed, raw)} ${first.name} (${facts(first)}).${why}`);

  /* 2. Alternativas: solo el nombre y el dato que las distingue */
  if (second) {
    const alt = [`${second.name} (${facts(second)})`, third ? `o ${third.name} (${facts(third)})` : ""]
      .filter(Boolean)
      .join(" ");
    parts.push(`Si no te late, ${alt}.`);
  }

  /* 3. Honestidad sobre el registro de negocios */
  const mood = moodFor(ctx.mood);
  if (mood?.care) parts.push(mood.care);

  /* 4. Qué hacer después: el asistente no deja a la persona colgada */
  if (mood && ctx.domain === "leisure") {
    parts.push("Si quieres, te abro Comercios para ver qué hay cerca de ti.");
  }

  /* 5. Preguntar UNA sola cosa si falta dato */
  if (probe === "budget" && !ctx.budget) parts.push("¿Cuánto traes? Con eso te la afino.");
  if (probe === "craving") parts.push("¿Se te antoja algo en particular o me dejo llevar?");
  if (probe === "zone") parts.push("¿Por qué zona andas?");

  return {
    text: parts.join(" "),
    chips: ranking.slice(1).map((place) => `${place.name} — ${facts(place)}`),
    suggestions: mood?.suggestions?.length ? mood.suggestions : suggestFor(ctx, ranking),
  };
}

/* Sugerencias de seguimiento: lo que de verdad se suele querer después */
function suggestFor(ctx) {
  if (ctx.domain === "transport") return ["Cuánto cuesta", "Abrir Mototaxis", "Otro traslado"];
  if (ctx.domain === "repair" || ctx.domain === "health") {
    return ["Abrir la categoría", "Ver Comercios", "Necesito un mototaxi"];
  }
  if (ctx.domain === "food") {
    const out = ["Algo más barato"];
    if (!ctx.healthy) out.push("Algo más ligero");
    if (dishTags(ctx.tags).includes("papas")) out.push("Solo papas");
    else if (ctx.hunger) out.push("Algo con papas");
    out.push("Abrir Comida");
    return out;
  }
  return ["Ver Comida", "Ver Comercios", "Necesito un mototaxi"];
}

/* ---- Preguntas de un solo golpe: no necesitan el motor de ranking ---- */

const normText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Atajos conversacionales. Devuelven texto + sugerencias cuando la pregunta
 * es de conocimiento general ("¿qué está abierto?", "¿cómo funciona?").
 * null = el motor de ranking se encarga.
 */
export function quickAnswer(raw = "") {
  const t = normText(raw);

  /* Qué está abierto ahora */
  if (/(que (esta|hay) abierto|que abre ahorita|abierto ahorita|quien abre)/.test(t)) {
    const hour = new Date().getHours();
    const open = places
      .filter((p) => isOpenAt(p, hour))
      .filter((p) => p.domain !== "service")
      .slice(0, 4);
    if (!open.length) {
      return {
        text: "A esta hora casi todo está cerrado. La farmacia de guardia y los puestos nocturnos suelen aguantar.",
        suggestions: ["Farmacia de guardia", "Algo nocturno", "Abrir Comida"],
      };
    }
    return {
      text: `Ahorita abierto: ${open.map((p) => p.name).join(", ")}. Dime para quién es y te la afino.`,
      chips: open.slice(1).map((p) => `${p.name} — ${formatHours(p)}`),
      suggestions: ["Algo barato", "Con papas", "Abrir Comida"],
    };
  }

  /* Cómo funciona el asistente */
  if (/(como funciona|que puedes hacer|que sabes hacer|para que sirves)/.test(t)) {
    return {
      text: "Te ayudo a decidir, no a buscar. Me dices cómo vienes (hambre, prisa, dinero, ánimo) y te digo qué sí y qué no, con precio y horario. Conozco puestos, servicios y traslados de Cancún; lo que no tengo registrado, no me lo invento.",
      suggestions: ["Tengo mucha hambre", "Algo con papas", "Necesito un mototaxi"],
    };
  }

  /* Saludo suelto */
  if (/^(hola|buenas|que onda|hey|buenos dias|buenas tardes|buenas noches)$/.test(t)) {
    return {
      text: `${persona.greeting[periodOfDay()]} Dime cómo vienes y te digo qué hacer.`,
      suggestions: ["Tengo mucha hambre", "Algo ligero y barato", "¿Qué hay abierto?"],
    };
  }

  /* Agradecimiento */
  if (/(gracias|te agradezco|muy amable)/.test(t) && t.split(" ").length <= 4) {
    return {
      text: "De nada. Si te falla algo, aquí ando.",
      suggestions: ["Ver Comida", "Necesito un mototaxi"],
    };
  }

  return null;
}

/* Saludo inicial de la vista */
export function openingMessage() {
  const period = periodOfDay();
  return {
    text:
      "Antes de recomendarte nada, dime una cosa: ¿cómo vienes hoy? " +
      "Con hambre, con el día pesado, aburrido, con ganas de activarte, " +
      "o solo buscando algo. De ahí arranco.",
    suggestions: [
      "Tengo mucha hambre",
      "Ando con el día pesado",
      "Estoy aburrido",
      "Quiero activarme",
      "¿Qué hay abierto ahorita?",
    ],
    moodPicker: [
      { key: "triste", emoji: "🌧", label: "Día pesado" },
      { key: "estres", emoji: "😮‍💨", label: "Estrés" },
      { key: "aburrido", emoji: "🕹", label: "Aburrido" },
      { key: "activar", emoji: "⚡️", label: "Activarme" },
      { key: "cruda", emoji: "💧", label: "Cruda" },
      { key: "feliz", emoji: "🎉", label: "De fiesta" },
    ],
  };
}

/* Resumen del contexto detectado, para mostrarlo como "lo que entendí" */
export function readback(ctx) {
  const bits = [];
  if (ctx.mood && MOODS[ctx.mood]) bits.push(`como vienes: ${MOODS[ctx.mood].label}`);
  if (ctx.hunger) bits.push("con hambre");
  if (ctx.healthy) bits.push("buscando algo ligero");
  else if (dishTags(ctx.tags).length) {
    bits.push(`antojo de ${dishTags(ctx.tags).slice(0, 2).join(" y ")}`);
  }
  if (ctx.budget) bits.push(`presupuesto ${money(ctx.budget)}`);
  if (ctx.comfort) bits.push("día pesado");
  if (ctx.urgent) bits.push("con prisa");
  if (ctx.domain === "transport") bits.push("traslado");
  if (ctx.domain === "repair") bits.push("reparación");
  if (ctx.domain === "health") bits.push("salud");
  return [...new Set(bits)];
}
