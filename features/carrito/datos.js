/**
 * All Cancún — Carrito · Almacén
 *
 * Guarda los productos que el visitante aparta, en su propio teléfono
 * (localStorage). No se manda nada a Supabase: el pedido se cierra por
 * WhatsApp directo con el negocio, sin comisión y sin cuentas.
 *
 * Se agrupa por negocio porque un pedido va a UN negocio, no a varios.
 */

const CLAVE = "all-cancun-carrito";

/* { negocioId: { id, nombre, slug, whatsapp, items: [{ id, nombre, precio, cantidad }] } } */
export function leer() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    const datos = crudo ? JSON.parse(crudo) : {};
    return datos && typeof datos === "object" ? datos : {};
  } catch {
    return {};
  }
}

function escribir(carrito) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(carrito));
  } catch {
    /* Sin espacio o modo privado: la app sigue funcionando */
  }
  // El dock y otras vistas se enteran del cambio por este evento.
  window.dispatchEvent(new CustomEvent("carrito:cambio"));
}

/** Cuántas piezas hay en total (para el globito del dock). */
export function totalPiezas(carrito = leer()) {
  return Object.values(carrito).reduce(
    (suma, n) => suma + n.items.reduce((s, i) => s + i.cantidad, 0),
    0
  );
}

/** Suma en centavos de todo lo apartado. */
export function totalCentavos(carrito = leer()) {
  return Object.values(carrito).reduce(
    (suma, n) => suma + n.items.reduce((s, i) => s + i.precio * i.cantidad, 0),
    0
  );
}

/**
 * Agrega un producto. Si ya estaba, sube la cantidad.
 * `negocio` trae lo necesario para armar el mensaje de WhatsApp después.
 */
export function agregar(negocio, producto) {
  const carrito = leer();
  const id = String(negocio.id);

  const grupo = carrito[id] || {
    id,
    nombre: negocio.nombre,
    slug: negocio.slug,
    whatsapp: negocio.whatsapp || "",
    items: [],
  };

  const existente = grupo.items.find((i) => i.id === producto.id);
  if (existente) {
    existente.cantidad += 1;
  } else {
    grupo.items.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio_centavos) || 0,
      cantidad: 1,
    });
  }

  carrito[id] = grupo;
  escribir(carrito);
  return carrito;
}

/** Quita una pieza; si llega a cero se borra la fila. */
export function quitar(negocioId, productoId) {
  const carrito = leer();
  const grupo = carrito[negocioId];
  if (!grupo) return carrito;

  const item = grupo.items.find((i) => i.id === productoId);
  if (item) item.cantidad -= 1;

  grupo.items = grupo.items.filter((i) => i.cantidad > 0);
  if (!grupo.items.length) delete carrito[negocioId];

  escribir(carrito);
  return carrito;
}

/** Vacía el pedido de un negocio (después de mandarlo). */
export function vaciarNegocio(negocioId) {
  const carrito = leer();
  delete carrito[negocioId];
  escribir(carrito);
  return carrito;
}

/**
 * Arma el mensaje de WhatsApp con el pedido completo, en texto plano.
 * Se manda al número del negocio: él confirma precio y entrega.
 */
export function mensajePedido(grupo) {
  const lineas = grupo.items.map(
    (i) => `• ${i.cantidad} x ${i.nombre} — $${((i.precio * i.cantidad) / 100).toFixed(2)}`
  );
  const total = grupo.items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  return [
    `Hola ${grupo.nombre}, quiero pedir desde All Cancún:`,
    "",
    ...lineas,
    "",
    `Total: $${(total / 100).toFixed(2)}`,
  ].join("\n");
}
