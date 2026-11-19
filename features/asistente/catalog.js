/**
 * All Cancún — Asistente · Catálogo local
 * Lo que el asistente puede recomendar de verdad: platillos, servicios y
 * las categorías reales de la app como destino de navegación.
 *
 * Reglas del dataset:
 *   - `kind`: "stall" (puesto / comerciante ambulante) | "shop" (local fijo)
 *             | "service" (servicio a domicilio o taller)
 *   - `price`: rango en MXN por porción / servicio, siempre como [min, max]
 *   - `portions`: cuántas personas llena
 *   - `open`: horas en formato 24h [apertura, cierre]; cierre < apertura = cruza medianoche
 *   - `satiety`: 0–1, qué tanto llena
 *   - `tags`: vocabulario libre; es lo que el motor usa para empatar antojos
 *   - `category`: id de data/categories.js al que pertenece (destino real)
 *
 * NADA inventado a nivel de negocio individual: este archivo describe
 * platillos y tipos de lugar, no nombres de comercios. El asistente no
 * inventa nombres; lo dice abiertamente (ver persona.honest).
 */

/** Traduce `categories.js` a destinos navegables del asistente */
export const categories = [
  { id: "comida", title: "Comida", caption: "Pide y recibe en casa" },
  { id: "tianguis", title: "Tianguis", caption: "Puestos y mercado local" },
  { id: "comercios", title: "Comercios", caption: "Tiendas de tu zona" },
  { id: "mototaxis", title: "Mototaxis", caption: "Traslados por la ciudad" },
  { id: "mantenimiento", title: "Mantenimiento", caption: "Servicio técnico residencial" },
  { id: "mujeres", title: "Solo Mujeres", caption: "Belleza, moda y compra local" },
  { id: "hombres", title: "Solo Hombres", caption: "Calzado, ropa y servicios" },
  { id: "estudiantes", title: "Estudiantes", caption: "Útiles y productos escolares" },
  { id: "salud", title: "Salud y Bienestar", caption: "Bienestar y cuidado personal" },
];

export const places = [];
const street = [
  /* ---------- Comida de la calle: llena, barata, a veces con papas ---------- */
  {
    id: "tacos-pastor",
    name: "Tacos al pastor de la esquina",
    kind: "stall",
    category: "comida",
    price: [45, 90],
    portions: 1,
    open: [17, 2],
    satiety: 0.85,
    tags: ["taco", "tacos", "pastor", "alambre", "carne", "antojito", "hambre", "noche"],
    note: "Con piña, cebolla y cilantro. Salen en minutos.",
  },
  {
    id: "marquesitas",
    name: "Marquesitas del parque",
    kind: "stall",
    category: "comida",
    price: [25, 45],
    portions: 1,
    open: [17, 1],
    satiety: 0.35,
    tags: ["marquesita", "postre", "dulce", "queso", "nutella", "antojo", "noche", "barato"],
    note: "Las clásicas de queso con Nutella. Ojo: son postre, no cena.",
  },
  {
    id: "elotes",
    name: "Elotes y esquites",
    kind: "stall",
    category: "comida",
    price: [25, 50],
    portions: 1,
    open: [16, 23],
    satiety: 0.45,
    tags: ["elote", "esquites", "maiz", "antojito", "vegetariano", "barato", "ligero"],
    note: "Con mayonesa, queso y chile piquín.",
  },
  {
    id: "tortas-ambulante",
    name: "Torta de puesto nocturno",
    kind: "stall",
    category: "comida",
    price: [55, 95],
    portions: 1,
    open: [19, 3],
    satiety: 0.92,
    tags: ["torta", "sandwich", "milanesa", "papas", "hambre", "noche", "llenador"],
    note: "La de milanesa trae papas dentro y llena de verdad.",
  },
  {
    id: "hot-dogs-papas",
    name: "Hot dogs sonorenses con papas",
    kind: "stall",
    category: "comida",
    price: [50, 85],
    portions: 1,
    open: [18, 2],
    satiety: 0.8,
    tags: ["hotdog", "hot dog", "papas", "salchicha", "hambre", "noche", "antojito", "barato"],
    note: "Jitomate, cebolla y tocino. Pide las papas aparte para que no se suavicen.",
  },
  {
    id: "puesto-papas-naturales",
    name: "Puesto de papas naturales con salsa",
    kind: "stall",
    category: "comida",
    price: [35, 60],
    portions: 1,
    open: [13, 22],
    satiety: 0.5,
    tags: ["papas", "papas fritas", "naturales", "antojito", "barato", "vegetariano"],
    note: "Recién cortadas con limón y chile. Si quieres llenar, pide doble.",
  },
  {
    id: "hamburguesa-carrito",
    name: "Hamburguesa de carrito",
    kind: "stall",
    category: "comida",
    price: [70, 130],
    portions: 1,
    open: [19, 3],
    satiety: 0.95,
    tags: ["hamburguesa", "burger", "papas", "carne", "hambre", "noche", "llenador"],
    note: "Carne, queso y papas a la francesa. De las opciones más llenadoras.",
  },
  {
    id: "kibi",
    name: "Kibis y panuchos yucatecos",
    kind: "stall",
    category: "comida",
    price: [30, 70],
    portions: 1,
    open: [11, 21],
    satiety: 0.6,
    tags: ["kibi", "panucho", "yucateco", "antojito", "regional", "barato", "local"],
    note: "Cocina yucateca: barato y distinto a lo de siempre.",
  },
  {
    id: "pizza-rebanada",
    name: "Pizza por rebanada",
    kind: "shop",
    category: "comida",
    price: [35, 90],
    portions: 1,
    open: [12, 1],
    satiety: 0.55,
    tags: ["pizza", "rebanada", "queso", "antojito", "noche", "rapido"],
    note: "Por rebanada sale más barato que la pizza completa.",
  },
];
places.push(...street);

