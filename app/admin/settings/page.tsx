"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, MapPin, Save, Truck } from "lucide-react";

type DeliverySettings = {
  freeCities: string[];
  deliveryPrice: number;
  inStockMinDays: number;
  inStockMaxDays: number;
  foreignMinDays: number;
  foreignMaxDays: number;
  pickupAddress: string;
};

const fallbackSettings: DeliverySettings = {
  freeCities: ["Казань"],
  deliveryPrice: 500,
  inStockMinDays: 1,
  inStockMaxDays: 3,
  foreignMinDays: 7,
  foreignMaxDays: 14,
  pickupAddress: 'г. Казань, Академика Глушко 16Г, ТЦ "АКАДЕМИК", 2 этаж',
};

function parseCities(value: string) {
  return value
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean);
}

function toNumber(value: string, fallback: number) {
  const next = Number(value.replace(/\D/g, ""));
  return Number.isFinite(next) ? next : fallback;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<DeliverySettings>(fallbackSettings);
  const [freeCitiesDraft, setFreeCitiesDraft] = useState(
    fallbackSettings.freeCities.join(", ")
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings/delivery", {
          cache: "no-store",
        });
        const result = await response.json();

        if (response.ok && result?.settings) {
          setSettings(result.settings);
          setFreeCitiesDraft(result.settings.freeCities.join(", "));
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const preview = useMemo(() => {
    const cities = parseCities(freeCitiesDraft);
    return {
      freeCities: cities.length > 0 ? cities : fallbackSettings.freeCities,
      deliveryPrice: settings.deliveryPrice,
      inStock:
        settings.inStockMinDays === settings.inStockMaxDays
          ? `${settings.inStockMinDays} дн.`
          : `${settings.inStockMinDays}-${settings.inStockMaxDays} дн.`,
      foreign:
        settings.foreignMinDays === settings.foreignMaxDays
          ? `${settings.foreignMinDays} дн.`
          : `${settings.foreignMinDays}-${settings.foreignMaxDays} дн.`,
    };
  }, [freeCitiesDraft, settings]);

  const updateField = <K extends keyof DeliverySettings>(
    key: K,
    value: DeliverySettings[K]
  ) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage("");
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");

    const freeCities = parseCities(freeCitiesDraft);
    const payload: DeliverySettings = {
      ...settings,
      freeCities: freeCities.length > 0 ? freeCities : fallbackSettings.freeCities,
      inStockMaxDays: Math.max(settings.inStockMinDays, settings.inStockMaxDays),
      foreignMaxDays: Math.max(settings.foreignMinDays, settings.foreignMaxDays),
    };

    try {
      const response = await fetch("/api/settings/delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings: payload }),
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.details || result?.error || "Ошибка сохранения");
      }

      setSettings(result.settings);
      setFreeCitiesDraft(result.settings.freeCities.join(", "));
      setMessage("Настройки доставки сохранены.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Не удалось сохранить настройки доставки."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="pb-28">
      <header className="mb-2 rounded-[22px] bg-white p-3 shadow-sm">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A94A3]">
          Управление
        </p>
        <h1 className="mt-0.5 text-[21px] font-semibold text-black">
          Настройки
        </h1>
        <p className="mt-1 text-[12px] leading-4 text-[#697386]">
          Доставка, сроки и адрес самовывоза для оформления заказа.
        </p>
      </header>

      {message ? (
        <div className="mb-2 rounded-[18px] bg-white px-3 py-2.5 text-[12px] font-medium text-black shadow-sm">
          {message}
        </div>
      ) : null}

      <section className="mb-2 grid grid-cols-3 gap-2">
        <div className="rounded-[18px] bg-white p-3 shadow-sm">
          <p className="text-[10px] text-[#8A94A3]">Бесплатно</p>
          <p className="mt-1 truncate text-[14px] font-semibold text-black">
            {preview.freeCities.join(", ")}
          </p>
        </div>
        <div className="rounded-[18px] bg-white p-3 shadow-sm">
          <p className="text-[10px] text-[#8A94A3]">Доставка</p>
          <p className="mt-1 text-[14px] font-semibold text-black">
            {preview.deliveryPrice} ₽
          </p>
        </div>
        <div className="rounded-[18px] bg-white p-3 shadow-sm">
          <p className="text-[10px] text-[#8A94A3]">Сроки</p>
          <p className="mt-1 text-[14px] font-semibold text-black">
            {preview.inStock}
          </p>
        </div>
      </section>

      <section className="mb-2 rounded-[22px] bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[#F4F6FA] text-black">
            <Truck size={18} />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-black">Доставка</h2>
            <p className="text-[11px] text-[#8A94A3]">Цена и бесплатные города</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-[#697386]">
              Города без доплаты
            </span>
            <input
              value={freeCitiesDraft}
              onChange={(event) => setFreeCitiesDraft(event.target.value)}
              placeholder="Казань"
              className="h-11 w-full rounded-[15px] bg-[#F4F6FA] px-3 text-[14px] outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-[#697386]">
              Цена доставки в другие города
            </span>
            <input
              value={String(settings.deliveryPrice)}
              onChange={(event) =>
                updateField("deliveryPrice", toNumber(event.target.value, 0))
              }
              inputMode="numeric"
              className="h-11 w-full rounded-[15px] bg-[#F4F6FA] px-3 text-[14px] outline-none"
            />
          </label>
        </div>
      </section>

      <section className="mb-2 rounded-[22px] bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[#F4F6FA] text-black">
            <Check size={18} />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-black">Сроки</h2>
            <p className="text-[11px] text-[#8A94A3]">Показываются клиенту и в заказах</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block rounded-[16px] bg-[#F7F8FB] p-2.5">
            <span className="text-[11px] text-[#697386]">В наличии от</span>
            <input
              value={String(settings.inStockMinDays)}
              onChange={(event) =>
                updateField("inStockMinDays", toNumber(event.target.value, 1))
              }
              inputMode="numeric"
              className="mt-1 h-9 w-full rounded-[12px] bg-white px-2 text-[14px] outline-none"
            />
          </label>
          <label className="block rounded-[16px] bg-[#F7F8FB] p-2.5">
            <span className="text-[11px] text-[#697386]">В наличии до</span>
            <input
              value={String(settings.inStockMaxDays)}
              onChange={(event) =>
                updateField("inStockMaxDays", toNumber(event.target.value, 1))
              }
              inputMode="numeric"
              className="mt-1 h-9 w-full rounded-[12px] bg-white px-2 text-[14px] outline-none"
            />
          </label>
          <label className="block rounded-[16px] bg-[#F7F8FB] p-2.5">
            <span className="text-[11px] text-[#697386]">Из-за рубежа от</span>
            <input
              value={String(settings.foreignMinDays)}
              onChange={(event) =>
                updateField("foreignMinDays", toNumber(event.target.value, 1))
              }
              inputMode="numeric"
              className="mt-1 h-9 w-full rounded-[12px] bg-white px-2 text-[14px] outline-none"
            />
          </label>
          <label className="block rounded-[16px] bg-[#F7F8FB] p-2.5">
            <span className="text-[11px] text-[#697386]">Из-за рубежа до</span>
            <input
              value={String(settings.foreignMaxDays)}
              onChange={(event) =>
                updateField("foreignMaxDays", toNumber(event.target.value, 1))
              }
              inputMode="numeric"
              className="mt-1 h-9 w-full rounded-[12px] bg-white px-2 text-[14px] outline-none"
            />
          </label>
        </div>
      </section>

      <section className="rounded-[22px] bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[#F4F6FA] text-black">
            <MapPin size={18} />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-black">Самовывоз</h2>
            <p className="text-[11px] text-[#8A94A3]">Адрес магазина</p>
          </div>
        </div>

        <textarea
          value={settings.pickupAddress}
          onChange={(event) => updateField("pickupAddress", event.target.value)}
          rows={3}
          className="w-full resize-none rounded-[15px] bg-[#F4F6FA] px-3 py-2.5 text-[14px] leading-5 outline-none"
        />
      </section>

      <div className="fixed bottom-[86px] left-0 right-0 z-40 px-4">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving || loading}
          className="mx-auto flex h-11 w-full max-w-[390px] items-center justify-center gap-2 rounded-[16px] bg-[#101114] text-[14px] font-medium text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] disabled:opacity-60"
        >
          <Save size={17} />
          {saving ? "Сохраняю..." : "Сохранить"}
        </button>
      </div>
    </main>
  );
}
