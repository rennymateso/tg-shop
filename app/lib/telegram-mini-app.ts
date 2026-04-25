export type TelegramMiniAppUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

type TelegramEventPayload = {
  status?: string;
};

type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  initData: string;
  initDataUnsafe?: {
    user?: TelegramMiniAppUser;
  };
  requestContact?: (callback?: (shared: boolean) => void) => void;
  onEvent?: (
    eventType: string,
    eventHandler: (event: TelegramEventPayload) => void
  ) => void;
  offEvent?: (
    eventType: string,
    eventHandler: (event: TelegramEventPayload) => void
  ) => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp() {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp || null;
}

export function getTelegramInitData() {
  const webApp = getTelegramWebApp();
  return webApp?.initData || "";
}

export function getTelegramUnsafeUser() {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user || null;
}

export async function requestTelegramContact() {
  const webApp = getTelegramWebApp();

  if (!webApp?.requestContact) {
    return {
      ok: false,
      status: "unsupported" as const,
    };
  }

  return await new Promise<{
    ok: boolean;
    status: "sent" | "cancelled" | "unsupported";
  }>((resolve) => {
    let resolved = false;

    const handleContactRequested = (event: TelegramEventPayload) => {
      if (event?.status === "sent") {
        finish({ ok: true, status: "sent" });
        return;
      }

      if (event?.status === "cancelled") {
        finish({ ok: false, status: "cancelled" });
      }
    };

    const finish = (result: {
      ok: boolean;
      status: "sent" | "cancelled" | "unsupported";
    }) => {
      if (resolved) return;
      resolved = true;

      if (webApp.offEvent) {
        webApp.offEvent("contactRequested", handleContactRequested);
      }

      resolve(result);
    };

    if (webApp.onEvent) {
      webApp.onEvent("contactRequested", handleContactRequested);
    }

    webApp.requestContact?.((shared) => {
      window.setTimeout(() => {
        finish({
          ok: shared,
          status: shared ? "sent" : "cancelled",
        });
      }, 150);
    });
  });
}