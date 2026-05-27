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

type PaymentAttemptStatus = "pending" | "confirmed" | "failed" | "cancelled";
type AttemptFilter = "Все попытки" | "Только ожидающие";

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

type CustomerRow = {
  id: string;
  telegram_user_id: number | null;
  telegram_username: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
};

type OrderRowDb = {
  id: string;
  customer_id: string | null;
  customer: string;
  phone: string;
  total: number;
  payment: PaymentMethod;
  delivery: DeliveryMethod;
  address: string;
  status: OrderStatus;
  comment: string | null;
  promo_code: string | null;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  id: string;
  customerId: string | null;
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
  telegramUserId: number | null;
  telegramUsername: string | null;
};

type PaymentAttemptRowDb = {
  id: string;
  order_id: string | null;
  customer_id: string | null;
  customer: string;
  phone: string;
  total: number;
  payment: "Картой";
  delivery: DeliveryMethod;
  address: string;
  comment: string | null;
  promo_code: string | null;
  status: PaymentAttemptStatus;
  tbank_order_id: string | null;
  tbank_payment_id: string | null;
  tbank_payment_status: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

type PaymentAttemptRow = {
  id: string;
  orderId: string | null;
  customerId: string | null;
  customer: string;
  phone: string;
  total: number;
  delivery: DeliveryMethod;
  address: string;
  comment: string;
  promoCode: string;
  status: PaymentAttemptStatus;
  tbankOrderId: string | null;
  tbankPaymentId: string | null;
  tbankPaymentStatus: string | null;
  paidAt: string | null;
  createdAt: string;
  createdAtRaw: string;
  telegramUserId: number | null;
  telegramUsername: string | null;
};

type QuickFilter =
  | "Все"
  | "Новый"
  | "Оплачен"
  | "В обработке"
  | "Частично готов"
  | "В пути из-за рубежа"
  | "Собран"
  | "В доставке"
  | "Доставлен"
  | "Отменен";

type DateFilter = "Все даты" | "Только сегодня";

const quickFilters: QuickFilter[] = [
  "Все",
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

const dateFilters: DateFilter[] = ["Все даты", "Только сегодня"];
const attemptFilters: AttemptFilter[] = ["Все попытки", "Только ожидающие"];

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
      return "bg-[#F3F4F6] text-[#111827]";
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

function attemptStatusClass(status: PaymentAttemptStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "confirmed":
      return "bg-emerald-100 text-emerald-700";
    case "failed":
      return "bg-red-100 text-red-600";
    case "cancelled":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatAttemptStatus(status: PaymentAttemptStatus) {
  switch (status) {
    case "pending":
      return "Ожидает оплату";
    case "confirmed":
      return "Оплачено";
    case "failed":
      return "Ошибка";
    case "cancelled":
      return "Отменено";
    default:
      return status;
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

function getOrderHint(status: OrderStatus) {
  switch (status) {
    case "Новый":
      return "Заказ нужно проверить и принять";
    case "Оплачен":
      return "Оплата получена, можно передавать в сборку";
    case "В обработке":
      return "Заказ готовится";
    case "Частично готов":
      return "Часть товаров готова";
    case "В пути из-за рубежа":
      return "Есть позиции в ожидании";
    case "Собран":
      return "Готов к выдаче или доставке";
    case "В доставке":
      return "Заказ передан в доставку";
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

function CopyIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M5 15V7a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M21.6 4.2c-.3-.2-.8-.2-1.4 0L3.8 10.5c-.7.3-.7.7-.1.9l4.2 1.3 1.6 5c.2.6.3.8.7.8.3 0 .5-.1.8-.4l2.3-2.2 4.7 3.5c.9.5 1.5.3 1.8-.8l2.8-13.1c.2-.8 0-1.2-.3-1.3Zm-12.7 8.3 8.2-5.2c.4-.3.8-.1.4.2l-6.8 6.1-.3 3.1-1.5-4.2Z" />
    </svg>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [paymentAttempts, setPaymentAttempts] = useState<PaymentAttemptRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<QuickFilter>("Все");
  const [selectedDateFilter, setSelectedDateFilter] =
    useState<DateFilter>("Все даты");
  const [selectedAttemptFilter, setSelectedAttemptFilter] =
    useState<AttemptFilter>("Все попытки");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [copiedOrderId, setCopiedOrderId] = useState("");

  const copyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedOrderId(orderId);
      window.setTimeout(() => {
        setCopiedOrderId("");
      }, 1500);
    } catch {
      setMessage("Не удалось скопировать номер заказа");
    }
  };

  const getTelegramLink = (params: {
    telegramUsername: string | null;
    telegramUserId: number | null;
  }) => {
    if (params.telegramUsername?.trim()) {
      return `https://t.me/${params.telegramUsername.trim()}`;
    }

    if (params.telegramUserId) {
      return `tg://user?id=${params.telegramUserId}`;
    }

    return "";
  };

  const hasTelegramLink = (params: {
    telegramUsername: string | null;
    telegramUserId: number | null;
  }) => Boolean(params.telegramUsername?.trim() || params.telegramUserId);

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

    const { data: attemptsData, error: attemptsError } = await supabase
      .from("payment_attempts")
      .select("*")
      .in("status", ["pending", "failed", "cancelled"])
      .order("created_at", { ascending: false });

    if (attemptsError) {
      setMessage(`Ошибка загрузки попыток оплаты: ${attemptsError.message}`);
    }

    const safeAttempts = ((attemptsData || []) as PaymentAttemptRowDb[]) || [];

    const customerIds = [
      ...safeOrders.map((order) => order.customer_id),
      ...safeAttempts.map((attempt) => attempt.customer_id),
    ].filter(Boolean) as string[];

    let itemsMap: Record<string, OrderItem[]> = {};
    let customersMap: Record<string, CustomerRow> = {};

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

    if (customerIds.length > 0) {
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("id, telegram_user_id, telegram_username, first_name, last_name, phone")
        .in("id", customerIds);

      if (customersError) {
        setMessage(`Ошибка загрузки клиентов: ${customersError.message}`);
      } else {
        customersMap = ((customersData || []) as CustomerRow[]).reduce<
          Record<string, CustomerRow>
        >((acc, customer) => {
          acc[customer.id] = customer;
          return acc;
        }, {});
      }
    }

    const mergedOrders: OrderRow[] = safeOrders.map((order) => {
      const customer = order.customer_id ? customersMap[order.customer_id] : undefined;

      return {
        id: order.id,
        customerId: order.customer_id,
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
        telegramUserId: customer?.telegram_user_id ?? null,
        telegramUsername: customer?.telegram_username ?? null,
      };
    });

    const mergedAttempts: PaymentAttemptRow[] = safeAttempts.map((attempt) => {
      const customer = attempt.customer_id ? customersMap[attempt.customer_id] : undefined;

      return {
        id: attempt.id,
        orderId: attempt.order_id,
        customerId: attempt.customer_id,
        customer: attempt.customer,
        phone: attempt.phone,
        total: attempt.total,
        delivery: attempt.delivery,
        address: attempt.address,
        comment: attempt.comment || "",
        promoCode: attempt.promo_code || "",
        status: attempt.status,
        tbankOrderId: attempt.tbank_order_id,
        tbankPaymentId: attempt.tbank_payment_id,
        tbankPaymentStatus: attempt.tbank_payment_status,
        paidAt: attempt.paid_at,
        createdAt: formatOrderDate(attempt.created_at),
        createdAtRaw: attempt.created_at,
        telegramUserId: customer?.telegram_user_id ?? null,
        telegramUsername: customer?.telegram_username ?? null,
      };
    });

    setOrders(mergedOrders);
    setPaymentAttempts(mergedAttempts);

    if (mergedOrders.length > 0) {
      setSelectedOrderId((prev) =>
        prev && mergedOrders.some((order) => order.id === prev)
          ? prev
          : mergedOrders[0].id
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers" },
        async () => {
          await loadOrders();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_attempts" },
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

  const filteredAttempts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return paymentAttempts.filter((attempt) => {
      const matchesAttemptFilter =
        selectedAttemptFilter === "Все попытки" || attempt.status === "pending";

      const matchesDate =
        selectedDateFilter === "Все даты" || isToday(attempt.createdAtRaw);

      const matchesSearch =
        !q ||
        attempt.id.toLowerCase().includes(q) ||
        attempt.customer.toLowerCase().includes(q) ||
        attempt.phone.toLowerCase().includes(q) ||
        formatAttemptStatus(attempt.status).toLowerCase().includes(q) ||
        attempt.delivery.toLowerCase().includes(q) ||
        (attempt.tbankPaymentStatus || "").toLowerCase().includes(q);

      return matchesAttemptFilter && matchesDate && matchesSearch;
    });
  }, [paymentAttempts, search, selectedDateFilter, selectedAttemptFilter]);

  const selectedOrder =
    filteredOrders.find((order) => order.id === selectedOrderId) ||
    filteredOrders[0] ||
    null;

  const updateItemStatus = async (itemId: number, status: OrderItemStatus) => {
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

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingOrderId(orderId);
    setMessage("");

    const { error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      setMessage(`Ошибка обновления статуса заказа: ${error.message}`);
      setUpdatingOrderId("");
      return;
    }

    await loadOrders();
    setUpdatingOrderId("");
  };

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((order) => order.status !== "Отменен")
        .reduce((sum, order) => sum + order.total, 0),
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

  const processingCount = useMemo(
    () =>
      orders.filter((order) =>
        ["Оплачен", "В обработке", "Частично готов", "В пути из-за рубежа", "Собран"].includes(
          order.status
        )
      ).length,
    [orders]
  );

  const deliveryOrdersCount = useMemo(
    () => orders.filter((order) => order.status === "В доставке").length,
    [orders]
  );

  const pendingAttemptsCount = useMemo(
    () => paymentAttempts.filter((attempt) => attempt.status === "pending").length,
    [paymentAttempts]
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

  const getAttemptFilterCount = (filter: AttemptFilter) => {
    const base =
      selectedDateFilter === "Только сегодня"
        ? paymentAttempts.filter((attempt) => isToday(attempt.createdAtRaw))
        : paymentAttempts;

    if (filter === "Все попытки") return base.length;
    return base.filter((attempt) => attempt.status === "pending").length;
  };

  return (
    <>
      <div className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Seller panel</p>
            <h1 className="text-[26px] font-semibold tracking-[-0.04em] text-black">
              Заказы
            </h1>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-60"
          >
            {loading ? "..." : "Обновить"}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-[22px] bg-white px-4 py-3 shadow-sm">
          <span className="text-gray-400">⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по заказам, клиенту или телефону"
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {message && (
        <div className="mb-4 whitespace-pre-wrap rounded-[22px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      <section className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-[24px] bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Сегодня</p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em]">
            {todayOrders.length}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            {todayNewOrders} новых
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">В работе</p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em]">
            {processingCount}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            нужно собрать
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">В доставке</p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em]">
            {deliveryOrdersCount}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            отправлены
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Выручка</p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em]">
            {totalRevenue.toLocaleString("ru-RU")} ₽
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            без отмен
          </p>
        </div>
      </section>

      <section className="mb-5">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {dateFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedDateFilter(filter)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm ${
                selectedDateFilter === filter
                  ? "bg-white text-black shadow-sm ring-1 ring-black/10"
                  : "bg-[#ECECEC] text-gray-600"
              }`}
            >
              {filter} · {getDateFilterCount(filter)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {quickFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedFilter(filter)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm ${
                selectedFilter === filter
                  ? "bg-white text-black shadow-sm ring-1 ring-black/10"
                  : "bg-[#ECECEC] text-gray-600"
              }`}
            >
              {filter} · {getFilterCount(filter)}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-[24px] bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
              Загружаем заказы...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-[24px] bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
              Заказы не найдены
            </div>
          ) : (
            filteredOrders.map((order) => (
              <article
                key={order.id}
                className={`rounded-[26px] bg-white p-4 shadow-sm transition ${
                  selectedOrder?.id === order.id ? "ring-1 ring-black/10" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[15px] font-semibold text-black">
                          {order.id}
                        </p>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            copyOrderId(order.id);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5F5F5] text-gray-600"
                          aria-label="Скопировать номер"
                        >
                          <CopyIcon />
                        </button>
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {copiedOrderId === order.id
                          ? "Номер скопирован"
                          : `${order.customer} • ${order.phone}`}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${orderStatusClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-[#F7F7F7] p-2">
                      <p className="text-[10px] text-gray-400">Товаров</p>
                      <p className="mt-1 text-sm font-medium text-black">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#F7F7F7] p-2">
                      <p className="text-[10px] text-gray-400">Сумма</p>
                      <p className="mt-1 text-sm font-medium text-black">
                        {order.total.toLocaleString("ru-RU")} ₽
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#F7F7F7] p-2">
                      <p className="text-[10px] text-gray-400">Получение</p>
                      <p className="mt-1 truncate text-sm font-medium text-black">
                        {order.delivery}
                      </p>
                    </div>
                  </div>
                </button>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, "В обработке")}
                    disabled={updatingOrderId === order.id}
                    className="rounded-2xl bg-[#F5F5F5] px-2 py-2.5 text-xs font-medium text-gray-700 disabled:opacity-60"
                  >
                    Собрать
                  </button>

                  <button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, "Собран")}
                    disabled={updatingOrderId === order.id}
                    className="rounded-2xl bg-[#F5F5F5] px-2 py-2.5 text-xs font-medium text-gray-700 disabled:opacity-60"
                  >
                    Отгрузить
                  </button>

                  <button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, "В доставке")}
                    disabled={updatingOrderId === order.id}
                    className="rounded-2xl bg-[#F5F5F5] px-2 py-2.5 text-xs font-medium text-gray-700 disabled:opacity-60"
                  >
                    Отправить
                  </button>
                </div>

                <select
                  value={order.status}
                  onChange={(event) =>
                    updateOrderStatus(order.id, event.target.value as OrderStatus)
                  }
                  disabled={updatingOrderId === order.id}
                  className="mt-3 w-full rounded-2xl border border-black/5 bg-[#FAFAFA] px-3 py-3 text-sm outline-none disabled:opacity-60"
                >
                  {orderStatusOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>

                {selectedOrder?.id === order.id && (
                  <div className="mt-4 rounded-[22px] bg-[#FAFAFA] p-4">
                    <p className="text-sm font-medium text-black">Информация</p>
                    <div className="mt-3 space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="text-gray-400">Дата:</span> {order.createdAt}
                      </p>
                      <p>
                        <span className="text-gray-400">Оплата:</span> {order.payment}
                      </p>
                      <p>
                        <span className="text-gray-400">Адрес:</span> {order.address || "—"}
                      </p>
                      {order.comment && (
                        <p>
                          <span className="text-gray-400">Комментарий:</span>{" "}
                          {order.comment}
                        </p>
                      )}
                      {order.promoCode && (
                        <p>
                          <span className="text-gray-400">Промокод:</span>{" "}
                          {order.promoCode}
                        </p>
                      )}
                    </div>

                    {hasTelegramLink({
                      telegramUsername: order.telegramUsername,
                      telegramUserId: order.telegramUserId,
                    }) && (
                      <a
                        href={getTelegramLink({
                          telegramUsername: order.telegramUsername,
                          telegramUserId: order.telegramUserId,
                        })}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#EAF6FF] px-3 py-2 text-sm font-medium text-[#229ED9]"
                      >
                        <TelegramIcon />
                        Telegram
                      </a>
                    )}

                    <div className="mt-4 space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl bg-white p-3 text-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-black">{item.name}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                {item.size || "—"} · {item.color || "—"} ·{" "}
                                {item.quantity} шт.
                              </p>
                            </div>
                            <span className="shrink-0 text-sm font-medium text-black">
                              {(item.price * item.quantity).toLocaleString("ru-RU")} ₽
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                            <select
                              value={item.item_status || "Новый"}
                              onChange={(event) =>
                                updateItemStatus(
                                  item.id,
                                  event.target.value as OrderItemStatus
                                )
                              }
                              disabled={updatingItemId === item.id}
                              className="rounded-xl border border-black/5 bg-[#F7F7F7] px-3 py-2 text-xs outline-none"
                            >
                              {itemStatusOptions.map((status) => (
                                <option key={status}>{status}</option>
                              ))}
                            </select>

                            <span
                              className={`rounded-xl px-3 py-2 text-xs ${itemStatusClass(
                                item.item_status
                              )}`}
                            >
                              {item.item_status || "Новый"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[26px] bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-black">Попытки оплаты</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ожидающие и неуспешные платежи
            </p>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {attemptFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedAttemptFilter(filter)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm ${
                    selectedAttemptFilter === filter
                      ? "bg-[#111827] text-white"
                      : "bg-[#F5F5F5] text-gray-600"
                  }`}
                >
                  {filter} · {getAttemptFilterCount(filter)}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {filteredAttempts.length === 0 ? (
                <div className="rounded-[20px] bg-[#F7F7F7] p-4 text-center text-sm text-gray-500">
                  Нет активных попыток
                </div>
              ) : (
                filteredAttempts.slice(0, 6).map((attempt) => (
                  <div key={attempt.id} className="rounded-[20px] bg-[#F7F7F7] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-black">
                          {attempt.customer}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {attempt.phone}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${attemptStatusClass(
                          attempt.status
                        )}`}
                      >
                        {formatAttemptStatus(attempt.status)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-gray-500">{attempt.createdAt}</span>
                      <span className="font-medium text-black">
                        {attempt.total.toLocaleString("ru-RU")} ₽
                      </span>
                    </div>

                    {hasTelegramLink({
                      telegramUsername: attempt.telegramUsername,
                      telegramUserId: attempt.telegramUserId,
                    }) && (
                      <a
                        href={getTelegramLink({
                          telegramUsername: attempt.telegramUsername,
                          telegramUserId: attempt.telegramUserId,
                        })}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-medium text-[#229ED9]"
                      >
                        <TelegramIcon />
                        Написать клиенту
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[26px] bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-black">Сводка</h2>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Ожидают оплату</span>
                <span className="font-medium text-black">{pendingAttemptsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Всего заказов</span>
                <span className="font-medium text-black">{orders.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Выручка без отмен</span>
                <span className="font-medium text-black">
                  {totalRevenue.toLocaleString("ru-RU")} ₽
                </span>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
