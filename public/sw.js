// FITAI push-only service worker (no fetch handler; relays push to open tabs).

self.addEventListener("install", () => {
  // Take over immediately rather than waiting for every old tab to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { body: event.data.text() } };
  }

  // FCM puts display fields under `notification` and custom fields under `data`.
  const notification = payload.notification ?? {};
  const data = payload.data ?? {};
  const title = notification.title ?? data.title ?? "FITAI";

  const body = notification.body ?? data.body ?? "";
  const url = data.url ?? "/notifications";

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body,
        data: { url },
        icon: "/icons/icon-192.png",
        tag: data.tag ?? "fitai",
      }),
      self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "FITAI_PUSH", title, body, url, data });
        }
      }),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? "/notifications";

  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
      // Focus an existing tab rather than opening a duplicate.
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
