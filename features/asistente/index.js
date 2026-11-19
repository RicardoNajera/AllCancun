/**
 * All Cancún — Asistente · Vista
 * Pantalla completa inmersiva: al abrirse, el dock y el header desaparecen.
 *
 * Estructura:
 *   .ai                     contenedor a pantalla completa
 *     .ai__glow             halos de color de fondo (profundidad)
 *     .ai__head             Chéel + estado + acciones (nueva conversación, cerrar)
 *     .ai__context          "lo que entendí": chips del contexto vivo
 *     .ai__thread           hilo de mensajes (scroll propio)
 *     .ai__suggest          sugerencias contextuales
 *     .ai__composer         textarea + dictado + enviar
 *
 * Contrato estándar de features (features/shared/shell.js).
 */

import { aiIcons } from "./icons.js";
import { readIntent, mergeContext, rankPlaces, missingData, periodOfDay } from "./brain.js";
import { composeReply, openingMessage, readback, quickAnswer } from "./reply.js";
import { persona } from "./persona.js";
import { escape } from "../shared/ui.js";

const THREAD_KEY = "all-cancun:ai-thread";
const CONTEXT_KEY = "all-cancun:ai-context";

/* Persistencia ligera: la conversación sobrevive a cerrar y abrir */
function load(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Sin almacenamiento la vista sigue funcionando */
  }
}

const timeNow = () => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

/* ---- Render de un mensaje ---- */

function messageNode(message) {
  const isUser = message.role === "user";
  const chips = (message.chips || [])
    .map((chip) => `<li class="ai-chip">${escape(chip)}</li>`)
    .join("");

  return `
    <div class="ai-msg" data-role="${isUser ? "user" : "ai"}">
      ${isUser ? "" : `<span class="ai-msg__avatar" aria-hidden="true">${aiIcons.spark}</span>`}
      <div class="ai-msg__body">
        <p class="ai-msg__text">${escape(message.text)}</p>
        ${chips ? `<ul class="ai-msg__chips">${chips}</ul>` : ""}
        <span class="ai-msg__time">${escape(message.time || "")}</span>
      </div>
    </div>
  `;
}

/* Indicador de escritura */
function pendingNode() {
  return `
    <div class="ai-msg ai-msg--pending" data-role="ai" data-pending>
      <span class="ai-msg__avatar" aria-hidden="true">${aiIcons.spark}</span>
      <div class="ai-msg__body">
        <span class="ai-typing" aria-label="El asistente está escribiendo">
          <i></i><i></i><i></i>
        </span>
      </div>
    </div>
  `;
}

/* "Comida" → "comida"; "Solo Mujeres" → "mujeres" */
const CATEGORY_ALIASES = [
  "comida",
  "tianguis",
  "comercios",
  "mototaxis",
  "mantenimiento",
  "mujeres",
  "hombres",
  "estudiantes",
  "salud",
];

function resolveCategory(label = "") {
  const key = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^solo\s+/, "")
    .replace(/\b(la|el|los|las)\s+/, "")
    .trim();
  if (CATEGORY_ALIASES.includes(key)) return key;
  return CATEGORY_ALIASES.find((id) => key.includes(id)) || null;
}

/* ---- HTML de la vista ---- */

function viewHtml(opening) {
  return `
    <div class="ai" data-ai-root data-period="${periodOfDay()}">
      <span class="ai__glow ai__glow--a" aria-hidden="true"></span>
      <span class="ai__glow ai__glow--b" aria-hidden="true"></span>

      <header class="ai__head">
        <button type="button" class="ai__icon-btn ai__icon-btn--back" data-ai-close
                aria-label="Cerrar el asistente">
          ${aiIcons.arrow}
        </button>

        <div class="ai__identity">
          <span class="ai__orb" aria-hidden="true">
            <span class="ai__orb-ring"></span>
            <span class="ai__orb-core">${aiIcons.spark}</span>
          </span>
          <span class="ai__who">
            <span class="ai__name">${escape(persona.name)}</span>
            <span class="ai__status">
              <i class="ai__dot" aria-hidden="true"></i>
              En línea · Cancún
            </span>
          </span>
        </div>

        <button type="button" class="ai__icon-btn" data-ai-new
                aria-label="Empezar una conversación nueva">
          ${aiIcons.trash}
        </button>
      </header>

      <div class="ai__context" data-ai-context hidden>
        <span class="ai__context-label">${aiIcons.bulb}<span>Lo que entendí</span></span>
        <ul class="ai__context-list" data-ai-context-list></ul>
      </div>

      <div class="ai__thread" data-ai-thread role="log" aria-live="polite"
           aria-label="Conversación con ${escape(persona.name)}"></div>

      <div class="ai__suggest" data-ai-suggest></div>

      <form class="ai__composer" data-ai-form>
        <div class="ai__field">
          <textarea class="ai__input" data-ai-input rows="1"
                    placeholder="Escríbeme o dicta lo que necesitas…"
                    aria-label="Mensaje para ${escape(persona.name)}"
                    enterkeyhint="send"></textarea>

          <button type="button" class="ai__mic" data-ai-mic
                  aria-label="Dictar por voz" aria-pressed="false">
            ${aiIcons.mic}
          </button>

          <button type="submit" class="ai__send" data-ai-send
                  aria-label="Enviar mensaje" disabled>
            ${aiIcons.send}
          </button>
        </div>
        <p class="ai__hint" data-ai-hint hidden></p>
      </form>
    </div>
  `;
}

