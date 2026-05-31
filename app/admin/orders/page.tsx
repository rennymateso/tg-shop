"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, PackageOpen, Search, SlidersHorizontal, ScanLine, Truck } from "lucide-react";
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

type ProductRow = {
  id: string;
  image: string | null;
  color_images: Record<string, string[]> | null;
};

type OrderFilter =
  | "Все"
  | "Ожидают сборки"
  | "Готовы к отгрузке"
  | "Отгружены"
  | "Доставляются"
  | "Спорные"
  | "Завершенные";

const filterOptions: OrderFilter[] = [
  "Все",
  "Ожидают сборки",
  "Готовы к отгрузке",
  "Отгружены",
  "Доставляются",
  "Спорные",
  "Завершенные",
];

function formatPrice(value: number) {
  return Number(value || 0).toLocaleString("ru-RU");
}

function formatDateLabel(value?: string) {
  if (!value) return "БЕЗ ДАТЫ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "БЕЗ ДАТЫ";

  return date
    .toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
    .toUpperCase();
}

function formatShortDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function getDateKey(value?: string) {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFilterMatch(order: OrderRow, filter: OrderFilter) {
  if (filter === "Все") return true;
  if (filter === "Ожидают сборки") {
    return ["Новый", "Оплачен", "В обработке"].includes(order.status);
  }
  if (filter === "Готовы к отгрузке") {
    return ["Собран", "Частично готов", "В пути из-за рубежа"].includes(order.status);
  }
  if (filter === "Отгружены") return order.status === "В доставке";
  if (filter === "Доставляются") return order.status === "В доставке";
  if (filter === "Спорные") return order.status === "Отменен";
  if (filter === "Завершенные") return ["Доставлен", "Отменен"].includes(order.status);

  return true;
}

function getStatusPill(status: OrderStatus) {
  if (["Собран", "Частично готов", "В пути из-за рубежа"].includes(status)) {
    return {
      label: "Готов к отгрузке",
      className: "bg-[#d9fbf8] text-[#00a8a0]",
      dot: true,
    };
  }
  if (status === "В доставке") {
    return {
      label: "Доставляется",
      className: "bg-[#f1edff] text-[#6d5bd0]",
      dot: false,
    };
  }
  if (status === "Доставлен") {
    return {
      label: "Доставлен",
      className: "bg-[#dcfce7] text-[#15803d]",
      dot: false,
    };
  }
  if (status === "Отменен") {
    return {
      label: "Отменён",
      className: "bg-[#f4f6fb] text-slate-500",
      dot: false,
    };
  }

  return {
    label: "Ожидает сборки",
    className: "bg-[#f4f6fb] text-slate-600",
    dot: false,
  };
}

function getFirstProductImage(product?: ProductRow, color?: string | null) {
  if (!product) return "";
  const colorImages = color ? product.color_images?.[color] || [] : [];
  return colorImages[0] || product.image || "";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, OrderItemRow[]>>({});
  const [productsMap, setProductsMap] = useState<Record<string, ProductRow>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("Все");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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
      setProductsMap({});
      setLoading(false);
      return;
    }

    const safeOrders = (data || []) as OrderRow[];
    setOrders(safeOrders);

    if (safeOrders.length === 0) {
      setItemsMap({});
      setProductsMap({});
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
      setProductsMap({});
      setLoading(false);
      return;
    }

    const items = (itemsData || []) as OrderItemRow[];
    const nextItemsMap: Record<string, OrderItemRow[]> = {};
    items.forEach((item) => {
      if (!nextItemsMap[item.order_id]) nextItemsMap[item.order_id] = [];
      nextItemsMap[item.order_id].push(item);
    });
    setItemsMap(nextItemsMap);

    const productIds = Array.from(
      new Set(items.map((item) => item.product_id).filter(Boolean) as string[])
    );

    if (productIds.length > 0) {
      const { data: productsData } = await supabase
        .from("products")
        .select("id,image,color_images")
        .in("id", productIds);

      const nextProductsMap: Record<string, ProductRow> = {};
      ((productsData || []) as ProductRow[]).forEach((product) => {
        nextProductsMap[product.id] = product;
      });
      setProductsMap(nextProductsMap);
    } else {
      setProductsMap({});
    }

    setLoading(false);
  };

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel("admin-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadOrders)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, loadOrders)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, loadOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const counts = useMemo(() => {
    return filterOptions.reduce<Record<OrderFilter, number>>((acc, item) => {
      acc[item] = orders.filter((order) => getFilterMatch(order, item)).length;
      return acc;
    }, {} as Record<OrderFilter, number>);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      const items = itemsMap[order.id] || [];
      const matchFilter = getFilterMatch(order, filter);
      const matchSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        String(order.customer || "").toLowerCase().includes(q) ||
        String(order.phone || "").toLowerCase().includes(q) ||
        String(order.address || "").toLowerCase().includes(q) ||
        items.some((item) => item.name.toLowerCase().includes(q));

      return matchFilter && matchSearch;
    });
  }, [orders, itemsMap, search, filter]);

  const groupedOrders = useMemo(() => {
    const groups: Array<{ key: string; label: string; orders: OrderRow[] }> = [];
    filteredOrders.forEach((order) => {
      const key = getDateKey(order.created_at);
      const existing = groups.find((group) => group.key === key);
      if (existing) {
        existing.orders.push(order);
      } else {
        groups.push({
          key,
          label: formatDateLabel(order.created_at),
          orders: [order],
        });
      }
    });
    return groups;
  }, [filteredOrders]);

  return (
    <>
      <header className="mb-2 bg-[#f3f4f8] pt-2">
        <div className="mb-3 flex items-center justify-between pl-10 pr-1">
          <h1 className="orders-title text-black">Заказы</h1>
          <button
            type="button"
            onClick={loadOrders}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-400 text-white"
            aria-label="Обновить заказы"
          >
            <Check size={19} strokeWidth={3} />
          </button>
        </div>

        <div className="rounded-[20px] bg-white px-3 py-3 shadow-sm">
          <div className="mb-2 grid grid-cols-[1fr_auto_auto] items-center gap-2">
            <label className="flex h-10 min-w-0 items-center gap-2 rounded-[14px] bg-[#f0f2f7] px-3">
              <Search size={19} className="shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Номер заказа"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-black outline-none placeholder:text-slate-400"
              />
            </label>
            <button
              type="button"
              className="flex h-10 w-9 items-center justify-center text-slate-400"
              aria-label="Сканер"
            >
              <ScanLine size={21} />
            </button>
            <button
              type="button"
              className="flex h-10 w-9 items-center justify-center text-slate-400"
              aria-label="Фильтры"
            >
              <SlidersHorizontal size={21} />
            </button>
          </div>

          <div className="orders-filter-scroll flex gap-2 overflow-x-auto pb-0.5">
            {filterOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`shrink-0 rounded-xl px-2.5 py-1.5 text-[12px] font-medium ${
                  filter === item
                    ? "bg-[#24262d] text-white"
                    : "bg-[#f7f8fb] text-black"
                }`}
              >
                {item}
                {item !== "Все" && counts[item] > 0 ? (
                  <span
                    className={`ml-2 ${
                      filter === item ? "text-white/65" : "text-slate-500"
                    }`}
                  >
                    {counts[item]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </header>

      {message && (
        <div className="mb-2 rounded-[16px] bg-white p-3 text-[12px] text-red-600 shadow-sm">
          {message}
        </div>
      )}

      <style>{`
        .orders-filter-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .orders-filter-scroll::-webkit-scrollbar {
          display: none;
        }

        .orders-title {
          font-size: 25px !important;
          line-height: 1 !important;
          font-weight: 650 !important;
          letter-spacing: 0 !important;
        }
      `}</style>

      {filter === "Ожидают сборки" && (
        <Link
          href="/admin/stocks"
          className="mb-2 inline-flex rounded-xl bg-[#d9fbf8] px-3 py-1.5 text-[12px] font-semibold text-[#00a8a0]"
        >
          Проверьте остатки по товарам ›
        </Link>
      )}

      {loading ? (
        <section className="rounded-[20px] bg-white p-7 text-center shadow-sm">
          <p className="text-[13px] text-slate-500">Загружаем заказы...</p>
        </section>
      ) : filteredOrders.length === 0 ? (
        <section className="rounded-[22px] bg-white px-5 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#f4f6fb] text-[#0969ff]">
            <PackageOpen size={34} />
          </div>
          <h2 className="mt-4 text-[18px] font-semibold text-black">Нет заказов</h2>
          <p className="mt-1 text-[14px] text-slate-500">Попробуйте выбрать другие фильтры</p>
        </section>
      ) : (
        <div className="space-y-3 pb-20">
          {groupedOrders.map((group) => (
            <section key={group.key}>
              <h2 className="mb-1.5 px-1 text-[14px] font-semibold text-slate-500">
                {group.label}
              </h2>

              <div className="space-y-2">
                {group.orders.map((order) => {
                  const items = itemsMap[order.id] || [];
                  const firstItem = items[0];
                  const itemsCount = items.reduce(
                    (sum, item) => sum + (Number(item.quantity) || 0),
                    0
                  );
                  const productImage = getFirstProductImage(
                    firstItem?.product_id ? productsMap[firstItem.product_id] : undefined,
                    firstItem?.color
                  );
                  const statusPill = getStatusPill(order.status);

                  return (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="block rounded-[20px] bg-white p-2.5 shadow-sm"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${statusPill.className}`}
                        >
                          {statusPill.dot && <span className="mr-1.5">•</span>}
                          {statusPill.label}
                        </span>
                        {formatShortDate(order.created_at) && (
                          <span className="rounded-lg bg-[#f4f6fb] px-2 py-1 text-[11px] font-semibold text-slate-500">
                            {formatShortDate(order.created_at)}
                          </span>
                        )}
                        {order.promo_code && (
                          <span className="rounded-lg bg-[#e8fff0] px-2 py-1 text-[11px] font-semibold text-emerald-600">
                            Промо
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-[68px_1fr_auto] gap-2 rounded-[16px] bg-[#f4f6fb] p-2">
                        <div className="flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-[14px] bg-white">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={firstItem?.name || "Товар"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <PackageOpen size={28} className="text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0 py-0.5">
                          <p className="line-clamp-2 text-[14px] font-medium leading-[1.18] text-black">
                            {firstItem?.name || "Товар не указан"}
                          </p>
                          <p className="mt-1 truncate text-[12px] text-slate-500">
                            {order.id.replace("ORD-", "")}
                          </p>
                          {(firstItem?.size || firstItem?.color) && (
                            <p className="mt-0.5 truncate text-[11px] text-slate-400">
                              {[firstItem?.size, firstItem?.color].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        <span className="h-fit rounded-xl bg-white px-2 py-1 text-[12px] font-semibold text-slate-500">
                          {itemsCount || 1} шт
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-3 text-[13px] text-slate-500">
                        <div className="min-w-0">
                          <p className="truncate">{order.address?.split(",")[0] || "Казань"}</p>
                          <p className="mt-0.5 truncate">{order.id.replace("ORD-", "")}</p>
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="truncate">{order.delivery || "Получение"}</p>
                          <p className="mt-0.5 truncate">{formatPrice(order.total)} ₽</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setFilter("Готовы к отгрузке")}
        className="fixed bottom-[68px] left-1/2 z-[70] flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#0969ff] px-4 text-[11px] font-semibold text-white shadow-lg"
      >
        <Truck size={15} />
        Перейти к отгрузкам
      </button>
    </>
  );
}
