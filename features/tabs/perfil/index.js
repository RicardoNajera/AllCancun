/**
 * All Cancún — Perfil · Vista
 * Contrato estándar de features (ver features/shared/shell.js).
 *
 * Login social con Supabase (Google), sesión persistente y edición de
 * public.perfiles (apodo y nombre completo). La anon key vive en
 * config.local.js; RLS decide a qué fila puede llegar el usuario.
 */

import { hero, escape } from "../../shared/ui.js";
import { content } from "./content.js";
import {
  PROVIDERS,
  isConfigured,
  getSession,
  onAuthChange,
  signInWithProvider,
  signOut,
  ensureProfile,
  getProfile,
  updateProfile,
} from "../../shared/supabase.js";

/* Logos de los proveedores (inline para no depender de red) */
const providerLogo = (id) => {
  if (id === "google") {
    return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2.1 3.7-5.1 3.7-8.6z"/>
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.8-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5l-.1.1-3.6 2.8-.1.1C3.4 21.3 7.4 24 12 24z"/>
      <path fill="#FBBC05" d="M5.3 14.4c-.3-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4V9.5L1.5 6.7l-.1.1C.5 8.4 0 10.1 0 12s.5 3.6 1.4 5.2l3.9-2.8z"/>
      <path fill="#EA4335" d="M12 4.7c2.2 0 3.7.9 4.5 1.7l3.3-3.2C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.7l3.9 2.9c.9-2.9 3.6-4.9 6.7-4.9z"/>
    </svg>`;
  }
  if (id === "apple") {
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.7c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.6-1.9-1.5-.1-2.9.9-3.6.9-.7 0-1.9-.9-3.1-.8-1.6 0-3 .9-3.9 2.4-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 3 2.3 1.2 0 1.7-.8 3.1-.8 1.4 0 1.9.8 3.1.8 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.6-.1 0-2.5-1-2.5-3.5zM14 5.4c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.09 24 18.1 24 12.07z"/>
  </svg>`;
};

/* Vista previa del avatar: foto si existe, inicial si no */
function avatarMarkup(profile, fallback) {
  const url = profile?.foto_perfil_url;
  if (url) {
    return `<img class="pf-avatar__img" src="${escape(url)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()" />`;
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

    const html = `
      ${hero({
        eyebrow: content.eyebrow,
        title: content.title,
        lead: content.lead,
        status: content.status,
      })}

      <div class="tv-body pf-root">
        <!-- Invitado: acceso con Google -->
        <div class="pf-auth" data-pf="guest" ${configured ? "" : "hidden"}>
          <div class="pf-auth__card">
            <div class="pf-auth__halo" aria-hidden="true"></div>
            <span class="pf-avatar pf-avatar--xl" data-pf-avatar aria-hidden="true">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor"
                   stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
              </svg>
            </span>

            <h2 class="pf-auth__title">${escape(content.loginTitle)}</h2>
            <p class="pf-auth__lead">${escape(content.loginLead)}</p>

            <div class="pf-providers">
              ${PROVIDERS.map(
                (p) => `
                <button type="button" class="pf-provider"
                        data-pf-provider="${p.id}" aria-label="Continuar con ${escape(p.label)}">
                  <span class="pf-provider__icon" aria-hidden="true">${providerLogo(p.id)}</span>
                  <span class="pf-provider__label">Continuar con ${escape(p.label)}</span>
                </button>`
              ).join("")}
            </div>

            <p class="pf-auth__error" data-pf-error role="alert" hidden></p>
            <p class="pf-auth__legal">${escape(content.loginLegal)}</p>
          </div>
        </div>

        <!-- Sesión activa -->
        <div class="pf-account" data-pf="account" hidden>
          <header class="pf-hero">
            <div class="pf-hero__glow" aria-hidden="true"></div>
            <span class="pf-avatar pf-avatar--xl" data-pf-avatar-slot></span>
            <h2 class="pf-hero__apodo" data-pf-apodo>—</h2>
            <p class="pf-hero__mail" data-pf-email></p>
            <span class="pf-chip" data-pf-rol hidden></span>
          </header>

          <form class="pf-form" data-pf-form novalidate>
            <div class="pf-card">
              <label class="pf-field">
                <span class="pf-field__label">Apodo público</span>
                <div class="pf-field__box">
                  <span class="pf-field__at" aria-hidden="true">@</span>
                  <input class="pf-field__input" type="text" name="apodo" maxlength="32"
                         autocomplete="nickname" spellcheck="false" placeholder="tu apodo" />
                </div>
                <span class="pf-field__hint">Así te ven los demás. Tu nombre real no se muestra.</span>
              </label>

              <label class="pf-field">
                <span class="pf-field__label">Nombre completo</span>
                <input class="pf-field__input pf-field__input--plain" type="text"
                       name="nombre_completo" maxlength="80"
                       autocomplete="name" placeholder="Solo lo ves tú" />
                <span class="pf-field__hint">Privado. Nunca aparece en la app.</span>
              </label>
            </div>

            <p class="pf-form__status" data-pf-status role="status" hidden></p>

            <button type="submit" class="pf-save" data-pf-save>
              <span data-pf-save-label>Guardar cambios</span>
            </button>
          </form>

          <button type="button" class="pf-signout" data-pf-signout>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
                 stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
              <path d="M15 17l5-5-5-5" /><path d="M20 12H9" />
              <path d="M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" />
            </svg>
            Cerrar sesión
          </button>
        </div>

        <!-- Cargando sesión -->
        <div class="pf-loading" data-pf="loading" ${configured ? "" : "hidden"}>
          <span class="pf-loading__dot"></span>Comprobando tu sesión…
        </div>

        <!-- Falta configurar Supabase -->
        <div class="pf-setup" data-pf="setup" ${configured ? "hidden" : ""}>
          <p class="pf-setup__title">Falta conectar Supabase</p>
          <p class="pf-setup__text">
            Añade <code>ALL_CANCUN_SUPABASE_URL</code> y
            <code>ALL_CANCUN_SUPABASE_ANON_KEY</code> en <code>config.local.js</code>.
          </p>
        </div>

      </div>
    `;

    return { html, onMount: (root) => mountLogin(root) };
  },
};

/* ------------------------------------------------------------------ */
/* Lógica de la vista: sesión, OAuth y edición del perfil              */
/* ------------------------------------------------------------------ */

function mountLogin(root) {
  if (!root) return;

  const $ = (sel) => root.querySelector(sel);
  const panels = {
    guest: $('[data-pf="guest"]'),
    account: $('[data-pf="account"]'),
    loading: $('[data-pf="loading"]'),
    setup: $('[data-pf="setup"]'),
  };

  const form = $("[data-pf-form]");
  const errorBox = $("[data-pf-error]");
  const statusBox = $("[data-pf-status]");
  const avatarSlot = $("[data-pf-avatar-slot]");
  const apodoLabel = $("[data-pf-apodo]");
  const emailLabel = $("[data-pf-email]");
  const rolBadge = $("[data-pf-rol]");
  const saveBtn = $("[data-pf-save]");
  const saveLabel = $("[data-pf-save-label]");

  let session = null;
  let profile = null;
  let disposed = false;
  let unsubscribe = () => {};

  /* Muestra el panel activo y oculta el resto */
  function show(name) {
    Object.entries(panels).forEach(([key, el]) => {
      if (el) el.hidden = key !== name;
    });
  }

  function setError(el, message) {
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
  }

  function setStatus(message, tone = "ok") {
    if (!statusBox) return;
    statusBox.textContent = message || "";
    statusBox.hidden = !message;
    statusBox.dataset.tone = tone;
  }

  /* Pinta el perfil en la cabecera y en el formulario */
  function renderProfile() {
    const fallback = session?.user?.user_metadata?.name || session?.user?.email || "";
    if (avatarSlot) avatarSlot.innerHTML = avatarMarkup(profile, fallback);

    if (apodoLabel) apodoLabel.textContent = profile?.apodo || "Sin apodo";
    if (emailLabel) emailLabel.textContent = session?.user?.email || "";
    if (rolBadge) {
      rolBadge.textContent = profile?.rol || "";
      rolBadge.hidden = !profile?.rol;
    }

    if (form) {
      form.elements.apodo.value = profile?.apodo || "";
      form.elements.nombre_completo.value = profile?.nombre_completo || "";
    }
  }

  /* Carga (o crea) el perfil del usuario y muestra la cuenta */
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
    if (merged.error) setStatus(`No se pudo leer tu perfil: ${merged.error}`, "error");

    /* Sin apodo guardado se pide al entrar: es la identidad pública y anónima
       que relaciona al usuario con el resto de tablas. */
    if (!profile?.apodo) promptApodo();
  }

  /* Pide el apodo y lo guarda en public.perfiles (UPDATE por id) */
  function promptApodo() {
    const input = form?.elements.apodo;
    if (!input) return;
    setStatus("Elige tu apodo: será tu identidad pública y anónima.", "ok");
    input.value = "";
    input.focus();
    input.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  /* Aplica una sesión nueva; si el usuario cambió, recarga el perfil */
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

  /* --- OAuth --- */
  root.querySelectorAll("[data-pf-provider]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const provider = btn.dataset.pfProvider;
      setError(errorBox, null);
      btn.classList.add("is-busy");
      root.querySelectorAll("[data-pf-provider]").forEach((b) => (b.disabled = true));

      const { error } = await signInWithProvider(provider);
      if (error) {
        setError(errorBox, `No se pudo iniciar sesión con ${provider}: ${error}`);
        btn.classList.remove("is-busy");
        root.querySelectorAll("[data-pf-provider]").forEach((b) => (b.disabled = false));
      }
      /* Sin error el navegador ya va al proveedor */
    });
  });

  /* --- Guardar perfil --- */
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!session?.user?.id) return;

    const apodo = form.elements.apodo.value.trim();

    /* El apodo es la identidad relacional: se exige antes de guardar */
    if (!apodo) {
      setStatus("El apodo es obligatorio: es tu identidad pública.", "error");
      form.elements.apodo.focus();
      return;
    }
    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(apodo)) {
      setStatus("El apodo debe tener 3 a 32 caracteres: letras, números, punto, guion o guion bajo.", "error");
      form.elements.apodo.focus();
      return;
    }

    setStatus(null);
    saveBtn.disabled = true;
    if (saveLabel) saveLabel.textContent = "Guardando…";

    const { profile: updated, error } = await updateProfile(session.user.id, {
      apodo,
      nombre_completo: form.elements.nombre_completo.value,
    });

    if (disposed) return;
    saveBtn.disabled = false;
    if (saveLabel) saveLabel.textContent = "Guardar cambios";

    if (error) {
      const dup = /duplicate|unique/i.test(error);
      setStatus(
        dup ? "Ese apodo ya está en uso. Prueba con otro." : `No se pudo guardar: ${error}`,
        "error"
      );
      return;
    }

    if (updated) profile = updated;
    renderProfile();
    setStatus("Perfil actualizado.", "ok");
  });

  /* --- Cerrar sesión --- */
  $("[data-pf-signout]")?.addEventListener("click", async () => {
    const { error } = await signOut();
    if (disposed) return;
    if (error) {
      setStatus(`No se pudo cerrar sesión: ${error}`, "error");
      return;
    }
    session = null;
    profile = null;
    show("guest");
  });

  /* --- Arranque: getSession + onAuthStateChange --- */
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

  /* Limpieza al salir de la vista */
  return () => {
    disposed = true;
    unsubscribe();
    if (session?.user?.id) {
      /* Al volver a entrar el perfil se relee desde Supabase */
      session = null;
    }
  };
}


