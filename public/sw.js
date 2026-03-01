const STATIC_CACHE_NAME = "sine-shin-static-v1";
const RUNTIME_CACHE_NAME = "sine-shin-runtime-v1";

const APP_SHELL_FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-192x192.png",
  "/icons/icon-maskable-512x512.png",
  "/icons/apple-touch-icon-180x180.png",
  "/icons/favicon-32x32.png",
  "/icons/favicon-16x16.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName !== STATIC_CACHE_NAME && cacheName !== RUNTIME_CACHE_NAME,
          )
          .map((cacheName) => caches.delete(cacheName)),
      );
      await self.clients.claim();
    })(),
  );
});

function isCacheableAsset(request, url) {
  return (
    request.method === "GET" &&
    url.origin === self.location.origin &&
    ["style", "script", "font", "image", "worker"].includes(request.destination)
  );
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const networkFetch = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => undefined);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await networkFetch;
    return networkResponse || Response.error();
  } catch {
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE_NAME);
            cache.put("/index.html", networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          const appShell = await caches.match("/index.html");
          if (appShell) {
            return appShell;
          }

          return caches.match("/offline.html");
        }
      })(),
    );
    return;
  }

  if (isCacheableAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
