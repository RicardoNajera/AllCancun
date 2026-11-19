/**
 * All Cancún — Componente CategoryGrid
 * Genera el grid de tarjetas a partir del catálogo de data/categories.js.
 */

import { icons } from "./icons.js";
import { categories } from "../data/categories.js";

const escape = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });

function categoryCard(category, position) {
  const caption = category.caption
    ? `<span class="category-card__caption">${escape(category.caption)}</span>`
    : "";

  const slides = (category.images || [])
    .map(
      (file, index) => `
        <img
          class="category-card__slide${index === 0 ? " is-active" : ""}"
          src="assets/images/${escape(file)}"
          alt=""
          loading="${index === 0 ? "eager" : "lazy"}"
          decoding="async"
          draggable="false"
        />`
    )
    .join("");

  return `
    <button
      type="button"
      class="category-card"
      data-accent="${escape(category.accent)}"
      data-category-id="${escape(category.id)}"
      data-index="${String(position).padStart(2, "0")}"
      aria-label="${escape([category.title, category.caption].filter(Boolean).join(": "))}"
    >
      <span class="category-card__media" aria-hidden="true">
        ${slides}
        <span class="category-card__scrim"></span>
      </span>
      <span class="category-card__top">
        <span class="category-card__icon" aria-hidden="true">
          ${icons[category.icon] || icons.comercios}
        </span>
      </span>
      <span class="category-card__body">
        <span class="category-card__title">${escape(category.title)}</span>
        ${caption}
      </span>
    </button>
  `;
}

export function renderCategoryGrid(mount) {
  mount.innerHTML = `
    <section class="categories" aria-labelledby="categories-title">
      <div class="hero">
        <span class="hero__eyebrow">Bienvenido</span>
        <h2 class="hero__title">Todo Cancún, en tu bolsillo</h2>
        <p class="hero__text">
          Servicios, negocios y oficios locales verificados. Sin intermediarios.
        </p>
        <div class="hero__chips">
          <span class="hero__chip">${icons.viajes} 100% local</span>
          <span class="hero__chip">${icons.salud} Cerca de ti</span>
        </div>
      </div>
      <div class="categories__heading">
        <h1 class="categories__title" id="categories-title">¿Qué necesitas hoy?</h1>
        <p class="categories__subtitle">Elige una categoría para empezar.</p>
      </div>
      <div class="category-grid" role="list">
        ${categories.map((category, index) => categoryCard(category, index + 1)).join("")}
      </div>
    </section>
  `;

  // Los botones son role=listitem dentro del grid para accesibilidad
  mount.querySelectorAll(".category-card").forEach((card) => {
    card.setAttribute("role", "listitem");
  });

  initCardCarousels(mount);

  mount.querySelector(".category-grid")?.addEventListener("click", (event) => {
    const card = event.target.closest(".category-card");
    if (!card) return;
    const category = categories.find((item) => item.id === card.dataset.categoryId);
    if (!category) return;

    // Placeholder de navegación: aquí irá la vista de la categoría.
    card.dispatchEvent(
      new CustomEvent("category:select", { detail: category, bubbles: true })
    );
  });
}

/* Carrusel automático de fotos dentro de cada tarjeta */
function initCardCarousels(mount) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const INTERVAL = 3600;
  let offset = 0;

  const cards = Array.from(mount.querySelectorAll(".category-card"));

  cards.forEach((card) => {
    const slides = Array.from(card.querySelectorAll(".category-card__slide"));
    if (slides.length < 2) return;

    // Desfase inicial para que no cambien todas al mismo tiempo
    offset += 520;
    let index = 0;

    window.setTimeout(() => {
      window.setInterval(() => {
        if (document.hidden) return;
        slides[index].classList.remove("is-active");
        index = (index + 1) % slides.length;
        slides[index].classList.add("is-active");
      }, INTERVAL);
    }, offset);
  });
}
