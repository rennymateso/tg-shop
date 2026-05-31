"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Boxes,
  Bell,
  ChevronRight,
  CircleHelp,
  PackageCheck,
  ShoppingBag,
  Wallet,
} from "lucide-react";
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

type OrderRow = {
  id: string;
  customer: string;
  phone: string;
  total: number;
  status: OrderStatus;
  created_at: string;
};

type OrderItemRow = {
  order_id: string;
  quantity: number;
};

type ProductRow = {
  id: string;
  status: string;
  stock?: Record<string, number> | null;
};

type DayPoint = {
  key: string;
  label: string;
  shortLabel: string;
  revenue: number;
  deliveredRevenue: number;
  orderedUnits: number;
  deliveredUnits: number;
  orders: number;
};

function formatPrice(value: number) {
  return value.toLocaleString("ru-RU");
}

function getDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getStockTotal(product: ProductRow) {
  if (!product.stock || typeof product.stock !== "object") return 0;
  return Object.values(product.stock).reduce(
    (sum, value) => sum + Math.max(0, Number(value) || 0),
    0
  );
}

function statusClass(status: OrderStatus) {
  if (status === "Новый") return "bg-black text-white";
  if (status === "Оплачен") return "bg-blue-50 text-blue-700";
  if (status === "Отменен") return "bg-red-50 text-red-600";
  if (status === "Доставлен") return "bg-emerald-50 text-emerald-700";
  return "bg-amber-50 text-amber-700";
}

