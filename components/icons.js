/**
 * All Cancún — Set de iconos SVG
 * Trazo de 1.7px, 24x24, sin dependencias externas.
 * Cada icono usa `currentColor` para heredar el acento de su tarjeta.
 */

const svg = (body, extraClass = "") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"
        class="${extraClass}">${body}</svg>`;

export const icons = {
  /* Logotipo: monograma "A" estilizado con destello caribe */
  brand: svg(`
    <path d="M5.4 18.6 12 4.6l6.6 14"/>
    <path d="M8.7 14.2h6.6"/>
    <path d="M18.2 3.4l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9Z"/>
  `),

  /* Instalar app */
  install: svg(`
    <path d="M12 3.5v10"/>
    <path d="m8.2 9.9 3.8 3.8 3.8-3.8"/>
    <path d="M4.5 16.5v2A2 2 0 0 0 6.5 20.5h11a2 2 0 0 0 2-2v-2"/>
  `),

  /* Viajes — pin de ruta estilo mapas + carretera */
  viajes: svg(`
    <path d="M12 20.5s6-4.9 6-9.7A6 6 0 0 0 6 10.8c0 4.8 6 9.7 6 9.7Z"/>
    <circle cx="12" cy="10.6" r="2.2"/>
  `),

  /* Tianguis — puesto de mercado con toldo y bolsa */
  tianguis: svg(`
    <path d="M3.5 8.5h17"/>
    <path d="M5 8.5 6.4 4.5h11.2L19 8.5"/>
    <path d="M5 8.5c0 1.5 1.2 2.6 2.7 2.6s2.6-1.1 2.6-2.6c0 1.5 1.2 2.6 2.7 2.6s2.7-1.1 2.7-2.6c0 1.5 1.1 2.6 2.6 2.6S21 10 21 8.5"/>
    <path d="M6.2 11.1v8.4h11.6v-8.4"/>
    <path d="M9.6 19.5v-4.2h4.8v4.2"/>
  `),

  /* Comercios — bolsa de tienda */
  comercios: svg(`
    <path d="M5.2 7.8h13.6l1.1 11.6a1.6 1.6 0 0 1-1.6 1.8H5.7a1.6 1.6 0 0 1-1.6-1.8Z"/>
    <path d="M8.9 7.8V6.2a3.1 3.1 0 0 1 6.2 0v1.6"/>
  `),

  /* Mantenimiento — llave inglesa */
  mantenimiento: svg(`
    <path d="M14.7 6.3a3.9 3.9 0 0 0 5.1 5.1l-8.6 8.6a2.6 2.6 0 0 1-3.7-3.7Z"/>
    <path d="M14.8 6.2 17.3 3.7"/>
    <path d="M18.9 10.3 21.4 7.8"/>
  `),

  /* Solo Mujeres — silueta femenina + destello */
  mujeres: svg(`
    <circle cx="11.4" cy="5.4" r="2.9"/>
    <path d="M11.4 8.6c-2.7 0-4.4 1.8-4.6 4.4l-.4 4.2h3l.4 4.3h3.2l.4-4.3h3l-.4-4.2c-.2-2.6-1.9-4.4-4.6-4.4Z"/>
    <path d="M19.4 3.2v3.2M17.8 4.8h3.2"/>
  `),

  /* Solo Hombres — silueta masculina */
  hombres: svg(`
    <circle cx="10.8" cy="5.6" r="3"/>
    <path d="M10.8 8.9c-3 0-5 2.1-5.2 5l-.5 4.6h3.1l.4 3h4.4l.4-3h3.1l-.5-4.6c-.2-2.9-2.2-5-5.2-5Z"/>
    <path d="M17.4 4.2h3.2v3.2"/>
  `),

  /* Estudiantes — birrete + libro */
  estudiantes: svg(`
    <path d="M2.8 9.2 12 5.1l9.2 4.1L12 13.3 2.8 9.2Z"/>
    <path d="M6.6 11v4.2c0 1.5 2.4 2.7 5.4 2.7s5.4-1.2 5.4-2.7V11"/>
    <path d="M20.4 9.9v4.6"/>
  `),

  /* Salud y Bienestar — corazón con pulso */
  salud: svg(`
    <path d="M12 20.3S3.8 15.4 3.8 9.6a4.3 4.3 0 0 1 8.2-1.5 4.3 4.3 0 0 1 8.2 1.5c0 5.8-8.2 10.7-8.2 10.7Z"/>
    <path d="M6.6 11.7h2.3l1.4-2.2 1.8 4 1.4-2.2h2.9"/>
  `),

  /* Comida — plato con cubiertos */
  comida: svg(`
    <path d="M3.6 11.4h16.8a8.4 8.4 0 0 1-8.4 8h0a8.4 8.4 0 0 1-8.4-8Z"/>
    <path d="M7.6 7.6c0-1.4 1.2-2 1.2-3.2M12 7.2c0-1.6 1.2-2.2 1.2-3.6M16.4 7.6c0-1.4 1.2-2 1.2-3.2"/>
  `),

  /* Hogar y Servicios domésticos — casa */
  hogar: svg(`
    <path d="M4 10.6 12 4l8 6.6"/>
    <path d="M6.2 9.5v10h11.6v-10"/>
    <path d="M10.2 19.5v-5.3h3.6v5.3"/>
  `),

  /* Volver atrás */
  arrowLeft: svg(`
    <path d="M14.5 5.5 8 12l6.5 6.5"/>
  `),

  /* Equipo de desarrollo — tres personas */
  team: svg(`
    <circle cx="12" cy="8" r="2.6"/>
    <path d="M7.2 19.4c0-2.6 2.1-4.4 4.8-4.4s4.8 1.8 4.8 4.4"/>
    <circle cx="5" cy="10.2" r="1.9"/>
    <path d="M2.2 18.6c0-2 1.2-3.4 2.8-3.4"/>
    <circle cx="19" cy="10.2" r="1.9"/>
    <path d="M21.8 18.6c0-2-1.2-3.4-2.8-3.4"/>
  `),

  /* Código / desarrollo */
  code: svg(`
    <path d="M8.6 8.2 4.2 12l4.4 3.8"/>
    <path d="M15.4 8.2 19.8 12l-4.4 3.8"/>
    <path d="M13.4 5.6l-2.8 12.8"/>
  `),

  /* Verificado — check en círculo */
  check: svg(`
    <circle cx="12" cy="12" r="8.6"/>
    <path d="M8.4 12.2l2.5 2.5 4.7-5"/>
  `),

  /* Reloj — en proceso */
  clock: svg(`
    <circle cx="12" cy="12" r="8.6"/>
    <path d="M12 7.4V12l3.2 2"/>
  `),

  /* Rayo — rapidez */
  bolt: svg(`
    <path d="M13.2 3.4 6 13.4h4.4L10 20.6 17.6 10.4h-4.6Z"/>
  `),
};
