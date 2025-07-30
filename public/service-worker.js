const CACHE_NAME = 'orbitly-cache-v1';
// Add all main app shell files and assets to cache for offline
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Picsart_25-05-26_23-07-56-664 (1).png',
  '/src/App.css',
  '/src/index.css',
  '/src/App.jsx',
  '/src/Calendar.jsx',
  '/src/Journal.jsx',
  '/src/Reminders.jsx',
  '/src/Schedule.jsx',
  '/src/VoiceMemos.jsx',
  '/src/Welcome.jsx',
  '/src/Header.jsx',
  '/src/assets/mixkit-urgent-simple-tone-loop-2976.wav',
  // Add more assets as needed
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Activate new SW immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// On activate, claim clients immediately for PWA updates
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
      ),
      self.clients.claim(),
      // Force all open clients to reload and use the new SW
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
          client.navigate(client.url);
        });
      })
    ])
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
        // Fallback: for static assets, try to serve a fallback asset or nothing
        if (event.request.destination === 'image') {
          return new Response('', { status: 404 });
        }
        if (event.request.destination === 'style' || event.request.destination === 'script') {
          return new Response('', { status: 404 });
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
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open Orbitly' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  event.waitUntil(
    (async () => {
      // Show notification
      await self.registration.showNotification(title, options);
      // If any client is focused, post a message to play sound in foreground
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        if (client.focused || client.visibilityState === 'visible') {
          client.postMessage({ type: 'orbitly-reminder', title, body: options.body });
        }
      }
    })()
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
