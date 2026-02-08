// اسم الكاش
const CACHE_NAME = 'walking-tracker-v1';

// الملفات المطلوب تخزينها
const CACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// حدث التثبيت - تخزين الملفات
self.addEventListener('install', function(event) {
  console.log('Service Worker: جاري التثبيت...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: جاري تخزين الملفات...');
        return cache.addAll(CACHE_URLS);
      })
      .then(function() {
        console.log('Service Worker: تم التثبيت بنجاح');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.error('Service Worker: فشل التثبيت', error);
      })
  );
});

// حدث التفعيل - تنظيف الكاش القديم
self.addEventListener('activate', function(event) {
  console.log('Service Worker: جاري التفعيل...');
  
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: حذف الكاش القديم:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(function() {
        console.log('Service Worker: تم التفعيل بنجاح');
        return self.clients.claim();
      })
  );
});

// حدث الطلب - استراتيجية Cache First
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(cachedResponse) {
        // إذا وُجد في الكاش، إرجاعه
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // إذا لم يوجد، جلبه من الشبكة
        return fetch(event.request)
          .then(function(networkResponse) {
            // تخزين النسخة الجديدة في الكاش
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseClone);
                });
            }
            return networkResponse;
          })
          .catch(function(error) {
            console.error('Service Worker: فشل جلب الملف من الشبكة', error);
            // يمكن إرجاع صفحة احتياطية هنا
          });
      })
  );
});

// حدث الرسائل (اختياري)
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
