const cacheName = 'v1.4::static';

self.addEventListener('install', event => {
  // Once SW is installed, fetch the resources to make this work offline
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll([
        '/',
        'index.html',
        'manifest.json',
        'icon.png',
        'css/styles.min.css',
        'images/offline.png',
        'js/app.min.js'
      ]).then(() => self.skipWaiting());
    })
  );
});

// When the browser fetches a URL, respond from the cache, or get from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(res => res || fetch(event.request))
      .catch(() => {
        // Replace jpg requests (screenshots) with a cached offline fallback
        if (event.request.url.endsWith('.jpg')){
          return caches.match('images/offline.png'); // This is that image! :)
        }
      })
  );
});

self.addEventListener('activate', event => {
  // Replace old cached objects with updated ones
  function clearOldCaches(){
    return caches.keys()
      .then( keys => {
        return Promise.all(keys
          .filter(key => key.indexOf(cacheName) !== 0)
          .map(key => caches.delete(key))
        );
      });
  }

  // Activate Service Worker
  event.waitUntil(clearOldCaches()
    .then( () => self.clients.claim() )
  );
});
