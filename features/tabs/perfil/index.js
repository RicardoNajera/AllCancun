/**
 * All Cancún — Perfil · Vista
 * Contrato estándar de features (ver features/shared/shell.js).
 *
 * Patrón Uber/Didi: panel de identidad + filas que abren un editor.
 * Nada de formularios sueltos en la pantalla principal: se edita un
 * dato a la vez, con guardado explícito. Menos ruido, menos errores.
 *
 * Login social con Supabase (Google), sesión persistente y edición de
 * public.perfiles (apodo y nombre completo). La anon key vive en
 * config.js; RLS decide a qué fila puede llegar el usuario.
 */

import { escape } from "../../shared/ui.js";
import { content } from "./content.js";
import {
  PROVIDERS,
  isConfigured,
  getSession,
  onAuthChange,
  signInWithProvider,
  signOut,
  ensureProfile,
  updateProfile,
  normalizarApodo,
  apodoValido,
} from "../../shared/supabase.js";

/* Logo de Google (inline para no depender de red) */
const googleLogo = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2.1 3.7-5.1 3.7-8.6z"/>
  <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.8-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5l-.1.1-3.6 2.8-.1.1C3.4 21.3 7.4 24 12 24z"/>
  <path fill="#FBBC05" d="M5.3 14.4c-.3-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4V9.5L1.5 6.7l-.1.1C.5 8.4 0 10.1 0 12s.5 3.6 1.4 5.2l3.9-2.8z"/>
  <path fill="#EA4335" d="M12 4.7c2.2 0 3.7.9 4.5 1.7l3.3-3.2C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.7l3.9 2.9c.9-2.9 3.6-4.9 6.7-4.9z"/>
