"use client";

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

type PaymentMethod = "Картой" | "Наличными";
type DeliveryMethod = "Доставка" | "Самовывоз";

type OrderItemStatus =
  | "Новый"
  | "Подтвержден"
  | "Готов к отправке"
  | "В пути из-за рубежа"
  | "Прибыл"
  | "Собран"
  | "Отправлен"
  | "Доставлен"
  | "Отменен";

type OrderItem = {
  id: number;
  order_id: string;
  product_id: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  item_status: OrderItemStatus | null;
  created_at: string;
};

type OrderRowDb = {
  id: string;
  customer: string;
  phone: string;
  total: number;
  payment: PaymentMethod;
  delivery: DeliveryMethod;
  address: string;
  status: OrderStatus;
  comment: string;
  promo_code: string;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  id: string;
  customer: string;
  phone: string;
  total: number;
  payment: PaymentMethod;
  delivery: DeliveryMethod;
  address: string;
  status: OrderStatus;
  createdAt: string;
  createdAtRaw: string;
  comment: string;
  promoCode: string;
  items: OrderItem[];
};

type QuickFilter =
  | "Все"
  | "Новый"
  | "В обработке"
  | "Частично готов"
  | "В пути из-за рубежа"
  | "В доставке"
  | "Доставлен"
  | "Отменен";

type DateFilter = "Все даты" | "Только сегодня";

const quickFilters: QuickFilter[] = [
  "Все",
  "Новый",
  "В обработке",
  "Частично готов",
  "В пути из-за рубежа",
  "В доставке",
  "Доставлен",
  "Отменен",
];

const dateFilters: DateFilter[] = ["Все даты", "Только сегодня"];

const itemStatusOptions: OrderItemStatus[] = [
  "Новый",
  "Подтвержден",
  "Готов к отправке",
  "В пути из-за рубежа",
  "Прибыл",
  "Собран",
  "Отправлен",
  "Доставлен",
  "Отменен",
];

