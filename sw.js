/* All Cancún - Service Worker (PWA) */
const CACHE_VERSION = "v101";
const CACHE_NAME = `all-cancun-${CACHE_VERSION}`;
/* Respuestas de Supabase (lista de comercios, menús). Se separa del shell
   para poder borrarlo solo cuando cambia la versión, no en cada visita. */
const CACHE_DATOS = `all-cancun-datos-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./app.js",
  "./styles/tokens.css",
  "./styles/base.css",
  "./styles/header.css",
  "./styles/categories.css",
  "./styles/dock.css",
  "./components/icons.js",
  "./components/dock.js",
  "./components/dock-icons.js",
  "./components/header.js",
  "./components/category-grid.js",
  "./data/categories.js",
  "./features/registry.js",
  "./features/router.js",
  "./features/shared/shell.js",
  "./features/shared/ui.js",
  "./features/shared/content.js",
  "./features/shared/building.js",
  "./features/shared/feature-view.css",
  "./features/tabs/shared/tab-view.css",
  "./features/tabs/perfil/view.css",
  "./features/shared/install.js",
  "./features/tabs.js",
  "./features/asistente/index.js",
  "./features/asistente/brain.js",
  "./features/asistente/catalog.js",
  "./features/asistente/reply.js",
  "./features/asistente/persona.js",
  "./features/asistente/icons.js",
  "./features/asistente/view.css",
  "./features/mototaxis/index.js",
  "./features/mototaxis/content.js",
  "./features/mototaxis/map.js",
  "./features/mototaxis/view.css",
  "./features/shared/supabase.js",
  "./features/comercios/index.js",
  "./features/comercios/content.js",
  "./features/comercios/datos.js",
  "./features/comercios/bits.js",
  "./features/comercios/vista-lista.js",
  "./features/comercios/vista-ficha.js",
  "./features/comercios/vista-estados.js",
  "./features/comercios/view.css",
  "./assets/images/comercios-1.jpg",
  "./assets/images/comercios-2.jpg",
  "./assets/images/comercios-3.jpg",
  "./assets/images/comercios-4.jpg",
  "./assets/images/comercios-5.jpg",
  "./assets/images/comida-1.jpg",
  "./assets/images/comida-2.jpg",
  "./assets/images/comida-3.jpg",
  "./assets/images/comida-4.jpg",
  "./assets/images/comida-5.jpg",
  "./assets/images/estudiantes-1.jpg",
  "./assets/images/estudiantes-2.jpg",
  "./assets/images/estudiantes-3.jpg",
  "./assets/images/estudiantes-4.jpg",
  "./assets/images/estudiantes-5.jpg",
  "./assets/images/hombres-1.jpg",
  "./assets/images/hombres-2.jpg",
  "./assets/images/hombres-3.jpg",
  "./assets/images/hombres-4.jpg",
  "./assets/images/hombres-5.jpg",
  "./assets/images/mantenimiento-1.jpg",
  "./assets/images/mantenimiento-2.jpg",
  "./assets/images/mantenimiento-3.jpg",
  "./assets/images/mantenimiento-4.jpg",
  "./assets/images/mantenimiento-5.jpg",
  "./assets/images/mototaxis-1.jpg",
  "./assets/images/mototaxis-2.jpg",
  "./assets/images/mototaxis-3.jpg",
  "./assets/images/mototaxis-4.jpg",
  "./assets/images/mototaxis-5.jpg",
  "./assets/images/mujeres-1.jpg",
  "./assets/images/mujeres-2.jpg",
  "./assets/images/mujeres-3.jpg",
  "./assets/images/mujeres-4.jpg",
  "./assets/images/mujeres-5.jpg",
  "./assets/images/mujeres-6.jpg",
  "./assets/images/salud-1.jpg",
  "./assets/images/salud-2.jpg",
  "./assets/images/salud-3.jpg",
  "./assets/images/salud-4.jpg",
  "./assets/images/salud-5.jpg",
  "./assets/images/tianguis-1.jpg",
  "./assets/images/tianguis-2.jpg",
  "./assets/images/tianguis-3.jpg",
  "./assets/images/tianguis-4.jpg",
  "./assets/images/tianguis-5.jpg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./features/carrito/datos.js",
  "./features/tabs/carrito/index.js",
];


self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  /* Al subir de versión se borran los cachés viejos, incluido el de datos.
     Se conservan solo las dos familias actuales: shell (CACHE_NAME) y
     respuestas de Supabase (CACHE_DATOS). */
  const vigentes = new Set([CACHE_NAME, CACHE_DATOS]);

  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !vigentes.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  /* Configuración pública: NUNCA se cachea.
     - "cache primero" la congelaba: al cambiar credenciales seguía sirviendo
       la versión vieja y la app no conectaba.
     - "red primero + no-store": siempre la versión actual del servidor. */
  if (new URL(request.url).pathname.endsWith("/config.js")) {
    event.respondWith(
      fetch(new Request(request, { cache: "no-store" })).catch(
        () => new Response("", { status: 404, headers: { "Content-Type": "text/javascript" } })
      )
    );
    return;
  }

  // Navegación: red primero, cache como respaldo (offline)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  /* Consultas a Supabase: "red primero, caché de respaldo" con vigencia corta.
     Sin esto, cada apertura de la app vuelve a bajar la lista completa y el
     egress de Supabase crece con cada visita. Con 5 minutos de vigencia, el
     visitante que abre la app varias veces al día consume una sola consulta. */
  if (request.url.includes(".supabase.co/rest/v1/")) {
    event.respondWith(redPrimeroConCache(request, 5 * 60 * 1000));
    return;
  }
  /* Estáticos: cache primero, luego red */
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
      );
    })
  );
});

/* ---------------------------------------------------------------------------
   Red primero, caché de respaldo, con vigencia.
   La marca de tiempo viaja en una cabecera propia de la copia guardada,
   así no hace falta mantener un índice aparte.
   ------------------------------------------------------------------------- */
async function redPrimeroConCache(request, vigenciaMs) {
  const cache = await caches.open(CACHE_DATOS);

  try {
    const response = await fetch(request);

    // Solo se guardan respuestas buenas: un 401 o un 500 no debe quedarse.
    if (response && response.status === 200) {
      const cuerpo = await response.clone().blob();
      const headers = new Headers(response.headers);
      headers.set("x-guardado-en", String(Date.now()));
      cache.put(request, new Response(cuerpo, { status: 200, headers }));
    }

    return response;
  } catch (error) {
    const guardada = await cache.match(request);
    if (!guardada) throw error;

    /* Sin señal se devuelve la copia aunque sea vieja: mostrar los comercios
       de hace un rato es mejor que una pantalla vacía. Se refresca sola en
       segundo plano para la próxima apertura. */
    const guardadoEn = Number(guardada.headers.get("x-guardado-en") || 0);
    if (Date.now() - guardadoEn > vigenciaMs) fetch(request).catch(() => {});

    return guardada;
  }
}
