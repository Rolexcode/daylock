// DayLock SW v3 - FCM + Offline Cache
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js');

const CACHE = 'daylock-v3';
const CACHE_FILES = ['/', '/index.html', '/manifest.json'];

firebase.initializeApp({
  apiKey: "AIzaSyBNitYErbnD2SDGgOgCCnfPwZkaeUYveKs",
  authDomain: "daylock-ce9b6.firebaseapp.com",
  projectId: "daylock-ce9b6",
  storageBucket: "daylock-ce9b6.firebasestorage.app",
  messagingSenderId: "122850231348",
  appId: "1:1228850231348:web:25b2eaebb0c5c34f50f661"
});

const messaging = firebase.messaging();

// ── OFFLINE CACHE ─────────────────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CACHE_FILES))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('/index.html')))
  );
});

// ── FCM BACKGROUND MESSAGES ───────────────────────────────────
messaging.onBackgroundMessage(payload => {
  const { title, body, taskId } = payload.data || {};
  self.registration.showNotification(title || 'DayLock 🔒', {
    body: body || 'Time to lock in.',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'daylock-' + (taskId || Date.now()),
    requireInteraction: true,
    actions: [
      { action: 'done', title: '✅ Mark Done' },
      { action: 'snooze', title: '⏰ Snooze 5m' }
    ],
    data: { taskId }
  });
});

// ── NOTIFICATION CLICK ────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const { action } = e;
  const taskId = e.notification.data?.taskId;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) {
          c.focus();
          c.postMessage({ type: 'NOTIF_ACTION', action, taskId });
          return;
        }
      }
      return clients.openWindow('/').then(c => {
        if (c) setTimeout(() => c.postMessage({ type: 'NOTIF_ACTION', action, taskId }), 1000);
      });
    })
  );
});