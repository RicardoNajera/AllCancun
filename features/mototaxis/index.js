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
        <header class="mt-top">
          <button type="button" class="mt-top__back" data-action="back" aria-label="Volver al inicio">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div class="mt-top__title">
            <span>All Cancún</span>
            <strong>Mototaxi</strong>
          </div>
          <span class="mt-top__avatar" aria-hidden="true">R</span>
        </header>

        <section class="mt-map" aria-label="Mapa de la zona">
          <div class="mt-map__canvas" id="mt-map-canvas" role="application"
               aria-label="Mapa interactivo de Cancún"></div>
          <span class="mt-map__veil" aria-hidden="true"></span>
          <span class="mt-map__status" data-map-status>
            <span class="mt-map__status-dot" aria-hidden="true"></span>
            <span data-map-status-text>Cargando mapa…</span>
          </span>
          <button type="button" class="mt-map__locate" data-action="locate" aria-label="Usar mi ubicación">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <circle cx="12" cy="12" r="8" />
            </svg>
          </button>
          <div class="mt-token" data-token-panel hidden>
            <p class="mt-token__text">
              Pega tu token de Mapbox para buscar direcciones y trazar la ruta.
              El mapa ya es real (OpenFreeMap, sin API key).
            </p>
            <form class="mt-token__form" data-token-form>
              <input class="mt-token__input" type="password" name="token"
                     placeholder="pk.eyJ1…" autocomplete="off" spellcheck="false"
                     aria-label="Token de Mapbox" />
              <button class="mt-token__save" type="submit">Guardar</button>
            </form>
            <p class="mt-token__hint">
              Solo se guarda en este navegador (localStorage).
            </p>
          </div>
        </section>

        <section class="mt-sheet">
          <span class="mt-sheet__grab" aria-hidden="true"></span>

          <h1 class="mt-sheet__title">¿A dónde vamos?</h1>

          <div class="mt-origin" data-origin-row>
            <span class="mt-origin__dot" aria-hidden="true"></span>
            <span class="mt-origin__label">Tu ubicación</span>
            <span class="mt-origin__value" data-origin-text>Detectando…</span>
          </div>

          <div class="mt-search">
            <span class="mt-search__icon" aria-hidden="true">${pinIcon}</span>
            <input class="mt-search__input" type="text" inputmode="search"
                   placeholder="¿A dónde vamos?"
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
      const tokenPanel = $("[data-token-panel]");
      const statusText = $("[data-map-status-text]");
      const originText = $("[data-origin-text]");
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

      const setStatus = (msg) => {
        if (statusText) statusText.textContent = msg;
      };

      const setTokenState = (hasToken) => {
        if (tokenPanel) tokenPanel.hidden = hasToken;
      };

      /* ---------- Mapa ---------- */
      const setMarker = (kind, point, label) => {
        if (!map || !window.maplibregl) return null;
        const el = document.createElement("span");
        el.className = `mt-pin mt-pin--${kind}`;
        const marker = new window.maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([point.lng, point.lat]);
        if (label) marker.setPopup(new window.maplibregl.Popup({ offset: 16 }).setText(label));
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
      const initMap = async () => {
        try {
          const maplibregl = await loadMapLibre();
          if (destroyed) return;

          map = new maplibregl.Map({
            container: "mt-map-canvas",
            style: STYLE_URL,
            center: [CANCUN.lng, CANCUN.lat],
            zoom: 12.2,
            attributionControl: false,
            pitchWithRotate: false,
            dragRotate: false,
          });

          map.on("load", () => {
            map.addSource("mt-route", {
              type: "geojson",
              data: { type: "FeatureCollection", features: [] },
            });
            map.addLayer({
              id: "mt-route-casing",
              type: "line",
              source: "mt-route",
              layout: { "line-cap": "round", "line-join": "round" },
              paint: { "line-color": "#0b0e13", "line-width": 8, "line-opacity": 0.55 },
            });
            map.addLayer({
              id: "mt-route-line",
              type: "line",
              source: "mt-route",
              layout: { "line-cap": "round", "line-join": "round" },
              paint: { "line-color": "#4fa8ff", "line-width": 4.5 },
            });
            setStatus("Mapa en vivo · OpenFreeMap");
          });

          map.on("error", () => setStatus("Mapa con problemas de conexión"));
          setMarker("origin", origin);
        } catch {
          setStatus("No se pudo cargar el mapa");
          setError("El mapa no cargó. Revisa tu conexión e intenta de nuevo.");
        }
      };

      /* ---------- Ubicación ---------- */
      const detectLocation = () => {
        if (!navigator.geolocation) {
          originText.textContent = "Ubicación no disponible";
          setError("Tu navegador no permite geolocalización. Escribe tu destino igual.");
          return;
        }
        originText.textContent = "Detectando…";
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { longitude: lng, latitude: lat } = pos.coords;
            origin = { lng, lat };
            clearMarkers("origin");
            setMarker("origin", origin, "Tu ubicación");
            map?.flyTo({ center: [lng, lat], zoom: 14.5, duration: 900 });
            originText.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setError("");
            if (destination) planTrip();
          },
          () => {
            originText.textContent = "Cancún centro (por defecto)";
            setError("No leímos tu ubicación. Usamos el centro de Cancún como origen.");
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
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
          setTokenState(false);
          setError("Agrega tu token de Mapbox para calcular la ruta.");
          return;
        }
        try {
          setStatus("Calculando ruta…");
          routeData = await fetchRoute(origin, destination.center, token);
          if (destroyed) return;
          drawRoute(routeData.geometry);
          fitRoute(routeData.geometry);
          paintTrip();
          setStatus(destination.name);
          setError("");
        } catch (err) {
          if (err.message === "token") {
            setTokenState(false);
            setError("El token de Mapbox no es válido o expiró.");
          } else {
            setError("No pudimos trazar la ruta. Prueba con otra dirección.");
          }
          setStatus("Ruta no disponible");
        }
      };


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
          .map(
            (place, index) => `
            <li>
              <button type="button" class="mt-result" data-result="${index}">
                <span class="mt-result__icon" aria-hidden="true">${pinIcon}</span>
                <span class="mt-result__body">
                  <span class="mt-result__name"></span>
                  <span class="mt-result__address"></span>
                </span>
              </button>
            </li>`
          )
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
        if (text.length < 3) {
          renderResults([]);
          return;
        }
        if (!token) {
          setTokenState(false);
          setError("Para buscar direcciones necesitas tu token de Mapbox.");
          return;
        }
        searchController?.abort();
        searchController = new AbortController();
        if (spinner) spinner.hidden = false;
        try {
          const places = await searchPlaces(text, token, { near: origin });
          if (destroyed) return;
          renderResults(places);
          setError(places.length ? "" : "Sin resultados. Intenta con otra dirección.");
        } catch (err) {
          if (err?.name === "AbortError") return;
          if (err?.message === "token") {
            setTokenState(false);
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

      /* ---------- Token ---------- */
      const tokenForm = $("[data-token-form]");

      const onTokenSubmit = (event) => {
        event.preventDefault();
        const value = new FormData(tokenForm).get("token");
        if (!String(value || "").trim()) return;
        token = String(value).trim();
        saveToken(token);
        setTokenState(true);
        setError("");
        if (destination) planTrip();
        else if (input && input.value.trim().length >= 3) runSearch(input.value);
      };

      /* ---------- Servicios / CTA ---------- */
      const onClick = (event) => {
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

      const onLocate = () => detectLocation();
      const locateBtn = root.querySelector('[data-action="locate"]');

      /* ---------- Arranque ---------- */
      setTokenState(Boolean(token));
      root.addEventListener("click", onClick);
      input?.addEventListener("input", onInput);
      cta?.addEventListener("click", onRequest);
      locateBtn?.addEventListener("click", onLocate);
      tokenForm?.addEventListener("submit", onTokenSubmit);

      initMap();
      detectLocation();

      return () => {
        destroyed = true;
        clearTimeout(searchTimer);
        searchController?.abort();
        root.removeEventListener("click", onClick);
        input?.removeEventListener("input", onInput);
        cta?.removeEventListener("click", onRequest);
        locateBtn?.removeEventListener("click", onLocate);
        tokenForm?.removeEventListener("submit", onTokenSubmit);
        markers.forEach((entry) => entry.marker.remove());
        markers = [];
        map?.remove();
        map = null;
      };
    };

    return { html, onMount };
  },
};
