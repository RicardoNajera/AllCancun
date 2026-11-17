/**
 * All Cancún — Bloque "en construcción"
 * Un solo mensaje profesional + escena animada de programadores.
 */

import { escape } from "./ui.js";

const dev = (x, y, delay) => `
  <g class="fv-dev" style="--d:${delay}s" transform="translate(${x} ${y})">
    <circle class="fv-dev__head" cx="0" cy="-14" r="7" />
    <path class="fv-dev__body" d="M-10 4c0-6 4.5-10 10-10s10 4 10 10" />
    <rect class="fv-dev__screen" x="-15" y="3" width="30" height="13" rx="2.5" />
    <path class="fv-dev__code" d="M-10 7h7M-10 11h12" />
    <path class="fv-dev__arm" d="M-10-2l-4 7M10-2l4 7" />
  </g>`;

export function building(message) {
  return `
    <div class="fv-building">
      <div class="fv-building__scene" aria-hidden="true">
        <span class="fv-building__glow"></span>
        <svg class="fv-building__svg" viewBox="0 0 240 92" role="presentation">
          <path class="fv-building__floor" d="M12 86h216" />
          ${dev(58, 66, 0)}
          ${dev(120, 62, 0.35)}
          ${dev(182, 66, 0.7)}
          <g class="fv-building__bubble" transform="translate(176 16)">
            <rect x="-26" y="-11" width="52" height="20" rx="10" />
            <path d="M-6 9l-4 6 10-6z" />
            <circle class="fv-dot d1" cx="-10" cy="-1" r="2" />
            <circle class="fv-dot d2" cx="0" cy="-1" r="2" />
            <circle class="fv-dot d3" cx="10" cy="-1" r="2" />
          </g>
        </svg>
      </div>
      <p class="fv-building__text">${escape(message)}</p>
    </div>
  `;
}
