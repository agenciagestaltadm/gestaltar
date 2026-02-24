// GUESTALT AR Service Worker
const CACHE_NAME = "guestaltar-v1";
const STATIC_CACHE_NAME = "guestaltar-static-v1";
const DYNAMIC_CACHE_NAME = "guestaltar-dynamic-v1";

// Assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/upload",
  "/ar",
  "/manifest.json",
];

// External assets to cache
const EXTERNAL_ASSETS = [
  "https://cdn.jsdelivr.net/npm/aframe@1.4.0/dist/aframe-master.min.js",
  "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.0/dist/mindar-image-aframe.prod.js",
  "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.0/examples/image-tracking/assets/card-example/card.mind",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache external assets
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        console.log("[SW] Caching external assets");
        return Promise.all(
          EXTERNAL_ASSETS.map((url) =>
            fetch(url)
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(() => {
                console.warn("[SW] Failed to cache:", url);
              })
          )
        );
      }),
    ]).then(() => {
      console.log("[SW] Installation complete");
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== STATIC_CACHE_NAME &&
              name !== DYNAMIC_CACHE_NAME &&
              name !== CACHE_NAME
            );
          })
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log("[SW] Activation complete");
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip API requests
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Skip Supabase requests
  if (url.hostname.includes("supabase.co")) {
    return;
  }

  // For navigation requests, try network first, then cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Return cached response or offline page
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match("/");
          });
        })
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update cache in background
        event.waitUntil(
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => {
              // Ignore fetch errors for background updates
            })
        );
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Cache the response
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline fallback for certain request types
          if (request.destination === "image") {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#000" width="100" height="100"/><text fill="#fff" x="50%" y="50%" text-anchor="middle">Offline</text></svg>',
              { headers: { "Content-Type": "image/svg+xml" } }
            );
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

// Background sync for analytics
self.addEventListener("sync", (event) => {
  if (event.tag === "analytics-sync") {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  try {
    // Get pending analytics from IndexedDB or localStorage
    const pendingEvents = await getPendingAnalytics();
    
    if (pendingEvents.length === 0) return;

    // Send to server
    const response = await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: pendingEvents }),
    });

    if (response.ok) {
      // Clear pending events
      await clearPendingAnalytics();
    }
  } catch (error) {
    console.error("[SW] Analytics sync failed:", error);
  }
}

async function getPendingAnalytics() {
  // This would use IndexedDB in a real implementation
  return [];
}

async function clearPendingAnalytics() {
  // This would clear IndexedDB in a real implementation
}

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || "Nova atualização do GUESTALT AR!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
    actions: [
      { action: "open", title: "Abrir" },
      { action: "close", title: "Fechar" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "GUESTALT AR", options)
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});

// Message handler for communication with main thread
self.addEventListener("message", (event) => {
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  if (event.data.type === "CACHE_URLS") {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

console.log("[SW] Service worker loaded");
