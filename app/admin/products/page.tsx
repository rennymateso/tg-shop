"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type ProductStatus = "Активен" | "Скрыт";
type BadgeType =
  | "Без бейджа"
  | "Новинка"
  | "Скидка"
  | "В наличии"
  | "Из-за рубежа";

type AdminProduct = {
  id: string;
  name: string;
  brand: string;
  gender: string;
  category: string;
  country: string;
  price: number;
  oldPrice: number;
  badge: BadgeType;
  status: ProductStatus;
  description: string;
  article: string;
  sizes: string[];
  stock: Record<string, number>;
  colors: string[];
  image: string;
  colorImages: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
};

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  gender?: string | null;
  category: string;
  country?: string | null;
  price: number;
  old_price: number;
  badge: string | null;
  status: string;
  description: string;
  article: string;
  sizes: string[] | null;
  stock?: Record<string, number> | null;
  colors: string[] | null;
  image: string | null;
  color_images: Record<string, string[]> | null;
  created_at: string;
  updated_at: string;
};

type ProductFilter = "Все" | "Активные" | "Скрытые" | "Без остатков";

const filters: ProductFilter[] = ["Все", "Активные", "Скрытые", "Без остатков"];

function formatPrice(value: number) {
  return Number(value || 0).toLocaleString("ru-RU");
}

function getStockTotal(stock: Record<string, number>) {
  const entries = Object.entries(stock || {});
  const colorEntries = entries.filter(([key]) => key.includes("::"));
  const sourceEntries = colorEntries.length > 0 ? colorEntries : entries;

  return sourceEntries.reduce(
    (sum, value) => sum + Math.max(0, Number(value) || 0),
    0
  );
}

function getStockKey(color: string, size: string) {
  return color ? `${color}::${size}` : size;
}

function hasColorSpecificStock(stock: Record<string, number>) {
  return Object.keys(stock || {}).some((key) => key.includes("::"));
}

function getStockValue(stock: Record<string, number>, color: string, size: string) {
  const colorKey = getStockKey(color, size);

  if (Object.prototype.hasOwnProperty.call(stock, colorKey)) {
    return Math.max(0, Number(stock[colorKey]) || 0);
  }

  if (color && hasColorSpecificStock(stock)) {
    return 0;
  }

  return Math.max(0, Number(stock[size]) || 0);
}

function getBadgeClass(badge: BadgeType) {
  if (badge === "В наличии") return "bg-[#EAF8F0] text-[#15803D]";
  if (badge === "Из-за рубежа") return "bg-[#EEF2FF] text-[#4F46E5]";
  if (badge === "Скидка") return "bg-[#FFF1F2] text-[#E11D48]";
  if (badge === "Новинка") return "bg-[#E0F2FE] text-[#0369A1]";
  return "bg-[#F2F3F6] text-[#6B7280]";
}

