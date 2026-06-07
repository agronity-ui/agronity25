const CACHE_NAME = 'agronity25-v1';
const APP_SHELL = ['/', '/dashboard', '/offline.html', '/manifest.json'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(res => { const copy=res.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)); return res; }).catch(async () => (await caches.match(event.request)) || (await caches.match('/offline.html'))));
});
self.addEventListener('push', event => { const data = event.data?.json?.() || { title: 'Agronity25', body: 'Ada notifikasi baru.' }; event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: 'https://image2url.com/r2/default/images/1775039804162-457ef4f8-5b5d-46af-b13f-5da942fe6314.png', badge: 'https://image2url.com/r2/default/images/1775039804162-457ef4f8-5b5d-46af-b13f-5da942fe6314.png' })); });
