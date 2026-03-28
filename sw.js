// DayLock SW v2
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'DayLock 🔒', {
      body: data.body || 'Time to lock in.',
      tag: data.tag || 'daylock',
      requireInteraction: true,
      actions: [
        { action: 'done', title: '✅ Mark Done' },
        { action: 'snooze', title: '⏰ Snooze 5m' }
      ],
      data: data
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const { action } = e;
  const taskId = e.notification.data?.taskId;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) {
          c.focus();
          c.postMessage({ type: 'NOTIF_ACTION', action, taskId });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/').then(c => {
          if (c) setTimeout(() => c.postMessage({ type: 'NOTIF_ACTION', action, taskId }), 1000);
        });
      }
    })
  );
});