"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import {
  syncTelegramCustomer,
  type CustomerProfile,
} from "../lib/customer-profile";
import {
  getTelegramWebApp,
  requestTelegramContact,
} from "../lib/telegram-mini-app";
import { ProfilePageSkeleton } from "../components/PageSkeletons";

function setCachedCustomer(customer: CustomerProfile | null) {
  if (!customer) return;
  localStorage.setItem("customer_profile_cache", JSON.stringify(customer));
  window.dispatchEvent(new Event("customer-profile-updated"));
}

export default function ProfilePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [isRequestingPhone, setIsRequestingPhone] = useState(false);
  const [phoneRequestMessage, setPhoneRequestMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      const webApp = getTelegramWebApp();
      webApp?.ready();
      webApp?.expand();

      const profile = await syncTelegramCustomer();
      setCustomer(profile);
      setCachedCustomer(profile);
      setLoadingCustomer(false);
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
      title: "Мои заказы",
      description: "История заказов и статусы",
      onClick: () => router.push("/orders"),
    },
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

      const refreshedProfile = await syncTelegramCustomer();
      if (refreshedProfile) {
        setCustomer(refreshedProfile);
        setCachedCustomer(refreshedProfile);
      }
    } finally {
      setIsRequestingPhone(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-[76px] pb-32">
      <div className="mb-5 flex items-center justify-center">
        <h1 className="text-[20px] font-medium">Профиль</h1>
      </div>

      {loadingCustomer ? (
        <ProfilePageSkeleton />
      ) : (
        <>
          <div className="mb-4 rounded-[24px] border border-black/10 bg-[#EFEAE3] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
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
                  {fullName}
                </p>

                {customer?.telegram_username ? (
                  <p className="mt-1 text-sm text-gray-600">
                    @{customer.telegram_username}
                  </p>
                ) : null}

                <p className="mt-1 text-sm text-gray-600">
                  {customer?.phone || "Телефон не указан"}
                </p>
              </div>
            </div>

            {!customer?.phone && (
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
                  <p className="mt-2 text-center text-sm text-gray-600">
                    {phoneRequestMessage}
                  </p>
                ) : null}
              </div>
            )}
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
        </>
      )}

      <BottomNav />
    </main>
  );
}