function mapRowToProduct(row: ProductRow): AdminProduct {
  return {
    id: row.id,
    name: row.name || "Без названия",
    brand: row.brand || "",
    gender: row.gender || "",
    category: row.category || "",
    country: row.country || "",
    price: Number(row.price) || 0,
    oldPrice: Number(row.old_price) || 0,
    badge: (row.badge || "Без бейджа") as BadgeType,
    status: (row.status || "Активен") as ProductStatus,
    description: row.description || "",
    article: row.article || "",
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    stock: row.stock && typeof row.stock === "object" ? row.stock : {},
    colors: Array.isArray(row.colors) ? row.colors : [],
    image: row.image || "",
    colorImages: row.color_images || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("Все");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [badgeProductId, setBadgeProductId] = useState<string | null>(null);
  const [stockProductId, setStockProductId] = useState<string | null>(null);
  const [selectedStockColor, setSelectedStockColor] = useState("");
  const [priceProductId, setPriceProductId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState({ price: "", oldPrice: "" });
  const stockSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const loadProducts = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Ошибка загрузки: ${error.message}`);
      setProducts([]);
      setLoading(false);
      return;
    }

    setProducts(((data || []) as ProductRow[]).map(mapRowToProduct));
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();

    const channel = supabase
      .channel("admin-products-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => loadProducts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((item) => {
      const stockTotal = getStockTotal(item.stock);
      const matchFilter =
        filter === "Все" ||
        (filter === "Активные" && item.status === "Активен") ||
        (filter === "Скрытые" && item.status === "Скрыт") ||
        (filter === "Без остатков" && stockTotal <= 0);

      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.article.toLowerCase().includes(q);

      return matchFilter && matchSearch;
    });
  }, [products, search, filter]);

  const stats = useMemo(() => {
    const active = products.filter((item) => item.status === "Активен").length;
    const hidden = products.filter((item) => item.status === "Скрыт").length;
    const outOfStock = products.filter((item) => getStockTotal(item.stock) <= 0).length;
    const totalStock = products.reduce((sum, item) => sum + getStockTotal(item.stock), 0);

    return { active, hidden, outOfStock, totalStock };
  }, [products]);

  const badgeProduct = useMemo(
    () => products.find((item) => item.id === badgeProductId) || null,
    [badgeProductId, products]
  );

  const stockProduct = useMemo(
    () => products.find((item) => item.id === stockProductId) || null,
    [stockProductId, products]
  );

  const priceProduct = useMemo(
    () => products.find((item) => item.id === priceProductId) || null,
    [priceProductId, products]
  );

  useEffect(() => {
    if (!stockProduct) {
      setSelectedStockColor("");
      return;
    }

    setSelectedStockColor((current) => current || stockProduct.colors[0] || "");
  }, [stockProduct]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Удалить товар?");
    if (!confirmed) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      setMessage(`Ошибка удаления: ${error.message}`);
      return;
    }

    await loadProducts();
  };

  const toggleStatus = async (id: string) => {
    const current = products.find((item) => item.id === id);
    if (!current) return;

    const nextStatus: ProductStatus =
      current.status === "Активен" ? "Скрыт" : "Активен";

    const { error } = await supabase
      .from("products")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      setMessage(`Ошибка обновления: ${error.message}`);
      return;
    }

    await loadProducts();
  };

  const setProductBadge = async (id: string, badge: BadgeType) => {
    setBadgeProductId(null);

    setProducts((current) =>
      current.map((item) => (item.id === id ? { ...item, badge } : item))
    );

    const { error } = await supabase
      .from("products")
      .update({
        badge,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      setMessage(`Ошибка обновления: ${error.message}`);
      await loadProducts();
    }
  };

  const updateStockValue = (id: string, color: string, size: string, rawValue: string) => {
    const quantity = Math.max(0, Number(rawValue.replace(/\D/g, "")) || 0);
    const stockKey = getStockKey(color, size);
    let nextStock: Record<string, number> | null = null;

    setProducts((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        nextStock = {
          ...item.stock,
          [stockKey]: quantity,
        };

        return {
          ...item,
          stock: nextStock,
          sizes: item.sizes.includes(size) ? item.sizes : [...item.sizes, size],
        };
      })
    );

    const timerKey = `${id}:${stockKey}`;
    if (stockSaveTimers.current[timerKey]) {
      clearTimeout(stockSaveTimers.current[timerKey]);
    }

    stockSaveTimers.current[timerKey] = setTimeout(async () => {
      if (!nextStock) return;

      const nextSizes = Array.from(
        new Set(
          Object.entries(nextStock)
            .filter(([, value]) => Math.max(0, Number(value) || 0) > 0)
            .map(([stockSize]) => stockSize.split("::").pop() || stockSize)
        )
      );

      const { error } = await supabase
        .from("products")
        .update({
          stock: nextStock,
          sizes: nextSizes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        setMessage(`Ошибка остатков: ${error.message}`);
        await loadProducts();
      }
    }, 500);
  };

  const openPriceSheet = (item: AdminProduct) => {
    setPriceProductId(item.id);
    setPriceDraft({
      price: String(item.price || ""),
      oldPrice: String(item.oldPrice || ""),
    });
  };

  const savePrice = async () => {
    if (!priceProduct) return;

    const nextPrice = Math.max(0, Number(priceDraft.price.replace(/\D/g, "")) || 0);
    const nextOldPrice = Math.max(
      0,
      Number(priceDraft.oldPrice.replace(/\D/g, "")) || 0
    );

    setProducts((current) =>
      current.map((item) =>
        item.id === priceProduct.id
          ? { ...item, price: nextPrice, oldPrice: nextOldPrice }
          : item
      )
    );
    setPriceProductId(null);

    const { error } = await supabase
      .from("products")
      .update({
        price: nextPrice,
        old_price: nextOldPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", priceProduct.id);

    if (error) {
      setMessage(`Ошибка цены: ${error.message}`);
      await loadProducts();
    }
  };

  return (
    <main className="min-h-screen bg-[#F3F4F8] px-3 pb-24 pt-4 text-[#101114]">
      <div className="mx-auto max-w-[480px] space-y-3">
        <header className="rounded-[22px] bg-white px-4 pb-4 pt-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[27px] font-semibold leading-none tracking-normal">
                Товары
              </h1>
              <p className="mt-1 text-[12px] font-normal text-[#8A94A3]">
                Каталог, цены и остатки
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#101114] px-3 text-[12px] font-medium text-white"
            >
              <Plus size={15} strokeWidth={2.4} />
              Товар
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            <div className="rounded-[14px] bg-[#F5F6FA] px-2.5 py-2">
              <p className="text-[10px] text-[#8A94A3]">Всего</p>
              <p className="text-[15px] font-semibold">{products.length}</p>
            </div>
            <div className="rounded-[14px] bg-[#F5F6FA] px-2.5 py-2">
              <p className="text-[10px] text-[#8A94A3]">Активные</p>
              <p className="text-[15px] font-semibold">{stats.active}</p>
            </div>
            <div className="rounded-[14px] bg-[#F5F6FA] px-2.5 py-2">
              <p className="text-[10px] text-[#8A94A3]">Остаток</p>
              <p className="text-[15px] font-semibold">{stats.totalStock}</p>
            </div>
            <div className="rounded-[14px] bg-[#F5F6FA] px-2.5 py-2">
              <p className="text-[10px] text-[#8A94A3]">Скрыто</p>
              <p className="text-[15px] font-semibold">{stats.hidden}</p>
            </div>
          </div>
        </header>

        <section className="rounded-[22px] bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="flex h-10 flex-1 items-center gap-2 rounded-[14px] bg-[#F1F3F7] px-3">
              <Search size={17} className="shrink-0 text-[#98A1AE]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Название, артикул"
                className="h-full w-full bg-transparent text-[14px] font-normal outline-none placeholder:text-[#9AA3AF]"
              />
            </label>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1F3F7] text-[#8A94A3]"
              aria-label="Фильтры"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`shrink-0 rounded-[12px] px-3 py-2 text-[12px] font-medium transition ${
                  filter === item
                    ? "bg-[#101114] text-white"
                    : "bg-[#F6F7FA] text-[#101114]"
                }`}
              >
                {item}
                {item === "Без остатков" && stats.outOfStock > 0 ? (
                  <span className="ml-1 text-[#9AA3AF]">{stats.outOfStock}</span>
                ) : null}
              </button>
            ))}
          </div>
        </section>

        {message ? (
          <div className="rounded-[16px] bg-red-50 px-3 py-2 text-[12px] text-red-600">
            {message}
          </div>
        ) : null}

        <section className="space-y-2">
          {loading ? (
            <div className="rounded-[22px] bg-white py-10 text-center text-[13px] text-[#8A94A3] shadow-sm">
              Загрузка товаров...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[22px] bg-white px-4 py-10 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#F1F3F7] text-[#8A94A3]">
                <Package size={22} />
              </div>
              <p className="mt-3 text-[16px] font-semibold">Нет товаров</p>
              <p className="mt-1 text-[13px] text-[#8A94A3]">
                Попробуйте другой поиск или фильтр
              </p>
            </div>
          ) : (
            filteredProducts.map((item) => {
              const stockTotal = getStockTotal(item.stock);

              return (
                <article
                  key={item.id}
                  className="rounded-[22px] bg-white p-3 shadow-sm"
                >
                  <div className="flex gap-3">
                    <Link
                      href={`/admin/products/${item.id}`}
                      className="block h-[74px] w-[74px] shrink-0 overflow-hidden rounded-[16px] bg-[#F1F3F7]"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#9AA3AF]">
                          <Package size={22} />
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/admin/products/${item.id}`}
                          className="min-w-0"
                        >
                          <p className="line-clamp-2 text-[14px] font-medium leading-[1.18] text-[#101114]">
                            {item.name}
                          </p>
                          <p className="mt-1 truncate text-[11px] text-[#7F8997]">
                            {item.article || item.id}
                          </p>
                        </Link>

                        <span
                          className={`shrink-0 rounded-[9px] px-2 py-1 text-[10px] font-medium ${
                            item.status === "Активен"
                              ? "bg-[#EAF8F0] text-[#15803D]"
                              : "bg-[#F1F3F7] text-[#7F8997]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setBadgeProductId(item.id)}
                          className={`rounded-[9px] px-2 py-1 text-[10px] font-medium ${getBadgeClass(item.badge)}`}
                        >
                          {item.badge}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStockProductId(item.id)}
                          className="rounded-[9px] bg-[#F6F7FA] px-2 py-1 text-[10px] font-medium text-[#697386]"
                        >
                          {stockTotal} шт
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#EEF0F4] pt-2.5">
                    <button
                      type="button"
                      onClick={() => openPriceSheet(item)}
                      className="flex h-9 items-center gap-2 rounded-[12px] bg-[#F6F7FA] px-3 text-left"
                    >
                      <span className="text-[10px] font-medium text-[#8A94A3]">
                        Цена
                      </span>
                      <span className="text-[15px] font-semibold leading-none">
                        {formatPrice(item.price)} ₽
                      </span>
                      <Pencil size={13} className="text-[#8A94A3]" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/products/${item.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#F1F3F7] text-[#7F8997]"
                        aria-label="Редактировать"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleStatus(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#F1F3F7] text-[#7F8997]"
                        aria-label={item.status === "Активен" ? "Скрыть" : "Активировать"}
                      >
                        {item.status === "Активен" ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#FFF1F2] text-[#E11D48]"
                        aria-label="Удалить"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      {badgeProduct ? (
        <>
          <div
            className="fixed inset-x-0 top-0 bg-black/25"
            style={{ bottom: "86px", zIndex: 9998 }}
            onClick={() => setBadgeProductId(null)}
          />
          <div
            className="fixed left-3 right-3 rounded-[24px] bg-white p-4 shadow-xl"
            style={{ bottom: "86px", zIndex: 9999 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[16px] font-semibold">Тип товара</p>
                <p className="mt-0.5 truncate text-[12px] text-[#8A94A3]">
                  {badgeProduct.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBadgeProductId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#F1F3F7] text-[#7F8997]"
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["В наличии", "Из-за рубежа"] as BadgeType[]).map((badge) => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => setProductBadge(badgeProduct.id, badge)}
                  className={`rounded-[14px] px-3 py-3 text-[13px] font-medium ${
                    badgeProduct.badge === badge
                      ? "bg-[#101114] text-white"
                      : "bg-[#F4F6FA] text-[#101114]"
                  }`}
                >
                  {badge}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {stockProduct ? (
        <>
          <div
            className="fixed inset-x-0 top-0 bg-black/25"
            style={{ bottom: "86px", zIndex: 9998 }}
            onClick={() => setStockProductId(null)}
          />
          <div
            className="fixed left-3 right-3 max-h-[68vh] overflow-hidden rounded-[24px] bg-white shadow-xl"
            style={{ bottom: "86px", zIndex: 9999 }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#EEF0F4] p-4">
              <div className="min-w-0">
                <p className="text-[16px] font-semibold">Остатки</p>
                <p className="mt-0.5 truncate text-[12px] text-[#8A94A3]">
                  {stockProduct.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStockProductId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#F1F3F7] text-[#7F8997]"
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[calc(78vh-74px)] overflow-y-auto p-4">
              {stockProduct.colors.length > 0 ? (
                <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {stockProduct.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedStockColor(color)}
                      className={`shrink-0 rounded-[10px] px-2.5 py-1.5 text-[11px] font-medium ${
                        selectedStockColor === color
                          ? "bg-[#101114] text-white"
                          : "bg-[#F4F6FA] text-[#697386]"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                {(
                  stockProduct.sizes.length > 0
                    ? stockProduct.sizes
                    : Object.keys(stockProduct.stock).length > 0
                      ? Array.from(
                          new Set(
                            Object.keys(stockProduct.stock).map(
                              (stockSize) => stockSize.split("::").pop() || stockSize
                            )
                          )
                        )
                      : ["OS"]
                ).map((size) => (
                  <label
                    key={size}
                    className="flex h-11 items-center justify-between gap-2 rounded-[14px] bg-[#F6F7FA] px-3"
                  >
                    <span className="min-w-0 truncate text-[12px] font-medium text-[#101114]">
                      {size}
                    </span>
                    <input
                      value={getStockValue(stockProduct.stock, selectedStockColor, size)}
                      onChange={(event) =>
                        updateStockValue(
                          stockProduct.id,
                          selectedStockColor,
                          size,
                          event.target.value
                        )
                      }
                      inputMode="numeric"
                      className="h-8 w-14 rounded-[10px] bg-white text-center text-[13px] font-medium outline-none"
                      aria-label={`Остаток ${size}`}
                    />
                  </label>
                ))}
              </div>

              <p className="mt-3 rounded-[12px] bg-[#F4F6FA] px-3 py-2 text-[12px] text-[#697386]">
                Изменения сохраняются автоматически.
              </p>
            </div>
          </div>
        </>
      ) : null}

      {priceProduct ? (
        <>
          <div
            className="fixed inset-x-0 top-0 bg-black/25"
            style={{ bottom: "86px", zIndex: 9998 }}
            onClick={() => setPriceProductId(null)}
          />
          <div
            className="fixed left-3 right-3 rounded-[24px] bg-white p-4 shadow-xl"
            style={{ bottom: "86px", zIndex: 9999 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[16px] font-semibold">Цена</p>
                <p className="mt-0.5 truncate text-[12px] text-[#8A94A3]">
                  {priceProduct.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPriceProductId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#F1F3F7] text-[#7F8997]"
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <label className="rounded-[14px] bg-[#F6F7FA] px-3 py-2">
                <span className="text-[11px] font-medium text-[#697386]">
                  Новая цена
                </span>
                <input
                  value={priceDraft.price}
                  onChange={(event) =>
                    setPriceDraft((current) => ({
                      ...current,
                      price: event.target.value.replace(/\D/g, ""),
                    }))
                  }
                  inputMode="numeric"
                  className="mt-1 h-8 w-full bg-transparent text-[17px] font-semibold outline-none"
                  placeholder="0"
                />
              </label>
              <label className="rounded-[14px] bg-[#F6F7FA] px-3 py-2">
                <span className="text-[11px] font-medium text-[#697386]">
                  Старая цена
                </span>
                <input
                  value={priceDraft.oldPrice}
                  onChange={(event) =>
                    setPriceDraft((current) => ({
                      ...current,
                      oldPrice: event.target.value.replace(/\D/g, ""),
                    }))
                  }
                  inputMode="numeric"
                  className="mt-1 h-8 w-full bg-transparent text-[17px] font-semibold outline-none"
                  placeholder="0"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={savePrice}
              className="mt-3 h-11 w-full rounded-[15px] bg-[#101114] text-[14px] font-medium text-white"
            >
              Сохранить
            </button>
          </div>
        </>
      ) : null}
    </main>
  );
}
