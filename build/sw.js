/**
 * Suprik Wallet - Service Worker
 * Enables offline functionality with NETWORK-FIRST strategy
 *
 * IMPORTANT: Increment VERSION on every deploy to bust cache!
 */

// ⚠️ INCREMENT THIS ON EVERY DEPLOY TO FORCE UPDATE
const VERSION = '2.1.24';

const CACHE_NAME = `suprik-wallet-v${VERSION}`;
const RUNTIME_CACHE = `suprik-runtime-v${VERSION}`;

// Only cache truly static assets (Vite handles JS/CSS with content hashing)
const PRECACHE_URLS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache essential files and activate immediately
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing v${VERSION}...`);

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching static files');
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      // Force activation immediately (don't wait for tabs to close)
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up ALL old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating v${VERSION}...`);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Taking control of all clients');
      // Take control of all pages immediately
      return self.clients.claim();
    }).then(() => {
      // Notify all clients to refresh
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: VERSION
          });
        });
      });
    })
  );
});

// Fetch event - NETWORK FIRST for HTML/JS, cache fallback for assets
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // NETWORK FIRST for HTML and API routes (always get fresh content)
  if (event.request.mode === 'navigate' ||
      url.pathname === '/' ||
      url.pathname.endsWith('.html') ||
      url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Don't cache HTML - always serve fresh
          return response;
        })
        .catch(() => {
          // Only use cache as offline fallback
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // CACHE FIRST for static assets with content hash (Vite bundles)
  if (url.pathname.startsWith('/assets/') ||
      url.pathname.match(/\.[a-f0-9]{8}\.(js|css)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // NETWORK FIRST for everything else (fresh data priority)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for offline use
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request).then((cached) => {
          return cached || new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Suprik Wallet';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync (for offline transactions)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

async function syncTransactions() {
  console.log('[SW] Syncing transactions...');
}

// Message event (for communication with app)
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

console.log(`[SW] Service Worker v${VERSION} loaded`);
