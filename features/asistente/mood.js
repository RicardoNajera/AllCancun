/**
 * All Cancún — Asistente · Estados de ánimo
 * Escucha primero cómo viene la persona y después decide qué recomendar.
 * Un comercio no resuelve una tristeza, pero sí puede acompañar.
 */

export const MOODS = {
  triste: {
    label: "triste",
    chip: "día pesado",
    ask: [
      "No hay que estar bien todo el tiempo. ¿Quieres que te consienta un poco o prefieres distraerte?",
      "Gracias por decirlo. Vamos a lo primero: que estés bien. ¿Algo caliente, algo dulce o algo que te saque de casa un rato?",
    ],
    needs: ["consuelo"],
    want: "food",
    tags: ["dulce", "postre", "cafe", "caliente", "antojo"],
    boost: ["comida", "salud"],
    care: "Si la tristeza se queda muchos días o no te deja dormir, hablar con alguien ayuda más que cualquier recomendación.",
    suggestions: ["Algo dulce", "Algo caliente y llenador", "Algo para distraerme"],
  },
  sola: {
    label: "con ganas de compañía",
    chip: "buscando compañía",
    ask: [
      "No tienes que pasarlo sola. ¿Te provoca salir un rato o preferirías algo a domicilio?",
      "Te escucho. ¿Algo para compartir en casa o prefieres darte una vuelta?",
    ],
    needs: ["compañía"],
    want: "food",
    tags: ["para dos", "compartir", "antojito", "cafe", "postre"],
    boost: ["comida", "tianguis"],
    care: "La compañía también se pide. Si el sentimiento se vuelve pesado, decirlo en voz alta ya es un paso.",
    suggestions: ["Algo para compartir", "Un antojito", "Salir un rato"],
  },
  estres: {
    label: "con estrés",
    chip: "trayendo estrés",
    ask: [
      "Se nota. Vamos a bajarle dos cambios: comida sin pensarla mucho y, si se puede, aire libre.",
      "Ya sé, día cargado. Te propongo algo que no te haga decidir más de la cuenta.",
    ],
    needs: ["calma"],
    want: "food",
    tags: ["ligero", "fresco", "jugo", "fruta"],
    boost: ["comida", "salud"],
    care: "Si el pecho se aprieta o la respiración no baja, para un momento y respira lento.",
    suggestions: ["Algo ligero y fresco", "Agua o jugo", "Algo para no pensar"],
  },
  activar: {
    label: "con ganas de activarse",
    chip: "queriendo activarme",
    ask: [
      "¡Va! ¿Para andar más ligero durante el día o para entrenar en serio?",
      "Sí se puede. ¿Arrancamos suave o buscamos algo con más proteína?",
    ],
    needs: ["energía"],
    want: "food",
    tags: ["proteina", "fruta", "fresco", "natural", "huevo", "jugo"],
    boost: ["salud", "estudiantes"],
    care: "Constancia le gana a intensidad: no hace falta rendir al 100 % todos los días.",
    suggestions: ["Algo con proteína", "Algo fresco y natural", "Ver Salud y Bienestar"],
  },
  aburrido: {
    label: "aburrido",
    chip: "necesitando distracción",
    ask: [
      "El aburrimiento se arregla mejor con algo que ver, jugar o probar que con comida. ¿Te late?",
      "Vamos a distraernos. ¿Algo para pasar el rato en casa o prefieres salir a caminar y encontrar algo?",
    ],
    needs: ["distracción"],
    want: "leisure",
    tags: ["juego", "distraccion", "pasatiempo", "libro", "antojito"],
    boost: ["comercios", "tianguis"],
    care: "Cambiar de escenario, aunque sea cinco minutos, cambia más el ánimo de lo que parece.",
    suggestions: ["Algo para distraerme", "Salir a ver qué encuentro", "Un antojito"],
  },
  mascota: {
    label: "pensando en una mascota",
    chip: "buscando compañía animal",
    ask: [
      "Un perro o un gato a veces hace compañía mejor que muchas cosas. Te llevo a lo que hay en la zona.",
      "Buena idea. Vamos a ver qué hay para animales por aquí.",
    ],
    needs: ["compañía"],
    want: "leisure",
    tags: ["mascota", "perro", "gato", "compañia"],
    boost: ["comercios"],
    care: "Adoptar es una decisión de años. Vale la pena pensarlo despacio.",
    suggestions: ["Ver Comercios", "Algo para distraerme"],
  },
  cruda: {
    label: "con cruda",
    chip: "con cruda",
    ask: [
      "Primero agua y algo caliente. Los tacos pueden esperar veinte minutos.",
      "Vamos a lo práctico: líquido, algo con caldo y cero prisa.",
    ],
    needs: ["recuperación"],
    want: "food",
    tags: ["caldo", "sopa", "fresco", "fruta", "agua fresca", "jugo", "ligero"],
    boost: ["comida", "salud"],
    care: "Si hay vómito que no para o mucha debilidad, no es cosa de comida: es cosa de doctor.",
    suggestions: ["Algo con caldo", "Agua o suero", "Algo ligero"],
  },
  feliz: {
    label: "de buen ánimo",
    chip: "de buen ánimo",
    ask: [
      "¡Eso! Con ese ánimo todo sabe mejor. ¿Algo para celebrar o algo rico sin más?",
      "Se nota y se agradece. ¿Nos damos gusto?",
    ],
    needs: ["disfrute"],
    want: "food",
    tags: ["dulce", "postre", "compartir", "antojito"],
    boost: ["comida", "tianguis"],
    care: "",
    suggestions: ["Algo para celebrar", "Algo dulce", "Algo para compartir"],
  },
  enfermo: {
    label: "sin sentirse bien",
    chip: "sintiéndome mal",
    ask: [
      "Eso importa más que cualquier antojo. ¿Necesitas medicina o algo suave para el estómago?",
      "Primero lo primero: ¿hay farmacia cerca o te llevo a algo suave de comer?",
    ],
    needs: ["salud"],
    want: "health",
    tags: ["farmacia", "medicina", "salud", "caldo", "suave"],
    boost: ["salud"],
    care: "Si hay fiebre alta, dolor fuerte o no puedes mantener líquidos, ve a consulta.",
    suggestions: ["Farmacia cercana", "Algo suave de comer", "Ver Salud y Bienestar"],
  },
};

