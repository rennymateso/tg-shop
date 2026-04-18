"use client";

import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

export default function ProfilePage() {
  const router = useRouter();

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
        <p className="text-[18px] font-medium text-black">MONTREAUX</p>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Личный кабинет покупателя. Здесь можно перейти в избранное, корзину и
          посмотреть информацию по доставке и оплате.
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
      </div>

      <BottomNav />
    </main>
  );
}