</svg>`;

/* Iconos — trazo 1.7, heredan color del contexto */
const ico = {
  user: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="3.6"/><path d="M4.8 20.4c0-3.6 3.2-5.8 7.2-5.8s7.2 2.2 7.2 5.8"/></svg>`,
  signature: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3.5 17.2c2.4 0 3.1-4.6 4.6-8.6.9-2.4 2-3.2 2.9-2.2 1 1.1-.8 5.2-.2 6.6.6 1.4 2 .5 2.9-.5"/>
    <path d="M14 12.6c1.6-1.6 3.4-2.1 4 .1.5 1.9-2.1 4.3-.4 4.6 1.2.2 2.4-.9 3-1.7"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
    stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m9.5 6 6 6-6 6"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M15 17l5-5-5-5"/><path d="M20 12H9"/>
    <path d="M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"/></svg>`,
  close: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    stroke-width="2.1" stroke-linecap="round" aria-hidden="true">
    <path d="m6 6 12 12M18 6 6 18"/></svg>`,
  bag: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M4.5 8h15l-1.1 11.2a1.6 1.6 0 0 1-1.6 1.4H7.2a1.6 1.6 0 0 1-1.6-1.4Z"/>
    <path d="M8.8 8V6.2a3.2 3.2 0 0 1 6.4 0V8"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 21s6.6-6 6.6-11A6.6 6.6 0 0 0 5.4 10c0 5 6.6 11 6.6 11Z"/>
    <circle cx="12" cy="10" r="2.4"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 3c0 5-7.5 9.6-7.5 9.6Z"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M13.4 2.5 5 13.6h5.4L9.9 21.5 18.5 10h-5.6Z"/></svg>`,
};

const ROW_ICONS = { apodo: ico.user, nombre_completo: ico.signature };

/* Vista previa del avatar: foto si existe, inicial si no */
function avatarMarkup(profile, fallback) {
  const url = profile?.foto_perfil_url;
  if (url) {
    return `<img class="pf-avatar__img" src="${escape(url)}" alt=""
      referrerpolicy="no-referrer" onerror="this.remove()" />`;
  }
  const initial = (profile?.apodo || fallback || "?").trim().charAt(0).toUpperCase();
  return `<span class="pf-avatar__initial">${escape(initial)}</span>`;
}


export default {
  id: "perfil",
  accent: "mujeres",
  styleBase: "features/shared/feature-view.css",
  styles: "features/tabs/perfil/view.css",

  render() {
    const configured = isConfigured();

    /* Filas del panel: el valor lo rellena renderProfile() */
    const rows = content.rows
      .map(
        (row) => `
      <button type="button" class="pf-row" data-pf-row="${row.id}"
              aria-label="Editar ${escape(row.label)}">
        <span class="pf-row__ico" aria-hidden="true">${ROW_ICONS[row.id] || ico.user}</span>
        <span class="pf-row__text">
          <span class="pf-row__label">${escape(row.label)}</span>
          <span class="pf-row__value" data-pf-value="${row.id}">—</span>
        </span>
        <span class="pf-row__chev" aria-hidden="true">${ico.chevron}</span>
      </button>`
      )
      .join("");

    const html = `
      <div class="tv-body pf-root">

        <!-- Invitado -->
        <div class="pf-guest" data-pf="guest" ${configured ? "" : "hidden"}>
          <span class="pf-guest__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
                 stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>
            </svg>
          </span>

          <h2 class="pf-guest__title">${escape(content.loginTitle)}</h2>
          <p class="pf-guest__lead">${escape(content.loginLead)}</p>

          <div class="pf-providers">
            ${PROVIDERS.map(
              (p) => `
              <button type="button" class="pf-provider" data-pf-provider="${p.id}"
                      aria-label="Continuar con ${escape(p.label)}">
                <span class="pf-provider__icon" aria-hidden="true">${googleLogo}</span>
                <span>${escape(content.loginCta)}</span>
              </button>`
            ).join("")}
          </div>

          <p class="pf-guest__error" data-pf-error role="alert" hidden></p>

          <!-- Lo que desbloquea la cuenta -->
          <div class="pf-perks">
            <p class="pf-perks__label">${escape(content.perksTitle)}</p>
            <div class="pf-perks__grid">
              ${content.perks
                .map(
                  (perk, i) => `
              <div class="pf-perk pf-perk--${escape(perk.icon)}" style="--pf-perk-i:${i}">
                <span class="pf-perk__ico" aria-hidden="true">${ico[perk.icon] || ico.user}</span>
                <span class="pf-perk__title">${escape(perk.title)}</span>
                <span class="pf-perk__hint">${escape(perk.hint)}</span>
              </div>`
                )
                .join("")}
            </div>
          </div>

          <p class="pf-guest__legal">${escape(content.loginLegal)}</p>
        </div>

        <!-- Cuenta activa -->
        <div class="pf-account" data-pf="account" hidden>

          <header class="pf-id">
            <span class="pf-avatar" data-pf-avatar-slot></span>
            <div class="pf-id__text">
              <h2 class="pf-id__apodo" data-pf-apodo>—</h2>
              <p class="pf-id__mail" data-pf-email></p>
            </div>
          </header>

          <p class="pf-section">${escape(content.accountSectionLabel)}</p>
          <div class="pf-list">${rows}</div>

          <p class="pf-account__status" data-pf-status role="status" hidden></p>

          <button type="button" class="pf-signout" data-pf-signout>
            <span class="pf-signout__ico" aria-hidden="true">${ico.logout}</span>
            <span data-pf-signout-label>Cerrar sesión</span>
          </button>
        </div>

        <!-- Cargando -->
        <div class="pf-loading" data-pf="loading" ${configured ? "" : "hidden"}>
          <span class="pf-loading__dot"></span>Comprobando tu sesión…
        </div>

        <!-- Falta configurar -->
        <div class="pf-setup" data-pf="setup" ${configured ? "hidden" : ""}>
          <p class="pf-setup__title">Falta conectar Supabase</p>
          <p class="pf-setup__text">
            Añade <code>ALL_CANCUN_SUPABASE_URL</code> y
            <code>ALL_CANCUN_SUPABASE_ANON_KEY</code> en <code>config.js</code>.
          </p>
        </div>

        <!-- Editor (sheet) -->
        <div class="pf-sheet" data-pf-sheet hidden>
          <div class="pf-sheet__veil" data-pf-sheet-close></div>
          <div class="pf-sheet__panel" role="dialog" aria-modal="true"
               aria-labelledby="pf-sheet-title">
            <div class="pf-sheet__grip" aria-hidden="true"></div>
            <div class="pf-sheet__head">
              <h3 class="pf-sheet__title" id="pf-sheet-title"></h3>
              <button type="button" class="pf-sheet__x" data-pf-sheet-close
                      aria-label="Cerrar">${ico.close}</button>
            </div>
            <label class="pf-sheet__field">
              <span class="pf-sheet__label" data-pf-sheet-label></span>
              <input class="pf-sheet__input" type="text" data-pf-sheet-input
                     autocomplete="off" spellcheck="false" autocapitalize="none" />
            </label>
            <p class="pf-sheet__msg" data-pf-sheet-msg role="status" hidden></p>
            <button type="button" class="pf-sheet__save" data-pf-sheet-save>
              <span data-pf-sheet-save-label>Guardar</span>
            </button>
          </div>
        </div>

      </div>
    `;

    return { html, onMount: (root) => mountLogin(root) };
  },
};


/* ------------------------------------------------------------------ */
/* Lógica: sesión, OAuth y edición por filas                           */
/* ------------------------------------------------------------------ */

const FIELD_META = {
  apodo: {
    title: "Apodo público",
    label: "Cómo te ven los demás",
    placeholder: "tu apodo",
    maxlength: 32,
  },
  nombre_completo: {
    title: "Nombre completo",
    label: "Solo lo ves tú",
    placeholder: "Tu nombre",
    maxlength: 80,
  },
};

function mountLogin(root) {
  if (!root) return;

  /* El perfil tiene poca información: no debe deslizarse.
     Marcamos el scroller de la app para que el CSS lo sepa. */
  const scroller = document.getElementById("app-screen");
  if (scroller) scroller.classList.add("is-no-scroll");

  const $ = (sel) => root.querySelector(sel);

  const panels = {
    guest: $('[data-pf="guest"]'),
    account: $('[data-pf="account"]'),
    loading: $('[data-pf="loading"]'),
    setup: $('[data-pf="setup"]'),
  };

  const errorBox = $("[data-pf-error]");
  const statusBox = $("[data-pf-status]");
  const avatarSlot = $("[data-pf-avatar-slot]");
  const apodoLabel = $("[data-pf-apodo]");
  const emailLabel = $("[data-pf-email]");
  const signoutBtn = $("[data-pf-signout]");

  const sheet = $("[data-pf-sheet]");
  const sheetTitle = $(".pf-sheet__title");
  const sheetLabel = $("[data-pf-sheet-label]");
  const sheetInput = $("[data-pf-sheet-input]");
  const sheetMsg = $("[data-pf-sheet-msg]");
  const sheetSave = $("[data-pf-sheet-save]");
  const sheetSaveLabel = $("[data-pf-sheet-save-label]");

  let session = null;
  let profile = null;
  let disposed = false;
  let unsubscribe = () => {};
  let activeField = null;
  let lastFocus = null;
  let statusTimer = 0;

  function show(name) {
    Object.entries(panels).forEach(([key, el]) => {
      if (el) el.hidden = key !== name;
    });
  }

  function setMsg(el, message, tone = "error") {
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
    el.dataset.tone = tone;
  }

  function flashStatus(message) {
    setMsg(statusBox, message, "ok");
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      if (!disposed) setMsg(statusBox, null);
    }, 2600);
  }

  /* Pinta identidad y valores de las filas */
  function renderProfile() {
    const fallback = session?.user?.user_metadata?.name || session?.user?.email || "";
    if (avatarSlot) avatarSlot.innerHTML = avatarMarkup(profile, fallback);

    if (apodoLabel) apodoLabel.textContent = profile?.apodo || "Tu perfil";
    if (emailLabel) emailLabel.textContent = session?.user?.email || "";

    content.rows.forEach((row) => {
      const node = $(`[data-pf-value="${row.id}"]`);
      if (!node) return;
      const value = String(profile?.[row.id] ?? "").trim();
      node.textContent = value || "Sin definir";
      node.classList.toggle("is-empty", !value);
    });
  }

  /* ---------- Sheet: abrir / cerrar / guardar ---------- */

  function openSheet(field, { focus = true } = {}) {
    const meta = FIELD_META[field];
    if (!meta || !sheet) return;

    activeField = field;
    lastFocus = document.activeElement;

    if (sheetTitle) sheetTitle.textContent = meta.title;
    if (sheetLabel) sheetLabel.textContent = meta.label;
    if (sheetInput) {
      sheetInput.value = String(profile?.[field] ?? "");
      sheetInput.maxLength = meta.maxlength;
      sheetInput.placeholder = meta.placeholder;
      sheetInput.setAttribute("autocapitalize", field === "apodo" ? "none" : "words");
    }
    setMsg(sheetMsg, null);
    if (sheetSaveLabel) sheetSaveLabel.textContent = "Guardar";
    if (sheetSave) sheetSave.disabled = false;

    sheet.hidden = false;
    /* La clase entra en el siguiente frame: transición sin reflow forzado */
    const raf =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : (fn) => setTimeout(fn, 16);
    raf(() => sheet && sheet.classList.add("is-open"));

    if (focus && sheetInput) {
      sheetInput.focus();
      sheetInput.setSelectionRange(0, sheetInput.value.length);
    }
  }

  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove("is-open");
    activeField = null;

    const hide = () => {
      if (sheet) sheet.hidden = true;
    };
    sheet.addEventListener("transitionend", hide, { once: true });
    /* Red de seguridad si no hay transición (reduced-motion) */
    setTimeout(hide, 260);

    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    lastFocus = null;
  }

  async function saveField() {
    const field = activeField;
    if (!field || !session?.user?.id) return;

    const meta = FIELD_META[field];
    let value = sheetInput ? sheetInput.value.trim() : "";

    if (field === "apodo") {
      if (!value) {
        setMsg(sheetMsg, "El apodo es obligatorio: es tu identidad pública.");
        sheetInput?.focus();
        return;
      }
      /* Se guarda normalizado, igual que la base */
      value = normalizarApodo(value);
      if (!apodoValido(value)) {
        setMsg(
          sheetMsg,
          "3 a 32 caracteres: letras, números, punto, guion o guion bajo."
        );
        sheetInput?.focus();
        return;
      }
    }

    setMsg(sheetMsg, null);
    if (sheetSave) sheetSave.disabled = true;
    if (sheetSaveLabel) sheetSaveLabel.textContent = "Guardando…";

    const { profile: updated, error } = await updateProfile(session.user.id, {
      [field]: value,
    });

    if (disposed) return;
    if (sheetSave) sheetSave.disabled = false;
    if (sheetSaveLabel) sheetSaveLabel.textContent = "Guardar";

    if (error) {
      const dup = /duplicate|unique/i.test(error);
      setMsg(
        sheetMsg,
        dup ? "Ese apodo ya está en uso. Prueba con otro." : `No se pudo guardar: ${error}`
      );
      return;
    }

    if (updated) profile = updated;
    renderProfile();
    closeSheet();
    flashStatus(`${meta.title} actualizado.`);
  }

  /* Filas → abrir editor */
  root.querySelectorAll("[data-pf-row]").forEach((btn) => {
    btn.addEventListener("click", () => openSheet(btn.dataset.pfRow));
  });

  root.querySelectorAll("[data-pf-sheet-close]").forEach((el) => {
    el.addEventListener("click", closeSheet);
  });
  sheetSave?.addEventListener("click", saveField);

  sheetInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveField();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeSheet();
    }
  });

  /* ---------- Sesión ---------- */

  async function loadAccount(currentSession) {
    session = currentSession;
    const user = currentSession?.user;
    if (!user) {
      profile = null;
      show("guest");
      return;
    }

    const merged = await ensureProfile(user);
    if (disposed) return;
    profile = merged.profile;
    renderProfile();
    show("account");
    if (merged.error) setMsg(statusBox, `No se pudo leer tu perfil: ${merged.error}`);

    /* Sin apodo no hay identidad pública: se pide de inmediato */
    if (!profile?.apodo) openSheet("apodo");
  }

  function applySession(next, event) {
    if (disposed) return;
    const prevId = session?.user?.id;
    const nextId = next?.user?.id;

    if (!nextId) {
      session = null;
      profile = null;
      show("guest");
      return;
    }

    if (prevId !== nextId || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      loadAccount(next);
      return;
    }

    session = next;
    show("account");
  }

  /* ---------- OAuth ---------- */

  root.querySelectorAll("[data-pf-provider]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const provider = btn.dataset.pfProvider;
      setMsg(errorBox, null);
      btn.classList.add("is-busy");
      root.querySelectorAll("[data-pf-provider]").forEach((b) => (b.disabled = true));

      const { error } = await signInWithProvider(provider);
      if (error) {
        setMsg(errorBox, `No se pudo iniciar sesión con ${provider}: ${error}`);
        btn.classList.remove("is-busy");
        root.querySelectorAll("[data-pf-provider]").forEach((b) => (b.disabled = false));
      }
    });
  });

  /* ---------- Cerrar sesión (doble toque para confirmar) ---------- */

  let disarmTimer = 0;

  signoutBtn?.addEventListener("click", async () => {
    const label = signoutBtn.querySelector("[data-pf-signout-label]");
    if (signoutBtn.dataset.armed !== "1") {
      signoutBtn.dataset.armed = "1";
      signoutBtn.classList.add("is-armed");
      if (label) label.textContent = "Toca de nuevo para salir";
      clearTimeout(disarmTimer);
      disarmTimer = setTimeout(() => {
        if (!signoutBtn) return;
        delete signoutBtn.dataset.armed;
        signoutBtn.classList.remove("is-armed");
        if (label) label.textContent = "Cerrar sesión";
      }, 3000);
      return;
    }

    const { error } = await signOut();
    if (disposed) return;
    if (error) {
      setMsg(statusBox, `No se pudo cerrar sesión: ${error}`);
      return;
    }
    session = null;
    profile = null;
    show("guest");
  });

  /* ---------- Arranque ---------- */

  if (!isConfigured()) {
    show("setup");
    return;
  }

  show("loading");

  (async () => {
    const initial = await getSession();
    if (disposed) return;
    unsubscribe = await onAuthChange(applySession);
    await applySession(initial, "INITIAL_SESSION");
  })();

  return () => {
    disposed = true;
    clearTimeout(statusTimer);
    clearTimeout(disarmTimer);
    unsubscribe();
    if (session?.user?.id) session = null;
    /* Otras vistas vuelven a poder deslizarse */
    const scr = document.getElementById("app-screen");
    if (scr) scr.classList.remove("is-no-scroll");
  };
}

