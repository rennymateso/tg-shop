"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type OrderStatus =
  | "Новый"
  | "Оплачен"
  | "В обработке"
  | "Собран"
  | "В доставке";

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice: number;
  badge: string;
  status: "Активен" | "Скрыт";
};

type OrderRow = {
  id: string;
  customer: string;
  phone: string;
  total: number;
  items: number;
  status: OrderStatus;
  createdAt: string;
};

const stats = [
  {
    title: "Выручка",
    value: "184 500 ₽",
    note: "+12% за неделю",
    icon: "₽",
  },
  {
    title: "Заказы",
    value: "28",
    note: "6 новых сегодня",
    icon: "🛍",
  },
  {
    title: "Продано товаров",
    value: "73",
    note: "Средний чек 6 589 ₽",
    icon: "📦",
  },
  {
    title: "Низкий остаток",
    value: "9",
    note: "Нужно пополнить",
    icon: "⚠",
  },
];

const initialProducts: ProductRow[] = [
  {
    id: "P-001",
    name: "Поло Premium",
    brand: "Lacoste",
    category: "Поло",
    price: 3500,
    oldPrice: 4500,
    badge: "Новинка",
    status: "Активен",
  },
  {
    id: "P-002",
    name: "Поло Classic",
    brand: "Polo Ralph Lauren",
    category: "Поло",
    price: 3900,
    oldPrice: 4900,
    badge: "Скидка",
    status: "Активен",
  },
  {
    id: "P-003",
    name: "Поло Black",
    brand: "BORZ",
    category: "Поло",
    price: 5200,
    oldPrice: 6500,
    badge: "В наличии",
    status: "Активен",
  },
  {
    id: "P-004",
    name: "Поло White",
    brand: "Massimo Carino",
    category: "Поло",
    price: 2900,
    oldPrice: 3900,
    badge: "Из-за рубежа",
    status: "Скрыт",
  },
];

const initialOrders: OrderRow[] = [
  {
    id: "ORD-1001",
    customer: "Илья Смирнов",
    phone: "+7 (927) 123-45-67",
    total: 7800,
    items: 2,
    status: "Новый",
    createdAt: "Сегодня, 12:40",
  },
  {
    id: "ORD-1002",
    customer: "Руслан Ахметов",
    phone: "+7 (987) 765-43-21",
    total: 5200,
    items: 1,
    status: "Оплачен",
    createdAt: "Сегодня, 11:05",
  },
  {
    id: "ORD-1003",
    customer: "Тимур Гайнутдинов",
    phone: "+7 (903) 111-22-33",
    total: 10400,
    items: 3,
    status: "В обработке",
    createdAt: "Вчера, 18:22",
  },
];

function statusClass(status: OrderStatus) {
  switch (status) {
    case "Новый":
      return "bg-black text-white";
    case "Оплачен":
      return "bg-emerald-100 text-emerald-700";
    case "В обработке":
      return "bg-amber-100 text-amber-700";
    case "Собран":
      return "bg-blue-100 text-blue-700";
    case "В доставке":
      return "bg-violet-100 text-violet-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((item) => {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [search]);

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    );
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Управление магазином</p>
          <h2 className="text-2xl font-semibold">Главная</h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <span className="text-gray-400">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск товаров, брендов, заказов"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 sm:w-72"
            />
          </div>

          <Link
            href="/admin/products/new"
            className="rounded-2xl bg-black px-5 py-3 text-center text-sm font-medium text-white"
          >
            + Добавить товар
          </Link>
        </div>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.title}
            className="rounded-[28px] bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">{item.title}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5F5F5] text-base">
                {item.icon}
              </div>
            </div>
            <p className="text-2xl font-semibold tracking-[-0.03em]">
              {item.value}
            </p>
            <p className="mt-2 text-sm text-gray-400">{item.note}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium">Товары</h3>
              <p className="text-sm text-gray-500">
                Быстрое управление каталогом
              </p>
            </div>
            <Link
              href="/admin/products"
              className="rounded-2xl bg-[#F5F5F5] px-4 py-2 text-sm text-gray-700"
            >
              Все товары
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-black/5 text-xs uppercase tracking-[0.18em] text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Товар</th>
                  <th className="pb-3 pr-4 font-medium">Бренд</th>
                  <th className="pb-3 pr-4 font-medium">Цена</th>
                  <th className="pb-3 pr-4 font-medium">Бейдж</th>
                  <th className="pb-3 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-black/5 last:border-b-0"
                  >
                    <td className="py-4 pr-4">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {item.id} • {item.category}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-sm text-gray-600">
                      {item.brand}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-emerald-600">
                          {item.price.toLocaleString("ru-RU")} ₽
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          {item.oldPrice.toLocaleString("ru-RU")} ₽
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-[#F5F5F5] px-2.5 py-1 text-xs text-gray-700">
                        {item.badge}
                      </span>
                    </td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          item.status === "Активен"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Последние заказы</h3>
                <p className="text-sm text-gray-500">
                  Изменение статусов прямо из панели
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl bg-[#F7F7F7] p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{order.id}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {order.customer} • {order.phone}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${statusClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
                    <span>{order.items} тов.</span>
                    <span>{order.total.toLocaleString("ru-RU")} ₽</span>
                  </div>

                  <div className="mb-3 text-xs text-gray-400">
                    {order.createdAt}
                  </div>

                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateOrderStatus(
                        order.id,
                        e.target.value as OrderStatus
                      )
                    }
                    className="w-full rounded-2xl border border-black/5 bg-white px-3 py-2 text-sm outline-none"
                  >
                    <option>Новый</option>
                    <option>Оплачен</option>
                    <option>В обработке</option>
                    <option>Собран</option>
                    <option>В доставке</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <h3 className="text-lg font-medium">Что дальше</h3>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="rounded-2xl bg-[#F7F7F7] p-4">
                1. Подключим реальные данные товаров вместо заглушек.
              </div>
              <div className="rounded-2xl bg-[#F7F7F7] p-4">
                2. Сделаем реальное сохранение и удаление товаров.
              </div>
              <div className="rounded-2xl bg-[#F7F7F7] p-4">
                3. Свяжем товары, остатки, промокоды и заказы.
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}