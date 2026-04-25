"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import {
  syncTelegramCustomer,
  type CustomerProfile,
} from "../lib/customer-profile";
import {
  getTelegramInitData,
  getTelegramWebApp,
  requestTelegramContact,
} from "../lib/telegram-mini-app";

type CustomerAddress = {
  id: string;
  label: string;
  city: string | null;
  street: string | null;
  house: string | null;
  apartment: string | null;
  entrance: string | null;
  floor: string | null;
  comment: string | null;
  is_default: boolean;
};

function setCachedCustomer(customer: CustomerProfile | null) {
  if (!customer) return;
  localStorage.setItem("customer_profile_cache", JSON.stringify(customer));
  window.dispatchEvent(new Event("customer-profile-updated"));
}

function formatAddress(address: CustomerAddress) {
  const parts = [
    address.city ? `г. ${address.city}` : "",
    address.street ? `ул. ${address.street}` : "",
    address.house ? `д. ${address.house}` : "",
    address.apartment ? `кв. ${address.apartment}` : "",
  ].filter(Boolean);

  return parts.join(", ");
}

export default function ProfilePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [isRequestingPhone, setIsRequestingPhone] = useState(false);
  const [phoneRequestMessage, setPhoneRequestMessage] = useState("");

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);

  const [label, setLabel] = useState("Дом");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [apartment, setApartment] = useState("");
  const [entrance, setEntrance] = useState("");
  const [floor, setFloor] = useState("");
  const [comment, setComment] = useState("");

  const initData = getTelegramInitData();

  const loadAddresses = async () => {
    if (!initData) {
      setAddresses([]);
      setLoadingAddresses(false);
      return;
    }

    setLoadingAddresses(true);

    const response = await fetch(
      `/api/customer/addresses?initData=${encodeURIComponent(initData)}`
    );
    const result = await response.json();

    if (response.ok && result?.success && Array.isArray(result.addresses)) {
      setAddresses(result.addresses);
    } else {
      setAddresses([]);
    }

    setLoadingAddresses(false);
  };

  useEffect(() => {
    const init = async () => {
      const webApp = getTelegramWebApp();
      webApp?.ready();
      webApp?.expand();

      const profile = await syncTelegramCustomer();
      setCustomer(profile);
      setCachedCustomer(profile);
      setLoadingCustomer(false);

      await loadAddresses();
    };

    init();
  }, []);

  const fullName = useMemo(() => {
    if (!customer) return "Профиль";
    return (
      [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim() ||
      "Профиль"
    );
  }, [customer]);

  const menuItems = [
    {
      title: "Избранное",
      description: "Сохраненные товары",
      onClick: () => router.push("/favorites"),
    },
    {
      title: "Корзина",
      description: "Товары к оформлению",
      onClick: () => router.push("/cart"),
    },
    {
      title: "Доставка и оплата",
      description: "Условия доставки и способы оплаты",
      onClick: () => router.push("/delivery-payment"),
    },
    {
      title: "Возврат и обмен",
      description: "Правила возврата и обмена товара",
      onClick: () => router.push("/return-exchange"),
    },
  ];

  const profileInitial =
    customer?.first_name?.trim()?.charAt(0)?.toUpperCase() || "P";

  const handleRequestPhone = async () => {
    setPhoneRequestMessage("");
    setIsRequestingPhone(true);

    try {
      const result = await requestTelegramContact();

      if (result.status === "unsupported") {
        setPhoneRequestMessage("Запрос номера недоступен в этом режиме.");
        setIsRequestingPhone(false);
        return;
      }

      if (!result.ok) {
        setPhoneRequestMessage("Вы не поделились номером.");
        setIsRequestingPhone(false);
        return;
      }

      setPhoneRequestMessage("Номер отправлен через Telegram.");

      let attempts = 0;
      const maxAttempts = 8;

      const pollProfile = async () => {
        attempts += 1;

        const refreshedProfile = await syncTelegramCustomer();
        if (refreshedProfile?.phone) {
          setCustomer(refreshedProfile);
          setCachedCustomer(refreshedProfile);
          setPhoneRequestMessage("");
          setIsRequestingPhone(false);
          return;
        }

        if (attempts < maxAttempts) {
          window.setTimeout(pollProfile, 1000);
          return;
        }

        setPhoneRequestMessage("Номер отправлен, обновите страницу через пару секунд.");
        setIsRequestingPhone(false);
      };

      window.setTimeout(pollProfile, 1200);
    } catch {
      setPhoneRequestMessage("Не удалось запросить номер.");
      setIsRequestingPhone(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!city.trim() || !street.trim() || !house.trim()) {
      alert("Заполните город, улицу и дом");
      return;
    }

    setSavingAddress(true);

    const response = await fetch("/api/customer/addresses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        initData,
        label,
        city,
        street,
        house,
        apartment,
        entrance,
        floor,
        comment,
        is_default: addresses.length === 0,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result?.success) {
      alert(result?.error || "Не удалось сохранить адрес");
      setSavingAddress(false);
      return;
    }

    setLabel("Дом");
    setCity("");
    setStreet("");
    setHouse("");
    setApartment("");
    setEntrance("");
    setFloor("");
    setComment("");

    await loadAddresses();
    setSavingAddress(false);
  };

  const handleMakeDefault = async (addressId: string) => {
    const response = await fetch("/api/customer/addresses", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        initData,
        addressId,
        is_default: true,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result?.success) {
      alert(result?.error || "Не удалось обновить адрес");
      return;
    }

    await loadAddresses();
  };

  const handleDeleteAddress = async (addressId: string) => {
    const response = await fetch("/api/customer/addresses", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        initData,
        addressId,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result?.success) {
      alert(result?.error || "Не удалось удалить адрес");
      return;
    }

    await loadAddresses();
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-[76px] pb-32">
      <div className="mb-5 flex items-center justify-center">
        <h1 className="text-[20px] font-medium">Профиль</h1>
      </div>

      <div className="mb-4 rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#F5F5F5]">
            {customer?.photo_url ? (
              <img
                src={customer.photo_url}
                alt={fullName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl text-gray-500">
                {profileInitial}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-[18px] font-medium text-black">
              {loadingCustomer ? "Загрузка..." : fullName}
            </p>

            {customer?.telegram_username ? (
              <p className="mt-1 text-sm text-gray-500">
                @{customer.telegram_username}
              </p>
            ) : null}

            <p className="mt-1 text-sm text-gray-500">
              {customer?.phone || "Телефон не указан"}
            </p>
          </div>
        </div>

        {!customer?.phone && !loadingCustomer && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleRequestPhone}
              disabled={isRequestingPhone}
              className="w-full rounded-2xl bg-black py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {isRequestingPhone
                ? "Запрашиваем номер..."
                : "Поделиться номером"}
            </button>

            {phoneRequestMessage ? (
              <p className="mt-2 text-center text-sm text-gray-500">
                {phoneRequestMessage}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="mb-4 rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
        <h2 className="text-[18px] font-medium text-black">Мои адреса</h2>

        <div className="mt-4 space-y-3">
          {loadingAddresses ? (
            <p className="text-sm text-gray-400">Загрузка адресов...</p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-gray-400">Адресов пока нет</p>
          ) : (
            addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-[20px] bg-[#F7F7F7] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-black">
                        {address.label}
                      </p>
                      {address.is_default && (
                        <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                          Основной
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      {formatAddress(address)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(address.id)}
                    className="text-xs text-gray-400"
                  >
                    удалить
                  </button>
                </div>

                {!address.is_default && (
                  <button
                    type="button"
                    onClick={() => handleMakeDefault(address.id)}
                    className="mt-3 text-sm text-black underline underline-offset-2"
                  >
                    Сделать основным
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-5 border-t border-black/5 pt-5">
          <h3 className="text-[15px] font-medium text-black">Добавить адрес</h3>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            >
              <option>Дом</option>
              <option>Работа</option>
              <option>Другой адрес</option>
            </select>

            <input
              placeholder="Город *"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />

            <input
              placeholder="Улица *"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />

            <input
              placeholder="Дом *"
              value={house}
              onChange={(e) => setHouse(e.target.value)}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />

            <input
              placeholder="Квартира"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />

            <input
              placeholder="Подъезд"
              value={entrance}
              onChange={(e) => setEntrance(e.target.value)}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />

            <input
              placeholder="Этаж"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />
          </div>

          <textarea
            placeholder="Комментарий"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="mt-3 w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          />

          <button
            type="button"
            onClick={handleSaveAddress}
            disabled={savingAddress}
            className="mt-3 w-full rounded-2xl bg-black py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {savingAddress ? "Сохраняем..." : "Сохранить адрес"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.title}
            onClick={item.onClick}
            className="w-full rounded-[24px] bg-white p-4 text-left shadow-[0_8px_28px_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-medium text-black">{item.title}</p>
                <p className="mt-1 text-sm text-gray-500">{item.description}</p>
              </div>

              <span className="text-lg text-gray-300">›</span>
            </div>
          </button>
        ))}

        <button
          onClick={() => router.push("/support")}
          className="w-full rounded-[24px] bg-black p-4 text-left text-white shadow-[0_8px_28px_rgba(0,0,0,0.10)]"
        >
          <p className="text-[15px] font-medium">Поддержка</p>
          <p className="mt-1 text-sm text-white/70">
            Связаться с нами по вопросам заказа
          </p>
        </button>

        <button
          onClick={() => router.push("/channel")}
          className="w-full rounded-[24px] bg-[#229ED9] p-4 text-left text-white shadow-[0_8px_28px_rgba(34,158,217,0.20)]"
        >
          <p className="text-[15px] font-medium">Перейти на наш канал</p>
          <p className="mt-1 text-sm text-white/80">
            Новости, поступления и обновления
          </p>
        </button>
      </div>

      <BottomNav />
    </main>
  );
}