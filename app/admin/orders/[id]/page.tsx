"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Copy,
  MoreHorizontal,
  PackageOpen,
} from "lucide-react";
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

type ProductRow = {
  id: string;
  image: string | null;
  color_images: Record<string, string[]> | null;
  badge: string | null;
};

type DeliverySettings = {
  freeCities: string[];
  deliveryPrice: number;
  inStockMinDays: number;
  inStockMaxDays: number;
  foreignMinDays: number;
  foreignMaxDays: number;
  pickupAddress: string;
};

const defaultDeliverySettings: DeliverySettings = {
  freeCities: ["Казань"],
  deliveryPrice: 500,
  inStockMinDays: 1,
  inStockMaxDays: 3,
  foreignMinDays: 7,
  foreignMaxDays: 14,
  pickupAddress: 'г. Казань, Академика Глушко 16Г, ТЦ "АКАДЕМИК", 2 этаж',
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

function formatPrice(value: number) {
  return Number(value || 0).toLocaleString("ru-RU");
}

function compactOrderId(id: string) {
  return id.replace("ORD-", "");
}

function formatDate(value?: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("ru-RU", options || { day: "numeric", month: "long" });
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function addDays(value: string | undefined, days: number) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";

  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function getStatusPill(status: OrderStatus) {
  if (["Собран", "Частично готов", "В пути из-за рубежа"].includes(status)) {
    return { label: "Готов к отгрузке", className: "bg-[#d9fbf8] text-[#00a8a0]", dot: true };
  }
  if (status === "В доставке") {
    return { label: "Доставляется", className: "bg-[#f1edff] text-[#6d5bd0]", dot: false };
  }
  if (status === "Доставлен") {
    return { label: "Доставлен", className: "bg-[#dcfce7] text-[#15803d]", dot: false };
  }
  if (status === "Отменен") {
    return { label: "Отменён", className: "bg-[#f4f6fb] text-slate-500", dot: false };
  }

  return { label: "Ожидает сборки", className: "bg-[#f4f6fb] text-slate-600", dot: false };
}

function getFirstProductImage(product?: ProductRow, color?: string | null) {
  if (!product) return "";
  const colorImages = color ? product.color_images?.[color] || [] : [];
  return colorImages[0] || product.image || "";
}

function getCity(address: string) {
  if (!address) return "Казань";
  return address.split(",")[0]?.trim() || "Казань";
}

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, ProductRow>>({});
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [message, setMessage] = useState("");
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(
    defaultDeliverySettings
  );

  const loadOrder = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();

    if (error || !data) {
      setOrder(null);
      setItems([]);
      setProductsMap({});
      setMessage(error?.message || "Заказ не найден");
      setLoading(false);
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id);

    const safeItems = itemsError ? [] : ((itemsData || []) as OrderItemRow[]);
    setItems(safeItems);

    if (itemsError) {
      setMessage(`Ошибка загрузки товаров заказа: ${itemsError.message}`);
    }

    const productIds = Array.from(
      new Set(safeItems.map((item) => item.product_id).filter(Boolean) as string[])
    );

    if (productIds.length > 0) {
      const { data: productsData } = await supabase
        .from("products")
        .select("id,image,color_images,badge")
        .in("id", productIds);

      const nextProductsMap: Record<string, ProductRow> = {};
      ((productsData || []) as ProductRow[]).forEach((product) => {
        nextProductsMap[product.id] = product;
      });
      setProductsMap(nextProductsMap);
    } else {
      setProductsMap({});
    }

    setOrder(data as OrderRow);
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();

    const channel = supabase
      .channel(`admin-order-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadOrder)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, loadOrder)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, loadOrder)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    const loadDeliverySettings = async () => {
      try {
        const response = await fetch("/api/settings/delivery", {
          cache: "no-store",
        });
        const result = await response.json();

        if (response.ok && result?.settings) {
          setDeliverySettings(result.settings);
        }
      } catch {
        setDeliverySettings(defaultDeliverySettings);
      }
    };

    loadDeliverySettings();
  }, []);

  const itemsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [items]);

  const itemsTotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
      0
    );
  }, [items]);

  const hasForeignItems = useMemo(() => {
    return items.some((item) => {
      const badge = item.product_id ? productsMap[item.product_id]?.badge : "";
      return badge?.trim().toLowerCase() === "из-за рубежа";
    });
  }, [items, productsMap]);

  const updateStatus = async (status: OrderStatus) => {
    if (!order) return;

    setSavingStatus(true);
    setMessage("");

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: now })
      .eq("id", order.id);

    if (error) {
      setMessage(`Ошибка обновления статуса: ${error.message}`);
      setSavingStatus(false);
      return;
    }

    setOrder({ ...order, status, updated_at: now });
    setSavingStatus(false);
  };

  const copyOrderId = async () => {
    await navigator.clipboard?.writeText(order?.id || "");
  };

  if (loading) {
    return (
      <div className="rounded-[20px] bg-white p-6 text-[13px] text-slate-500 shadow-sm">
        Загрузка заказа...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-[20px] bg-white p-6 text-[13px] text-slate-500 shadow-sm">
        Заказ не найден
      </div>
    );
  }

  const statusPill = getStatusPill(order.status);
  const promisedDeliveryFrom = addDays(
    order.created_at,
    hasForeignItems
      ? deliverySettings.foreignMinDays
      : deliverySettings.inStockMinDays
  );
  const promisedDeliveryTo = addDays(
    order.created_at,
    hasForeignItems
      ? deliverySettings.foreignMaxDays
      : deliverySettings.inStockMaxDays
  );

  return (
    <>
      <style>{`
        .order-details-title {
          font-size: 17px !important;
          line-height: 1.05 !important;
          font-weight: 650 !important;
          letter-spacing: 0 !important;
        }
      `}</style>

      <header className="sticky top-0 z-30 -mx-2 mb-2 border-b border-slate-100 bg-white px-2 py-2">
        <div className="grid grid-cols-[36px_1fr_36px] items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center text-slate-400"
            aria-label="Назад"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="min-w-0 text-center">
            <h1 className="order-details-title text-black">Детали отправления</h1>
            <p className="mt-0.5 truncate text-[12px] text-slate-400">{order.id}</p>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center text-slate-400"
            aria-label="Действия"
          >
            <MoreHorizontal size={22} />
          </button>
        </div>
      </header>

      {message && (
        <div className="mb-3 rounded-[16px] bg-white p-3 text-[12px] text-red-600 shadow-sm">
          {message}
        </div>
      )}

      <section className="mb-2 px-1">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold ${statusPill.className}`}>
            {statusPill.dot && <span className="mr-1.5">•</span>}
            {statusPill.label}
          </span>
          <span className="rounded-lg bg-white px-2.5 py-1 text-[12px] font-semibold text-slate-500">
            {formatDate(order.created_at)}
          </span>
        </div>
      </section>

      <section className="mb-2 bg-white px-3 py-3 shadow-sm">
        <div className="space-y-2 text-[13px]">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <span className="text-black">Принят в обработку</span>
            <span className="text-right text-black">{formatDateTime(order.created_at)}</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <span className="text-black">Обещанная дата доставки</span>
            <span className="text-right text-black">
              {formatDate(promisedDeliveryFrom)} - {formatDate(promisedDeliveryTo)}
            </span>
          </div>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-[72px_1fr] gap-y-2 text-[13px]">
            <span className="text-slate-500">Склад</span>
            <span className="text-black">{getCity(order.address)}</span>
            <span className="text-slate-500">Служба</span>
            <span className="text-black">{order.delivery || "Самовывоз"}</span>
            <span className="text-slate-500">Метод</span>
            <span className="text-black">{order.delivery || "Самовывоз"}, {getCity(order.address)}</span>
          </div>
        </div>
      </section>

      <section className="mb-2 bg-white px-3 py-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={copyOrderId}
            className="flex min-w-0 items-center gap-2 text-left"
          >
            <Copy size={21} className="shrink-0 text-[#0969ff]" />
            <span className="truncate text-[15px] font-semibold text-[#0969ff]">
              {order.id}
            </span>
          </button>
          <p className="shrink-0 text-[16px] font-semibold text-black">
            {formatPrice(order.total)} ₽
          </p>
        </div>

        <div className="border-t border-slate-100 pt-3">
          {items.length === 0 ? (
            <div className="rounded-[18px] bg-[#f4f6fb] p-6 text-center text-[13px] text-slate-500">
              Товары заказа не найдены
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const image = getFirstProductImage(
                  item.product_id ? productsMap[item.product_id] : undefined,
                  item.color
                );

                return (
                  <Link
                    key={`${item.order_id}-${item.product_id}-${index}`}
                    href={item.product_id ? `/admin/products/${item.product_id}` : "#"}
                    className="grid grid-cols-[46px_1fr_auto] gap-2"
                  >
                    <div className="flex h-[46px] w-[46px] items-center justify-center overflow-hidden rounded-xl bg-[#f4f6fb]">
                      {image ? (
                        <img src={image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <PackageOpen size={22} className="text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] leading-tight text-black">
                        {compactOrderId(item.product_id || order.id)}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-tight text-black">
                        {item.name}
                      </p>
                      <p className="mt-1 text-[12px] text-slate-500">
                        {[item.size, item.color].filter(Boolean).join(" x ") || "Параметры не указаны"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold text-slate-500">
                        {item.quantity} шт
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-black">
                        {formatPrice(item.price * item.quantity)} ₽
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="mb-2 bg-white px-3 py-3 shadow-sm">
        <h2 className="text-[16px] font-semibold text-black">О покупателе</h2>
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[12px] text-slate-500">Тип покупателя</p>
            <p className="mt-0.5 text-[14px] text-black">Физическое лицо</p>
          </div>
          <div>
            <p className="text-[12px] text-slate-500">Покупатель</p>
            {order.customer_id ? (
              <Link
                href={`/admin/customers/${order.customer_id}`}
                className="mt-0.5 inline-flex text-[14px] font-semibold text-[#0969ff]"
              >
                {order.customer || "Не указан"}
              </Link>
            ) : (
              <p className="mt-0.5 text-[14px] text-black">{order.customer || "Не указан"}</p>
            )}
          </div>
          <div>
            <p className="text-[12px] text-slate-500">Телефон</p>
            <p className="mt-0.5 text-[14px] text-black">{order.phone || "Не указан"}</p>
          </div>
          <div>
            <p className="text-[12px] text-slate-500">Кластер доставки</p>
            <p className="mt-0.5 text-[14px] text-black">{getCity(order.address)}</p>
          </div>
        </div>

      </section>

      <section className="mb-20 rounded-[18px] bg-white p-3 shadow-sm">
        <p className="mb-2 text-[13px] font-medium text-slate-500">Статус заказа</p>
        <select
          value={order.status}
          onChange={(event) => updateStatus(event.target.value as OrderStatus)}
          disabled={savingStatus}
          className="w-full rounded-xl border border-slate-100 bg-[#f4f6fb] px-3 py-2.5 text-[14px] text-black outline-none disabled:opacity-60"
        >
          {statusOptions.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </section>
    </>
  );
}
