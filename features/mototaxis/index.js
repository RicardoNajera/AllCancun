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

const services = [
  {
    id: "moto",
    name: "Moto Taxi",
    desc: "1 persona · casco incluido",
    eta: "3 min",
    price: "$35",
    icon: motoIcon,
    popular: true,
  },
  {
    id: "moto-xl",
    name: "Moto Taxi XL",
    desc: "2 personas · con cajuela",
    eta: "5 min",
    price: "$55",
    icon: motoIcon,
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

          <ul class="mt-quick" aria-label="Destinos frecuentes" data-quick>
            <li><button type="button" class="mt-quick__item">Centro</button></li>
            <li><button type="button" class="mt-quick__item">Playa Delfines</button></li>
            <li><button type="button" class="mt-quick__item">Mercado 28</button></li>
            <li><button type="button" class="mt-quick__item">Terminal ADO</button></li>
          </ul>

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

          <div class="mt-pay">
            <span class="mt-pay__label">Pago</span>
            <span class="mt-pay__value">
              <span class="mt-pay__chip" aria-hidden="true">$</span>
              Efectivo
            </span>
            <span class="mt-pay__change">Cambiar</span>
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

      let token = getToken();
      let map = null;
      let markers = [];
      let routeData = null;
      let origin = { ...CANCUN };
      let destination = null;
      let searchTimer = 0;
      let searchController = null;
      let destroyed = false;

      const setError = (msg) => {
        if (!errorEl) return;
        errorEl.textContent = msg || "";
        errorEl.hidden = !msg;
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
        if (!token) {
          setError("Agrega tu token de Mapbox para calcular la ruta.");
          return;
        }
        try {
          routeData = await fetchRoute(origin, destination.center, token);
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
      };

      const runSearch = async (query) => {
        const text = String(query || "").trim();
        if (text.length < 2) {
          renderResults([]);
          return;
        }
        searchController?.abort();
        searchController = new AbortController();
        if (spinner) spinner.hidden = false;
        try {
          const places = await searchPlaces(text, token, {
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

      const onRequest = () => {
        if (!cta || cta.classList.contains("is-loading")) return;
        if (!destination) {
          setError("Elige primero a dónde quieres ir.");
          input?.focus();
          return;
        }
        const label = cta.querySelector("span");
        cta.classList.add("is-loading");
        label.textContent = "Buscando tu mototaxi";
        setTimeout(() => {
          if (destroyed) return;
          cta.classList.remove("is-loading");
          cta.classList.add("is-done");
          label.textContent = "¡Mototaxi asignado!";
          if (priceEl) priceEl.textContent = "3 min";
        }, 1400);
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
      root.addEventListener("click", onClick);
      input?.addEventListener("input", onInput);
      input?.addEventListener("focus", onFocusSearch);
      cta?.addEventListener("click", onRequest);
      locateBtn?.addEventListener("click", onLocate);

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
        markers.forEach((entry) => entry.marker.remove());
        markers = [];
        map?.remove();
        map = null;
      };
    };

    return { html, onMount };
  },
};
