"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type WarehouseBadge = "В наличии" | "Из-за рубежа";
type WarehouseStatus = "Активен" | "Скрыт";

type WarehouseRow = {
  id: string;
  name: string;
  city: string;
  country: string;
  badge: WarehouseBadge;
  kazDelivery: string;
  rfDelivery: string;
  productsCount: number;
  status: WarehouseStatus;
};

const initialWarehouses: WarehouseRow[] = [
  {
    id: "WH-001",
    name: "Склад Казань",
    city: "Казань",
    country: "Россия",
    badge: "В наличии",
    kazDelivery: "День в день",
    rfDelivery: "3–7 дней",
    productsCount: 86,
    status: "Активен",
  },
  {
    id: "WH-002",
    name: "Склад Стамбул",
    city: "Стамбул",
    country: "Турция",
    badge: "Из-за рубежа",
    kazDelivery: "Около 7 дней",
    rfDelivery: "До 14 дней",
    productsCount: 143,
    status: "Активен",
  },
];

export default function AdminWarehousesPage() {
  const [search, setSearch] = useState("");
  const [warehouses, setWarehouses] =
    useState<WarehouseRow[]>(initialWarehouses);

  const filteredWarehouses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return warehouses;

    return warehouses.filter((item) => {
      return (
        item.id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q)
      );
    });
  }, [warehouses, search]);

  const toggleWarehouseStatus = (id: string) => {
    setWarehouses((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "Активен" ? "Скрыт" : "Активен",
            }
          : item
      )
    );
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">Склады</h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <span className="text-gray-400">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по складам"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 sm:w-72"
            />
          </div>

          <Link
            href="/admin/warehouses/new"
            className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
          >
            + Добавить склад
          </Link>
        </div>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Всего складов</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {warehouses.length}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Активные</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {warehouses.filter((item) => item.status === "Активен").length}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">По Казани</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {
              warehouses.filter(
                (item) => item.kazDelivery.toLowerCase().includes("день") || item.kazDelivery.includes("7")
              ).length
            }
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Товаров на складах</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {warehouses.reduce((sum, item) => sum + item.productsCount, 0)}
          </p>
        </div>
      </section>

      <section className="mb-6 rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-black">Логика доставки</h2>

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="rounded-2xl bg-[#F7F7F7] p-4 text-sm leading-6 text-gray-600">
            Если клиент указывает <span className="text-black">Казань</span> и
            заказывает товар с бейджем{" "}
            <span className="rounded-full bg-[#F0F0F0] px-2 py-0.5 text-black">
              В наличии
            </span>
            , срок доставки — <span className="text-black">день в день</span>.
          </div>

          <div className="rounded-2xl bg-[#F7F7F7] p-4 text-sm leading-6 text-gray-600">
            Если клиент указывает <span className="text-black">Казань</span> и
            заказывает товар с бейджем{" "}
            <span className="rounded-full bg-black px-2 py-0.5 text-white">
              Из-за рубежа
            </span>
            , срок доставки — <span className="text-black">около 7 дней</span>.
          </div>

          <div className="rounded-2xl bg-[#F7F7F7] p-4 text-sm leading-6 text-gray-600">
            Если клиент указывает <span className="text-black">любой другой регион</span>{" "}
            и заказывает товар с бейджем{" "}
            <span className="rounded-full bg-[#F0F0F0] px-2 py-0.5 text-black">
              В наличии
            </span>
            , срок доставки — <span className="text-black">3–7 дней</span>.
          </div>

          <div className="rounded-2xl bg-[#F7F7F7] p-4 text-sm leading-6 text-gray-600">
            Если клиент указывает <span className="text-black">любой другой регион</span>{" "}
            и заказывает товар с бейджем{" "}
            <span className="rounded-full bg-black px-2 py-0.5 text-white">
              Из-за рубежа
            </span>
            , срок доставки — <span className="text-black">до 14 дней</span>.
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-black">Список складов</h2>
          <p className="text-sm text-gray-500">
            Бейдж склада определяет бейдж товара при наличии остатка
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-[0.18em] text-gray-400">
                <th className="pb-3 pr-4 font-medium">Склад</th>
                <th className="pb-3 pr-4 font-medium">Город</th>
                <th className="pb-3 pr-4 font-medium">Страна</th>
                <th className="pb-3 pr-4 font-medium">Бейдж</th>
                <th className="pb-3 pr-4 font-medium">Казань</th>
                <th className="pb-3 pr-4 font-medium">Россия</th>
                <th className="pb-3 pr-4 font-medium">Товаров</th>
                <th className="pb-3 font-medium">Статус</th>
              </tr>
            </thead>

            <tbody>
              {filteredWarehouses.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-black/5 last:border-b-0"
                >
                  <td className="py-4 pr-4">
                    <div>
                      <p className="text-sm font-medium text-black">{item.name}</p>
                      <p className="mt-1 text-xs text-gray-400">{item.id}</p>
                    </div>
                  </td>

                  <td className="py-4 pr-4 text-sm text-gray-600">{item.city}</td>
                  <td className="py-4 pr-4 text-sm text-gray-600">{item.country}</td>

                  <td className="py-4 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        item.badge === "Из-за рубежа"
                          ? "bg-black text-white"
                          : "bg-[#F5F5F5] text-gray-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </td>

                  <td className="py-4 pr-4 text-sm text-gray-600">
                    {item.kazDelivery}
                  </td>

                  <td className="py-4 pr-4 text-sm text-gray-600">
                    {item.rfDelivery}
                  </td>

                  <td className="py-4 pr-4 text-sm text-gray-600">
                    {item.productsCount}
                  </td>

                  <td className="py-4">
                    <button
                      onClick={() => toggleWarehouseStatus(item.id)}
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        item.status === "Активен"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {item.status}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}