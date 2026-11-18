/**
 * All Cancún — Mototaxis · Interfaz de pedido tipo Uber
 * Todo exclusivo de esta carpeta: mapa, servicio, destino, tarifa y conductor.
 */

import { content } from "./content.js";
import {
  CANCUN,
  STYLE_URL,
  loadMapLibre,
  getToken,
  saveToken,
  searchPlaces,
  fetchRoute,
  formatDistance,
  formatDuration,
} from "./map.js";

const motoIcon = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="5" cy="17" r="3" />
    <circle cx="19" cy="17" r="3" />
    <path d="M8 17h6l2-5h-3" />
    <path d="M14 12V8h3" />
    <path d="M11 12 9 8H6" />
  </svg>`;

const pinIcon = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>`;

/* Iconos por categoría de lugar: la lista se lee de un vistazo,
 * como en Google Maps (parque, tienda, comida, salud, playa…). */
const CATEGORY_ICONS = {
  park: `<path d="M12 21v-6" /><path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" /><path d="M8.5 18h7" />`,
  store: `<path d="M4 9h16l-1.2 10.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8z" /><path d="M9 9V6.5a3 3 0 0 1 6 0V9" />`,
  food: `<path d="M6 3v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3" /><path d="M8 13v8" /><path d="M17 3c-1.7 1.5-2.5 3.5-2.5 6s.8 3 2.5 3v9" />`,
  health: `<path d="M12 21s-7.5-4.7-7.5-10.2A4.3 4.3 0 0 1 12 7.8a4.3 4.3 0 0 1 7.5 3c0 5.5-7.5 10.2-7.5 10.2z" />`,
  beach: `<path d="M3 18h18" /><path d="M12 18V9" /><path d="M12 9a5 5 0 0 1 9 2" /><path d="M12 9H4" /><circle cx="6.5" cy="6" r="2" />`,
  fuel: `<path d="M5 21V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v16" /><path d="M3 21h12" /><path d="M13 9h2.5a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V9l-2-2" />`,
  bank: `<path d="M3 10h18" /><path d="M5 10v9" /><path d="M9.5 10v9" /><path d="M14.5 10v9" /><path d="M19 10v9" /><path d="M3 21h18" /><path d="M12 3l9 7H3z" />`,
  hotel: `<path d="M3 20V8h7v12" /><path d="M10 12h7a4 4 0 0 1 4 4v4" /><path d="M3 20h18" /><circle cx="6.5" cy="5.5" r="1.8" />`,
  address: `<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" />`,
};

/* Elige el icono a partir del `maki` de Mapbox y del tipo/nombre del lugar */
function categoryIcon(place) {
  const maki = String(place.maki || "").toLowerCase();
  const name = String(place.name || "").toLowerCase();
  const type = String(place.placeType || "");

  if (maki) {
    if (/park|garden|playground/.test(maki)) return "park";
    if (/grocery|shop|store|convenience|mall|supermarket/.test(maki)) return "store";
    if (/restaurant|cafe|bar|fast|food|bakery|pizza/.test(maki)) return "food";
    if (/hospital|doctor|pharmacy|medical|dentist/.test(maki)) return "health";
    if (/beach|swimming/.test(maki)) return "beach";
    if (/fuel|gas/.test(maki)) return "fuel";
    if (/bank|atm/.test(maki)) return "bank";
    if (/lodging|hotel/.test(maki)) return "hotel";
  }
  if (/parque|jard[ií]n|plaza|glorieta/.test(name)) return "park";
  if (/oxxo|walmart|soriana|chedraui|comer|costco|super|tienda|mercado/.test(name)) return "store";
  if (/taco|pizza|caf|restaur|bar|comida|marquesita|antojito/.test(name)) return "food";
  if (/farmacia|hospital|cl[ií]nica|consultorio|dental/.test(name)) return "health";
  if (/playa|malec[oó]n/.test(name)) return "beach";
  if (/gasolina|pemex|gas/.test(name)) return "fuel";
  if (/banco|banorte|bbva|santander|hsbc/.test(name)) return "bank";
  if (/hotel|hostal|suites/.test(name)) return "hotel";
  if (type === "poi") return "store";
  return "address";
}

/* Marcador kawaii: gatito con mejillas rosadas dentro de un pin */
const kawaiiPinIcon = `
  <svg viewBox="0 0 44 56" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="mt-kawaii-body" x1="8" y1="4" x2="36" y2="52" gradientUnits="userSpaceOnUse">
        <stop stop-color="#fff6fa" />
        <stop offset="1" stop-color="#ffe0ee" />
      </linearGradient>
      <linearGradient id="mt-kawaii-face" x1="10" y1="10" x2="34" y2="38" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffd1e3" />
        <stop offset="1" stop-color="#ffb3d1" />
      </linearGradient>
    </defs>

    <!-- cuerpo del pin -->
    <path d="M22 53.5c0 0 15.5-12.4 15.5-24.2C37.5 18.9 30.6 12 22 12S6.5 18.9 6.5 29.3C6.5 41.1 22 53.5 22 53.5z"
          fill="url(#mt-kawaii-body)" stroke="#ff8ec0" stroke-width="1.6" />

    <!-- carita -->
    <ellipse cx="22" cy="28" rx="11.5" ry="10.5" fill="url(#mt-kawaii-face)" />

    <!-- orejas -->
    <path d="M13.4 21.6l-1.9-6.4 6.1 2.6z" fill="#ffb3d1" stroke="#ff8ec0"
          stroke-width="1.3" stroke-linejoin="round" />
    <path d="M30.6 21.6l1.9-6.4-6.1 2.6z" fill="#ffb3d1" stroke="#ff8ec0"
          stroke-width="1.3" stroke-linejoin="round" />

    <!-- ojos -->
    <ellipse cx="17.9" cy="27.4" rx="1.75" ry="2.15" fill="#4a2b3a" />
    <ellipse cx="26.1" cy="27.4" rx="1.75" ry="2.15" fill="#4a2b3a" />
    <circle cx="18.5" cy="26.6" r="0.62" fill="#fff" />
    <circle cx="26.7" cy="26.6" r="0.62" fill="#fff" />

    <!-- mejillas -->
    <ellipse cx="15.1" cy="30.6" rx="2.1" ry="1.25" fill="#ff7aab" opacity="0.55" />
    <ellipse cx="28.9" cy="30.6" rx="2.1" ry="1.25" fill="#ff7aab" opacity="0.55" />

    <!-- boquita :3 -->
    <path d="M19.9 30.9q2.1 1.85 4.2 0" stroke="#4a2b3a" stroke-width="1.15"
          stroke-linecap="round" fill="none" />

    <!-- bigotes -->
    <path d="M12.6 26.2h-3M12.9 28.9l-2.9.7M31.4 26.2h3M31.1 28.9l2.9.7"
          stroke="#ff8ec0" stroke-width="0.95" stroke-linecap="round" opacity="0.75" />
  </svg>`;

