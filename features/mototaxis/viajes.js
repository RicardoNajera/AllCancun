/**
 * All Cancún — Mototaxis · Viajes
 *
 * Pide un viaje a Supabase y espera a que un conductor lo acepte.
 *
 * Regla del negocio: el viaje nace en estado `solicitado` y el PRIMER
 * conductor que lo acepta se lo queda. La app del cliente NO asigna
 * conductor: solo escucha hasta que `conductor_id` deja de ser null.
 *
 * Si no hay sesión, devuelve null y la vista sigue con la simulación
 * de siempre: pedir un viaje sin cuenta nunca debe romperse.
 */

import { getSupabase } from "../shared/supabase.js";

/**
 * ¿Están las credenciales de Supabase configuradas?
 *
 * Se usa para decidir si se puede caer a la simulación. Si Supabase SÍ
 * está configurado pero el viaje no se guardó, es un error de verdad y
 * hay que avisarlo: simular ahí engaña al usuario.
 */
export function haySupabase() {
  return Boolean(
    window.ALL_CANCUN_SUPABASE_URL && window.ALL_CANCUN_SUPABASE_ANON_KEY
  );
}

export const ESTADO = {
  SOLICITADO: "solicitado",
  ACEPTADO: "aceptado",
  EN_CAMINO: "en_camino",
  A_BORDO: "a_bordo",
  COMPLETADO: "completado",
  CANCELADO: "cancelado",
};

/** Código de 4 dígitos que el pasajero le dice al conductor al subir. */
function codigoAbordaje() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Crea el viaje. Devuelve { viaje, error }.
 *
 * El precio se guarda en CENTAVOS, igual que en el resto de la base.
 * `tipo` usa el enum tipo_vehiculo; el mototaxi es 'mototaxi'.
 */
export async function crearViaje({
  origen,
  destino,
  precio,
  notas = null,
  tipo = "mototaxi",
}) {
  const supabase = await getSupabase();
  if (!supabase) return { viaje: null, error: null }; // sin Supabase: modo demo

  const { data: sesion } = await supabase.auth.getSession();
  const clienteId = sesion?.session?.user?.id || null;
  if (!clienteId) return { viaje: null, error: null }; // sin sesión: modo demo

  const { data, error } = await supabase
    .from("viajes")
    .insert({
      cliente_id: clienteId,
      estado: ESTADO.SOLICITADO,
      tipo,
      origen_texto: String(origen?.name || "Origen").slice(0, 200),
      origen_lat: origen?.lat ?? null,
      origen_lng: origen?.lng ?? null,
      destino_texto: String(destino?.name || "Destino").slice(0, 200),
      destino_lat: destino?.lat ?? null,
      destino_lng: destino?.lng ?? null,
      precio_centavos: Math.round(Number(precio || 0) * 100),
      moneda: "MXN",
      notas: notas ? String(notas).slice(0, 500) : null,
      codigo_abordaje: codigoAbordaje(),
    })
    .select("id, estado, codigo_abordaje, precio_centavos, solicitado_en")
    .maybeSingle();

  if (error) {
    console.warn("[mototaxis] crearViaje:", error.message);
    return { viaje: null, error: error.message };
  }

  return { viaje: data || null, error: null };
}

/**
 * Escucha el viaje hasta que un conductor lo tome.
 *
 * `onCambio(fila)` recibe la fila cada vez que cambia: primero
 * `solicitado`, luego `aceptado` con `conductor_id` puesto.
 *
 * Devuelve la función para dejar de escuchar.
 */
export async function esperarConductor(viajeId, onCambio) {
  const supabase = await getSupabase();
  if (!supabase || !viajeId) return () => {};

  const canal = supabase
    .channel(`viaje-${viajeId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "viajes",
        filter: `id=eq.${viajeId}`,
      },
      (payload) => {
        if (payload?.new) onCambio(payload.new);
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(canal);
    } catch {
      /* canal ya cerrado */
    }
  };
}

/** Relee el viaje. Sirve de respaldo si Realtime no está activado. */
export async function leerViaje(viajeId) {
  const supabase = await getSupabase();
  if (!supabase || !viajeId) return { viaje: null, error: null };

  const { data, error } = await supabase
    .from("viajes")
    .select("id, estado, conductor_id, codigo_abordaje, precio_centavos, aceptado_en")
    .eq("id", viajeId)
    .maybeSingle();

  return { viaje: data || null, error: error?.message || null };
}

/** Cancela el viaje. Solo funciona si todavía no lo tomó un conductor. */
export async function cancelarViaje(viajeId) {
  const supabase = await getSupabase();
  if (!supabase || !viajeId) return { error: null };

  const { error } = await supabase
    .from("viajes")
    .update({ estado: ESTADO.CANCELADO, cancelado_en: new Date().toISOString() })
    .eq("id", viajeId)
    .eq("estado", ESTADO.SOLICITADO);

  return { error: error?.message || null };
}

/**
 * Lee los datos públicos del conductor asignado, para pintar su ficha.
 * Usa la vista `conductor_publico`, que no expone teléfono ni posición
 * exacta.
 */
export async function getConductorPublico(conductorId) {
  const supabase = await getSupabase();
  if (!supabase || !conductorId) return { conductor: null, error: null };

  const { data, error } = await supabase
    .from("conductor_publico")
    .select("*")
    .eq("id", conductorId)
    .maybeSingle();

  return { conductor: data || null, error: error?.message || null };
}
