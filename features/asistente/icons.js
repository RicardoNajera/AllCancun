/**
 * All Cancún — Asistente · Iconos
 * SVG nativos, 24x24, `currentColor`. Mismo trazo que el resto de la app.
 */

const svg = (body) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const aiIcons = {
  /* Chispa del asistente (misma familia que el dock) */
  spark: svg(`
    <path d="M12 3.4l1.9 4.7 4.7 1.9-4.7 1.9L12 16.6l-1.9-4.7L5.4 10l4.7-1.9Z"/>
    <path d="M18.4 15.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z"/>
  `),

  mic: svg(`
    <rect x="9.2" y="3" width="5.6" height="10.4" rx="2.8"/>
    <path d="M5.6 11.2a6.4 6.4 0 0 0 12.8 0"/>
    <path d="M12 17.6V21"/>
  `),

  send: svg(`
    <path d="M4.2 12 20 4.6l-3.4 14.9-4.5-4.1Z"/>
    <path d="M12.1 15.4 20 4.6"/>
  `),

  stop: svg(`<rect x="7" y="7" width="10" height="10" rx="2.2"/>`),

  close: svg(`
    <path d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6"/>
  `),

  history: svg(`
    <path d="M3.8 12a8.2 8.2 0 1 0 2.6-6"/>
    <path d="M3.4 4.4v4h4"/>
    <path d="M12 7.8V12l3 1.8"/>
  `),

  trash: svg(`
    <path d="M4.8 7.2h14.4"/>
    <path d="M9.4 7.2V5.4h5.2v1.8"/>
    <path d="M6.6 7.2l.9 12.2h9l.9-12.2"/>
  `),

  /* Persona: mismo lenguaje que el resto del set */
  user: svg(`
    <circle cx="12" cy="8.2" r="3.4"/>
    <path d="M5.4 20c0-3.4 3-5.6 6.6-5.6s6.6 2.2 6.6 5.6"/>
  `),

  pin: svg(`
    <path d="M12 21s6.4-5.2 6.4-10.3A6.4 6.4 0 0 0 5.6 10.7C5.6 15.8 12 21 12 21Z"/>
    <circle cx="12" cy="10.4" r="2.3"/>
  `),

  clock: svg(`
    <circle cx="12" cy="12" r="8.6"/>
    <path d="M12 7.4V12l3.2 2"/>
  `),

  wallet: svg(`
    <rect x="3.4" y="6.4" width="17.2" height="12" rx="3"/>
    <path d="M3.4 10.4h17.2"/>
    <circle cx="16.6" cy="14.4" r="1.1"/>
  `),

  arrow: svg(`<path d="M14.5 5.5 8 12l6.5 6.5"/>`),

  /* Bombilla: "cómo pienso" */
  bulb: svg(`
    <path d="M9 16.4a5.6 5.6 0 1 1 6 0v1.4H9Z"/>
    <path d="M10 20.4h4"/>
  `),
};
