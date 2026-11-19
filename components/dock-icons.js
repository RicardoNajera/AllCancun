/**
 * All Cancún — Iconos del dock
 * SVG nativos, 24x24, trazo 1.7px, `currentColor`. Cero dependencias.
 */

const svg = (body) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const dockIcons = {
  home: svg(`
    <path d="M4 10.4 12 3.8l8 6.6"/>
    <path d="M6.3 9.3v9.9h11.4V9.3"/>
    <path d="M10.2 19.2v-5h3.6v5"/>
  `),

  cart: svg(`
    <path d="M3.2 4.2h2.3l2.2 10.3h9.6"/>
    <path d="M6.1 7.3h13.1l-1.6 7.2"/>
    <circle cx="9.4" cy="18.9" r="1.5"/>
    <circle cx="17.1" cy="18.9" r="1.5"/>
  `),

  live: svg(`
    <circle cx="12" cy="12" r="2.4"/>
    <path d="M7.8 7.8a6 6 0 0 0 0 8.4"/>
    <path d="M16.2 16.2a6 6 0 0 0 0-8.4"/>
    <path d="M5.1 5.1a9.8 9.8 0 0 0 0 13.8"/>
    <path d="M18.9 18.9a9.8 9.8 0 0 0 0-13.8"/>
  `),

  profile: svg(`
    <circle cx="12" cy="8.2" r="3.6"/>
    <path d="M4.9 20.2c0-3.7 3.2-6.2 7.1-6.2s7.1 2.5 7.1 6.2"/>
  `),

  spark: svg(`
    <path d="M12 3.4l1.7 4.3 4.3 1.7-4.3 1.7L12 15.4l-1.7-4.3L6 9.4l4.3-1.7Z"/>
    <path d="M18.2 15.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z"/>
  `),
};
