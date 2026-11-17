/**
 * All Cancún — Feature: shared/ui
 * Piezas reutilizables de la vista interna. Cada feature usa estas piezas
 * y puede sobrescribir cualquier texto u orden sin tocar otros módulos.
 */

import { icons } from "../../components/icons.js";

export const escape = (value = "") =>
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

/* Hero con la portada real de la categoría */
export function hero({ eyebrow, title, lead, cover, status = "En construcción" }) {
  return `
    <header class="fv-hero">
      ${
        cover
          ? `<img class="fv-hero__cover" src="assets/images/${escape(cover)}" alt="" decoding="async" draggable="false" />`
          : ""
      }
      <span class="fv-hero__veil" aria-hidden="true"></span>
      <div class="fv-hero__inner">
        <button type="button" class="fv-back" data-action="back" aria-label="Volver al inicio">
          ${icons.arrowLeft}
          <span>Inicio</span>
        </button>
        <span class="fv-hero__eyebrow">${escape(eyebrow)}</span>
        <h1 class="fv-hero__title">${escape(title)}</h1>
        <p class="fv-hero__lead">${escape(lead)}</p>
        <span class="fv-badge">
          <span class="fv-badge__dot" aria-hidden="true"></span>
          ${escape(status)}
        </span>
      </div>
    </header>
  `;
}

/* Tarjeta de avance del módulo */
export function buildCard({ title, text, progress }) {
  return `
    <div class="fv-card">
      <div class="fv-card__head">
        <span class="fv-card__icon" aria-hidden="true">${icons.code}</span>
        <div>
          <h2 class="fv-card__title">${escape(title)}</h2>
          <p class="fv-card__text">${escape(text)}</p>
        </div>
      </div>
      <div class="fv-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"
           aria-valuenow="${progress}" aria-label="Avance del módulo">
        <span class="fv-progress__bar" style="--progress: ${progress}%"></span>
      </div>
      <div class="fv-progress__meta">
        <span>Avance del módulo</span>
        <strong>${progress}%</strong>
      </div>
    </div>
  `;
}

/* Lista de pasos animada en cascada */
export function steps(list = []) {
  const set = ["code", "bolt", "check"];
  return `
    <ol class="fv-steps">
      ${list
        .map(
          (step, index) => `
        <li class="fv-step" style="--i: ${index}" data-zone="${escape(step.zone || "")}">
          <span class="fv-step__icon" aria-hidden="true">${
            icons[set[index % set.length]] || icons.check
          }</span>
          <span class="fv-step__text">
            <span class="fv-step__title">${escape(step.title)}</span>
            <span class="fv-step__detail">${escape(step.detail)}</span>
          </span>
        </li>`
        )
        .join("")}
    </ol>
  `;
}

/* Bloque del equipo detrás del producto */
export function crew(members = []) {
  return `
    <div class="fv-crew">
      <div class="fv-crew__stage" aria-hidden="true">
        <span class="fv-crew__orbit"></span>
        <span class="fv-crew__glow"></span>
      </div>
      <ul class="fv-crew__list">
        ${members
          .map(
            (member, index) => `
          <li class="fv-crew__member" style="--i: ${index}">
            <span class="fv-crew__avatar" aria-hidden="true">${icons.team}</span>
            <span class="fv-crew__info">
              <span class="fv-crew__role">${escape(member.role)}</span>
              <span class="fv-crew__detail">${escape(member.detail)}</span>
            </span>
          </li>`
          )
          .join("")}
      </ul>
    </div>
  `;
}

/* Nota al pie de la vista */
export function note(text) {
  if (!text) return "";
  return `<p class="fv-note">${icons.clock}<span>${escape(text)}</span></p>`;
}

/* Título de sección */
export function sectionTitle(text) {
  return `<h2 class="fv-section-title">${escape(text)}</h2>`;
}