/* Marcador de mototaxi: vista de frente, para que se lea a cualquier ángulo */
const riderPinIcon = `
  <svg viewBox="0 0 44 44" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="mt-rider-bg" x1="6" y1="4" x2="38" y2="42" gradientUnits="userSpaceOnUse">
        <stop stop-color="#1b2431" />
        <stop offset="1" stop-color="#0d1218" />
      </linearGradient>
    </defs>
    <circle cx="22" cy="22" r="19" fill="url(#mt-rider-bg)" stroke="#64d2ff" stroke-width="2" />

    <g stroke="#64d2ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <circle cx="13" cy="30" r="4.2" />
      <circle cx="31" cy="30" r="4.2" />
      <path d="M17 30h5l2.5-6h-3.5" />
      <path d="M24.5 24v-3.6h3.2" />
      <path d="M21.5 24 19 20.4h-3.4" />
      <path d="M26.5 16.5h4.2" />
    </g>
    <circle cx="27" cy="16.5" r="2.1" fill="#64d2ff" opacity="0.85" />
  </svg>`;

const services = [
  {
    id: "moto",
    name: "Moto Taxi",
    desc: "Casco incluido",
    eta: "3 min",
    price: "$35",
    icon: motoIcon,
    popular: true,
  },
  {
    id: "moto-envio",
    name: "Moto Envío",
    desc: "Paquetes y mandados",
    eta: "4 min",
    price: "$45",
    icon: motoIcon,
  },
];

