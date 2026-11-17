/* 광주 밥약 & 포토스팟 맵 — offline shell
   껍데기(index.html·아이콘·지도 라이브러리)는 캐시, 장소 데이터는 항상 네트워크 우선. */
var CACHE = 'gwangju-map-v4';
var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './vendor/leaflet.css',
  './vendor/leaflet.js',
  './vendor/leaflet.markercluster.js',
  './vendor/MarkerCluster.css',
  './vendor/MarkerCluster.Default.css'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  var isData = /\/data\//.test(url.pathname);
  var isPage = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname);

  // 장소 목록과 페이지는 네트워크 우선 — 고친 내용이 바로 보이도록
  if (isData || isPage) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || (isPage ? caches.match('./index.html') : undefined);
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && res.status === 200 && url.origin === self.location.origin) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
