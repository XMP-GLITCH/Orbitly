const CACHE_NAME = 'orbitly-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/vite.svg',
  '/manifest.json',
  // Add more assets as needed
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
});

// Cache all static assets and API requests for offline use
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(response => {
      // Serve from cache if available
      if (response) return response;
      // Otherwise, fetch from network and cache it
      return fetch(event.request).then(networkResponse => {
        // Only cache successful responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback: for navigation requests, serve index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Handle push events for notifications
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  const title = data.title || 'Orbitly Reminder';
  const options = {
    body: data.body || '',
    data: data.data || {},
    icon: '/Picsart_25-05-26_23-07-56-664 (1).png',
    badge: '/Picsart_25-05-26_23-07-56-664 (1).png',
    vibrate: [200, 100, 200],
    requireInteraction: true
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Optionally handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
