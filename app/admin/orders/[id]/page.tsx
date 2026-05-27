"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPrice(value: number) {
  return Number(value || 0).toLocaleString("ru-RU");
}

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
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

  const loadOrder = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      setOrder(null);
      setItems([]);
      setMessage(error?.message || "Заказ не найден");
      setLoading(false);
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id);

    if (itemsError) {
      setMessage(`Ошибка загрузки товаров заказа: ${itemsError.message}`);
      setItems([]);
    } else {
      setItems((itemsData || []) as OrderItemRow[]);
    }

    setOrder(data as OrderRow);
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const itemsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [items]);

  const itemsTotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
      0
    );
  }, [items]);

  const updateStatus = async (status: OrderStatus) => {
    if (!order) return;

    try {
      setSavingStatus(true);
      setMessage("");

      const now = new Date().toISOString();

      const { error } = await supabase
        .from("orders")
        .update({
          status,
          updated_at: now,
        })
        .eq("id", order.id);

      if (error) {
        setMessage(`Ошибка обновления статуса: ${error.message}`);
        setSavingStatus(false);
        return;
      }

      setOrder({
        ...order,
        status,
        updated_at: now,
      });

      setSavingStatus(false);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Не удалось обновить статус"
      );
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[24px] bg-white p-6 text-sm text-gray-500 shadow-sm">
        Загрузка заказа...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-[24px] bg-white p-6 text-sm text-gray-500 shadow-sm">
        Заказ не найден
      </div>
    );
  }

  return (
    <>
      <style>{`
        input,
        textarea,
        select {
          font-size: 16px;
        }
      `}</style>

      <div className="mb-5">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-gray-500">Заказ</p>
              <h1 className="mt-1 truncate text-[22px] font-semibold tracking-[-0.04em] text-black">
                {order.id}
              </h1>
              <p className="mt-1 text-xs text-gray-400">
                Создан: {formatDate(order.created_at)}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusClasses(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#F7F7F7] p-3">
              <p className="text-[11px] text-gray-400">Сумма</p>
              <p className="mt-1 text-lg font-semibold text-black">
                {formatPrice(order.total)} ₽
              </p>
            </div>

            <div className="rounded-2xl bg-[#F7F7F7] p-3">
              <p className="text-[11px] text-gray-400">Товаров</p>
              <p className="mt-1 text-lg font-semibold text-black">
                {itemsCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-[22px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      <section className="mb-4 rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-black">
          Управление заказом
        </h2>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => updateStatus("В обработке")}
            disabled={savingStatus}
            className="rounded-2xl bg-[#F7F7F7] px-3 py-3 text-xs font-medium text-gray-700 disabled:opacity-60"
          >
            Собрать
          </button>

          <button
            type="button"
            onClick={() => updateStatus("Собран")}
            disabled={savingStatus}
            className="rounded-2xl bg-[#F7F7F7] px-3 py-3 text-xs font-medium text-gray-700 disabled:opacity-60"
          >
            Собран
          </button>

          <button
            type="button"
            onClick={() => updateStatus("В доставке")}
            disabled={savingStatus}
            className="rounded-2xl bg-[#F7F7F7] px-3 py-3 text-xs font-medium text-gray-700 disabled:opacity-60"
          >
            Отправить
          </button>
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <select
            value={order.status}
            onChange={(e) => updateStatus(e.target.value as OrderStatus)}
            disabled={savingStatus}
            className="w-full rounded-2xl border border-black/5 bg-[#F7F7F7] px-3 py-3 text-sm outline-none disabled:opacity-60"
          >
            {statusOptions.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => updateStatus("Доставлен")}
            disabled={savingStatus}
            className="rounded-2xl bg-[#E8F7EE] px-4 py-3 text-sm font-medium text-[#15803D] disabled:opacity-60"
          >
            Доставлен
          </button>
        </div>
      </section>

      <section className="mb-4 rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-black">
          Клиент
        </h2>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-[#F7F7F7] p-4">
            <p className="text-xs text-gray-400">Имя</p>
            <p className="mt-1 text-sm font-medium text-black">
              {order.customer || "Не указано"}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F7F7F7] p-4">
            <p className="text-xs text-gray-400">Телефон</p>
            <p className="mt-1 text-sm font-medium text-black">
              {order.phone || "Не указан"}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F7F7F7] p-4">
            <p className="text-xs text-gray-400">Адрес</p>
            <p className="mt-1 text-sm font-medium leading-5 text-black">
              {order.address || "Адрес не указан"}
            </p>
          </div>

          {order.comment && (
            <div className="rounded-2xl bg-[#FFF7ED] p-4">
              <p className="text-xs text-orange-500">Комментарий клиента</p>
              <p className="mt-1 text-sm font-medium leading-5 text-black">
                {order.comment}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mb-4 rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-black">
          Получение и оплата
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <div className="rounded-2xl bg-[#F7F7F7] p-4">
            <p className="text-xs text-gray-400">Способ получения</p>
            <p className="mt-1 text-sm font-medium text-black">
              {order.delivery || "Не указан"}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F7F7F7] p-4">
            <p className="text-xs text-gray-400">Оплата</p>
            <p className="mt-1 text-sm font-medium text-black">
              {order.payment || "Не указана"}
            </p>
          </div>

          {order.promo_code && (
            <div className="rounded-2xl bg-[#F7F7F7] p-4">
              <p className="text-xs text-gray-400">Промокод</p>
              <p className="mt-1 text-sm font-medium text-black">
                {order.promo_code}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-black">
              Состав заказа
            </h2>
            <p className="text-sm text-gray-500">
              {items.length} позиций, {itemsCount} шт.
            </p>
          </div>

          <p className="text-sm font-semibold text-black">
            {formatPrice(itemsTotal)} ₽
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-6 text-center text-sm text-gray-500">
            Товары заказа не найдены
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={`${item.order_id}-${item.product_id}-${index}`}
                className="rounded-[22px] bg-[#F7F7F7] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-black">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Размер: {item.size || "—"} • Цвет: {item.color || "—"}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold text-black">
                    {formatPrice(item.price)} ₽
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-2xl bg-white p-3 text-sm">
                  <span className="text-gray-500">Количество</span>
                  <span className="font-medium text-black">
                    {item.quantity} шт.
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 pb-3">
        <Link
          href="/admin/orders"
          className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 shadow-sm"
        >
          Назад
        </Link>

        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-2xl bg-[#111] px-4 py-3 text-sm font-medium text-white"
        >
          Обновить
        </button>
      </div>
    </>
  );
}