function orderStatusClass(status: OrderStatus) {
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

function itemStatusClass(status: OrderItemStatus | null) {
  switch (status) {
    case "Новый":
      return "bg-gray-100 text-gray-700";
    case "Подтвержден":
      return "bg-amber-100 text-amber-700";
    case "Готов к отправке":
      return "bg-emerald-100 text-emerald-700";
    case "В пути из-за рубежа":
      return "bg-indigo-100 text-indigo-700";
    case "Прибыл":
      return "bg-blue-100 text-blue-700";
    case "Собран":
      return "bg-violet-100 text-violet-700";
    case "Отправлен":
      return "bg-fuchsia-100 text-fuchsia-700";
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

function getOrderHint(status: OrderStatus) {
  switch (status) {
    case "Новый":
      return "Заказ только создан";
    case "Оплачен":
      return "Оплата подтверждена";
    case "В обработке":
      return "Начали работу по заказу";
    case "Частично готов":
      return "Часть товаров уже готова";
    case "В пути из-за рубежа":
      return "Ждём зарубежные позиции";
    case "Собран":
      return "Все товары готовы";
    case "В доставке":
      return "Заказ уже отправлен";
    case "Доставлен":
      return "Заказ завершён";
    case "Отменен":
      return "Заказ отменён";
    default:
      return "";
  }
}

function isToday(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<QuickFilter>("Все");
  const [selectedDateFilter, setSelectedDateFilter] =
    useState<DateFilter>("Все даты");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setMessage("");

    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) {
      setMessage(`Ошибка загрузки заказов: ${ordersError.message}`);
      setOrders([]);
      setLoading(false);
      return;
    }

    const safeOrders = ((ordersData || []) as OrderRowDb[]) || [];
    const orderIds = safeOrders.map((order) => order.id);

    let itemsMap: Record<string, OrderItem[]> = {};

    if (orderIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds)
        .order("created_at", { ascending: true });

      if (itemsError) {
        setMessage(`Ошибка загрузки товаров заказа: ${itemsError.message}`);
      } else {
        itemsMap = ((itemsData || []) as OrderItem[]).reduce<
          Record<string, OrderItem[]>
        >((acc, item) => {
          if (!acc[item.order_id]) acc[item.order_id] = [];
          acc[item.order_id].push(item);
          return acc;
        }, {});
      }
    }

    const merged: OrderRow[] = safeOrders.map((order) => ({
      id: order.id,
      customer: order.customer,
      phone: order.phone,
      total: order.total,
      payment: order.payment,
      delivery: order.delivery,
      address: order.address,
      status: order.status,
      createdAt: formatOrderDate(order.created_at),
      createdAtRaw: order.created_at,
      comment: order.comment || "",
      promoCode: order.promo_code || "",
      items: itemsMap[order.id] || [],
    }));

    setOrders(merged);

    if (merged.length > 0) {
      setSelectedOrderId((prev) =>
        prev && merged.some((order) => order.id === prev) ? prev : merged[0].id
      );
    } else {
      setSelectedOrderId("");
    }

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

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        selectedFilter === "Все" || order.status === selectedFilter;

      const matchesDate =
        selectedDateFilter === "Все даты" || isToday(order.createdAtRaw);

      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.phone.toLowerCase().includes(q) ||
        order.status.toLowerCase().includes(q) ||
        order.payment.toLowerCase().includes(q) ||
        order.delivery.toLowerCase().includes(q);

      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [orders, search, selectedFilter, selectedDateFilter]);

  const selectedOrder =
    filteredOrders.find((order) => order.id === selectedOrderId) ||
    filteredOrders[0] ||
    null;

  const updateItemStatus = async (
    itemId: number,
    status: OrderItemStatus
  ) => {
    setUpdatingItemId(itemId);
    setMessage("");

    const { error } = await supabase
      .from("order_items")
      .update({
        item_status: status,
      })
      .eq("id", itemId);

    if (error) {
      setMessage(`Ошибка обновления статуса товара: ${error.message}`);
      setUpdatingItemId(null);
      return;
    }

    await loadOrders();
    setUpdatingItemId(null);
  };

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((order) => order.status !== "Отменен")
        .reduce((sum, order) => sum + order.total, 0),
    [orders]
  );

  const newOrdersCount = useMemo(
    () => orders.filter((order) => order.status === "Новый").length,
    [orders]
  );

  const deliveryOrdersCount = useMemo(
    () => orders.filter((order) => order.delivery === "Доставка").length,
    [orders]
  );

  const pickupOrdersCount = useMemo(
    () => orders.filter((order) => order.delivery === "Самовывоз").length,
    [orders]
  );

  const todayOrders = useMemo(
    () => orders.filter((order) => isToday(order.createdAtRaw)),
    [orders]
  );

  const todayNewOrders = useMemo(
    () => todayOrders.filter((order) => order.status === "Новый").length,
    [todayOrders]
  );

  const todayDeliveryOrders = useMemo(
    () => todayOrders.filter((order) => order.delivery === "Доставка").length,
    [todayOrders]
  );

  const todayPickupOrders = useMemo(
    () => todayOrders.filter((order) => order.delivery === "Самовывоз").length,
    [todayOrders]
  );

  const getFilterCount = (filter: QuickFilter) => {
    const base =
      selectedDateFilter === "Только сегодня"
        ? orders.filter((order) => isToday(order.createdAtRaw))
        : orders;

    if (filter === "Все") return base.length;
    return base.filter((order) => order.status === filter).length;
  };

  const getDateFilterCount = (filter: DateFilter) => {
    if (filter === "Все даты") return orders.length;
    return orders.filter((order) => isToday(order.createdAtRaw)).length;
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">Заказы</h1>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <span className="text-gray-400">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по заказам"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 sm:w-80"
            />
          </div>

          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black shadow-sm disabled:opacity-60"
          >
            {loading ? "Обновляем..." : "Обновить"}
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Заказы за сегодня</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {todayOrders.length}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Новые сегодня</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {todayNewOrders}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Сегодня в доставку</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {todayDeliveryOrders}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Сегодня самовывоз</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {todayPickupOrders}
          </p>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {dateFilters.map((filter) => {
            const isActive = selectedDateFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedDateFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  isActive
                    ? "bg-black text-white"
                    : "bg-white text-black shadow-sm"
                }`}
              >
                {filter} ({getDateFilterCount(filter)})
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {quickFilters.map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  isActive
                    ? "bg-black text-white"
                    : "bg-white text-black shadow-sm"
                }`}
              >
                {filter} ({getFilterCount(filter)})
              </button>
            );
          })}
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-[24px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Всего заказов</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {orders.length}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Новые заказы</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {newOrdersCount}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Выручка</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {totalRevenue.toLocaleString("ru-RU")} ₽
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Доставка / Самовывоз</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {deliveryOrdersCount} / {pickupOrdersCount}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-black">Список заказов</h2>
              <p className="text-sm text-gray-500">Открой заказ и меняй статусы товаров</p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-[24px] bg-[#F7F7F7] p-6 text-center text-sm text-gray-500">
              Загрузка заказов...
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full rounded-[24px] p-4 text-left transition ${
                    selectedOrder?.id === order.id
                      ? "bg-black text-white"
                      : "bg-[#F7F7F7] text-black"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{order.id}</p>
                      <p
                        className={`mt-1 text-xs ${
                          selectedOrder?.id === order.id
                            ? "text-white/70"
                            : "text-gray-500"
                        }`}
                      >
                        {order.customer} • {order.phone}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        selectedOrder?.id === order.id
                          ? "bg-white text-black"
                          : orderStatusClass(order.status)
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between text-sm ${
                      selectedOrder?.id === order.id
                        ? "text-white/80"
                        : "text-gray-600"
                    }`}
                  >
                    <span>{order.createdAt}</span>
                    <span>{order.total.toLocaleString("ru-RU")} ₽</span>
                  </div>
                </button>
              ))}

              {filteredOrders.length === 0 && (
                <div className="rounded-[24px] bg-[#F7F7F7] p-6 text-center text-sm text-gray-500">
                  Нет заказов по выбранным фильтрам
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          {selectedOrder ? (
            <>
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Карточка заказа</p>
                  <h2 className="text-xl font-semibold text-black">
                    {selectedOrder.id}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    {getOrderHint(selectedOrder.status)}
                  </p>
                </div>

                <span
                  className={`inline-flex rounded-full px-3 py-1.5 text-xs ${orderStatusClass(
                    selectedOrder.status
                  )}`}
                >
                  {selectedOrder.status}
                </span>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-[24px] bg-[#F7F7F7] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                    Клиент
                  </p>
                  <p className="mt-2 text-sm font-medium text-black">
                    {selectedOrder.customer}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedOrder.phone}
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#F7F7F7] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                    Дата
                  </p>
                  <p className="mt-2 text-sm font-medium text-black">
                    {selectedOrder.createdAt}
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#F7F7F7] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                    Получение
                  </p>
                  <p className="mt-2 text-sm font-medium text-black">
                    {selectedOrder.delivery}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedOrder.address}
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#F7F7F7] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                    Оплата
                  </p>
                  <p className="mt-2 text-sm font-medium text-black">
                    {selectedOrder.payment}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Сумма: {selectedOrder.total.toLocaleString("ru-RU")} ₽
                  </p>
                </div>
              </div>

              <div className="mb-6 rounded-[24px] bg-[#F7F7F7] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                  Комментарий
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  {selectedOrder.comment || "Комментарий отсутствует"}
                </p>
                {selectedOrder.promoCode ? (
                  <p className="mt-3 text-sm text-gray-600">
                    Промокод:{" "}
                    <span className="font-medium text-black">
                      {selectedOrder.promoCode}
                    </span>
                  </p>
                ) : null}
              </div>

              <div className="rounded-[24px] bg-[#F7F7F7] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-black">Состав заказа</h3>
                  <span className="text-sm text-gray-500">
                    {selectedOrder.items.length} поз.
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={`${selectedOrder.id}-${index}`}
                      className="rounded-[20px] bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-black">
                              {item.name}
                            </p>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] ${itemStatusClass(
                                item.item_status
                              )}`}
                            >
                              {item.item_status || "Новый"}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-gray-500">
                            Размер: {item.size} • Цвет: {item.color}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium text-black">
                            {(item.price * item.quantity).toLocaleString("ru-RU")} ₽
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.quantity} шт. × {item.price.toLocaleString("ru-RU")} ₽
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <select
                          value={item.item_status || "Новый"}
                          onChange={(e) =>
                            updateItemStatus(
                              item.id,
                              e.target.value as OrderItemStatus
                            )
                          }
                          disabled={updatingItemId === item.id}
                          className="w-full rounded-2xl border border-black/5 bg-[#F5F5F5] px-3 py-3 text-sm outline-none disabled:opacity-60"
                        >
                          {itemStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4">
                  <span className="text-sm text-gray-500">Итого</span>
                  <span className="text-lg font-semibold text-black">
                    {selectedOrder.total.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-[24px] bg-[#F7F7F7] p-8 text-center text-sm text-gray-500">
              Выберите заказ слева
            </div>
          )}
        </div>
      </section>
    </>
  );
}