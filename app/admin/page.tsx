"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type OrderStatus =
  | "Новый"
  | "Оплачен"
  | "В обработке"
  | "Собран"
  | "В доставке"
  | "Доставлен"
  | "Отменен";

type ProductStatus = "Активен" | "Скрыт";

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  old_price: number;
  badge: string | null;
  status: ProductStatus;
  created_at: string;
};

type OrderRowDb = {
  id: string;
  customer: string;
  phone: string;
  total: number;
  payment: string;
  delivery: string;
  address: string;
  status: OrderStatus;
  comment: string;
  promo_code: string;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  id: number;
  order_id: string;
  product_id: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  created_at: string;
};

type DashboardOrder = {
  id: string;
  customer: string;
  phone: string;
  total: number;
  items: number;
  status: OrderStatus;
  createdAt: string;
};

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
    case "Доставлен":
      return "bg-sky-100 text-sky-700";
    case "Отменен":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatOrderDate(value: string) {
  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return value;
  }
}

function getTodayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getWeekStartIso() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

function calcPercentChange(current: number, previous: number) {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0 && current > 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [allOrders, setAllOrders] = useState<OrderRowDb[]>([]);
  const [allOrderItems, setAllOrderItems] = useState<OrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setMessage("");

    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id,name,brand,category,price,old_price,badge,status,created_at")
      .order("created_at", { ascending: false });

    if (productsError) {
      setMessage(`Ошибка загрузки товаров: ${productsError.message}`);
      setProducts([]);
    } else {
      setProducts((productsData || []) as ProductRow[]);
    }

    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) {
      setMessage((prev) =>
        prev
          ? `${prev}\nОшибка загрузки заказов: ${ordersError.message}`
          : `Ошибка загрузки заказов: ${ordersError.message}`
      );
      setAllOrders([]);
      setOrders([]);
      setAllOrderItems([]);
      setLoading(false);
      return;
    }

    const safeOrders = ((ordersData || []) as OrderRowDb[]) || [];
    setAllOrders(safeOrders);

    const orderIds = safeOrders.map((order) => order.id);

    let itemsMap: Record<string, OrderItemRow[]> = {};
    let safeItems: OrderItemRow[] = [];

    if (orderIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds)
        .order("created_at", { ascending: true });

      if (itemsError) {
        setMessage((prev) =>
          prev
            ? `${prev}\nОшибка загрузки товаров заказов: ${itemsError.message}`
            : `Ошибка загрузки товаров заказов: ${itemsError.message}`
        );
      } else {
        safeItems = (itemsData || []) as OrderItemRow[];
        itemsMap = safeItems.reduce<Record<string, OrderItemRow[]>>((acc, item) => {
          if (!acc[item.order_id]) acc[item.order_id] = [];
          acc[item.order_id].push(item);
          return acc;
        }, {});
      }
    }

    setAllOrderItems(safeItems);

    const dashboardOrders: DashboardOrder[] = safeOrders.slice(0, 5).map((order) => ({
      id: order.id,
      customer: order.customer,
      phone: order.phone,
      total: order.total,
      items: (itemsMap[order.id] || []).reduce((sum, item) => sum + item.quantity, 0),
      status: order.status,
      createdAt: formatOrderDate(order.created_at),
    }));

    setOrders(dashboardOrders);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();

    const channel = supabase
      .channel("admin-home-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async () => {
          await loadDashboard();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        async () => {
          await loadDashboard();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        async () => {
          await loadDashboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 6);

    return products
      .filter((item) => {
        return (
          item.name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [products, search]);

  const stats = useMemo(() => {
    const todayStart = getTodayStartIso();
    const weekStart = getWeekStartIso();

    const todayOrders = allOrders.filter((order) => order.created_at >= todayStart);
    const weekOrders = allOrders.filter((order) => order.created_at >= weekStart);
    const weekActiveOrders = weekOrders.filter((order) => order.status !== "Отменен");
    const weekRevenue = weekActiveOrders.reduce((sum, order) => sum + order.total, 0);

    const previousWeekEnd = new Date(weekStart);
    const previousWeekStart = new Date(previousWeekEnd);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const previousWeekOrders = allOrders.filter((order) => {
      return (
        order.created_at >= previousWeekStart.toISOString() &&
        order.created_at < previousWeekEnd.toISOString() &&
        order.status !== "Отменен"
      );
    });

    const previousWeekRevenue = previousWeekOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );

    const soldItems = allOrderItems.reduce((sum, item) => sum + item.quantity, 0);
    const averageCheck =
      weekActiveOrders.length > 0 ? Math.round(weekRevenue / weekActiveOrders.length) : 0;
    const activeProducts = products.filter((item) => item.status === "Активен").length;
    const hiddenProducts = products.filter((item) => item.status === "Скрыт").length;
    const revenueDelta = calcPercentChange(weekRevenue, previousWeekRevenue);

    return [
      {
        title: "Выручка",
        value: `${weekRevenue.toLocaleString("ru-RU")} ₽`,
        note: `${revenueDelta >= 0 ? "+" : ""}${revenueDelta}% за неделю`,
        icon: "₽",
      },
      {
        title: "Заказы",
        value: weekActiveOrders.length.toLocaleString("ru-RU"),
        note: `${todayOrders.length} новых сегодня`,
        icon: "🛍",
      },
      {
        title: "Продано товаров",
        value: soldItems.toLocaleString("ru-RU"),
        note: `Средний чек ${averageCheck.toLocaleString("ru-RU")} ₽`,
        icon: "📦",
      },
      {
        title: "Активные / скрытые",
        value: `${activeProducts} / ${hiddenProducts}`,
        note: "Текущий каталог",
        icon: "⚠",
      },
    ];
  }, [allOrders, allOrderItems, products]);

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      setMessage(`Ошибка обновления статуса: ${error.message}`);
      return;
    }

    await loadDashboard();
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

      {message && (
        <div className="mb-6 whitespace-pre-wrap rounded-[24px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.title} className="rounded-[28px] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">{item.title}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5F5F5] text-base">
                {item.icon}
              </div>
            </div>
            <p className="text-2xl font-semibold tracking-[-0.03em]">{item.value}</p>
            <p className="mt-2 text-sm text-gray-400">{item.note}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium">Товары</h3>
              <p className="text-sm text-gray-500">Быстрое управление каталогом</p>
            </div>
            <Link
              href="/admin/products"
              className="rounded-2xl bg-[#F5F5F5] px-4 py-2 text-sm text-gray-700"
            >
              Все товары
            </Link>
          </div>

          {loading ? (
            <div className="rounded-[24px] bg-[#F7F7F7] p-6 text-center text-sm text-gray-500">
              Загрузка товаров...
            </div>
          ) : (
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
                      <td className="py-4 pr-4 text-sm text-gray-600">{item.brand}</td>
                      <td className="py-4 pr-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-emerald-600">
                            {item.price.toLocaleString("ru-RU")} ₽
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {item.old_price.toLocaleString("ru-RU")} ₽
                          </span>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="rounded-full bg-[#F5F5F5] px-2.5 py-1 text-xs text-gray-700">
                          {item.badge || "Без бейджа"}
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

              {filteredProducts.length === 0 && (
                <div className="pt-4 text-sm text-gray-500">Ничего не найдено</div>
              )}
            </div>
          )}
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

            {loading ? (
              <div className="rounded-[24px] bg-[#F7F7F7] p-6 text-center text-sm text-gray-500">
                Загрузка заказов...
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-[24px] bg-[#F7F7F7] p-6 text-center text-sm text-gray-500">
                Заказов пока нет
              </div>
            ) : (
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

                    <div className="mb-3 text-xs text-gray-400">{order.createdAt}</div>

                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(order.id, e.target.value as OrderStatus)
                      }
                      className="w-full rounded-2xl border border-black/5 bg-white px-3 py-2 text-sm outline-none"
                    >
                      <option>Новый</option>
                      <option>Оплачен</option>
                      <option>В обработке</option>
                      <option>Собран</option>
                      <option>В доставке</option>
                      <option>Доставлен</option>
                      <option>Отменен</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <h3 className="text-lg font-medium">Что дальше</h3>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="rounded-2xl bg-[#F7F7F7] p-4">
                1. Главная панель уже показывает реальные товары и реальные заказы.
              </div>
              <div className="rounded-2xl bg-[#F7F7F7] p-4">
                2. Статусы заказов обновляются прямо отсюда и сохраняются в базе.
              </div>
              <div className="rounded-2xl bg-[#F7F7F7] p-4">
                3. Следующим шагом можно добавить графики и KPI по продажам.
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}