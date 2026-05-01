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

function OrdersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3.5h6" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6L5 3H2" />
      <circle cx="9" cy="20" r="1.2" />
      <circle cx="18" cy="20" r="1.2" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8.5 12 3 3 8.5 12 14l9-5.5Z" />
      <path d="M3 8.5V16l9 5 9-5V8.5" />
      <path d="M12 14v7" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h7V3" />
      <path d="M21 14h-7v7" />
      <path d="M20 10a8 8 0 0 0-14-4l-3 4" />
      <path d="M4 14a8 8 0 0 0 14 4l3-4" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13a8 8 0 0 1 16 0" />
      <rect x="2.5" y="12" width="4" height="7" rx="2" />
      <rect x="17.5" y="12" width="4" height="7" rx="2" />
      <path d="M12 20a2 2 0 0 1-2 2h-1" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.6 4.2c-.3-.2-.8-.2-1.4 0L3.8 10.5c-.7.3-.7.7-.1.9l4.2 1.3 1.6 5c.2.6.3.8.7.8.3 0 .5-.1.8-.4l2.3-2.2 4.7 3.5c.9.5 1.5.3 1.8-.8l2.8-13.1c.2-.8 0-1.2-.3-1.3Zm-12.7 8.3 8.2-5.2c.4-.3.8-.1.4.2l-6.8 6.1-.3 3.1-1.5-4.2Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

type MenuCard = {
  title: string;
  description: string;
  onClick: () => void;
  icon: React.ReactNode;
};

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

  const menuItems: MenuCard[] = [
    {
      title: "Избранное",
      description: "Сохраненные товары",
      onClick: () => router.push("/favorites"),
      icon: <HeartIcon />,
    },
    {
      title: "Корзина",
      description: "Товары к оформлению",
      onClick: () => router.push("/cart"),
      icon: <CartIcon />,
    },
    {
      title: "Доставка и оплата",
      description: "Условия доставки и способы оплаты",
      onClick: () => router.push("/delivery-payment"),
      icon: <BoxIcon />,
    },
    {
      title: "Возврат и обмен",
      description: "Правила возврата и обмена товара",
      onClick: () => router.push("/return-exchange"),
      icon: <ReturnIcon />,
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
        return;
      }

      if (!result.ok) {
        setPhoneRequestMessage("Вы не поделились номером.");
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
        <h1 className="text-[20px] font-medium tracking-[-0.02em] text-[#111827]">
          Профиль
        </h1>
      </div>

      {loadingCustomer ? (
        <ProfilePageSkeleton />
      ) : (
        <>
          <div className="mb-4 rounded-[20px] bg-[linear-gradient(145deg,#EEF4FF_0%,#FFFFFF_58%,#EAF1FA_100%)] p-4 shadow-[0_12px_34px_rgba(15,23,42,0.07)]">
            <div className="flex items-center gap-4">
              <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[22px] font-medium text-[#667085] shadow-[0_8px_18px_rgba(15,23,42,0.07)]">
                {customer?.photo_url ? (
                  <img
                    src={customer.photo_url}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profileInitial
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[18px] font-medium text-[#0F172A]">
                  {fullName}
                </p>

                {customer?.telegram_username ? (
                  <p className="mt-1 truncate text-[13px] text-[#667085]">
                    @{customer.telegram_username}
                  </p>
                ) : null}

                <p className="mt-1 text-[13px] text-[#667085]">
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
                  className="w-full rounded-[16px] bg-[linear-gradient(135deg,#08205A_0%,#001848_100%)] py-3.5 text-[15px] font-medium text-white shadow-[0_12px_28px_rgba(0,24,72,0.22)] disabled:opacity-60"
                >
                  {isRequestingPhone
                    ? "Запрашиваем номер..."
                    : "Поделиться номером"}
                </button>

                {phoneRequestMessage ? (
                  <p className="mt-2 text-center text-[13px] text-[#667085]">
                    {phoneRequestMessage}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <button
            onClick={() => router.push("/orders")}
            className="mb-3 flex w-full items-center gap-4 rounded-[18px] bg-white px-4 py-4 text-left shadow-[0_10px_26px_rgba(15,23,42,0.055)]"
          >
            <div className="shrink-0 text-[#0F172A]">
              <OrdersIcon />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-medium text-[#0F172A]">
                Мои заказы
              </p>
              <p className="mt-1 text-[13px] text-[#7A8397]">
                История заказов и статусы
              </p>
            </div>

            <div className="shrink-0 text-[#B6BDCB]">
              <ChevronIcon />
            </div>
          </button>

          <div className="space-y-2.5">
            {menuItems.map((item) => (
              <button
                key={item.title}
                onClick={item.onClick}
                className="flex w-full items-center gap-3 rounded-[16px] bg-white px-4 py-3.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.045)]"
              >
                <div className="shrink-0 text-[#3E4A68]">{item.icon}</div>

                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-[#0F172A]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#7A8397]">
                    {item.description}
                  </p>
                </div>

                <div className="shrink-0 text-[#B6BDCB]">
                  <ChevronIcon />
                </div>
              </button>
            ))}

            <button
              onClick={() => router.push("/support")}
              className="mt-4 flex w-full items-center gap-3 rounded-[16px] bg-[linear-gradient(135deg,#111827_0%,#020617_100%)] px-4 py-4 text-left text-white shadow-[0_14px_34px_rgba(2,6,23,0.22)]"
            >
              <div className="shrink-0 text-white">
                <SupportIcon />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">Поддержка</p>
                <p className="mt-0.5 text-[12px] text-white/75">
                  Связаться с нами по вопросам заказа
                </p>
              </div>

              <div className="shrink-0 text-white/75">
                <ChevronIcon />
              </div>
            </button>

            <button
              onClick={() => router.push("/channel")}
              className="flex w-full items-center gap-3 rounded-[16px] bg-[linear-gradient(135deg,#2EA8F7_0%,#177FE7_100%)] px-4 py-4 text-left text-white shadow-[0_14px_34px_rgba(34,158,217,0.24)]"
            >
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-white/90 text-[#229ED9]">
                <TelegramIcon />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">Перейти на наш канал</p>
                <p className="mt-0.5 text-[12px] text-white/82">
                  Новости, поступления и обновления
                </p>
              </div>

              <div className="shrink-0 text-white/80">
                <ChevronIcon />
              </div>
            </button>
          </div>
        </>
      )}

      <BottomNav />
    </main>
  );
}