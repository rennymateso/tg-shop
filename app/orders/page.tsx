"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";
import {
  syncTelegramCustomer,
  type CustomerProfile,
} from "../lib/customer-profile";

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
      return "Часть товаров уже готова";
    case "В пути из-за рубежа":
      return "Ожидаем поступление зарубежных позиций";
    case "Собран":
      return "Все товары готовы";
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

function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[24px] bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.05)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="h-5 w-40 rounded-full bg-[#ECECEC]" />
              <div className="mt-3 h-4 w-28 rounded-full bg-[#ECECEC]" />
              <div className="mt-3 h-4 w-24 rounded-full bg-[#ECECEC]" />
            </div>

            <div className="h-7 w-24 rounded-full bg-[#ECECEC]" />
          </div>

          <div className="mt-4 h-10 w-full rounded-2xl bg-[#ECECEC]" />
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItemRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [copiedOrderId, setCopiedOrderId] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);

      const profile = await syncTelegramCustomer();
      setCustomer(profile);

      if (!profile?.id) {
        setOrders([]);
        setOrderItemsMap({});
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Ошибка загрузки заказов:", error.message);
        setOrders([]);
        setOrderItemsMap({});
        setLoading(false);
        return;
      }

      const safeOrders = (data || []) as OrderRow[];
      setOrders(safeOrders);

      if (safeOrders.length === 0) {
        setOrderItemsMap({});
        setLoading(false);
        return;
      }

      const orderIds = safeOrders.map((order) => order.id);

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (itemsError) {
        console.error("Ошибка загрузки товаров заказов:", itemsError.message);
        setOrderItemsMap({});
        setLoading(false);
        return;
      }

      const nextMap: Record<string, OrderItemRow[]> = {};

      ((itemsData || []) as OrderItemRow[]).forEach((item) => {
        if (!nextMap[item.order_id]) {
          nextMap[item.order_id] = [];
        }
        nextMap[item.order_id].push(item);
      });

      setOrderItemsMap(nextMap);
      setLoading(false);
    };

    loadOrders();
  }, []);

  const hasOrders = useMemo(() => orders.length > 0, [orders]);

  const getItemsCount = (orderId: string) => {
    const items = orderItemsMap[orderId] || [];
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  const copyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedOrderId(orderId);

      window.setTimeout(() => {
        setCopiedOrderId("");
      }, 1600);
    } catch {
      //
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-[76px] pb-32">
      <div className="mb-5 flex items-center justify-center">
        <h1 className="text-[20px] font-medium">Мои заказы</h1>
      </div>

      {loading ? (
        <OrdersSkeleton />
      ) : !customer ? (
        <div className="rounded-[24px] bg-white p-6 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-[16px] font-medium text-black">
            Не удалось загрузить профиль
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Откройте приложение через Telegram Mini App
          </p>
        </div>
      ) : !hasOrders ? (
        <div className="rounded-[24px] bg-white p-6 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-[16px] font-medium text-black">
            У вас пока нет заказов
          </p>
          <p className="mt-2 text-sm text-gray-500">
            После оформления заказа он появится здесь
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const itemsCount = getItemsCount(order.id);

            return (
              <div
                key={order.id}
                className="rounded-[24px] bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[16px] font-medium text-black">
                        Заказ {order.id}
                      </p>

                      <button
                        type="button"
                        onClick={() => copyOrderId(order.id)}
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
                      {copiedOrderId === order.id
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

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between gap-3">
                    <span>Товаров</span>
                    <span className="font-medium text-black">{itemsCount}</span>
                  </div>

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
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="mt-4 w-full rounded-2xl bg-[#F5F5F5] py-3 text-sm font-medium text-black"
                >
                  Перейти
                </button>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </main>
  );
}