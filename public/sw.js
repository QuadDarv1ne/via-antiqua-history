// Service Worker для PWA
const CACHE_NAME = "via-antiqua-v1";
const DATA_CACHE_NAME = "via-antiqua-data-v1";

const ASSETS_TO_CACHE = ["/", "/manifest.json", "/logo.svg"];

// Install event — кэшируем статические ресурсы
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
  // Активируем SW сразу
  self.skipWaiting();
});

// Activate event — очищаем старые кэши
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DATA_CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  // Контролируем все клиенты сразу
  self.clients.claim();
});

// Fetch event — стратегия Cache First для статики, Network First для данных
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Для API запросов — Network First, но не кэшируем авторизованные данные
  if (url.pathname.startsWith("/api/")) {
    const isAuthEndpoint =
      url.pathname.startsWith("/api/auth/") ||
      url.pathname.startsWith("/api/bookmarks") ||
      url.pathname.startsWith("/api/subscription/");

    if (isAuthEndpoint) {
      // Never cache auth/bookmark/subscription endpoints
      return;
    }

    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cache.match(request);
        }
      }),
    );
    return;
  }

  // Для статики — Cache First
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request)
        .then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback для SPA роутинга
          if (request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/");
          }
        });
    }),
  );
});

// Background sync для офлайн данных
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-bookmarks") {
    event.waitUntil(syncBookmarks());
  }
});

async function syncBookmarks() {
  // Логика синхронизации закладок в фоне
  // eslint-disable-next-line no-console
  console.log("Background sync: bookmarks");
}

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {
    title: "Виа Антиква",
    body: "Обновление доступно!",
    icon: "/logo.svg",
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: "/logo.svg",
      tag: "via-antiqua-notification",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
