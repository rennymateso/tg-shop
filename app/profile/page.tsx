"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { syncTelegramCustomer, type CustomerProfile } from "../lib/customer-profile";
import { getTelegramWebApp } from "../lib/telegram-mini-app";

export default function ProfilePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  useEffect(() => {
    const init = async () => {
      const webApp = getTelegramWebApp();
      webApp?.ready();
      webApp?.expand();

      const profile = await syncTelegramCustomer();
      setCustomer(profile);
      setLoadingCustomer(false);
    };

    init();
  }, []);

  const fullName = useMemo(() => {
    if (!customer) return "Профиль клиента";
    return [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Профиль клиента";
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

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-5 pb-32">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-white px-4 py-2 text-sm text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
        >
          ← Назад
        </button>

        <h1 className="text-[20px] font-medium">Профиль</h1>

        <div className="w-[86px]" />
      </div>

      <div className="mb-4 rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#F5F5F5]">
            {customer?.photo_url ? (
              <img
                src={customer.photo_url}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg text-gray-500">
                {fullName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[18px] font-medium text-black">
              {loadingCustomer ? "Загружаем профиль..." : fullName}
            </p>

            {customer?.telegram_username ? (
              <p className="mt-1 text-sm text-gray-500">
                @{customer.telegram_username}
              </p>
            ) : null}

            {customer?.phone ? (
              <p className="mt-1 text-sm text-gray-500">{customer.phone}</p>
            ) : (
              <p className="mt-1 text-sm text-gray-400">
                Телефон можно ввести при оформлении заказа — потом он будет подставляться автоматически.
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-gray-500">
          Профиль привязан к Telegram Mini App. Имя подставляется автоматически, а телефон
          сохраняется после первого оформления заказа.
        </p>
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