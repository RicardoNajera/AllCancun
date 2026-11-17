/**
 * All Cancún — Mototaxis · Interfaz de pedido tipo Uber
 * Todo exclusivo de esta carpeta: mapa, servicio, destino, tarifa y conductor.
 */

import { content } from "./content.js";

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
          <span class="mt-map__veil" aria-hidden="true"></span>
          <svg class="mt-map__grid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 30h100M0 62h100M22 0v100M58 0v100M82 0v100" />
          </svg>
          <svg class="mt-map__route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path class="mt-map__line" d="M14 78C30 74 34 52 48 46s26 4 38-22" />
          </svg>
          <span class="mt-map__pin mt-map__pin--from" aria-hidden="true"></span>
          <span class="mt-map__pin mt-map__pin--to" aria-hidden="true"></span>
          <span class="mt-map__eta">
            <span class="mt-map__eta-dot" aria-hidden="true"></span>
            Mototaxis cerca de ti
          </span>
        </section>

        <section class="mt-sheet">
          <span class="mt-sheet__grab" aria-hidden="true"></span>

          <h1 class="mt-sheet__title">¿A dónde vamos?</h1>

          <div class="mt-search">
            <span class="mt-search__icon" aria-hidden="true">${pinIcon}</span>
            <input class="mt-search__input" type="text" inputmode="text"
                   placeholder="Ingresa tu destino"
                   aria-label="Destino" autocomplete="off" />
            <span class="mt-search__badge">Ahora</span>
          </div>

          <ul class="mt-quick" aria-label="Destinos frecuentes">
            <li><button type="button" class="mt-quick__item">Centro</button></li>
            <li><button type="button" class="mt-quick__item">Playa Delfines</button></li>
            <li><button type="button" class="mt-quick__item">Mercado 28</button></li>
            <li><button type="button" class="mt-quick__item">Terminal ADO</button></li>
          </ul>

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
      const priceEl = root.querySelector("[data-price]");
      const input = root.querySelector(".mt-search__input");
      const cta = root.querySelector(".mt-cta");

      const select = (btn) => {
        root.querySelectorAll(".mt-service").forEach((el) => {
          const active = el === btn;
          el.classList.toggle("is-active", active);
          el.setAttribute("aria-pressed", active ? "true" : "false");
        });
        const price = btn.querySelector(".mt-service__price")?.textContent || "$35";
        if (priceEl) priceEl.textContent = price;
        btn.animate?.(
          [{ transform: "scale(1)" }, { transform: "scale(0.985)" }, { transform: "scale(1)" }],
          { duration: 240, easing: "ease-out" }
        );
      };

      const onClick = (event) => {
        const btn = event.target.closest(".mt-service");
        if (btn) {
          select(btn);
          return;
        }
        const quick = event.target.closest(".mt-quick__item");
        if (quick && input) {
          input.value = quick.textContent.trim();
          input.focus({ preventScroll: true });
        }
      };

      const onRequest = () => {
        if (!cta || cta.classList.contains("is-loading")) return;
        const label = cta.querySelector("span");
        cta.classList.add("is-loading");
        label.textContent = "Buscando tu mototaxi";
        setTimeout(() => {
          cta.classList.remove("is-loading");
          cta.classList.add("is-done");
          label.textContent = "¡Mototaxi asignado!";
          if (priceEl) priceEl.textContent = "3 min";
        }, 1400);
      };

      root.addEventListener("click", onClick);
      cta?.addEventListener("click", onRequest);

      return () => {
        root.removeEventListener("click", onClick);
        cta?.removeEventListener("click", onRequest);
      };
    };

    return { html, onMount };
  },
};
