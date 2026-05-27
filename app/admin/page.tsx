"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type OrderStatus =
  | "Новый"
  | "Оплачен"
  | "В обработке"
  | "Частично готов"
  | "В пути из-за рубежа"
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
  comment: string | null;
  promo_code: string | null;
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
  name?: string;
  status: "Активен" | "Скрыт";
  stock?: Record<string, number> | null;
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

const orderStatusOptions: OrderStatus[] = [
  "Новый",
  "Оплачен",
  "В обработке",
  "Частично готов",
  "В пути из-за рубежа",
  "Собран",
  "В доставке",
  "Доставлен",
  "Отменен",
];

function statusClass(status: OrderStatus) {
  switch (status) {
    case "Новый":
      return "bg-black text-white";
    case "Оплачен":
      return "bg-emerald-100 text-emerald-700";
    case "В обработке":
      return "bg-amber-100 text-amber-700";
    case "Частично готов":
      return "bg-orange-100 text-orange-700";
    case "В пути из-за рубежа":
      return "bg-indigo-100 text-indigo-700";
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
    return new Date(value).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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

function getProductStockTotal(product: ProductRow) {
  if (!product.stock || typeof product.stock !== "object") return 0;
  return Object.values(product.stock).reduce(
    (sum, value) => sum + Math.max(0, Number(value) || 0),
    0
  );
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
      .select("id,name,status,stock");

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

  const stats = useMemo(() => {
    const todayStart = getTodayStartIso();
    const weekStart = getWeekStartIso();

    const todayOrders = allOrders.filter((order) => order.created_at >= todayStart);
    const newOrders = allOrders.filter((order) => order.status === "Новый");
    const processingOrders = allOrders.filter((order) =>
      ["Оплачен", "В обработке", "Частично готов", "В пути из-за рубежа", "Собран"].includes(
        order.status
      )
    );
    const deliveryOrders = allOrders.filter((order) => order.status === "В доставке");

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
    const outOfStockProducts = products.filter((item) => getProductStockTotal(item) <= 0).length;
    const revenueDelta = calcPercentChange(weekRevenue, previousWeekRevenue);

    return {
      weekRevenue,
      revenueDelta,
      todayOrders: todayOrders.length,
      newOrders: newOrders.length,
      processingOrders: processingOrders.length,
      deliveryOrders: deliveryOrders.length,
      soldItems,
      averageCheck,
      activeProducts,
      hiddenProducts,
      outOfStockProducts,
      cards: [
        {
          title: "Новые заказы",
          value: newOrders.length.toLocaleString("ru-RU"),
          note: `${todayOrders.length} сегодня`,
          href: "/admin/orders",
        },
        {
          title: "В работе",
          value: processingOrders.length.toLocaleString("ru-RU"),
          note: "Нужно собрать / отгрузить",
          href: "/admin/orders",
        },
        {
          title: "Выручка 7 дней",
          value: `${weekRevenue.toLocaleString("ru-RU")} ₽`,
          note: `${revenueDelta >= 0 ? "+" : ""}${revenueDelta}% к прошлой неделе`,
          href: "/admin/statistics",
        },
        {
          title: "Без остатков",
          value: outOfStockProducts.toLocaleString("ru-RU"),
          note: `${activeProducts} активных товаров`,
          href: "/admin/products",
        },
      ],
    };
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
      <div className="mb-5">
        <div className="rounded-[28px] bg-black p-5 text-white shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-white/55">Seller panel</p>
              <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.04em]">
                Главная
              </h1>
              <p className="mt-2 text-sm text-white/60">
                Контроль заказов, товаров и выручки
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-black"
            >
              + Товар
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[11px] text-white/55">Выручка 7 дней</p>
              <p className="mt-1 text-lg font-semibold">
                {stats.weekRevenue.toLocaleString("ru-RU")} ₽
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[11px] text-white/55">Новых сегодня</p>
              <p className="mt-1 text-lg font-semibold">{stats.todayOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-4 whitespace-pre-wrap rounded-[22px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      <section className="mb-5 grid grid-cols-2 gap-3">
        {stats.cards.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-[24px] bg-white p-4 shadow-sm"
          >
            <p className="text-xs text-gray-500">{item.title}</p>
            <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-black">
              {item.value}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-gray-400">{item.note}</p>
          </Link>
        ))}
      </section>

      <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em]">
              Продажи
            </h2>
            <p className="text-sm text-gray-500">За последние 7 дней</p>
          </div>

          <Link
            href="/admin/statistics"
            className="rounded-2xl bg-[#F5F5F5] px-4 py-2 text-sm text-gray-700"
          >
            Подробнее
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
              className="h-32 w-full overflow-visible"
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

            <div className="mt-3 grid grid-cols-7 gap-1">
              {dailyPoints.map((item) => (
                <div key={item.date} className="text-center">
                  <p className="text-[10px] text-gray-400">{item.label}</p>
                  <p className="mt-1 text-[10px] font-medium text-black">
                    {item.orders}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em]">
              Новые заказы
            </h2>
            <p className="text-sm text-gray-500">Быстрое управление статусами</p>
          </div>

          <Link href="/admin/orders" className="text-sm font-medium text-black">
            Все
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-6 text-center text-sm text-gray-500">
            Загружаем заказы...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-6 text-center text-sm text-gray-500">
            Заказов пока нет
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-[22px] bg-[#F7F7F7] p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-black">
                      {order.id}
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {order.customer} • {order.phone}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${statusClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-2xl bg-white p-2">
                    <p className="text-gray-400">Товаров</p>
                    <p className="mt-1 font-medium text-black">{order.items}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-2">
                    <p className="text-gray-400">Сумма</p>
                    <p className="mt-1 font-medium text-black">
                      {order.total.toLocaleString("ru-RU")} ₽
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-2">
                    <p className="text-gray-400">Дата</p>
                    <p className="mt-1 font-medium text-black">{order.createdAt}</p>
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateOrderStatus(order.id, e.target.value as OrderStatus)
                    }
                    className="w-full rounded-2xl border border-black/5 bg-white px-3 py-2.5 text-sm outline-none"
                  >
                    {orderStatusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>

                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white"
                  >
                    Открыть
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-5 grid grid-cols-2 gap-3">
        <Link
          href="/admin/products"
          className="rounded-[24px] bg-white p-4 text-sm font-medium text-black shadow-sm"
        >
          Товары
          <p className="mt-2 text-xs font-normal text-gray-500">
            Каталог, остатки, цены
          </p>
        </Link>

        <Link
          href="/admin/products/new"
          className="rounded-[24px] bg-white p-4 text-sm font-medium text-black shadow-sm"
        >
          Создать товар
          <p className="mt-2 text-xs font-normal text-gray-500">
            Фото, размеры, остатки
          </p>
        </Link>
      </section>
    </>
  );
}