/* ---------- Comida corrida: llena, completa, rendidora ---------- */
places.push(
  {
    id: "comida-corrida",
    name: "Comida corrida del día",
    kind: "shop",
    category: "comida",
    price: [70, 120],
    portions: 1,
    open: [13, 17],
    satiety: 0.97,
    tags: ["comida corrida", "sopa", "guisado", "casero", "hambre", "completa", "mediodia", "barato", "llenador"],
    note: "Sopa, guisado, tortillas y agua. Es lo que más llena por peso.",
  },
  {
    id: "cocina-economica",
    name: "Cocina económica de colonia",
    kind: "shop",
    category: "comida",
    price: [65, 110],
    portions: 1,
    open: [8, 16],
    satiety: 0.95,
    tags: ["cocina economica", "almuerzo", "desayuno", "casero", "hambre", "barato", "manana"],
    note: "Abre temprano: desayuno fuerte por poco.",
  },

  /* ---------- Saludable: ligero pero que llene ---------- */
  {
    id: "ensalada-puesto",
    name: "Ensalada fresca de puesto",
    kind: "stall",
    category: "comida",
    price: [45, 80],
    portions: 1,
    open: [12, 20],
    satiety: 0.5,
    tags: ["ensalada", "verdura", "fresco", "ligero", "saludable", "vegetariano", "cuidarse", "papas"],
    note: "Un ambulante te la arma al momento. Pide doble proteína si traes hambre.",
  },
  {
    id: "tostadas-ceviche",
    name: "Tostadas de ceviche",
    kind: "stall",
    category: "comida",
    price: [60, 110],
    portions: 1,
    open: [11, 18],
    satiety: 0.55,
    tags: ["ceviche", "mariscos", "pescado", "fresco", "ligero", "saludable", "local"],
    note: "Pescado del día: ligero en grasa, alto en proteína.",
  },
  {
    id: "jugos-licuados",
    name: "Jugos y licuados de puesto",
    kind: "stall",
    category: "salud",
    price: [30, 60],
    portions: 1,
    open: [7, 19],
    satiety: 0.2,
    tags: ["jugo", "licuado", "fruta", "saludable", "ligero", "desayuno", "barato", "antojo"],
    note: "Con avena llena más que un jugo solo.",
  },
  {
    id: "fruta-picada",
    name: "Fruta picada con chile",
    kind: "stall",
    category: "comida",
    price: [25, 50],
    portions: 1,
    open: [8, 20],
    satiety: 0.3,
    tags: ["fruta", "saludable", "ligero", "antojito", "barato", "fresco", "antojo"],
    note: "Barata y fresca. No llena si traes hambre de verdad.",
  },
  {
    id: "marisqueria",
    name: "Tostada o coctel de marisquería",
    kind: "shop",
    category: "comida",
    price: [80, 180],
    portions: 1,
    open: [11, 18],
    satiety: 0.75,
    tags: ["mariscos", "coctel", "camaron", "pescado", "region", "cancun", "antojito"],
    note: "Lo de aquí son los mariscos: pruébalo antes que una cadena.",
  },

  /* ---------- Servicios y urgencias ---------- */
  {
    id: "mototaxi",
    name: "Mototaxi dentro de la ciudad",
    kind: "service",
    category: "mototaxis",
    price: [30, 80],
    portions: 1,
    open: [6, 23],
    satiety: 0,
    tags: ["mototaxi", "traslado", "transporte", "viaje", "rapido", "barato", "llevar"],
    note: "Trae cambio: la mayoría cobra en efectivo.",
  },
  {
    id: "tecnico-aire",
    name: "Servicio de aire acondicionado a domicilio",
    kind: "service",
    category: "mantenimiento",
    price: [350, 900],
    portions: 1,
    open: [8, 19],
    satiety: 0,
    tags: ["aire", "clima", "reparacion", "tecnico", "mantenimiento", "calor"],
    note: "Pide revisión completa, no solo relleno de gas.",
  },
  {
    id: "tienda-abarrotes",
    name: "Tienda de abarrotes de la zona",
    kind: "shop",
    category: "comercios",
    price: [15, 200],
    portions: 1,
    open: [7, 23],
    satiety: 0.3,
    tags: ["abarrotes", "tienda", "despensa", "comprar", "basico", "papas", "antojito", "urgencia"],
    note: "Si es urgencia de noche, casi siempre hay una abierta.",
  },
  {
    id: "farmacia-guardia",
    name: "Farmacia de guardia",
    kind: "shop",
    category: "salud",
    price: [40, 400],
    portions: 1,
    open: [0, 24],
    satiety: 0,
    tags: ["farmacia", "medicina", "urgencia", "salud", "dolor", "noche", "24 horas"],
    note: "Si es algo serio, la farmacia no sustituye a un doctor.",
  },
  {
    id: "tianguis-dia",
    name: "Tianguis del día",
    kind: "shop",
    category: "tianguis",
    price: [20, 300],
    portions: 1,
    open: [6, 15],
    satiety: 0.4,
    tags: ["tianguis", "mercado", "puesto", "fruta", "verdura", "barato", "manana", "papas"],
    note: "Fruta y verdura salen a la mitad que en súper.",
  }
);
