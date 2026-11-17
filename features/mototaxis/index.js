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
            if (map && !styleReady) failMap("El mapa tardó demasiado. Revisa tu conexión.");
          }, 9000);
        } catch (error) {
          failMap("No se pudo cargar el mapa. Revisa tu conexión.");
          console.warn("[mt-map]", error);
        }
      };

      /* ---------- Ubicación ---------- */
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
            map?.flyTo({ center: [lng, lat], zoom: 14.5, duration: 900 });
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
          setError("Para buscar direcciones necesitas tu token de Mapbox.");
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
          setError(places.length ? "" : "Sin resultados. Intenta con otra dirección.");
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
