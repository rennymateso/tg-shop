"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const menuSections = [
  {
    title: "Товары",
    items: [
      {
        href: "/admin/products/new",
        title: "Добавить товар",
        subtitle: "Создание карточки, фото, размеры, остатки",
        icon: "+",
      },
      {
        href: "/admin/products",
        title: "Каталог товаров",
        subtitle: "Редактирование, цены, статусы",
        icon: "◫",
      },
      {
        href: "/admin/stocks",
        title: "Остатки",
        subtitle: "Контроль количества по размерам",
        icon: "≣",
      },
      {
        href: "/admin/warehouses",
        title: "Склады",
        subtitle: "Места хранения и наличие",
        icon: "▤",
      },
    ],
  },
  {
    title: "Продажи",
    items: [
      {
        href: "/admin/orders",
        title: "Заказы",
        subtitle: "Сборка, доставка, статусы",
        icon: "◎",
      },
      {
        href: "/admin/statistics",
        title: "Статистика",
        subtitle: "Выручка, заказы, активность Mini App",
        icon: "◔",
      },
      {
        href: "/admin/promocodes",
        title: "Промокоды",
        subtitle: "Скидки и акции",
        icon: "%",
      },
    ],
  },
  {
    title: "Витрина",
    items: [
      {
        href: "/admin/banners",
        title: "Баннеры",
        subtitle: "Главная страница и акции",
        icon: "▭",
      },
      {
        href: "/admin/brands",
        title: "Бренды",
        subtitle: "Список брендов магазина",
        icon: "◆",
      },
      {
        href: "/admin/badges",
        title: "Бейджи",
        subtitle: "В наличии, новинка, скидка",
        icon: "🏷",
      },
    ],
  },
  {
    title: "Система",
    items: [
      {
        href: "/admin/settings",
        title: "Настройки",
        subtitle: "Основные параметры магазина",
        icon: "⚙",
      },
    ],
  },
] as const;

export default function AdminMenuPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin-logout", {
      method: "POST",
    });

    router.push("/admin/login");
    router.refresh();
  };

  return (
    <>
      <div className="mb-5">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Seller panel</p>
          <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-black">
            Меню
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Все инструменты управления магазином
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {menuSections.map((section) => (
          <section key={section.title} className="rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-black">
              {section.title}
            </h2>

            <div className="mt-4 space-y-2">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-[22px] bg-[#F7F7F7] p-4 transition active:scale-[0.99]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-base text-black shadow-sm">
                    {item.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-black">
                      {item.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-4 text-gray-500">
                      {item.subtitle}
                    </p>
                  </div>

                  <span className="shrink-0 text-gray-300">›</span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-[28px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-black">
            Аккаунт
          </h2>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full rounded-[22px] bg-red-50 p-4 text-left text-sm font-semibold text-red-600"
          >
            Выйти из админ-панели
          </button>
        </section>
      </div>
    </>
  );
}