export default {
  id: "asistente",
  accent: "comida",
  styleBase: "features/shared/feature-view.css",
  styles: "features/asistente/view.css",

  render({ navigate, back }) {
    const opening = openingMessage();

    return {
      html: viewHtml(opening),
      onMount(root) {
        return mountView(root, { navigate, back, opening });
      },
    };
  },
};

/* ---- Montaje e interacción ---- */

function mountView(root, { navigate, back, opening }) {
  const ai = root.querySelector("[data-ai-root]");
  if (!ai) return;
  return wire(ai, { navigate, back, opening });
}

function wire(ai, { navigate, back, opening }) {
  let ctx = load(CONTEXT_KEY, {});
  let thread = load(THREAD_KEY, []);
  let busy = false;
  let recognition = null;

  const threadEl = ai.querySelector("[data-ai-thread]");
  const contextEl = ai.querySelector("[data-ai-context]");
  const contextListEl = ai.querySelector("[data-ai-context-list]");
  const suggestEl = ai.querySelector("[data-ai-suggest]");
  const form = ai.querySelector("[data-ai-form]");
  const input = ai.querySelector("[data-ai-input]");
  const sendBtn = ai.querySelector("[data-ai-send]");
  const micBtn = ai.querySelector("[data-ai-mic]");
  const hintEl = ai.querySelector("[data-ai-hint]");
  const headEl = ai.querySelector(".ai__head");

  /* ---- Pintado ---- */

  const scrollToEnd = (smooth = true) => {
    requestAnimationFrame(() => {
      threadEl.scrollTo({ top: threadEl.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    });
  };

  const paintThread = () => {
    const picker =
      thread.length === 0 && opening.moodPicker?.length
        ? `<div class="ai-mood" data-ai-mood>
             <p class="ai-mood__label">¿Cómo vienes?</p>
             <div class="ai-mood__grid">
               ${opening.moodPicker
                 .map(
                   (m) =>
                     `<button type="button" class="ai-mood__btn" data-ai-mood-pick="${escape(m.key)}">
                        <span aria-hidden="true">${m.emoji}</span>${escape(m.label)}
                      </button>`
                 )
                 .join("")}
             </div>
           </div>`
        : "";
    threadEl.innerHTML = thread.length
      ? thread.map(messageNode).join("")
      : messageNode({ role: "ai", text: opening.text, time: timeNow() }) + picker;
    scrollToEnd(false);
  };

  const paintContext = () => {
    const bits = readback(ctx);
    contextEl.hidden = bits.length === 0;
    contextListEl.innerHTML = bits
      .map((bit) => `<li class="ai__context-item">${escape(bit)}</li>`)
      .join("");
  };

  const paintSuggestions = (list = []) => {
    suggestEl.innerHTML = (list || [])
      .map(
        (text) =>
          `<button type="button" class="ai-sug" data-ai-sug>${escape(text)}</button>`
      )
      .join("");
    suggestEl.dataset.empty = list && list.length ? "false" : "true";
  };

  /* ---- Composer ---- */

  const autosize = () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(120, input.scrollHeight)}px`;
  };

  const syncSend = () => {
    sendBtn.disabled = input.value.trim().length === 0 || busy;
  };

  const setHint = (text) => {
    hintEl.textContent = text || "";
    hintEl.hidden = !text;
  };

  const isCoarse = () => window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  /* ---- Ciclo de respuesta ---- */

  const push = (message) => {
    thread.push({ ...message, time: timeNow() });
    if (thread.length > 40) thread = thread.slice(-40);
    save(THREAD_KEY, thread);
  };

  function respond(raw) {
    if (busy) return;
    const text = String(raw || "").trim();
    if (!text) return;

    busy = true;
    push({ role: "user", text });
    threadEl.innerHTML = thread.map(messageNode).join("") + pendingNode();
    scrollToEnd();
    paintSuggestions([]);
    input.value = "";
    autosize();
    sendBtn.disabled = true;

    const signals = readIntent(text);
    ctx = mergeContext(ctx, signals);
    save(CONTEXT_KEY, ctx);
    paintContext();

    const probe = missingData(ctx, signals);
    const ranking = rankPlaces(ctx, { limit: 3 });
    const reply =
      quickAnswer(text) || composeReply(ctx, ranking, { probe, raw: text, seed: text.length });

    /* Latencia corta y deliberada: leer una respuesta de golpe se siente
       como un buscador, no como un asistente. */
    const delay = 520 + Math.min(900, text.length * 16);
    window.setTimeout(() => {
      push({ role: "ai", text: reply.text, chips: reply.chips });
      paintThread();
      paintSuggestions(reply.suggestions);
      busy = false;
      syncSend();
    }, delay);
  }

  /* ---- Listeners ---- */

  const MOOD_ASK = {
    triste: "Ando con el día pesado, me siento triste",
    estres: "Traigo mucho estrés",
    aburrido: "Estoy aburrido, no hay nada que hacer",
    activar: "Quiero activarme un poco",
    cruda: "Ando con cruda",
    feliz: "Estoy feliz, quiero celebrar",
  };

  const onMoodPick = (event) => {
    const btn = event.target.closest("[data-ai-mood-pick]");
    if (!btn) return;
    respond(MOOD_ASK[btn.dataset.aiMoodPick] || "Estoy aburrido");
  };

  const onInput = () => {
    autosize();
    syncSend();
  };

  const onKeydown = (event) => {
    /* En móvil el Enter es salto de línea; se envía con el botón.
       En teclado físico, Enter envía y Shift+Enter salta. */
    if (event.key === "Enter" && !event.shiftKey && !isCoarse()) {
      event.preventDefault();
      form.requestSubmit();
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    respond(input.value);
  };

  const onSuggestClick = (event) => {
    const button = event.target.closest("[data-ai-sug]");
    if (!button) return;
    const text = button.textContent.trim();

    /* "Abrir Comida" / "Ver Comercios" navegan; el resto es una pregunta */
    const open = text.match(/^(?:abr(?:e|ir)|ver)\s+(.+)$/i);
    if (open && navigate) {
      const target = resolveCategory(open[1]);
      if (target) {
        navigate(target);
        return;
      }
    }
    if (/^necesito un mototaxi$/i.test(text)) {
      navigate?.("mototaxis");
      return;
    }
    respond(text);
  };

  const onHeadClick = (event) => {
    if (event.target.closest("[data-ai-close]")) {
      back?.();
      return;
    }
    if (event.target.closest("[data-ai-new]")) {
      thread = [];
      ctx = {};
      save(THREAD_KEY, thread);
      save(CONTEXT_KEY, ctx);
      paintThread();
      paintContext();
      paintSuggestions(opening.suggestions);
      setHint("");
    }
  };

  const onMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognition) {
      try {
        recognition.stop();
      } catch {
        /* ya terminó */
      }
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "es-MX";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalText = "";

    recognition.onstart = () => {
      micBtn.dataset.listening = "true";
      micBtn.setAttribute("aria-pressed", "true");
      ai.dataset.listening = "true";
      setHint("Te escucho… habla normal.");
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
        else interim += chunk;
      }
      input.value = (finalText + interim).trim();
      autosize();
      syncSend();
    };

    recognition.onerror = (event) => {
      const message =
        event.error === "not-allowed"
          ? "No tengo permiso del micrófono. Actívalo en el navegador."
          : event.error === "no-speech"
            ? "No te escuché. Intenta otra vez."
            : "No pude usar el micrófono. Mejor escribe.";
      setHint(message);
    };

    recognition.onend = () => {
      recognition = null;
      micBtn.dataset.listening = "false";
      micBtn.setAttribute("aria-pressed", "false");
      ai.dataset.listening = "false";
      setHint("");
      if (input.value.trim()) respond(input.value);
    };

    try {
      recognition.start();
    } catch {
      recognition = null;
      setHint("El micrófono no está disponible ahora.");
    }
  };

  const onKey = (event) => {
    if (event.key !== "Escape") return;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        /* ya terminó */
      }
      return;
    }
    back?.();
  };

  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onKeydown);
  form.addEventListener("submit", onSubmit);
  suggestEl.addEventListener("click", onSuggestClick);
  ai.addEventListener("click", onMoodPick);
  headEl.addEventListener("click", onHeadClick);
  micBtn.addEventListener("click", onMic);
  window.addEventListener("keydown", onKey);

  /* Sin API de voz se oculta el botón: mejor no ofrecer algo que no jala */
  if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) micBtn.hidden = true;

  /* Autofoco solo con puntero fino: en móvil no se abre el teclado solo */
  if (!isCoarse()) input.focus({ preventScroll: true });

  paintThread();
  paintContext();
  paintSuggestions(thread.length ? ["Algo más barato", "Algo más ligero", "Abrir Comida"] : opening.suggestions);
  autosize();
  syncSend();

  return () => {
    if (recognition) {
      try {
        recognition.abort();
      } catch {
        /* ya terminó */
      }
    }
    window.removeEventListener("keydown", onKey);
    input.removeEventListener("input", onInput);
    input.removeEventListener("keydown", onKeydown);
    form.removeEventListener("submit", onSubmit);
    suggestEl.removeEventListener("click", onSuggestClick);
    headEl.removeEventListener("click", onHeadClick);
    micBtn.removeEventListener("click", onMic);
  };
}