export default function AdminPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [miniAppVisits, setMiniAppVisits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedDayIndex, setSelectedDayIndex] = useState(13);
  const [salesMetric, setSalesMetric] = useState<"money" | "units">("units");
  const [showNotifications, setShowNotifications] = useState(false);
  const [seenNotificationIds, setSeenNotificationIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const saved = window.localStorage.getItem("montreaux_seen_admin_notifications");
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const newOrderNotifications = useMemo(
    () => orders.filter((order) => order.status === "Новый"),
    [orders]
  );
  const unseenNotificationCount = useMemo(
    () =>
      newOrderNotifications.filter((order) => !seenNotificationIds.includes(order.id)).length,
    [newOrderNotifications, seenNotificationIds]
  );

  const markNotificationsSeen = () => {
    if (newOrderNotifications.length === 0) return;

    setSeenNotificationIds((current) => {
      const next = Array.from(
        new Set([...current, ...newOrderNotifications.map((order) => order.id)])
      );
      window.localStorage.setItem(
        "montreaux_seen_admin_notifications",
        JSON.stringify(next)
      );
      return next;
    });
  };

  const closeNotifications = () => {
    markNotificationsSeen();
    setShowNotifications(false);
  };

  const loadDashboard = async () => {
    setLoading(true);
    setMessage("");

    const [{ data: ordersData, error: ordersError }, { data: productsData }] =
      await Promise.all([
        supabase
          .from("orders")
          .select("id,customer,phone,total,status,created_at")
          .order("created_at", { ascending: false }),
        supabase.from("products").select("id,status,stock"),
      ]);

    if (ordersError) {
      setMessage(`Не удалось загрузить заказы: ${ordersError.message}`);
      setOrders([]);
      setOrderItems([]);
      setProducts((productsData || []) as ProductRow[]);
      setLoading(false);
      return;
    }

    const safeOrders = (ordersData || []) as OrderRow[];
    const orderIds = safeOrders.map((order) => order.id);

    let items: OrderItemRow[] = [];
    if (orderIds.length > 0) {
      const { data: itemsData } = await supabase
        .from("order_items")
        .select("order_id,quantity")
        .in("order_id", orderIds);

      items = (itemsData || []) as OrderItemRow[];
    }

    setOrders(safeOrders);
    setOrderItems(items);
    setProducts((productsData || []) as ProductRow[]);
    setLoading(false);
  };

  const loadVisitStats = async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("app_events")
      .select("id", { count: "exact", head: true })
      .eq("type", "mini_app_visit")
      .gte("created_at", startOfDay.toISOString());

    if (!error) {
      setMiniAppVisits(count || 0);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadVisitStats();

    const channel = supabase
      .channel("admin-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, loadDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, loadDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_events" }, loadVisitStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!showNotifications) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        closeNotifications();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [showNotifications, newOrderNotifications]);

  const itemsByOrder = useMemo(() => {
    return orderItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.order_id] = (acc[item.order_id] || 0) + item.quantity;
      return acc;
    }, {});
  }, [orderItems]);

  const dayPoints = useMemo<DayPoint[]>(() => {
    const start = new Date();
    start.setDate(start.getDate() - 13);
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = getDayKey(date);
      const dayOrders = orders.filter((order) => order.created_at.slice(0, 10) === key);
      const activeOrders = dayOrders.filter((order) => order.status !== "Отменен");
      const deliveredOrders = dayOrders.filter((order) => order.status === "Доставлен");
      const orderedUnits = activeOrders.reduce(
        (sum, order) => sum + (itemsByOrder[order.id] || 0),
        0
      );
      const deliveredUnits = deliveredOrders.reduce(
        (sum, order) => sum + (itemsByOrder[order.id] || 0),
        0
      );

      return {
        key,
        label: date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
        shortLabel: date.toLocaleDateString("ru-RU", { day: "2-digit" }),
        revenue: activeOrders.reduce((sum, order) => sum + order.total, 0),
        deliveredRevenue: deliveredOrders.reduce((sum, order) => sum + order.total, 0),
        orderedUnits,
        deliveredUnits,
        orders: activeOrders.length,
      };
    });
  }, [orders, itemsByOrder]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    const weekOrders = orders.filter((order) => new Date(order.created_at) >= weekAgo);
    const activeWeekOrders = weekOrders.filter((order) => order.status !== "Отменен");
    const revenue = activeWeekOrders.reduce((sum, order) => sum + order.total, 0);
    const delivered = weekOrders.filter((order) => order.status === "Доставлен");
    const newOrders = orders.filter((order) => order.status === "Новый");
    const inWork = orders.filter((order) =>
      ["Оплачен", "В обработке", "Частично готов", "В пути из-за рубежа", "Собран"].includes(order.status)
    );
    const soldItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const activeProducts = products.filter((product) => product.status === "Активен").length;
    const emptyProducts = products.filter((product) => getStockTotal(product) <= 0).length;

    return {
      revenue,
      deliveredRevenue: delivered.reduce((sum, order) => sum + order.total, 0),
      newOrders: newOrders.length,
      inWork: inWork.length,
      soldItems,
      activeProducts,
      emptyProducts,
      balance: revenue,
      nextPayout: Math.round(revenue * 0.35),
    };
  }, [orders, orderItems, products]);

  const selectedDay = dayPoints[selectedDayIndex] || dayPoints[dayPoints.length - 1];
  const maxSalesValue = Math.max(
    ...dayPoints.map((point) =>
      salesMetric === "units" ? point.orderedUnits : point.revenue
    ),
    1
  );
  const selectedOrdered =
    salesMetric === "units" ? selectedDay?.orderedUnits || 0 : selectedDay?.revenue || 0;
  const selectedDelivered =
    salesMetric === "units"
      ? selectedDay?.deliveredUnits || 0
      : selectedDay?.deliveredRevenue || 0;
  const selectedSuffix = salesMetric === "units" ? "шт" : "₽";
  return (
    <>
      <header className="mb-2 rounded-[22px] bg-white px-3 pb-3 pt-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-semibold text-black">
                MONTREAUX
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">Seller panel</p>
          </div>

          <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={() => {
              if (showNotifications) {
                closeNotifications();
                return;
              }

              setShowNotifications(true);
            }}
            className="relative z-30 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f6fb] text-slate-500"
            aria-label="Уведомления"
          >
            <Bell size={20} />
            {unseenNotificationCount > 0 && !showNotifications && (
              <span className="pointer-events-none absolute -right-1 -top-1 z-40 min-w-5 rounded-full bg-[#ec168f] px-1 text-center text-[11px] font-semibold leading-5 text-white">
                {unseenNotificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 z-20 w-[270px] rounded-[18px] border border-slate-100 bg-white p-2 shadow-xl">
              <div className="flex items-center justify-between gap-2 px-2 pb-1">
                <p className="text-[12px] font-semibold text-black">
                  Уведомления
                </p>
                {newOrderNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={closeNotifications}
                    className="rounded-lg bg-[#f4f6fb] px-2 py-1 text-[11px] font-medium text-slate-600"
                  >
                    Очистить
                  </button>
                )}
              </div>
              {newOrderNotifications.length === 0 ? (
                <p className="rounded-xl bg-[#f4f6fb] px-3 py-2 text-[12px] text-slate-500">
                  Новых заказов нет
                </p>
              ) : (
                <div className="max-h-[260px] space-y-1 overflow-y-auto pr-1">
                  {newOrderNotifications.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="block break-words rounded-xl bg-[#f4f6fb] px-3 py-2 text-[12px] leading-4 text-black"
                      onClick={closeNotifications}
                    >
                      У вас новый заказ №{order.id}. Нужно его обработать.
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </header>

      {message && (
        <div className="mb-4 rounded-[24px] bg-white p-4 text-sm text-red-600 shadow-sm">
          {message}
        </div>
      )}

      <section className="mb-2 rounded-[22px] bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[21px] font-semibold text-black">
            Продажи
          </h2>
          <CircleHelp size={20} className="text-slate-400" />
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSalesMetric("money")}
              className={`h-8 rounded-xl px-3 text-[12px] ${
                salesMetric === "money"
                  ? "bg-[#24262d] text-white"
                  : "bg-[#f4f6fb] text-black"
              }`}
            >
              ₽
            </button>
            <button
              type="button"
              onClick={() => setSalesMetric("units")}
              className={`h-8 rounded-xl px-3 text-[12px] ${
                salesMetric === "units"
                  ? "bg-[#24262d] text-white"
                  : "bg-[#f4f6fb] text-black"
              }`}
            >
              Штуки
            </button>
          </div>
          <span className="text-[13px] font-medium text-black">{selectedDay?.label || "--"}</span>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2 rounded-[18px] border border-slate-100 p-3">
          <div>
            <p className="text-[12px] text-slate-500">Заказано</p>
            <p className="mt-1 text-[20px] font-semibold text-black">
              {formatPrice(selectedOrdered)} {selectedSuffix}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-slate-500">Доставлено</p>
            <p className="mt-1 text-[20px] font-semibold text-black">
              {formatPrice(selectedDelivered)} {selectedSuffix}
            </p>
          </div>
        </div>

        <div className="h-[190px] rounded-[18px] bg-white px-1 pb-2 pt-2">
          <div
            className="grid h-[150px] gap-1"
            style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}
          >
            {dayPoints.map((point, index) => {
              const orderedValue = salesMetric === "units" ? point.orderedUnits : point.revenue;
              const deliveredValue =
                salesMetric === "units" ? point.deliveredUnits : point.deliveredRevenue;
              const hasSales = orderedValue > 0;
              const fullHeight = hasSales
                ? Math.max(18, Math.round((orderedValue / maxSalesValue) * 132))
                : 0;
              const deliveredRatio =
                orderedValue > 0
                  ? Math.min(1, deliveredValue / orderedValue)
                  : 0;
              const blueHeight =
                deliveredValue > 0
                  ? Math.max(6, Math.round(fullHeight * deliveredRatio))
                  : 0;
              const selected = index === selectedDayIndex;

              return (
                <button
                  key={point.key}
                  type="button"
                  onClick={() => setSelectedDayIndex(index)}
                  className="flex h-full w-full flex-col items-center justify-end border-0 bg-transparent p-0"
                  aria-label={`Показать продажи за ${point.label}`}
                >
                  <span
                    className={`relative flex w-full max-w-[20px] items-end rounded-full ${
                      selected ? "border border-black/70 bg-white" : ""
                    }`}
                    style={{ height: `${selected ? 138 : fullHeight}px` }}
                  >
                    {hasSales && (
                      <span
                        className="absolute bottom-0 left-1/2 w-full -translate-x-1/2 overflow-hidden rounded-full bg-slate-100"
                        style={{ height: `${fullHeight}px` }}
                      >
                        {blueHeight > 0 && (
                          <span
                            className="absolute bottom-0 left-0 w-full rounded-full bg-[#0969ff]"
                            style={{ height: `${blueHeight}px` }}
                          />
                        )}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            className="mt-2 grid gap-1"
            style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}
          >
            {dayPoints.map((point, index) => (
              <button
                key={point.key}
                type="button"
                onClick={() => setSelectedDayIndex(index)}
                className={`border-0 bg-transparent p-0 text-center text-[11px] font-semibold ${
                  selectedDayIndex === index ? "text-black" : "text-slate-500"
                }`}
              >
                {point.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-2 rounded-[22px] bg-white p-3 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {[
            { href: "/admin/statistics", label: "Аналитика продаж", icon: BarChart3 },
            { href: "/admin/orders", label: "Заказы", icon: ShoppingBag },
            { href: "/admin/products", label: "Товары", icon: PackageCheck },
            { href: "/admin/stocks", label: "Остатки", icon: Boxes },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="min-w-0 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#f4f6fb] text-slate-400">
                  <Icon size={22} />
                </span>
                <span className="mt-1.5 block text-[12px] font-medium leading-4 text-black">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mb-2 rounded-[22px] bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[21px] font-semibold text-black">
            Финансы
          </h2>
          <CircleHelp size={20} className="text-slate-400" />
        </div>

        <div className="rounded-[18px] border border-slate-100 p-3">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <p className="text-[12px] text-black">Текущий баланс</p>
              <p className="mt-1 text-[21px] font-semibold text-black">
                {formatPrice(stats.balance)} ₽
              </p>
            </div>
            <Link
              href="/admin/statistics"
              className="rounded-xl bg-[#0969ff] px-4 py-2 text-[12px] font-medium text-white"
            >
              Отчёт
            </Link>
          </div>
        </div>

        <div className="mt-2 rounded-[18px] border border-slate-100 p-3">
          <p className="text-[12px] text-black">В работе</p>
          <p className="mt-1 text-[20px] font-semibold text-black">{stats.inWork}</p>
          <Link href="/admin/orders" className="mt-2 inline-block text-[12px] font-medium text-[#0969ff]">
            Открыть заказы
          </Link>
        </div>

        <Link
          href="/admin/statistics"
          className="mt-2 flex items-center justify-between rounded-[18px] bg-[#f4f6fb] p-3 text-[13px] font-medium text-black"
        >
          <span className="flex items-center gap-3">
            <Wallet size={22} className="text-slate-400" />
            Финансы
          </span>
          <ChevronRight className="text-slate-400" />
        </Link>
      </section>

      <section className="mb-2 rounded-[22px] bg-white p-3 shadow-sm">
        <h2 className="text-[21px] font-semibold text-black">
          Контроль
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Link href="/admin/orders" className="rounded-[18px] bg-[#f4f6fb] p-3">
            <p className="text-[12px] text-slate-500">Новые заказы</p>
            <p className="mt-1 text-[20px] font-semibold text-black">{stats.newOrders}</p>
          </Link>
          <Link href="/admin/products" className="rounded-[18px] bg-[#f4f6fb] p-3">
            <p className="text-[12px] text-slate-500">Без остатков</p>
            <p className="mt-1 text-[20px] font-semibold text-black">{stats.emptyProducts}</p>
          </Link>
          <Link href="/admin/products" className="rounded-[18px] bg-[#f4f6fb] p-3">
            <p className="text-[12px] text-slate-500">Активных товаров</p>
            <p className="mt-1 text-[20px] font-semibold text-black">{stats.activeProducts}</p>
          </Link>
          <Link href="/admin/statistics" className="rounded-[18px] bg-[#f4f6fb] p-3">
            <p className="text-[12px] text-slate-500">Продано штук</p>
            <p className="mt-1 text-[20px] font-semibold text-black">{stats.soldItems}</p>
          </Link>
          <Link href="/admin/statistics" className="rounded-[18px] bg-[#f4f6fb] p-3">
            <p className="text-[12px] text-slate-500">Заходы в mini app</p>
            <p className="mt-1 text-[20px] font-semibold text-black">{miniAppVisits}</p>
          </Link>
        </div>
      </section>

      {loading && (
        <p className="pb-4 text-center text-sm text-slate-400">Обновляем данные...</p>
      )}
    </>
  );
}
