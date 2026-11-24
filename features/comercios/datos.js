/**
 * All Cancún — Comercios · Datos
 *
 * Lee los negocios y sus productos desde Supabase.
 *
 * Regla de oro (esto es lo que mantiene el costo en $0):
 *   - Nunca se pide la tabla completa. Siempre de PAGINA en PAGINA.
 *   - Solo se piden las columnas que la pantalla necesita.
 *     La descripción larga se pide aparte, al abrir el negocio.
 *
 * Las fotos NO se leen de aquí: la base solo guarda su URL en R2.
 * El navegador las baja directo de R2 con loading="lazy".
 */

import { getSupabase } from "../shared/supabase.js";

/* Columnas mínimas para pintar una tarjeta en la lista.
   Todo lo demás (descripción, dirección) se pide al detalle. */
const CAMPOS_LISTA = ["id", "nombre", "slug", "categoria", "colonia", "foto_url"].join(",");

const CAMPOS_DETALLE = [
  "id",
  "nombre",
  "slug",
  "categoria",
  "descripcion",
  "colonia",
  "direccion",
  "whatsapp",
  "telefono",
  "foto_url",
].join(",");

const CAMPOS_PRODUCTO = [
  "id",
  "nombre",
  "descripcion",
  "precio_centavos",
  "disponible",
  "foto_url",
].join(",");

export const PAGINA = 20;

/**
 * Lista negocios publicados.
 *
 * `estado = 'activo'` va en la consulta, no en el navegador: así la base
 * manda solo lo público y el RLS lo vuelve a confirmar por su lado.
 *
 * Devuelve { negocios, hayMas } para que la vista sepa si mostrar
 * el botón de "ver más".
 */
export async function listarNegocios({ desde = 0, categoria = null } = {}) {
  const supabase = await getSupabase();
  if (!supabase) return { negocios: [], hayMas: false, error: "Sin conexión." };

  let consulta = supabase
    .from("negocios")
    .select(CAMPOS_LISTA)
    .eq("estado", "activo")
    .order("nombre", { ascending: true })
    // Se pide uno de más para saber si hay siguiente página sin
    // hacer una consulta extra de conteo.
    .range(desde, desde + PAGINA);

  if (categoria) consulta = consulta.eq("categoria", categoria);

  const { data, error } = await consulta;

  if (error) {
    console.warn("[comercios] listarNegocios:", error.message);
    return { negocios: [], hayMas: false, error: error.message };
  }

  const filas = data || [];
  const hayMas = filas.length > PAGINA;

  return { negocios: hayMas ? filas.slice(0, PAGINA) : filas, hayMas, error: null };
}

/** Un negocio por su slug, con todos los datos de la ficha. */
export async function getNegocioPorSlug(slug) {
  const supabase = await getSupabase();
  if (!supabase) return { negocio: null, error: "Sin conexión." };

  const { data, error } = await supabase
    .from("negocios")
    .select(CAMPOS_DETALLE)
    .eq("slug", String(slug || "").trim())
    .eq("estado", "activo")
    .maybeSingle();

  if (error) {
    console.warn("[comercios] getNegocioPorSlug:", error.message);
    return { negocio: null, error: error.message };
  }

  return { negocio: data || null, error: null };
}

/** Los productos de un negocio, en el orden en que se dieron de alta. */
export async function getMenu(negocioId) {
  const supabase = await getSupabase();
  if (!supabase || !negocioId) return { productos: [], error: null };

  const { data, error } = await supabase
    .from("productos")
    .select(CAMPOS_PRODUCTO)
    .eq("negocio_id", negocioId)
    .order("orden", { ascending: true });

  if (error) {
    console.warn("[comercios] getMenu:", error.message);
    return { productos: [], error: error.message };
  }

  return { productos: data || [], error: null };
}

/**
 * Arma el enlace de WhatsApp.
 *
 * En México los números se guardan a 10 dígitos (los de la base), pero
 * wa.me exige lada de país: se antepone 52. Si ya viene con 52, no se
 * duplica.
 */
export function enlaceWhatsApp(numero, texto = "") {
  const digitos = String(numero || "").replace(/\D/g, "");
  if (digitos.length < 10) return "";

  const conLada = digitos.length === 10 ? `52${digitos}` : digitos;
  const mensaje = String(texto || "").trim();

  return `https://wa.me/${conLada}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ""}`;
}

/** Mensaje que el cliente manda al pedir un producto. */
export function mensajeProducto(negocio, producto) {
  const precio = producto?.precio_centavos
    ? ` ($${(producto.precio_centavos / 100).toFixed(2)})`
    : "";
  return `Hola ${negocio?.nombre || "buenas tardes"}, vi "${producto?.nombre || "su producto"}"${precio} en All Cancún y quiero pedirlo.`;
}
