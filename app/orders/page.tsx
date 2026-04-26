"use client";

import { useEffect, useMemo, useState } from "react";
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

function getStatusClasses(status: OrderStatus) {
  switch (status) {
    case "Новый":
      return "bg-[#F3F4F6] text-gray-700";
    case "Оплачен":
      return "bg-[#E8F7EE] text-[#15803D]";
    case "В обработке":
      return "bg-[#FEF3C7] text-[#B45309]";
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
              <div className="h-5 w-36 rounded-full bg-[#ECECEC]" />
              <div className="mt-3 h-4 w-28 rounded-full bg-[#ECECEC]" />
              <div className="mt-3 h-4 w-20 rounded-full bg-[#ECECEC]" />
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
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedOrderId, setCopiedOrderId] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);

      const profile = await syncTelegramCustomer();
      setCustomer(profile);

      if (!profile?.id) {
        setOrders([]);
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
        setLoading(false);
        return;
      }

      setOrders((data || []) as OrderRow[]);
      setLoading(false);
    };

    loadOrders();
  }, []);

  const hasOrders = useMemo(() => orders.length > 0, [orders]);

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
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-[24px] bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[16px] font-medium text-black">
                    Заказ {order.id}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDate(order.created_at || order.updated_at)}
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

              <div className="mt-4 space-y-2 text-sm text-gray-600">
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
                onClick={() => copyOrderId(order.id)}
                className="mt-4 w-full rounded-2xl bg-[#F5F5F5] py-3 text-sm font-medium text-black"
              >
                {copiedOrderId === order.id
                  ? "Номер заказа скопирован"
                  : "Скопировать номер заказа"}
              </button>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}