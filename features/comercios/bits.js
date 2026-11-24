/**
 * All Cancún — Comercios · Piezas compartidas
 *
 * Funciones puras: reciben datos y devuelven texto o HTML.
 * Sin red, sin estado, para que se puedan probar de una en una.
 */

import { escape } from "../shared/ui.js";

/* Etiqueta legible de cada categoría de la base. */
const NOMBRES = {
  comida: "Comida y bebida",
  comercios: "Tienda",
  mantenimiento: "Mantenimiento",
  salud: "Salud",
  mujeres: "Belleza y moda",
  hombres: "Caballeros",
  estudiantes: "Estudiantes",
  tianguis: "Tianguis",
  mototaxis: "Mototaxis",
};

export const nombreCategoria = (id) => NOMBRES[id] || "Comercio";

/* $125.00 desde centavos. Si viene vacío no se inventa un precio. */
export function precioTexto(centavos) {
  const n = Number(centavos);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `$${(n / 100).toFixed(2)}`;
}

/* El WhatsApp de la base viene a 10 dígitos. */
export const tieneWhatsApp = (negocio) =>
  String(negocio?.whatsapp || "").replace(/\D/g, "").length >= 10;

/* La foto del negocio. En la base solo hay una: `foto_url` (en R2). */
export const fotoNegocio = (negocio) => negocio?.foto_url || "";

/**
 * Imagen con respaldo.
 *
 * Si la URL truena (foto borrada de R2, red caída), se esconde en vez de
 * dejar un ícono roto. `loading="lazy"` es obligatorio: sin él el
 * navegador baja TODAS las fotos de golpe y el costo se dispara.
 */
export function img(url, { clase = "", alt = "", lazy = true } = {}) {
  if (!url) return "";
  return `<img class="${escape(clase)}" src="${escape(url)}" alt="${escape(alt)}"${
    lazy ? ' loading="lazy"' : ""
  } decoding="async" draggable="false" onerror="this.style.display='none'" />`;
}

/* Iniciales para cuando no hay ninguna foto. */
export function iniciales(nombre) {
  const palabras = String(nombre || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!palabras.length) return "?";
  const primera = palabras[0][0] || "";
  const segunda = palabras.length > 1 ? palabras[1][0] : "";
  return (primera + segunda).toUpperCase();
}
