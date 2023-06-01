---
layout: 
sitemap: false
---

const CACHE = "cache-v{{ site.time | date: '%s' }}";

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll([
        "/",
        "/about/",
        "/contact/",
        "/services/",
        "/privacy/",
        "/terms/",
        "/offline/",
        "/assets/css/theme.css",
        "/assets/js/jquery.min.js",
        "/assets/js/lunr.js"
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheAllowlist = [CACHE];
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (!cacheAllowlist.includes(key)) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

workbox.routing.registerRoute(
  new RegExp('/*'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE
  })
);

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;

        if (preloadResp) {
          return preloadResp;
        }

        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {

        //const cache = await caches.open(CACHE);
        const cachedResp = await caches.match("/offline/");
        if (cachedResp) {
          return cachedResp;
        }

        return new Response("Network error happened", {
          status: 408,
          headers: {
            "Content-Type": "text/plain"
          },
        });
      }
    })());
  }
});
