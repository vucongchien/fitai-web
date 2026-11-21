import { dingToast } from "./ding-engine";

const NETWORK_TOAST_ID = "network-status";
const OFFLINE_DEBOUNCE_MS = 500;

export function bindNetworkToast(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  let offlineTimer: ReturnType<typeof setTimeout> | undefined;
  let wasOffline = false;

  const showOffline = () => {
    wasOffline = true;
    dingToast.warning("Mất kết nối mạng", {
      id: NETWORK_TOAST_ID,
      description: "Kiểm tra Wi-Fi hoặc dữ liệu di động.",
      duration: 0,
    });
  };

  const handleOffline = () => {
    if (offlineTimer !== undefined) {
      clearTimeout(offlineTimer);
    }
    offlineTimer = setTimeout(showOffline, OFFLINE_DEBOUNCE_MS);
  };

  const handleOnline = () => {
    if (offlineTimer !== undefined) {
      clearTimeout(offlineTimer);
      offlineTimer = undefined;
    }
    if (!wasOffline) {
      return;
    }
    wasOffline = false;
    const stillVisible = dingToast.getState().toasts.some((t) => t.id === NETWORK_TOAST_ID);
    if (stillVisible) {
      dingToast.update(NETWORK_TOAST_ID, {
        type: "success",
        title: "Đã kết nối lại mạng",
        description: "",
      });
    } else {
      dingToast.success("Đã kết nối lại mạng");
    }
  };

  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    handleOffline();
  }

  return () => {
    if (offlineTimer !== undefined) {
      clearTimeout(offlineTimer);
    }
    window.removeEventListener("offline", handleOffline);
    window.removeEventListener("online", handleOnline);
  };
}
