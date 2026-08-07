/**
 * FITAI service worker.
 *
 * Deliberately has NO `fetch` handler. Its only job is receiving push while the
 * tab is closed, which is the one thing a page cannot do for itself. Adding a
 * fetch handler here would put a caching layer between the app and every request
 * — stale assets after a deploy, swallowed RPCs — for no benefit, since the app
 * is online-first (PRODUCT.md: "Workout logging is online-first").
 *
 * Asset and model caching is done from the page via the Cache Storage API
 * directly (see inference.worker.ts), which needs no service worker at all.
 *
 * FCM delivers through the standard Web Push protocol, so the payload arrives on
 * a plain `push` event. We do not import the Firebase SW SDK: it would register a
 * second push handler and every notification would appear twice.
 */

self.addEventListener("install", () => {
  // Take over immediately rather than waiting for every old tab to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

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

  event.waitUntil(
    self.registration.showNotification(title, {
      body: notification.body ?? data.body ?? "",
      data: { url: data.url ?? "/notifications" },
      icon: "/icons/icon-192.png",
      tag: data.tag ?? "fitai",
    }),
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
