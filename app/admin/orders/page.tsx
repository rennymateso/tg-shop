"use client";

import { useMemo, useState } from "react";

type OrderStatus =
  | "Новый"
  | "Оплачен"
  | "В обработке"
  | "Собран"
  | "В доставке"
  | "Доставлен"
  | "Отменен";

type PaymentMethod = "Картой" | "Наличными" | "СБП";
type DeliveryMethod = "Доставка" | "Самовывоз";

type OrderItem = {
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
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
  comment: string;
  items: OrderItem[];
};

const initialOrders: OrderRow[] = [
  {
    id: "ORD-1001",
    customer: "Илья Смирнов",
    phone: "+7 (927) 123-45-67",
    total: 7800,
    payment: "Картой",
    delivery: "Доставка",
    address: "г. Казань, ул. Чистопольская, 20",
    status: "Новый",
    createdAt: "Сегодня, 12:40",
    comment: "Позвонить перед доставкой",
    items: [
      {
        name: "Поло Premium",
        size: "L",
        color: "Черный",
        quantity: 1,
        price: 3500,
      },
      {
        name: "Поло Classic",
        size: "M",
        color: "Белый",
        quantity: 1,
        price: 4300,
      },
    ],
  },
  {
    id: "ORD-1002",
    customer: "Руслан Ахметов",
    phone: "+7 (987) 765-43-21",
    total: 5200,
    payment: "СБП",
    delivery: "Самовывоз",
    address: 'г. Казань, Академика Глушко 16Г, ТЦ "АКАДЕМИК", 2 этаж',
    status: "Оплачен",
    createdAt: "Сегодня, 11:05",
    comment: "",
    items: [
      {
        name: "Поло Black",
        size: "XL",
        color: "Черный",
        quantity: 1,
        price: 5200,
      },
    ],
  },
  {
    id: "ORD-1003",
    customer: "Тимур Гайнутдинов",
    phone: "+7 (903) 111-22-33",
    total: 10400,
    payment: "Картой",
    delivery: "Доставка",
    address: "г. Москва, Ленинградский проспект, 48",
    status: "В обработке",
    createdAt: "Вчера, 18:22",
    comment: "Доставка после 18:00",
    items: [
      {
        name: "Поло White",
        size: "M",
        color: "Белый",
        quantity: 2,
        price: 2900,
      },
      {
        name: "Поло Premium",
        size: "XL",
        color: "Серый",
        quantity: 1,
        price: 4600,
      },
    ],
  },
];

const statusOptions: OrderStatus[] = [
  "Новый",
  "Оплачен",
  "В обработке",
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    initialOrders[0]?.id || ""
  );

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((order) => {
      return (
        order.id.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.phone.toLowerCase().includes(q) ||
        order.status.toLowerCase().includes(q) ||
        order.payment.toLowerCase().includes(q) ||
        order.delivery.toLowerCase().includes(q)
      );
    });
  }, [orders, search]);

  const selectedOrder =
    filteredOrders.find((order) => order.id === selectedOrderId) ||
    filteredOrders[0] ||
    null;

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    );
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

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">Заказы</h1>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
          <span className="text-gray-400">⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по заказам"
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 sm:w-80"
          />
        </div>
      </div>

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
              <p className="text-sm text-gray-500">
                Просмотр и изменение статусов
              </p>
            </div>
          </div>

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
                        : statusClass(order.status)
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
                Заказы не найдены
              </div>
            )}
          </div>
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
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs ${statusClass(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>

                  <select
                    value={selectedOrder.status}
                    onChange={(e) =>
                      updateOrderStatus(
                        selectedOrder.id,
                        e.target.value as OrderStatus
                      )
                    }
                    className="rounded-2xl border border-black/5 bg-[#F5F5F5] px-3 py-2 text-sm outline-none"
                  >
                    {statusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>
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
                        <div>
                          <p className="text-sm font-medium text-black">
                            {item.name}
                          </p>
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