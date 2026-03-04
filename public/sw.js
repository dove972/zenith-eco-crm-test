const CACHE_NAME = 'zenith-eco-v1';
const BAREME_CACHE = 'zenith-eco-baremes-v1';

const STATIC_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== BAREME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Stale-while-revalidate for barème API calls
  if (url.pathname.includes('/rest/v1/') &&
      (url.pathname.includes('sale_prices') ||
       url.pathname.includes('mpr_thresholds') ||
       url.pathname.includes('mpr_rates') ||
       url.pathname.includes('cee_rates') ||
       url.pathname.includes('credit_rates') ||
       url.pathname.includes('complementary_products'))) {
    event.respondWith(
      caches.open(BAREME_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Network first for other requests
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
