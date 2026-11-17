/* All Cancún - Service Worker (PWA) */
const CACHE_VERSION = "v38";
const CACHE_NAME = `all-cancun-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./app.js",
  "./styles/tokens.css",
  "./styles/base.css",
  "./styles/header.css",
  "./styles/categories.css",
  "./components/icons.js",
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
  "./features/mototaxis/index.js",
  "./features/mototaxis/content.js",
  "./features/mototaxis/map.js",
  "./features/mototaxis/view.css",
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
];


self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

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

  // Estáticos: cache primero, luego red
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
