"use client";

import { useEffect, useState } from "react";

type DebugData = {
  width: number;
  innerHeight: number;
  clientHeight: number;
  tgViewport: number;
  tgStable: number;
  platform: string;
};

export default function TelegramViewportDebug() {
  const [data, setData] = useState<DebugData>({
    width: 0,
    innerHeight: 0,
    clientHeight: 0,
    tgViewport: 0,
    tgStable: 0,
    platform: "",
  });

  useEffect(() => {
    const getTelegramWebApp = () => {
      if (typeof window === "undefined") return null;

      const win = window as unknown as {
        Telegram?: {
          WebApp?: {
            viewportHeight?: number;
            viewportStableHeight?: number;
            platform?: string;
            onEvent?: (eventType: string, eventHandler: () => void) => void;
            offEvent?: (eventType: string, eventHandler: () => void) => void;
          };
        };
      };

      return win.Telegram?.WebApp || null;
    };

    const update = () => {
      const tg = getTelegramWebApp();

      setData({
        width: window.innerWidth,
        innerHeight: window.innerHeight,
        clientHeight: document.documentElement.clientHeight,
        tgViewport: Math.round(tg?.viewportHeight || 0),
        tgStable: Math.round(tg?.viewportStableHeight || 0),
        platform: tg?.platform || "unknown",
      });
    };

    update();

    const tg = getTelegramWebApp();

    window.addEventListener("resize", update);
    tg?.onEvent?.("viewportChanged", update);

    return () => {
      window.removeEventListener("resize", update);
      tg?.offEvent?.("viewportChanged", update);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        left: 8,
        bottom: 8,
        zIndex: 999999,
        background: "rgba(0,0,0,.84)",
        color: "#fff",
        fontSize: 11,
        lineHeight: 1.45,
        padding: 10,
        borderRadius: 10,
        maxWidth: 270,
        fontFamily: "Arial, sans-serif",
        pointerEvents: "none",
      }}
    >
      <div>width: {data.width}</div>
      <div>innerHeight: {data.innerHeight}</div>
      <div>clientHeight: {data.clientHeight}</div>
      <div>tg viewport: {data.tgViewport}</div>
      <div>tg stable: {data.tgStable}</div>
      <div>platform: {data.platform}</div>
    </div>
  );
}
