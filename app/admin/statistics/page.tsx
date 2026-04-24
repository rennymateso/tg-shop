"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type RangeKey = "1d" | "7d" | "14d" | "30d";

type OrderStatus =
  | "Новый"
  | "Оплачен"
  | "В обработке"
  | "Собран"
  | "В доставке"
  | "Доставлен"
  | "Отменен";

type OrderRow = {
  id: string;
  total: number;
  status: OrderStatus;
  created_at: string;
};

type OrderItemRow = {
  id: number;
  order_id: string;
  created_at: string;
};

const rangeLabels: Record<RangeKey, string> = {
  "1d": "За день",
  "7d": "7 дней",
  "14d": "14 дней",
  "30d": "Месяц",
};

function getRangeStart(range: RangeKey) {
  const now = new Date();
  const next = new Date(now);

  if (range === "1d") next.setDate(now.getDate() - 1);
  if (range === "7d") next.setDate(now.getDate() - 7);
  if (range === "14d") next.setDate(now.getDate() - 14);
  if (range === "30d") next.setDate(now.getDate() - 30);

  return next.toISOString();
}

export default function AdminStatisticsPage() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadStats = async (selectedRange: RangeKey) => {
    setLoading(true);
    setMessage("");

    const fromDate = getRangeStart(selectedRange);

    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("id,total,status,created_at")
      .gte("created_at", fromDate)
      .order("created_at", { ascending: false });

    if (ordersError) {
      setMessage(`Ошибка загрузки заказов: ${ordersError.message}`);
      setOrders([]);
      setOrderItems([]);
      setLoading(false);
      return;
    }

    const safeOrders = (ordersData || []) as OrderRow[];
    setOrders(safeOrders);

    if (safeOrders.length === 0) {
      setOrderItems([]);
      setLoading(false);
      return;
    }

    const orderIds = safeOrders.map((order) => order.id);

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("id,order_id,created_at")
      .in("order_id", orderIds);

    if (itemsError) {
      setMessage(`Ошибка загрузки товаров заказов: ${itemsError.message}`);
      setOrderItems([]);
      setLoading(false);
      return;
    }

    setOrderItems((itemsData || []) as OrderItemRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadStats(range);
  }, [range]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-statistics-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async () => {
          await loadStats(range);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        async () => {
          await loadStats(range);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [range]);

  const current = useMemo(() => {
    const visits = orders.length;
    const productViews = orderItems.length;
    const favorites = 0;
    const cartAdds = orderItems.length;
    const activeOrders = orders.filter((order) => order.status !== "Отменен");
    const paidOrders = orders.filter((order) => order.status === "Оплачен");
    const revenue = activeOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      visits,
      productViews,
      favorites,
      cartAdds,
      orders: activeOrders.length,
      paidOrders: paidOrders.length,
      revenue,
    };
  }, [orders, orderItems]);

  const averageCheck = useMemo(() => {
    if (!current.paidOrders) return 0;
    return Math.round(current.revenue / current.paidOrders);
  }, [current]);

  const cartConversion = useMemo(() => {
    if (!current.visits) return 0;
    return ((current.cartAdds / current.visits) * 100).toFixed(1);
  }, [current]);

  const orderConversion = useMemo(() => {
    if (!current.visits) return 0;
    return ((current.orders / current.visits) * 100).toFixed(1);
  }, [current]);

  const funnel = [
    { label: "Оформленные заказы", value: current.orders },
    { label: "Товаров в заказах", value: current.productViews },
    { label: "Оплаченные заказы", value: current.paidOrders },
  ];

  const stats = [
    {
      title: "Заказы",
      value: current.orders.toLocaleString("ru-RU"),
      note: rangeLabels[range],
    },
    {
      title: "Товаров в заказах",
      value: current.cartAdds.toLocaleString("ru-RU"),
      note: `Соотношение ${cartConversion}%`,
    },
    {
      title: "Оплаченные заказы",
      value: current.paidOrders.toLocaleString("ru-RU"),
      note: rangeLabels[range],
    },
    {
      title: "Выручка",
      value: `${current.revenue.toLocaleString("ru-RU")} ₽`,
      note: `Средний чек ${averageCheck.toLocaleString("ru-RU")} ₽`,
    },
    {
      title: "Отмененные",
      value: orders
        .filter((order) => order.status === "Отменен")
        .length.toLocaleString("ru-RU"),
      note: rangeLabels[range],
    },
    {
      title: "Конверсия в заказ",
      value: `${orderConversion}%`,
      note: "По текущим данным",
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">Статистика</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(rangeLabels) as RangeKey[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={`rounded-2xl px-4 py-2 text-sm transition ${
                range === item
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 shadow-sm"
              }`}
            >
              {rangeLabels[item]}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-[24px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-[24px] bg-white p-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-[16px] font-medium text-black">Загрузка статистики...</p>
        </div>
      ) : (
        <>
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((item) => (
              <div key={item.title} className="rounded-[28px] bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">{item.title}</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
                  {item.value}
                </p>
                <p className="mt-2 text-sm text-gray-400">{item.note}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-medium text-black">Воронка заказов</h2>
              <p className="mt-1 text-sm text-gray-500">{rangeLabels[range]}</p>

              <div className="mt-5 space-y-4">
                {funnel.map((item, index) => {
                  const max = funnel[0].value || 1;
                  const width = Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0);

                  return (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-black">
                          {index + 1}. {item.label}
                        </span>
                        <span className="text-gray-500">
                          {item.value.toLocaleString("ru-RU")}
                        </span>
                      </div>

                      <div className="h-3 w-full rounded-full bg-[#F2F2F2]">
                        <div
                          className="h-3 rounded-full bg-black"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-medium text-black">Что считает блок</h2>

              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="rounded-2xl bg-[#F7F7F7] p-4">
                  1. Сколько заказов было создано за выбранный период.
                </div>
                <div className="rounded-2xl bg-[#F7F7F7] p-4">
                  2. Сколько товаров вошло в эти заказы.
                </div>
                <div className="rounded-2xl bg-[#F7F7F7] p-4">
                  3. Сколько заказов оплачено.
                </div>
                <div className="rounded-2xl bg-[#F7F7F7] p-4">
                  4. Сколько заказов отменено.
                </div>
                <div className="rounded-2xl bg-[#F7F7F7] p-4">
                  5. Общую выручку и средний чек по реальным заказам из базы.
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}