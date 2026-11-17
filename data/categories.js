/**
 * All Cancún — Catálogo de categorías
 * Fuente única de verdad del home. Añadir una categoría = añadir un objeto.
 */

const photos = (prefix, count) =>
  Array.from({ length: count }, (_, index) => `${prefix}-${index + 1}.jpg`);

export const categories = [
  {
    id: "mototaxis",
    title: "Mototaxis",
    caption: "Traslados por la ciudad",
    icon: "viajes",
    accent: "viajes",
    images: photos("mototaxis", 5),
  },
  {
    id: "tianguis",
    title: "Tianguis",
    caption: "Puestos y mercado local",
    icon: "tianguis",
    accent: "tianguis",
    images: photos("tianguis", 5),
  },
  {
    id: "comercios",
    title: "Comercios",
    caption: "Tiendas de tu zona",
    icon: "comercios",
    accent: "comercios",
    images: photos("comercios", 5),
  },
  {
    id: "mantenimiento",
    title: "Mantenimiento",
    caption: "Servicio técnico residencial",
    icon: "mantenimiento",
    accent: "mantenimiento",
    images: photos("mantenimiento", 5),
  },
  {
    id: "mujeres",
    title: "Solo Mujeres",
    caption: "Belleza, moda y compra local",
    icon: "mujeres",
    accent: "mujeres",
    images: photos("mujeres", 6),
  },
  {
    id: "hombres",
    title: "Solo Hombres",
    caption: "Calzado, ropa y servicios",
    icon: "hombres",
    accent: "hombres",
    images: photos("hombres", 5),
  },
  {
    id: "estudiantes",
    title: "Estudiantes",
    caption: "Útiles y productos escolares",
    icon: "estudiantes",
    accent: "estudiantes",
    images: photos("estudiantes", 5),
  },
  {
    id: "salud",
    title: "Salud y Bienestar",
    caption: "Bienestar y cuidado personal",
    icon: "salud",
    accent: "salud",
    images: photos("salud", 5),
  },
  {
    id: "comida",
    title: "Comida",
    caption: "Pide y recibe en casa",
    icon: "comida",
    accent: "comida",
    images: photos("comida", 5),
  },
];
