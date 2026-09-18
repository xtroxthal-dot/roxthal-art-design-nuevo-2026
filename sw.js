const CACHE_NAME = "roxthal-art-design-v5";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  /*
   * INDEX.HTML Y LA PÁGINA PRINCIPAL:
   * Siempre intentamos obtener la versión actual
   * desde GitHub Pages antes de usar la caché.
   */
  if (
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/")
  ) {
    event.respondWith(
      fetch(event.request, {
        cache: "no-store"
      })
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy);
          });

          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );

    return;
  }

  /*
   * RESTO DE ARCHIVOS:
   * Primero red, y si no hay conexión,
   * utiliza la copia almacenada.
   */
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, copy);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
