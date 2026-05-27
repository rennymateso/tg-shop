"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

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
  customer_id: string | null;
  customer: string;
  phone: string;
  total: number;
  payment: string;
  delivery: string;
  address: string;
  status: OrderStatus;
  comment: string | null;
  promo_code: string | null;
  created_at?: string;
  updated_at?: string;
};

type OrderItemRow = {
  id?: string;
  order_id: string;
  product_id: string | null;
  name: string;
  size: string | null;
  color: string | null;
  quantity: number;
  price: number;
};

type OrderFilter = "Все" | "Новые" | "В работе" | "Доставка" | "Завершенные";

const statusOptions: OrderStatus[] = [
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

const filterOptions: OrderFilter[] = [
  "Все",
  "Новые",
  "В работе",
  "Доставка",
  "Завершенные",
];

function getStatusClasses(status: OrderStatus) {
  switch (status) {
    case "Новый":
      return "bg-[#F3F4F6] text-gray-700";
    case "Оплачен":
      return "bg-[#E8F7EE] text-[#15803D]";
    case "В обработке":
      return "bg-[#FEF3C7] text-[#B45309]";
    case "Частично готов":
      return "bg-[#FFF7ED] text-[#C2410C]";
    case "В пути из-за рубежа":
      return "bg-[#E0E7FF] text-[#4338CA]";
    case "Собран":
      return "bg-[#DBEAFE] text-[#1D4ED8]";
    case "В доставке":
      return "bg-[#EDE9FE] text-[#6D28D9]";
    case "Доставлен":
      return "bg-[#DCFCE7] text-[#166534]";
    case "Отменен":
      return "bg-[#FEE2E2] text-[#B91C1C]";
    default:
      return "bg-[#F3F4F6] text-gray-700";
  }
}

function formatDate(value?: string) {
  if (!value) return "Дата не указана";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата не указана";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPrice(value: number) {
  return Number(value || 0).toLocaleString("ru-RU");
}

function getFilterMatch(order: OrderRow, filter: OrderFilter) {
  if (filter === "Все") return true;
  if (filter === "Новые") return order.status === "Новый";
  if (filter === "В работе") {
    return [
      "Оплачен",
      "В обработке",
      "Частично готов",
      "В пути из-за рубежа",
      "Собран",
    ].includes(order.status);
  }
  if (filter === "Доставка") return order.status === "В доставке";
  if (filter === "Завершенные") {
    return ["Доставлен", "Отменен"].includes(order.status);
  }

  return true;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, OrderItemRow[]>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("Все");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const previousContent = viewport?.getAttribute("content") || "";

    viewport?.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover"
    );

    return () => {
      if (viewport) viewport.setAttribute("content", previousContent);
    };
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Ошибка загрузки заказов: ${error.message}`);
      setOrders([]);
      setItemsMap({});
      setLoading(false);
      return;
    }

    const safeOrders = (data || []) as OrderRow[];
    setOrders(safeOrders);

    if (safeOrders.length === 0) {
      setItemsMap({});
      setLoading(false);
      return;
    }

    const orderIds = safeOrders.map((order) => order.id);

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);

    if (itemsError) {
      setMessage(`Ошибка загрузки товаров заказов: ${itemsError.message}`);
      setItemsMap({});
      setLoading(false);
      return;
    }

    const nextMap: Record<string, OrderItemRow[]> = {};

    ((itemsData || []) as OrderItemRow[]).forEach((item) => {
      if (!nextMap[item.order_id]) nextMap[item.order_id] = [];
      nextMap[item.order_id].push(item);
    });

    setItemsMap(nextMap);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async () => {
          await loadOrders();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        async () => {
          await loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(() => {
    const newOrders = orders.filter((order) => order.status === "Новый").length;
    const inWork = orders.filter((order) =>
      [
        "Оплачен",
        "В обработке",
        "Частично готов",
        "В пути из-за рубежа",
        "Собран",
      ].includes(order.status)
    ).length;
    const delivery = orders.filter((order) => order.status === "В доставке").length;
    const done = orders.filter((order) =>
      ["Доставлен", "Отменен"].includes(order.status)
    ).length;

    return { newOrders, inWork, delivery, done };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchFilter = getFilterMatch(order, filter);
      const matchSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        String(order.customer || "").toLowerCase().includes(q) ||
        String(order.phone || "").toLowerCase().includes(q) ||
        String(order.address || "").toLowerCase().includes(q);

      return matchFilter && matchSearch;
    });
  }, [orders, search, filter]);

  const getItemsCount = (orderId: string) => {
    const items = itemsMap[orderId] || [];
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      setMessage(`Ошибка обновления статуса: ${error.message}`);
      return;
    }

    await loadOrders();
  };

  return (
    <>
      <style>{`
        input,
        select {
          font-size: 16px;
        }
      `}</style>

      <div className="mb-5">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Seller panel</p>
              <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-black">
                Заказы
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Управление сборкой, доставкой и статусами
              </p>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              className="shrink-0 rounded-2xl bg-[#F5F5F5] px-4 py-2.5 text-sm font-medium text-gray-700"
            >
              Обновить
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#F5F5F5] px-4 py-3">
            <span className="text-gray-400">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск заказа, клиента, телефона"
              className="w-full bg-transparent text-[16px] outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-[22px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      <section className="mb-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setFilter("Новые")}
          className="rounded-[24px] bg-white p-4 text-left shadow-sm"
        >
          <p className="text-xs text-gray-500">Новые</p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em]">
            {stats.newOrders}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("В работе")}
          className="rounded-[24px] bg-white p-4 text-left shadow-sm"
        >
          <p className="text-xs text-gray-500">В работе</p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em]">
            {stats.inWork}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("Доставка")}
          className="rounded-[24px] bg-white p-4 text-left shadow-sm"
        >
          <p className="text-xs text-gray-500">Доставка</p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em]">
            {stats.delivery}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("Завершенные")}
          className="rounded-[24px] bg-white p-4 text-left shadow-sm"
        >
          <p className="text-xs text-gray-500">Завершенные</p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em]">
            {stats.done}
          </p>
        </button>
      </section>

      <section className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {filterOptions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
              filter === item
                ? "bg-[#111] text-white"
                : "bg-white text-gray-600 shadow-sm"
            }`}
          >
            {item}
          </button>
        ))}
      </section>

      <section className="rounded-[28px] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-black">
              Список заказов
            </h2>
            <p className="text-sm text-gray-500">
              {filteredOrders.length} из {orders.length} заказов
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-8 text-center text-sm text-gray-500">
            Загрузка заказов...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-8 text-center text-sm text-gray-500">
            Заказы не найдены
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const itemsCount = getItemsCount(order.id);

              return (
                <div
                  key={order.id}
                  className="rounded-[24px] bg-[#F7F7F7] p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-black">
                        {order.id}
                      </p>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {formatDate(order.created_at)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-gray-400">Клиент</p>
                      <p className="mt-1 truncate font-medium text-black">
                        {order.customer || "Не указан"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-gray-400">Телефон</p>
                      <p className="mt-1 truncate font-medium text-black">
                        {order.phone || "Не указан"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-gray-400">Товаров</p>
                      <p className="mt-1 font-medium text-black">{itemsCount}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-gray-400">Сумма</p>
                      <p className="mt-1 font-medium text-black">
                        {formatPrice(order.total)} ₽
                      </p>
                    </div>
                  </div>

                  <div className="mb-3 rounded-2xl bg-white p-3">
                    <p className="text-xs text-gray-400">Адрес / получение</p>
                    <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-black">
                      {order.delivery || "Получение не указано"}
                      {order.address ? ` • ${order.address}` : ""}
                    </p>
                  </div>

                  {order.comment && (
                    <div className="mb-3 rounded-2xl bg-[#FFF7ED] p-3">
                      <p className="text-xs text-orange-500">Комментарий</p>
                      <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-black">
                        {order.comment}
                      </p>
                    </div>
                  )}

                  <div className="mb-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => updateStatus(order.id, "В обработке")}
                      className="rounded-2xl bg-white px-3 py-2.5 text-xs font-medium text-gray-700"
                    >
                      Собрать
                    </button>

                    <button
                      type="button"
                      onClick={() => updateStatus(order.id, "Собран")}
                      className="rounded-2xl bg-white px-3 py-2.5 text-xs font-medium text-gray-700"
                    >
                      Собран
                    </button>

                    <button
                      type="button"
                      onClick={() => updateStatus(order.id, "В доставке")}
                      className="rounded-2xl bg-white px-3 py-2.5 text-xs font-medium text-gray-700"
                    >
                      Отправить
                    </button>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateStatus(order.id, e.target.value as OrderStatus)
                      }
                      className="w-full rounded-2xl border border-black/5 bg-white px-3 py-2.5 text-sm outline-none"
                    >
                      {statusOptions.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>

                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="rounded-2xl bg-[#111] px-4 py-2.5 text-sm font-medium text-white"
                    >
                      Открыть
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
