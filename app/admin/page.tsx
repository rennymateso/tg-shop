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

type ProductRow = {
  id: string;
  status: "Активен" | "Скрыт";
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

type DailyPoint = {
  date: string;
  label: string;
  revenue: number;
  orders: number;
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

function getDayKey(dateString: string) {
  return new Date(dateString).toISOString().slice(0, 10);
}

function getDayLabel(dateString: string) {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function AdminPage() {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [allOrders, setAllOrders] = useState<OrderRowDb[]>([]);
  const [allOrderItems, setAllOrderItems] = useState<OrderItemRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setMessage("");

    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id,status");

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

    const dashboardOrders: DashboardOrder[] = safeOrders.slice(0, 6).map((order) => ({
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

  const dailyPoints = useMemo<DailyPoint[]>(() => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const map = new Map<string, DailyPoint>();

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString();
      const key = getDayKey(iso);
      map.set(key, {
        date: key,
        label: getDayLabel(iso),
        revenue: 0,
        orders: 0,
      });
    }

    allOrders.forEach((order) => {
      const key = getDayKey(order.created_at);
      const point = map.get(key);
      if (!point) return;

      point.orders += 1;
      if (order.status !== "Отменен") {
        point.revenue += order.total;
      }
    });

    return Array.from(map.values());
  }, [allOrders]);

  const maxRevenue = useMemo(() => {
    return dailyPoints.reduce((max, item) => Math.max(max, item.revenue), 0) || 1;
  }, [dailyPoints]);

  const chartPoints = useMemo(() => {
    if (dailyPoints.length === 0) return "";
    const width = 100;
    const height = 36;

    return dailyPoints
      .map((item, index) => {
        const x =
          dailyPoints.length === 1 ? width / 2 : (index / (dailyPoints.length - 1)) * width;
        const y = height - (item.revenue / maxRevenue) * height;
        return `${x},${Number.isFinite(y) ? y : height}`;
      })
      .join(" ");
  }, [dailyPoints, maxRevenue]);

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
          <Link
            href="/admin/statistics"
            className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-medium text-gray-700 shadow-sm"
          >
            Открыть статистику
          </Link>

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

      <section className="mb-6 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Продажи за 7 дней</h3>
            <p className="text-sm text-gray-500">Реальные данные по выручке</p>
          </div>

          <Link
            href="/admin/statistics"
            className="rounded-2xl bg-[#F5F5F5] px-4 py-2 text-sm text-gray-700"
          >
            Вся статистика
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-6 text-center text-sm text-gray-500">
            Загрузка графика...
          </div>
        ) : (
          <div className="rounded-[24px] bg-[#F7F7F7] p-4">
            <svg
              viewBox="0 0 100 40"
              className="h-40 w-full overflow-visible"
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke="black"
                strokeWidth="2"
                points={chartPoints}
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <div className="mt-3 grid grid-cols-7 gap-2">
              {dailyPoints.map((item) => (
                <div key={item.date} className="text-center">
                  <p className="text-[11px] text-gray-400">{item.label}</p>
                  <p className="mt-1 text-xs font-medium text-black">
                    {item.revenue.toLocaleString("ru-RU")} ₽
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {item.orders} зак.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-medium">Быстрые действия</h3>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/admin/orders"
              className="rounded-2xl bg-[#F7F7F7] p-4 text-sm text-gray-700"
            >
              Открыть все заказы
            </Link>

            <Link
              href="/admin/products"
              className="rounded-2xl bg-[#F7F7F7] p-4 text-sm text-gray-700"
            >
              Открыть товары
            </Link>

            <Link
              href="/admin/brands"
              className="rounded-2xl bg-[#F7F7F7] p-4 text-sm text-gray-700"
            >
              Управлять брендами
            </Link>

            <Link
              href="/admin/badges"
              className="rounded-2xl bg-[#F7F7F7] p-4 text-sm text-gray-700"
            >
              Управлять бейджами
            </Link>
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
                1. Главная панель показывает реальные заказы и выручку.
              </div>
              <div className="rounded-2xl bg-[#F7F7F7] p-4">
                2. Мини-график теперь стоит выше и сразу виден.
              </div>
              <div className="rounded-2xl bg-[#F7F7F7] p-4">
                3. Полная аналитика доступна в разделе статистики.
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}