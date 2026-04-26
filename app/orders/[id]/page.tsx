"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BottomNav from "../../components/BottomNav";
import { supabase } from "../../lib/supabase";
import {
  syncTelegramCustomer,
  type CustomerProfile,
} from "../../lib/customer-profile";

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

function getStatusHint(status: OrderStatus) {
  switch (status) {
    case "Новый":
      return "Заказ создан и ожидает подтверждения";
    case "Оплачен":
      return "Оплата получена";
    case "В обработке":
      return "Мы начали подготовку заказа";
    case "Частично готов":
      return "Часть товаров уже готова, остальные ещё ожидаются";
    case "В пути из-за рубежа":
      return "Ожидаем поступление зарубежных позиций";
    case "Собран":
      return "Все товары полностью готовы";
    case "В доставке":
      return "Заказ передан в доставку";
    case "Доставлен":
      return "Заказ успешно получен";
    case "Отменен":
      return "Заказ отменён";
    default:
      return "";
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

function OrderDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
        <div className="h-6 w-40 rounded-full bg-[#ECECEC]" />
        <div className="mt-3 h-4 w-28 rounded-full bg-[#ECECEC]" />
        <div className="mt-4 h-8 w-28 rounded-full bg-[#ECECEC]" />
      </div>

      <div className="animate-pulse rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
        <div className="h-5 w-36 rounded-full bg-[#ECECEC]" />
        <div className="mt-4 space-y-3">
          <div className="h-20 rounded-[20px] bg-[#ECECEC]" />
          <div className="h-20 rounded-[20px] bg-[#ECECEC]" />
        </div>
      </div>

      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]"
        >
          <div className="h-5 w-36 rounded-full bg-[#ECECEC]" />
          <div className="mt-3 h-4 w-full rounded-full bg-[#ECECEC]" />
          <div className="mt-3 h-4 w-2/3 rounded-full bg-[#ECECEC]" />
        </div>
      ))}
    </div>
  );
}

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = String(params?.id || "");

  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);

      const profile = await syncTelegramCustomer();
      setCustomer(profile);

      if (!profile?.id || !orderId) {
        setOrder(null);
        setOrderItems([]);
        setLoading(false);
        return;
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("customer_id", profile.id)
        .single();

      if (orderError || !orderData) {
        console.error("Ошибка загрузки заказа:", orderError?.message || "not found");
        setOrder(null);
        setOrderItems([]);
        setLoading(false);
        return;
      }

      setOrder(orderData as OrderRow);

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (itemsError) {
        console.error("Ошибка загрузки товаров заказа:", itemsError.message);
        setOrderItems([]);
        setLoading(false);
        return;
      }

      setOrderItems((itemsData || []) as OrderItemRow[]);
      setLoading(false);
    };

    loadOrder();
  }, [orderId]);

  const copyOrderId = async () => {
    if (!order?.id) return;

    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      //
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-[76px] pb-32">
      <div className="mb-5 flex items-center justify-center">
        <h1 className="text-[20px] font-medium">Детали заказа</h1>
      </div>

      {loading ? (
        <OrderDetailsSkeleton />
      ) : !customer ? (
        <div className="rounded-[24px] bg-white p-6 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-[16px] font-medium text-black">
            Не удалось загрузить профиль
          </p>
        </div>
      ) : !order ? (
        <div className="rounded-[24px] bg-white p-6 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-[16px] font-medium text-black">Заказ не найден</p>
          <p className="mt-2 text-sm text-gray-500">
            Возможно, он не принадлежит этому аккаунту
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[18px] font-medium text-black">
                    Заказ {order.id}
                  </p>

                  <button
                    type="button"
                    onClick={copyOrderId}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5]"
                    aria-label="Скопировать номер заказа"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="black"
                      strokeWidth="1.8"
                    >
                      <rect x="9" y="9" width="10" height="10" rx="2" />
                      <path d="M5 15V7a2 2 0 0 1 2-2h8" />
                    </svg>
                  </button>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  {copied
                    ? "Номер заказа скопирован"
                    : formatDate(order.created_at || order.updated_at)}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${getStatusClasses(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              {getStatusHint(order.status)}
            </p>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
            <h2 className="text-[16px] font-medium text-black">Товары в заказе</h2>

            {orderItems.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Товары не найдены</p>
            ) : (
              <div className="mt-4 space-y-3">
                {orderItems.map((item, index) => (
                  <div
                    key={`${item.order_id}-${item.product_id || item.name}-${index}`}
                    className="rounded-[20px] bg-[#F5F5F5] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium text-black">
                          {item.name}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.size ? (
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-gray-600">
                              Размер: {item.size}
                            </span>
                          ) : null}

                          {item.color ? (
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-gray-600">
                              Цвет: {item.color}
                            </span>
                          ) : null}

                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-gray-600">
                            Кол-во: {item.quantity}
                          </span>
                        </div>
                      </div>

                      <span className="shrink-0 text-[15px] font-semibold text-black">
                        {item.price * item.quantity} ₽
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      {item.price} ₽ за штуку
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
            <h2 className="text-[16px] font-medium text-black">Основное</h2>

            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between gap-3">
                <span>Сумма</span>
                <span className="font-medium text-black">{order.total} ₽</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span>Получение</span>
                <span className="font-medium text-black">{order.delivery}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span>Оплата</span>
                <span className="font-medium text-black">{order.payment}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span>Телефон</span>
                <span className="font-medium text-black">{order.phone}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
            <h2 className="text-[16px] font-medium text-black">Адрес</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {order.address || "Адрес не указан"}
            </p>
          </div>

          {order.comment ? (
            <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
              <h2 className="text-[16px] font-medium text-black">Комментарий</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {order.comment}
              </p>
            </div>
          ) : null}

          {order.promo_code ? (
            <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
              <h2 className="text-[16px] font-medium text-black">Промокод</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {order.promo_code}
              </p>
            </div>
          ) : null}
        </div>
      )}

      <BottomNav />
    </main>
  );
}