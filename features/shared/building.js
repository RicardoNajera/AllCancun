/**
 * All Cancún — Bloque "en construcción"
 * Un solo mensaje profesional + escena animada de programadores.
 */

import { escape } from "./ui.js";

export function building(message) {
  return `
    <div class="fv-building">
      <div class="fv-building__scene" aria-hidden="true">
        <span class="fv-building__glow"></span>
        <svg class="fv-building__svg" viewBox="0 0 200 150" role="presentation">
          <ellipse class="fv-pad" cx="100" cy="138" rx="62" ry="7" />
          <g class="fv-thinker">
            <!-- pensamiento flotante -->
            <circle class="fv-think d1" cx="132" cy="26" r="4" />
            <circle class="fv-think d2" cx="146" cy="16" r="5.5" />
            <circle class="fv-think d3" cx="164" cy="8" r="7" />
            <!-- cabeza apoyada en la mano -->
            <circle class="fv-head" cx="86" cy="54" r="17" />
            <path class="fv-hair" d="M69 50c0-11 8-18 17-18s17 7 17 18c-4-6-9-9-17-9s-13 3-17 9z" />
            <!-- brazo que sostiene la barbilla -->
            <path class="fv-arm" d="M74 66c-8 6-12 16-6 22 5 5 14 3 17-3" />
            <!-- torso sentado -->
            <path class="fv-torso" d="M62 138c0-26 10-46 26-46s26 20 26 46" />
            <!-- piernas dobladas -->
            <path class="fv-legs" d="M78 138c2-16 8-22 22-22h26" />
            <path class="fv-legs" d="M104 138c6-14 14-18 28-18" />
            <!-- laptop al frente -->
            <g class="fv-laptop">
              <rect x="118" y="96" width="46" height="30" rx="3" />
              <path class="fv-laptop__base" d="M110 126h62" />
              <path class="fv-laptop__code" d="M126 105h20M126 111h30M126 117h14" />
            </g>
          </g>
        </svg>
      </div>
      <p class="fv-building__text">${escape(message)}</p>
    </div>
  `;
}
