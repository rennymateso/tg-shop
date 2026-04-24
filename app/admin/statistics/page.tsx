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
  product_id: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  created_at: string;
};

type ProductBrandRow = {
  id: string;
  brand: string;
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

function formatDayLabel(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getDayKey(dateString: string) {
  return new Date(dateString).toISOString().slice(0, 10);
}

export default function AdminStatisticsPage() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [productBrands, setProductBrands] = useState<Record<string, string>>({});
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
      setProductBrands({});
      setLoading(false);
      return;
    }

    const safeOrders = (ordersData || []) as OrderRow[];
    setOrders(safeOrders);

    if (safeOrders.length === 0) {
      setOrderItems([]);
      setProductBrands({});
      setLoading(false);
      return;
    }

    const orderIds = safeOrders.map((order) => order.id);

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("id,order_id,product_id,name,size,color,quantity,price,created_at")
      .in("order_id", orderIds);

    if (itemsError) {
      setMessage(`Ошибка загрузки товаров заказов: ${itemsError.message}`);
      setOrderItems([]);
      setProductBrands({});
      setLoading(false);
      return;
    }

    const safeItems = (itemsData || []) as OrderItemRow[];
    setOrderItems(safeItems);

    const productIds = Array.from(
      new Set(
        safeItems
          .map((item) => item.product_id)
          .filter((value) => typeof value === "string" && value.trim().length > 0)
      )
    );

    if (productIds.length > 0) {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id,brand")
        .in("id", productIds);

      if (productsError) {
        setMessage(`Ошибка загрузки брендов товаров: ${productsError.message}`);
        setProductBrands({});
        setLoading(false);
        return;
      }

      const brandsMap: Record<string, string> = {};
      ((productsData || []) as ProductBrandRow[]).forEach((product) => {
        brandsMap[product.id] = product.brand;
      });
      setProductBrands(brandsMap);
    } else {
      setProductBrands({});
    }

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
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
    const activeOrders = orders.filter((order) => order.status !== "Отменен");
    const paidOrders = orders.filter((order) => order.status === "Оплачен");
    const cancelledOrders = orders.filter((order) => order.status === "Отменен");
    const revenue = activeOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      orders: activeOrders.length,
      paidOrders: paidOrders.length,
      cancelledOrders: cancelledOrders.length,
      itemsCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      revenue,
    };
  }, [orders, orderItems]);

  const averageCheck = useMemo(() => {
    if (!current.paidOrders) return 0;
    return Math.round(current.revenue / current.paidOrders);
  }, [current]);

  const paidConversion = useMemo(() => {
    if (!current.orders) return 0;
    return ((current.paidOrders / current.orders) * 100).toFixed(1);
  }, [current]);

  const cancelRate = useMemo(() => {
    if (!orders.length) return 0;
    return ((current.cancelledOrders / orders.length) * 100).toFixed(1);
  }, [orders.length, current.cancelledOrders]);

  const funnel = [
    { label: "Все заказы", value: orders.length },
    { label: "Не отменены", value: current.orders },
    { label: "Оплачены", value: current.paidOrders },
  ];

  const stats = [
    {
      title: "Заказы",
      value: current.orders.toLocaleString("ru-RU"),
      note: rangeLabels[range],
    },
    {
      title: "Товаров продано",
      value: current.itemsCount.toLocaleString("ru-RU"),
      note: rangeLabels[range],
    },
    {
      title: "Оплаченные заказы",
      value: current.paidOrders.toLocaleString("ru-RU"),
      note: `Оплачено ${paidConversion}%`,
    },
    {
      title: "Выручка",
      value: `${current.revenue.toLocaleString("ru-RU")} ₽`,
      note: `Средний чек ${averageCheck.toLocaleString("ru-RU")} ₽`,
    },
    {
      title: "Отмененные",
      value: current.cancelledOrders.toLocaleString("ru-RU"),
      note: `Доля ${cancelRate}%`,
    },
    {
      title: "Всего записей",
      value: orders.length.toLocaleString("ru-RU"),
      note: "С учетом отмененных",
    },
  ];

  const topProducts = useMemo(() => {
    const map = new Map<
      string,
      { name: string; quantity: number; revenue: number; orders: Set<string> }
    >();

    orderItems.forEach((item) => {
      const key = item.product_id || item.name;
      const currentValue = map.get(key) || {
        name: item.name,
        quantity: 0,
        revenue: 0,
        orders: new Set<string>(),
      };

      currentValue.quantity += item.quantity;
      currentValue.revenue += item.price * item.quantity;
      currentValue.orders.add(item.order_id);

      map.set(key, currentValue);
    });

    return Array.from(map.values())
      .map((item) => ({
        name: item.name,
        quantity: item.quantity,
        revenue: item.revenue,
        orders: item.orders.size,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orderItems]);

  const topBrands = useMemo(() => {
    const map = new Map<string, { quantity: number; revenue: number }>();

    orderItems.forEach((item) => {
      const brand = productBrands[item.product_id] || "Без бренда";
      const currentValue = map.get(brand) || { quantity: 0, revenue: 0 };

      currentValue.quantity += item.quantity;
      currentValue.revenue += item.price * item.quantity;

      map.set(brand, currentValue);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        quantity: value.quantity,
        revenue: value.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orderItems, productBrands]);

  const topColors = useMemo(() => {
    const map = new Map<string, number>();

    orderItems.forEach((item) => {
      const key = item.color || "Не указан";
      map.set(key, (map.get(key) || 0) + item.quantity);
    });

    return Array.from(map.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orderItems]);

  const topSizes = useMemo(() => {
    const map = new Map<string, number>();

    orderItems.forEach((item) => {
      const key = item.size || "Не указан";
      map.set(key, (map.get(key) || 0) + item.quantity);
    });

    return Array.from(map.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orderItems]);

  const dailyStats = useMemo(() => {
    const map = new Map<
      string,
      { date: string; orders: number; revenue: number; paid: number }
    >();

    orders.forEach((order) => {
      const key = getDayKey(order.created_at);
      const currentValue = map.get(key) || {
        date: key,
        orders: 0,
        revenue: 0,
        paid: 0,
      };

      currentValue.orders += 1;

      if (order.status !== "Отменен") {
        currentValue.revenue += order.total;
      }

      if (order.status === "Оплачен") {
        currentValue.paid += 1;
      }

      map.set(key, currentValue);
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);
  }, [orders]);

  const maxDailyRevenue = useMemo(() => {
    return dailyStats.reduce((max, item) => Math.max(max, item.revenue), 0) || 1;
  }, [dailyStats]);

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

          <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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
              <h2 className="text-lg font-medium text-black">Продажи по дням</h2>
              <p className="mt-1 text-sm text-gray-500">Последние даты в выбранном периоде</p>

              {dailyStats.length === 0 ? (
                <div className="mt-4 rounded-[24px] bg-[#F7F7F7] p-6 text-center text-sm text-gray-500">
                  Пока нет данных
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {dailyStats.map((item) => {
                    const width = Math.max((item.revenue / maxDailyRevenue) * 100, item.revenue > 0 ? 8 : 0);

                    return (
                      <div key={item.date}>
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                          <span className="text-black">{formatDayLabel(item.date)}</span>
                          <span className="text-gray-500">
                            {item.revenue.toLocaleString("ru-RU")} ₽
                          </span>
                        </div>

                        <div className="h-3 w-full rounded-full bg-[#F2F2F2]">
                          <div
                            className="h-3 rounded-full bg-black"
                            style={{ width: `${width}%` }}
                          />
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>Заказов: {item.orders}</span>
                          <span>Оплачено: {item.paid}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-black">Топ товаров</h2>
                <span className="text-sm text-gray-500">По количеству</span>
              </div>

              {topProducts.length === 0 ? (
                <div className="rounded-[24px] bg-[#F7F7F7] p-6 text-center text-sm text-gray-500">
                  Пока нет данных
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="rounded-[22px] bg-[#F7F7F7] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-black">
                            {index + 1}. {item.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Заказов: {item.orders}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium text-black">
                            {item.quantity} шт.
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.revenue.toLocaleString("ru-RU")} ₽
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-black">Топ брендов</h2>
                <span className="text-sm text-gray-500">По продажам</span>
              </div>

              {topBrands.length === 0 ? (
                <div className="rounded-[24px] bg-[#F7F7F7] p-6 text-center text-sm text-gray-500">
                  Пока нет данных
                </div>
              ) : (
                <div className="space-y-3">
                  {topBrands.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="rounded-[22px] bg-[#F7F7F7] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-black">
                            {index + 1}. {item.name}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium text-black">
                            {item.quantity} шт.
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.revenue.toLocaleString("ru-RU")} ₽
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-black">Популярные цвета</h2>
                <span className="text-sm text-gray-500">По количеству</span>
              </div>

              {topColors.length === 0 ? (
                <div className="rounded-[24px] bg-[#F7F7F7] p-6 text-center text-sm text-gray-500">
                  Пока нет данных
                </div>
              ) : (
                <div className="space-y-3">
                  {topColors.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="rounded-[22px] bg-[#F7F7F7] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-black">
                          {index + 1}. {item.name}
                        </p>
                        <p className="text-sm text-gray-600">{item.quantity} шт.</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-black">Популярные размеры</h2>
                <span className="text-sm text-gray-500">По количеству</span>
              </div>

              {topSizes.length === 0 ? (
                <div className="rounded-[24px] bg-[#F7F7F7] p-6 text-center text-sm text-gray-500">
                  Пока нет данных
                </div>
              ) : (
                <div className="space-y-3">
                  {topSizes.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="rounded-[22px] bg-[#F7F7F7] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-black">
                          {index + 1}. {item.name}
                        </p>
                        <p className="text-sm text-gray-600">{item.quantity} шт.</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}