/* ---- Detección ---- */

/**
 * Se compara por palabra completa y frases explícitas: "estoy solo en casa"
 * no es lo mismo que "solo traigo 100 pesos". Gana lo primero que aparece.
 */
const PATTERNS = [
  ["cruda", /\b(cruda|crudo|resaca|goma)\b/],
  ["enfermo", /\b(me siento mal|enferm[oa]|gripa|fiebre|me duele la panza|nausea)\b/],
  ["triste", /\b(triste|tristeza|deprimid[oa]|nostalgia|llorar|llorando|mal dia|dia pesado|sin ganas de nada)\b/],
  ["sola", /\b(me siento sol[oa]|estoy sol[oa]|nadie con quien|sin compania)\b/],
  ["mascota", /\b(perro|perra|gato|gata|mascota|cachorro|adoptar)\b/],
  ["estres", /\b(estresad[oa]|estres|cansad[oa]|cansancio|agotad[oa]|harta|harto|no aguanto|ansiedad|nervios[oa])\b/],
  ["aburrido", /\b(aburrid[oa]|aburrimiento|nada que hacer|no hay nada que hacer|sin plan)\b/],
  ["activar", /\b(activarme|activar|ejercicio|entrenar|gym|gimnasio|correr|ponerme en forma|con pilas|hacer deporte)\b/],
  ["feliz", /\b(feliz|content[oa]|celebrar|festejo|celebro|de fiesta)\b/],
];

/** Señales que no se resuelven con una recomendación de comercio. */
const SERIOUS =
  /\b(no quiero vivir|quitarme la vida|hacerme dano|me quiero morir|me pegan|me golpea|violencia|abuso)\b/;

/** Devuelve la clave del ánimo detectado o null. */
export function readMood(raw = "") {
  const text = String(raw)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (SERIOUS.test(text)) return "cuidado";

  for (const [key, re] of PATTERNS) {
    if (re.test(text)) return key;
  }
  return null;
}

/** El ánimo, listo para pintar. */
export function moodFor(key) {
  return key && MOODS[key] ? MOODS[key] : null;
}

/** Respuesta de cuidado: no recomienda nada, primero la persona. */
export function careReply() {
  return {
    text: "Esto que me cuentas es importante y no lo voy a pasar por alto. No te voy a vender nada ni recomendarte un puesto. Si estás pasando por algo así, habla hoy con alguien de confianza y con una línea de apoyo emocional de tu ciudad. Aquí sigo para lo cotidiano.",
    suggestions: ["Solo quería distraerme", "Buscar farmacia", "Ver Salud y Bienestar"],
    care: true,
  };
}