export default {
  id: "mototaxis",
  accent: "viajes",
  styles: "features/mototaxis/view.css",
  content,

  render({ category }) {
    const html = `
      <div class="fv-body mt-body mt-app">
        <section class="mt-map" aria-label="Mapa de la zona">
          <div class="mt-map__canvas" id="mt-map-canvas" role="application"
               aria-label="Mapa interactivo de Cancún"></div>

          <div class="mt-map__fallback" data-map-fallback hidden>
            <svg class="mt-map__fallback-icon" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
                 stroke-linejoin="round" aria-hidden="true">
              <path d="M9 20l-5.5 2V6L9 4l6 2 5.5-2v16L15 22l-6-2z" />
              <path d="M9 4v16M15 6v16" />
            </svg>
            <p class="mt-map__fallback-text" data-map-fallback-text>Cargando mapa…</p>
            <button type="button" class="mt-map__fallback-btn" data-action="reload">
              Reintentar
            </button>
          </div>

          <button type="button" class="mt-fab mt-fab--back" data-action="back"
                  aria-label="Volver al inicio">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button type="button" class="mt-fab mt-fab--locate" data-action="locate"
                  aria-label="Centrar en mi ubicación">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21" />
              <circle cx="12" cy="12" r="7.6" />
            </svg>
          </button>
        </section>

        <section class="mt-sheet">
          <span class="mt-sheet__grab" aria-hidden="true"></span>

          <h1 class="mt-sheet__title">¿A dónde vamos?</h1>

          <div class="mt-search">
            <span class="mt-search__icon" aria-hidden="true">${pinIcon}</span>
            <input class="mt-search__input" type="text" inputmode="search"
                   placeholder="Busca tu destino"
                   aria-label="Destino" autocomplete="off"
                   data-search-input />
            <span class="mt-search__spinner" data-search-spinner hidden aria-hidden="true"></span>
          </div>

          <p class="mt-error" data-error hidden></p>

          <ul class="mt-results" data-results hidden></ul>

          <ul class="mt-quick" aria-label="Destinos frecuentes" data-quick hidden></ul>

          <div class="mt-trip" data-trip hidden>
            <div class="mt-trip__metric">
              <span class="mt-trip__label">Distancia</span>
              <strong data-trip-distance>—</strong>
            </div>
            <div class="mt-trip__metric">
              <span class="mt-trip__label">Tiempo</span>
              <strong data-trip-duration>—</strong>
            </div>
            <div class="mt-trip__metric">
              <span class="mt-trip__label">Mototaxi</span>
              <strong data-trip-eta>—</strong>
            </div>
          </div>

          <h2 class="mt-sheet__sub">Elige tu mototaxi</h2>

          <ul class="mt-services">
            ${services
              .map(
                (s) => `
              <li>
                <button type="button" class="mt-service${s.popular ? " is-active" : ""}"
                        data-service="${s.id}"
                        aria-pressed="${s.popular ? "true" : "false"}">
                  <span class="mt-service__icon" aria-hidden="true">${s.icon}</span>
                  <span class="mt-service__body">
                    <span class="mt-service__name">${s.name}${
                      s.popular ? `<em class="mt-service__tag">Más pedido</em>` : ""
                    }</span>
                    <span class="mt-service__desc">${s.desc}</span>
                    <span class="mt-service__eta">Llega en ${s.eta}</span>
                  </span>
                  <span class="mt-service__price">${s.price}</span>
                </button>
              </li>`
              )
              .join("")}
          </ul>

          <div class="mt-pay" data-pay>
            <span class="mt-pay__label">Forma de pago</span>
            <button type="button" class="mt-pay__select" data-pay-toggle
                    aria-haspopup="dialog" aria-expanded="false" data-pay-btn>
              <span class="mt-pay__icon" data-pay-icon aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1" />
                  <rect x="3" y="7.5" width="18" height="11.5" rx="2.5" />
                  <path d="M16.5 13.2h.01" />
                </svg>
              </span>
              <span class="mt-pay__value" data-pay-value>Elige cómo pagar</span>
              <span class="mt-pay__change">Elegir</span>
            </button>

            <div class="mt-pay__options" data-pay-options hidden>
              <p class="mt-pay__question">¿Cómo vas a pagar tu mototaxi?</p>
              <button type="button" class="mt-pay__option" data-pay-method="efectivo"
                      aria-pressed="false">
                <span class="mt-pay__option-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                       stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2.6" />
                    <path d="M6 12h.01M18 12h.01" />
                  </svg>
                </span>
                <span class="mt-pay__option-body">
                  <span class="mt-pay__option-name">Efectivo</span>
                  <span class="mt-pay__option-desc">Pagas al conductor al bajar</span>
                </span>
                <span class="mt-pay__tick" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
                       stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
              </button>
              <button type="button" class="mt-pay__option" data-pay-method="tarjeta"
                      aria-pressed="false">
                <span class="mt-pay__option-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                       stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2.5" />
                    <path d="M2 10h20" />
                    <path d="M6 15h4" />
                  </svg>
                </span>
                <span class="mt-pay__option-body">
                  <span class="mt-pay__option-name">Tarjeta</span>
                  <span class="mt-pay__option-desc">Débito o crédito, sin efectivo</span>
                </span>
                <span class="mt-pay__tick" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
                       stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
              </button>
            </div>
          </div>

          <button type="button" class="mt-cta" data-action="request">
            <span>Pedir mototaxi</span>
            <span class="mt-cta__price" data-price>$35</span>
          </button>

          <p class="mt-note">
            <span class="mt-note__pulse" aria-hidden="true"></span>
            ${content.message}
          </p>
        </section>
      </div>
    `;

    const onMount = (root) => {
      const $ = (sel) => root.querySelector(sel);

      const priceEl = $("[data-price]");
      const input = $("[data-search-input]");
      const cta = $(".mt-cta");
      const resultsEl = $("[data-results]");
      const errorEl = $("[data-error]");
      const spinner = $("[data-search-spinner]");
      const tripEl = $("[data-trip]");
      const quickEl = $("[data-quick]");
      const payEl = $("[data-pay]");
      const payBtn = $("[data-pay-btn]");
      const payIconEl = $("[data-pay-icon]");
      const payValueEl = $("[data-pay-value]");
      const payOptionsEl = $("[data-pay-options]");

      let token = getToken();
      /* En Android el token puede agregarse después de montar la vista
         (config.local.js nueva o ?mapbox=...). Se reintenta leerlo. */
      const tokenActual = () => {
        if (!token) token = getToken();
        return token;
      };
      let map = null;
      let markers = [];
      let routeData = null;
      let origin = { ...CANCUN };
      let destination = null;
      let searchTimer = 0;
      let searchController = null;
      let destroyed = false;
      let payMethod = null; // "efectivo" | "tarjeta" | null

      const setError = (msg) => {
        if (!errorEl) return;
        errorEl.textContent = msg || "";
        errorEl.hidden = !msg;
      };

      /* ---------- Auto-posicionamiento ----------
       * El scroller de la vista es `.screen` (#app-screen). Cualquier bloque que
       * crezca (resultados, opciones de pago, viaje) puede quedar fuera de vista.
       * `reveal()` lo deja visible sin que el usuario tenga que arrastrar.
       * Se ejecuta tras pintar para medir el layout definitivo. */
      const scroller = root.closest(".screen") || document.scrollingElement;

      const reveal = (el, { extra = 16 } = {}) => {
        if (!el || !scroller) return;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (destroyed || !el.isConnected) return;
          const box = el.getBoundingClientRect();
          if (!box.height) return;

          const viewBox = scroller.getBoundingClientRect();
          const headerH = parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--header-height")
          ) || 0;
          const viewTop = viewBox.top + headerH;
          const viewBottom = viewBox.bottom;

          if (box.top >= viewTop - 1 && box.bottom <= viewBottom - 1) return;

          const target = box.height > viewBottom - viewTop
            ? scroller.scrollTop + (box.top - viewTop) - extra
            : scroller.scrollTop + (box.bottom - viewBottom) + extra;

          const max = scroller.scrollHeight - scroller.clientHeight;
          scroller.scrollTo({
            top: Math.max(0, Math.min(target, max)),
            behavior: "smooth",
          });
        }));
      };

      /* Respaldo visible: el mapa nunca queda negro en silencio */
      const mapFallback = $("[data-map-fallback]");
      const hideMapFallback = () => {
        if (mapFallback) mapFallback.hidden = true;
      };
      const failMap = (msg) => {
        if (mapFallback) {
          mapFallback.hidden = false;
          const text = mapFallback.querySelector("[data-map-fallback-text]");
          if (text && msg) text.textContent = msg;
        }
      };
      /* ---------- Mapa ---------- */
      const setMarker = (kind, point, label) => {
        if (!map || !window.maplibregl) return null;
        const el = document.createElement("span");
        el.className = `mt-pin mt-pin--${kind}`;
        if (kind === "origin") {
          el.innerHTML = kawaiiPinIcon;
          el.setAttribute("role", "img");
          el.setAttribute("aria-label", label || "Tu ubicación");
        }
        const marker = new window.maplibregl.Marker({
          element: el,
          anchor: kind === "origin" ? "bottom" : "center",
        }).setLngLat([point.lng, point.lat]);
        if (label) marker.setPopup(new window.maplibregl.Popup({ offset: 22 }).setText(label));
        marker.addTo(map);
        markers.push({ kind, marker });
        return marker;
      };

      const clearMarkers = (kind) => {
        markers = markers.filter((entry) => {
          if (kind && entry.kind !== kind) return true;
          entry.marker.remove();
          return false;
        });
      };

      /* ---------- Mototaxis rondando (simulación) ----------
       * Las motos circulan por CALLES REALES: se leen los trazados viales del
       * estilo vectorial (OpenFreeMap usa el esquema OpenMapTiles, capa "road")
       * y cada moto se desliza por tramos válidos cercanos a ti.
       * Ciclo de vida: cada moto vive unos segundos, se desvanece y otra
       * aparece en un punto distinto — así la escena nunca se congela. */
      const RIDER_MIN_M = 1500; // distancia mínima de aparición
      const RIDER_MAX_M = 4000; // distancia máxima de aparición
      const ROAD_LAYERS = ["road", "transportation", "road_network", "roads"];
      let riderAnim = 0;
      let glideAnim = 0; // animaciones puntuales (acercar la moto asignada)
      let riderLoopOn = false;
      let riderSpawner = 0;
      let riders = [];
      let assignedRider = null;
      let roadNetwork = null; // { segments: [{a,b,len}], builtAt }

      /* Metros → desplazamiento en grados (aprox. en Cancún) */
      const offsetLatLng = (point, meters, bearingRad) => {
        const dLat = (meters * Math.cos(bearingRad)) / 111320;
        const dLng = (meters * Math.sin(bearingRad)) / (111320 * Math.cos((point.lat * Math.PI) / 180));
        return { lng: point.lng + dLng, lat: point.lat + dLat };
      };

      /* Distancia entre dos puntos en metros (Haversine) */
      const metersBetween = (a, b) => {
        const R = 6371000;
        const dLat = ((b.lat - a.lat) * Math.PI) / 180;
        const dLng = ((b.lng - a.lng) * Math.PI) / 180;
        const la1 = (a.lat * Math.PI) / 180;
        const la2 = (b.lat * Math.PI) / 180;
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(h));
      };

      const stopRiderAnim = () => {
        if (riderAnim) cancelAnimationFrame(riderAnim);
        if (glideAnim) cancelAnimationFrame(glideAnim);
        riderAnim = 0;
        glideAnim = 0;
        riderLoopOn = false;
      };

      const stopRiderSpawner = () => {
        if (riderSpawner) clearTimeout(riderSpawner);
        riderSpawner = 0;
      };

      /* Devuelve la primera capa vial que exista en el estilo cargado */
      const roadLayerId = () => {
        if (!map) return null;
        const layers = map.getStyle()?.layers || [];
        for (const name of ROAD_LAYERS) {
          const found = layers.find((l) => l.id === name || l.id.startsWith(`${name}_`));
          if (found) return found.id;
        }
        const anyRoad = layers.find((l) => /road|street|highway/i.test(l.id));
        return anyRoad?.id || null;
      };

      /* Capas/source-layers viales disponibles según el esquema del estilo
       * (OpenFreeMap/OpenMapTiles usan "transportation"; otros varían). */
      const roadSourceInfo = () => {
        const guess = ["transportation", "road", "roads", "streets"];
        const fallback = { sources: ["openmaptiles", "composite"], layers: guess };
        if (!map) return fallback;
        const style = map.getStyle() || {};
        const sources = [];
        const layers = new Set(guess);
        Object.entries(style.sources || {}).forEach(([id, src]) => {
          if (src?.type !== "vector") return;
          sources.push(id);
          (src.vector_layers || []).forEach((vl) => {
            if (/transportation|road|street/i.test(vl.id)) layers.add(vl.id);
          });
        });
        return { sources: sources.length ? sources : fallback.sources, layers: [...layers] };
      };

      /* Extrae los segmentos de calle visibles y los guarda en [lng, lat] */
      const buildRoadNetwork = () => {
        if (!map) return null;
        if (roadNetwork && Date.now() - roadNetwork.builtAt < 45000) return roadNetwork;

        const { sources, layers: sourceLayers } = roadSourceInfo();

        let features = [];
        /* 1º: la fuente vectorial completa da TODAS las vías del área cargada
           (queryRenderedFeatures solo devuelve las visibles y ya filtradas). */
        for (const sourceId of sources) {
          for (const sl of sourceLayers) {
            try {
              const extra = map.querySourceFeatures(sourceId, { sourceLayer: sl });
              if (extra?.length > features.length) features = extra;
            } catch {
              /* esquema distinto: se prueba el siguiente */
            }
          }
          if (features.length > 40) break;
        }

        /* 2º respaldo: lo dibujado en pantalla */
        if (!features.length) {
          const layerId = roadLayerId();
          if (layerId) {
            try {
              features = map.queryRenderedFeatures({ layers: [layerId] });
            } catch {
              features = [];
            }
          }
        }

        const segments = [];
        features.forEach((f) => {
          const g = f.geometry;
          if (!g) return;
          const lines =
            g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : [];
          lines.forEach((line) => {
            for (let i = 0; i < line.length - 1; i += 1) {
              const a = { lng: line[i][0], lat: line[i][1] };
              const b = { lng: line[i + 1][0], lat: line[i + 1][1] };
              const len = metersBetween(a, b);
              if (len > 8 && len < 6000) segments.push({ a, b, len });
            }
          });
        });

        roadNetwork = { segments, builtAt: Date.now() };
        return roadNetwork;
      };

      /* Punto aleatorio sobre una calle, a una distancia dada de `near` */
      const randomRoadPoint = (near, minM, maxM) => {
        const net = buildRoadNetwork();
        if (!net || !net.segments.length) return null;
        const candidates = net.segments.filter((s) => {
          const mid = { lng: (s.a.lng + s.b.lng) / 2, lat: (s.a.lat + s.b.lat) / 2 };
          const d = metersBetween(near, mid);
          return d >= minM && d <= maxM;
        });
        if (!candidates.length) return null;
        const seg = candidates[Math.floor(Math.random() * candidates.length)];
        const t = Math.random();
        return {
          point: {
            lng: seg.a.lng + (seg.b.lng - seg.a.lng) * t,
            lat: seg.a.lat + (seg.b.lat - seg.a.lat) * t,
          },
          segment: seg,
        };
      };

      /* Siguiente tramo conectado al punto `anchor` donde llegó la moto */
      const neighborSegment = (net, seg, anchor) => {
        if (!anchor) return null;
        const same = (p) => Math.abs(p.lng - anchor.lng) < 0.0004 && Math.abs(p.lat - anchor.lat) < 0.0004;
        const pool = net.segments.filter((s) => s !== seg && (same(s.a) || same(s.b)));
        if (!pool.length) return null;
        const next = pool[Math.floor(Math.random() * pool.length)];
        return same(next.a) ? { seg: next, from: next.a, to: next.b } : { seg: next, from: next.b, to: next.a };
      };

      /* Pin de moto en el mapa */
      const createRider = (point) => {
        if (!map || !window.maplibregl) return null;
        const el = document.createElement("div");
        el.className = "mt-rider";
        el.setAttribute("role", "img");
        el.setAttribute("aria-label", "Mototaxi cerca de ti");
        el.innerHTML = riderPinIcon;
        const marker = new window.maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([point.lng, point.lat])
          .addTo(map);
        return { el, marker, lat: point.lat, lng: point.lng, heading: 0, progress: 0 };
      };

      /* Aparece una moto en una calle lejana (1.5–4 km) */
      const spawnOneRider = (near) => {
        if (!map || destroyed) return null;
        const spot = randomRoadPoint(near, RIDER_MIN_M, RIDER_MAX_M);
        if (!spot) return null;
        const rider = createRider(spot.point);
        if (!rider) return null;
        rider.segment = spot.segment;
        /* Arranca justo en el punto elegido de la calle, avanzando hacia un extremo */
        const reverse = Math.random() < 0.5;
        rider.from = reverse ? spot.segment.b : spot.segment.a;
        rider.to = reverse ? spot.segment.a : spot.segment.b;
        const largoRestante = metersBetween(spot.point, rider.to);
        rider.progress = 1 - largoRestante / Math.max(1, spot.segment.len);
        rider.ttl = 12000 + Math.random() * 12000; // vive 12–24 s
        rider.bornAt = performance.now();
        rider.el.classList.add("is-entering");
        setTimeout(() => rider.el?.classList.remove("is-entering"), 500);
        riders.push(rider);
        return rider;
      };

      /* Se retira una moto: fundido y limpieza del marcador */
      const retireRider = (rider) => {
        rider.el.classList.add("is-leaving");
        const el = rider.el;
        const marker = rider.marker;
        setTimeout(() => {
          el.remove();
          marker.remove();
        }, 420);
      };

      /* Recambio: una se va, otra llega. Mantiene la escena viva. */
      const scheduleRiderSpawn = (near) => {
        stopRiderSpawner();
        riderSpawner = setTimeout(() => {
          if (destroyed || !root.classList.contains("mt-is-simulating")) return;
          const free = riders.filter((r) => r !== assignedRider);
          if (free.length < 5) spawnOneRider(near);
          scheduleRiderSpawn(near);
        }, 4000 + Math.random() * 4000);
      };

      /* Bucle de movimiento: cada moto avanza por su tramo de calle */
      const startRiderLoop = () => {
        riderLoopOn = true;
        let last = performance.now();

        const tick = (now) => {
          if (!riderLoopOn || destroyed) return;
          const dt = Math.min(64, Math.max(0, now - last));
          last = now;

          for (let i = riders.length - 1; i >= 0; i -= 1) {
            const rider = riders[i];
            if (rider === assignedRider || rider.gliding) continue;

            /* Fin de vida: desaparece y se reprograma otra */
            if (now - rider.bornAt > rider.ttl) {
              riders.splice(i, 1);
              retireRider(rider);
              continue;
            }

            if (!rider.segment || !rider.from || !rider.to) continue;

            /* ~8 m/s (29 km/h), ritmo de moto urbana */
            const tramo = metersBetween(rider.from, rider.to);
            rider.progress += (8 * dt) / Math.max(1, tramo);

            if (rider.progress >= 1) {
              /* Sigue por una calle conectada al punto donde llegó */
              const net = buildRoadNetwork();
              const next = net ? neighborSegment(net, rider.segment, rider.to) : null;
              if (next) {
                rider.segment = next.seg;
                rider.from = next.from;
                rider.to = next.to;
                rider.progress = 0;
              } else {
                /* Calle sin continuación: se muda a otra calle del rango */
                const spot = randomRoadPoint(origin, RIDER_MIN_M, RIDER_MAX_M);
                if (spot) {
                  rider.segment = spot.segment;
                  rider.from = spot.segment.a;
                  rider.to = spot.segment.b;
                  rider.progress = 0;
                  rider.marker.setLngLat([spot.point.lng, spot.point.lat]);
                } else {
                  rider.progress = 0;
                }
                continue;
              }
            }

            const p = Math.max(0, Math.min(1, rider.progress));
            const lng = rider.from.lng + (rider.to.lng - rider.from.lng) * p;
            const lat = rider.from.lat + (rider.to.lat - rider.from.lat) * p;
            rider.marker.setLngLat([lng, lat]);
            rider.lat = lat;
            rider.lng = lng;

            /* Orienta el pin hacia el avance */
            const angle =
              (Math.atan2(rider.to.lng - rider.from.lng, rider.to.lat - rider.from.lat) * 180) / Math.PI;
            if (Math.abs(angle - rider.heading) > 10) {
              rider.heading = angle;
              rider.el.style.setProperty("--mt-heading", `${angle.toFixed(1)}deg`);
            }
          }

          riderAnim = requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };

      const clearRiders = () => {
        stopRiderAnim();
        stopRiderSpawner();
        riders.forEach((r) => r.marker.remove());
        riders = [];
        assignedRider = null;
        root.classList.remove("mt-is-tracking", "mt-is-simulating");
      };


      const glideRider = (rider, to, durationMs = 2200) =>
        new Promise((resolve) => {
          const from = { lat: rider.lat, lng: rider.lng };
          const start = performance.now();
          rider.gliding = true;
          const step = (now) => {
            if (destroyed) {
              rider.gliding = false;
              resolve();
              return;
            }
            const p = Math.min(1, (now - start) / durationMs);
            const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
            const lat = from.lat + (to.lat - from.lat) * e;
            const lng = from.lng + (to.lng - from.lng) * e;
            rider.marker.setLngLat([lng, lat]);
            rider.lat = lat;
            rider.lng = lng;
            if (p < 1) glideAnim = requestAnimationFrame(step);
            else {
              rider.gliding = false;
              resolve();
            }
          };
          glideAnim = requestAnimationFrame(step);
        });

      /* Recorre una ruta completa (varios puntos) calculando distancia acumulada,
       * así la velocidad es constante y no se frena en las curvas. */
      const glideAlongPath = (rider, path, durationMs = 6000) =>
        new Promise((resolve) => {
          const pts = path.map((p) => ({ lat: p.lat, lng: p.lng }));
          const legs = [];
          let total = 0;
          for (let i = 0; i < pts.length - 1; i += 1) {
            const len = metersBetween(pts[i], pts[i + 1]);
            legs.push({ from: pts[i], to: pts[i + 1], len, startAt: total });
            total += len;
          }
          if (!legs.length || !total) return resolve();

          const start = performance.now();
          rider.gliding = true;
          const step = (now) => {
            if (destroyed) {
              rider.gliding = false;
              resolve();
              return;
            }
            const p = Math.min(1, (now - start) / durationMs);
            const traveled = total * p;
            const leg = legs.find((l) => traveled <= l.startAt + l.len) || legs[legs.length - 1];
            const t = leg.len ? Math.min(1, (traveled - leg.startAt) / leg.len) : 1;
            const lat = leg.from.lat + (leg.to.lat - leg.from.lat) * t;
            const lng = leg.from.lng + (leg.to.lng - leg.from.lng) * t;
            rider.marker.setLngLat([lng, lat]);
            rider.lat = lat;
            rider.lng = lng;
            const angle = (Math.atan2(leg.to.lng - leg.from.lng, leg.to.lat - leg.from.lat) * 180) / Math.PI;
            rider.el.style.setProperty("--mt-heading", `${angle.toFixed(1)}deg`);
            if (p < 1) glideAnim = requestAnimationFrame(step);
            else {
              rider.gliding = false;
              resolve();
            }
          };
          glideAnim = requestAnimationFrame(step);
        });

      /* Elige la moto más cercana, la acerca POR CALLES y la marca asignada */
      const assignNearestRider = async (near) => {
        if (!riders.length) return null;
        let best = null;
        let bestDist = Infinity;
        riders.forEach((rider) => {
          const d = metersBetween(near, rider);
          if (d < bestDist) {
            bestDist = d;
            best = rider;
          }
        });
        if (!best) return null;

        /* La ETA se calcula con la distancia real de origen, antes de mover */
        const startDistance = bestDist;
        /* OJO: no se detiene el bucle global. Solo esta moto se excluye del
           bucle con `gliding`, para que las demás sigan circulando. */
        best.el.classList.add("is-approaching");

        /* Intenta traerla por calles reales; si no hay token, cae a línea recta */
        best.gliding = true;
        let path = null;
        const tk = tokenActual();
        if (tk) {
          try {
            const ruta = await fetchRoute(best, near, tk);
            if (ruta?.geometry?.coordinates?.length) {
              path = ruta.geometry.coordinates.map((c) => ({ lng: c[0], lat: c[1] }));
            }
          } catch {
            path = null;
          }
        }
        if (destroyed) {
          best.gliding = false;
          return null;
        }

        if (path && path.length > 1) {
          await glideAlongPath(best, path, Math.min(9000, Math.max(3000, startDistance * 3)));
        } else {
          const stop = offsetLatLng(near, 60, Math.random() * Math.PI * 2);
          await glideRider(best, stop, 2400);
        }
        if (destroyed) return null;

        best.gliding = false;
        best.el.classList.remove("is-approaching");
        best.el.classList.add("is-assigned");
        best.marker.setPopup(
          new window.maplibregl.Popup({ offset: 20 }).setText("Tu mototaxi te espera aquí")
        );
        best.startDistance = startDistance;
        assignedRider = best;
        root.classList.add("mt-is-tracking");
        return best;
      };

      const drawRoute = (geometry) => {
        if (!map) return;
        const source = map.getSource("mt-route");
        const data = geometry
          ? { type: "Feature", properties: {}, geometry }
          : { type: "FeatureCollection", features: [] };
        source?.setData(data);
      };

      const fitRoute = (geometry) => {
        if (!map || !geometry?.coordinates?.length) return;
        const bounds = geometry.coordinates.reduce(
          (acc, coord) => acc.extend(coord),
          new window.maplibregl.LngLatBounds(geometry.coordinates[0], geometry.coordinates[0])
        );
        map.fitBounds(bounds, {
          padding: { top: 60, bottom: 60, left: 50, right: 50 },
          maxZoom: 15.5,
          duration: 700,
        });
      };

      const ensureRouteLayers = () => {
        if (!map || map.getSource("mt-route")) return;
        map.addSource("mt-route", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "mt-route-casing",
          type: "line",
          source: "mt-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#000000", "line-width": 9, "line-opacity": 0.28 },
        });
        map.addLayer({
          id: "mt-route-line",
          type: "line",
          source: "mt-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#0a84ff", "line-width": 5 },
        });
        map.addLayer({
          id: "mt-route-glow",
          type: "line",
          source: "mt-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#64d2ff", "line-width": 2.2, "line-opacity": 0.75 },
        });
      };

      const initMap = async () => {
        try {
          const maplibregl = await loadMapLibre();
          if (destroyed) return;
          if (!window.maplibregl) {
            failMap("No se pudo cargar el motor del mapa.");
            return;
          }

          map = new maplibregl.Map({
            container: "mt-map-canvas",
            style: STYLE_URL,
            center: [CANCUN.lng, CANCUN.lat],
            zoom: 12.2,
            attributionControl: false,
            pitchWithRotate: false,
            dragRotate: false,
          });
          if (window.__MT_DEBUG__) window.__mtMap = map;


          let styleReady = false;
          map.on("load", () => {
            styleReady = true;
            map.resize();
            ensureRouteLayers();
            hideMapFallback();
            // Si la ubicación llegó antes que el mapa, pintamos el origen ahora
            clearMarkers("origin");
            setMarker("origin", origin, "Tu ubicación");
          });




          map.once("styledata", () => {
            if (!styleReady) {
              map.resize();
              ensureRouteLayers();
              hideMapFallback();
            }
          });

          map.on("error", (event) => {
            if (!styleReady) {
              failMap("No se pudo cargar el mapa. Revisa tu conexión.");
            } else if (!map?.getSource("mt-route")) {
              ensureRouteLayers();
            }
            if (event?.error) console.warn("[mt-map]", event.error?.message || event.error);
          });

          // El canvas a veces nace con tamaño 0 si el contenedor aún no se mide
          setTimeout(() => map?.resize(), 260);
          setTimeout(() => map?.resize(), 900);
          setTimeout(() => {
            // Solo mostramos el aviso si de verdad no hay nada pintado:
            // con red lenta los tiles pueden seguir en camino.
            if (map && !styleReady && !map.isStyleLoaded()) {
              failMap("El mapa tardó demasiado. Revisa tu conexión.");
            }
          }, 20000);

        } catch (error) {
          failMap("No se pudo cargar el mapa. Revisa tu conexión.");
          console.warn("[mt-map]", error);
        }
      };

      /* ---------- Ubicación ---------- */
      /* Centra el mapa en el usuario. Sin trucos de offset: el panel de vidrio
         ya cubre la parte baja del mapa, así que basta con centrar el punto
         y dejar que el marcador quede visible en la franja superior. */
      const centerOnUser = (point, duration = 700) => {
        if (!map || !point) return;
        const target = { center: [point.lng, point.lat], zoom: 15.2, essential: true };
        if (duration > 0) map.flyTo({ ...target, duration });
        else map.jumpTo(target);
      };

      const detectLocation = () => {
        if (!navigator.geolocation) {
          setError("Tu navegador no permite geolocalización. Escribe tu destino igual.");
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { longitude: lng, latitude: lat } = pos.coords;
            origin = { lng, lat };
            clearMarkers("origin");
            setMarker("origin", origin, "Tu ubicación");
            // El panel de vidrio tapa la parte de abajo del mapa. En vez de
            // padding (que se desborda si el canvas es bajo), desplazamos el
            // centro con el offset real disponible.
            centerOnUser(origin);



            setError("");
            if (destination) planTrip();
          },
          (error) => {
            const denied = error?.code === 1;
            setError(
              denied
                ? "Bloqueaste la ubicación. Actívala en el candado de la barra de direcciones para usar tu punto de partida real."
                : "No pudimos leer tu ubicación. Usamos el centro de Cancún como origen."
            );
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      };

      /* ---------- Ruta ---------- */
      const priceForDistance = (meters) => {
        const km = Math.max(0.5, meters / 1000);
        return `$${Math.round(20 + km * 12)}`;
      };

      const paintTrip = () => {
        if (!tripEl || !routeData) return;
        tripEl.hidden = false;
        $("[data-trip-distance]").textContent = formatDistance(routeData.distance);
        $("[data-trip-duration]").textContent = formatDuration(routeData.duration);
        $("[data-trip-eta]").textContent = "+3 min";
        if (priceEl) priceEl.textContent = priceForDistance(routeData.distance);
      };

      const planTrip = async () => {
        if (!destination) return;
        if (!tokenActual()) {
          setError("Agrega tu token de Mapbox para calcular la ruta.");
          return;
        }
        try {
          routeData = await fetchRoute(origin, destination.center, tokenActual());
          if (destroyed) return;
          drawRoute(routeData.geometry);
          fitRoute(routeData.geometry);
          paintTrip();
          setError("");
        } catch (err) {
          if (err.message === "token") {
            setError("El token de Mapbox no es válido o expiró.");
          } else {
            setError("No pudimos trazar la ruta. Prueba con otra dirección.");
          }
        }
      };

      /* ---------- Buscador ---------- */
      const renderResults = (places) => {
        if (!resultsEl) return;
        if (!places.length) {
          resultsEl.hidden = true;
          resultsEl.innerHTML = "";
          return;
        }
        resultsEl.innerHTML = places
          .map((place, index) => {
            const iconKey = categoryIcon(place);
            const iconBody = CATEGORY_ICONS[iconKey] || CATEGORY_ICONS.address;
            return `
            <li>
              <button type="button" class="mt-result" data-result="${index}">
                <span class="mt-result__icon mt-result__icon--${iconKey}" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                    ${iconBody}
                  </svg>
                </span>
                <span class="mt-result__body">
                  <span class="mt-result__name"></span>
                  <span class="mt-result__address"></span>
                </span>
              </button>
            </li>`;
          })
          .join("");
        resultsEl.hidden = false;

        resultsEl.querySelectorAll("[data-result]").forEach((btn) => {
          const place = places[Number(btn.dataset.result)];
          btn.querySelector(".mt-result__name").textContent = place.name;
          btn.querySelector(".mt-result__address").textContent = place.address;
          btn.addEventListener("click", () => chooseDestination(place));
        });

        /* Auto-posicionamiento: al aparecer la lista, el buscador puede quedar
           recortado arriba si el sheet es más alto que el área visible.
           Se mantiene el campo de búsqueda a la vista junto con la lista. */
        reveal(resultsEl, { extra: 12 });
      };

      const chooseDestination = (place) => {
        destination = place;
        clearMarkers("destination");
        setMarker("destination", place.center, place.name);
        if (input) input.value = place.name;
        if (resultsEl) {
          resultsEl.hidden = true;
          resultsEl.innerHTML = "";
        }
        if (quickEl) quickEl.hidden = true;
        setError("");
        planTrip();
        /* Tras elegir destino aparece el bloque de viaje y, debajo, el selector
           de pago. Se revela el conjunto (viaje + pago + CTA) para que el
           siguiente paso quede a la vista sin arrastrar manualmente. */
        reveal(payEl || tripEl, { extra: 12 });
      };

      const runSearch = async (query) => {
        const text = String(query || "").trim();
        if (!text) {
          renderResults([]);
          return;
        }
        searchController?.abort();
        searchController = new AbortController();
        if (spinner) spinner.hidden = false;
        try {
          const places = await searchPlaces(text, tokenActual(), {
            near: origin,
            signal: searchController.signal,
          });
          if (destroyed) return;
          renderResults(places);
          if (places.length) {
            /* Si el motor corrigió la escritura, se avisa sin interrumpir. */
            const fixed = places.corrected;
            setError(fixed ? `Mostrando resultados para “${fixed}”.` : "");
          } else {
            setError("Sin resultados. Prueba con otra palabra o una dirección.");
          }
        } catch (err) {
          if (err?.name === "AbortError") return;
          if (err?.message === "token") {
            setError("El token de Mapbox no es válido o expiró.");
          } else {
            setError("No pudimos buscar. Revisa tu conexión.");
          }
        } finally {
          if (spinner) spinner.hidden = true;
        }
      };

      const onInput = () => {
        clearTimeout(searchTimer);
        const value = input.value;
        searchTimer = setTimeout(() => runSearch(value), 350);
      };

      /* ---------- Servicios / CTA ---------- */
      const onClick = (event) => {
        const reload = event.target.closest('[data-action="reload"]');
        if (reload) {
          // Limpia todo y recarga: garantiza la última versión sin caché vieja
          Promise.resolve()
            .then(() => window.caches?.keys?.())
            .then((keys) => Promise.all((keys || []).map((key) => caches.delete(key))))
            .catch(() => {})
            .then(() => location.reload());
          return;
        }
        const btn = event.target.closest(".mt-service");
        if (btn) {
          root.querySelectorAll(".mt-service").forEach((el) => {
            const active = el === btn;
            el.classList.toggle("is-active", active);
            el.setAttribute("aria-pressed", active ? "true" : "false");
          });
          return;
        }
        const quick = event.target.closest(".mt-quick__item");
        if (quick && input) {
          input.value = quick.textContent.trim();
          input.focus({ preventScroll: true });
          runSearch(input.value);
        }
      };

      /* ---------- Forma de pago ---------- */
      const CASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.6" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>`;
      const CARD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2.5" />
        <path d="M2 10h20" />
        <path d="M6 15h4" />
      </svg>`;

      const setPayOpen = (open) => {
        if (!payOptionsEl || !payBtn) return;
        payOptionsEl.hidden = !open;
        payBtn.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
          /* Auto-posicionar: el panel crece hacia abajo y puede salir de vista.
             Se revela el bloque completo para que las dos opciones queden a mano. */
          reveal(payOptionsEl, { extra: 12 });
          payOptionsEl.querySelector(".mt-pay__option")?.focus({ preventScroll: true });
        }
      };

      const setPayMethod = (method) => {
        if (method !== "efectivo" && method !== "tarjeta") return;
        payMethod = method;
        if (payEl) {
          payEl.classList.toggle("mt-pay--chosen", true);
          payEl.classList.toggle("mt-pay--pending", false);
        }
        if (payValueEl) {
          payValueEl.textContent = method === "efectivo" ? "Efectivo" : "Tarjeta";
        }
        if (payIconEl) {
          payIconEl.innerHTML = method === "efectivo" ? CASH_ICON : CARD_ICON;
        }
        const change = payEl?.querySelector(".mt-pay__change");
        if (change) change.textContent = "Cambiar";
        payOptionsEl?.querySelectorAll("[data-pay-method]").forEach((btn) => {
          btn.setAttribute("aria-pressed", btn.dataset.payMethod === method ? "true" : "false");
        });
        setPayOpen(false);
        setError("");
      };

      const onPayClick = (event) => {
        const option = event.target.closest("[data-pay-method]");
        if (option) {
          setPayMethod(option.dataset.payMethod);
          return true;
        }
        if (event.target.closest("[data-pay-toggle]")) {
          setPayOpen(Boolean(payOptionsEl?.hidden));
          return true;
        }
        return false;
      };

      /* El aviso de "elige cómo pagar" se retira al primer toque en otra parte */
      const onDocClick = (event) => {
        if (!payEl || payEl.contains(event.target)) return;
        setPayOpen(false);
      };

      const onRequest = () => {
        if (!cta || cta.classList.contains("is-loading")) return;
        if (!destination) {
          setError("Elige primero a dónde quieres ir.");
          input?.focus();
          return;
        }
        /* OBLIGATORIO: sin forma de pago no se pide el mototaxi */
        if (!payMethod) {
          setError("Antes de pedir, elige cómo vas a pagar: efectivo o tarjeta.");
          payEl?.classList.add("mt-pay--pending");
          /* Abrir el selector ya dispara el auto-posicionamiento correcto */
          setPayOpen(true);
          return;
        }
        const label = cta.querySelector("span");
        cta.classList.add("is-loading");
        label.textContent = "Buscando tu mototaxi…";

        /* Simulación: las motos circulan por calles reales a 1.5–4 km.
           Se van renovando solas; la más cercana viene hacia ti. */
        const near = { lat: origin.lat, lng: origin.lng };
        root.dataset.mtNear = JSON.stringify(near);
        clearRiders();
        root.classList.add("mt-is-simulating");

        /* Al pedir, se abre el plano: a 1.5–4 km las calles quedarían fuera
           de cuadro con el zoom de detalle, así que se aleja un poco. */
        if (map) {
          map.flyTo({ center: [near.lng, near.lat], zoom: 13.1, duration: 900, essential: true });
        }

        /* Arranque: se espera a que el estilo tenga calles cargadas */
        const boot = () => {
          if (destroyed) return;
          const net = buildRoadNetwork();
          if (!net || !net.segments.length) {
            riderSpawner = setTimeout(boot, 1200);
            return;
          }
          const iniciales = 3 + Math.floor(Math.random() * 2); // 3-4
          for (let i = 0; i < iniciales; i += 1) spawnOneRider(near);
          startRiderLoop();
          scheduleRiderSpawn(near);
          assignNearestRider(near).then((rider) => {
            if (destroyed) return;
            cta.classList.remove("is-loading");
            cta.classList.add("is-done");
            label.textContent = "¡Mototaxi asignado!";
            if (priceEl) {
              const km = (rider?.startDistance || 1500) / 1000;
              priceEl.textContent = `${Math.max(3, Math.round(km * 2.2) + 2)} min`;
            }
          });
        };
        boot();
      };

      /* ---------- Botón de mapa: centrar en mi ubicación ---------- */
      const onLocate = () => detectLocation();
      const locateBtn = root.querySelector('[data-action="locate"]');

      let askedLocation = false;
      const onFocusSearch = () => {
        if (askedLocation) return;
        askedLocation = true;
        if (!navigator.permissions) return;
        navigator.permissions
          .query({ name: "geolocation" })
          .then((p) => {
            if (p.state === "prompt") detectLocation();
          })
          .catch(() => {});
      };

      /* ---------- Arranque ---------- */
      payEl?.classList.add("mt-pay--pending");
      root.addEventListener("click", onClick);
      input?.addEventListener("input", onInput);
      input?.addEventListener("focus", onFocusSearch);
      cta?.addEventListener("click", onRequest);
      locateBtn?.addEventListener("click", onLocate);
      document.addEventListener("click", onDocClick);

      /* El selector de pago se resuelve en su propio contenedor antes de que
         el click suba a la raíz. */
      payEl?.addEventListener("click", onPayClick);

      root.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !payOptionsEl?.hidden) setPayOpen(false);

        /* Enter en el buscador: busca de inmediato, sin esperar el debounce.
           Si ya hay resultados, elige el primero — así "sm 22" + Enter resuelve. */
        if (event.key === "Enter" && event.target === input) {
          event.preventDefault();
          clearTimeout(searchTimer);
          const text = input.value.trim();
          if (!text) return;
          const first = resultsEl?.querySelector("[data-result]");
          if (first && !resultsEl.hidden) {
            first.click();
          } else {
            runSearch(text);
          }
        }
      });

      initMap();
      detectLocation();

      return () => {
        destroyed = true;
        clearTimeout(searchTimer);
        searchController?.abort();
        root.removeEventListener("click", onClick);
        input?.removeEventListener("input", onInput);
        input?.removeEventListener("focus", onFocusSearch);
        cta?.removeEventListener("click", onRequest);
        locateBtn?.removeEventListener("click", onLocate);
        document.removeEventListener("click", onDocClick);
        payEl?.removeEventListener("click", onPayClick);
        clearRiders();
        markers.forEach((entry) => entry.marker.remove());
        markers = [];
        map?.remove();
        map = null;
      };
    };

    return { html, onMount };
  },
};
