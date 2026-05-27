"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type ProductStatus = "Активен" | "Скрыт";
type BadgeType =
  | "Без бейджа"
  | "Новинка"
  | "Скидка"
  | "В наличии"
  | "Из-за рубежа";

type ProductCategory =
  | "Футболки"
  | "Поло"
  | "Джинсы"
  | "Брюки"
  | "Костюмы"
  | "Платья"
  | "Рубашки"
  | "Юбки";

type ProductGender = "Мужская одежда" | "Женская одежда";

type AdminProduct = {
  id: string;
  name: string;
  brand: string;
  gender: ProductGender;
  category: ProductCategory;
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

function getDiscountPercent(oldPrice: number, price: number) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function getStockTotal(stock: Record<string, number>) {
  return Object.values(stock || {}).reduce(
    (sum, value) => sum + Math.max(0, Number(value) || 0),
    0
  );
}

function getBadgeClass(badge: BadgeType) {
  if (badge === "В наличии") return "bg-[#EAF8F0] text-[#16A34A]";
  if (badge === "Из-за рубежа") return "bg-[#F1F1F1] text-[#666]";
  if (badge === "Скидка") return "bg-red-50 text-red-600";
  if (badge === "Новинка") return "bg-blue-50 text-blue-600";
  return "bg-[#F5F5F5] text-gray-500";
}

function mapRowToProduct(row: ProductRow): AdminProduct {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    gender: row.gender === "Женская одежда" ? "Женская одежда" : "Мужская одежда",
    category: row.category as ProductCategory,
    country: row.country || "",
    price: row.price,
    oldPrice: row.old_price,
    badge: (row.badge || "Без бейджа") as BadgeType,
    status: row.status === "Скрыт" ? "Скрыт" : "Активен",
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

    const mapped = ((data || []) as ProductRow[]).map(mapRowToProduct);
    setProducts(mapped);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
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
    const withDiscount = products.filter((item) => item.oldPrice > item.price).length;
    const outOfStock = products.filter((item) => getStockTotal(item.stock) <= 0).length;

    return { active, hidden, withDiscount, outOfStock };
  }, [products]);

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

  return (
    <>
      <div className="mb-5">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Seller panel</p>
              <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-black">
                Товары
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Каталог, остатки и статусы
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="shrink-0 rounded-2xl bg-[#111] px-4 py-2.5 text-sm font-medium text-white"
            >
              + Товар
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#F5F5F5] px-4 py-3">
            <span className="text-gray-400">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск товара, бренда, артикула"
              className="w-full bg-transparent text-[16px] outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-[22px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      <section className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-[24px] bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Активные</p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em]">
            {stats.active}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Без остатков</p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em]">
            {stats.outOfStock}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Со скидкой</p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em]">
            {stats.withDiscount}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Скрытые</p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em]">
            {stats.hidden}
          </p>
        </div>
      </section>

      <section className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {(["Все", "Активные", "Скрытые", "Без остатков"] as ProductFilter[]).map(
          (item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                filter === item
                  ? "bg-[#111] text-white"
                  : "bg-white text-gray-600 shadow-sm"
              }`}
            >
              {item}
            </button>
          )
        )}
      </section>

      <section className="rounded-[28px] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-black">
              Каталог
            </h2>
            <p className="text-sm text-gray-500">
              {filteredProducts.length} из {products.length} товаров
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-8 text-center text-sm text-gray-500">
            Загрузка товаров...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-8 text-center text-sm text-gray-500">
            Товаров не найдено
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((item) => {
              const discount = getDiscountPercent(item.oldPrice, item.price);
              const stockTotal = getStockTotal(item.stock);

              return (
                <div
                  key={item.id}
                  className="rounded-[24px] bg-[#F7F7F7] p-3"
                >
                  <div className="flex gap-3">
                    <Link
                      href={`/admin/products/${item.id}`}
                      className="h-[104px] w-[78px] shrink-0 overflow-hidden rounded-[18px] bg-[#ECECEC]"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-black">
                            {item.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-gray-500">
                            {item.brand} • {item.category}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleStatus(item.id)}
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
                            item.status === "Активен"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {item.status}
                        </button>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-semibold text-[#16A34A]">
                          {item.price.toLocaleString("ru-RU")} ₽
                        </span>

                        {item.oldPrice > item.price && (
                          <span className="text-xs text-gray-400 line-through">
                            {item.oldPrice.toLocaleString("ru-RU")} ₽
                          </span>
                        )}

                        {discount > 0 && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] text-red-600">
                            -{discount}%
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-[10px] ${getBadgeClass(item.badge)}`}>
                          {item.badge}
                        </span>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] ${
                            stockTotal > 0
                              ? "bg-white text-gray-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          Остаток: {stockTotal}
                        </span>
                      </div>

                      <p className="mt-2 truncate text-xs text-gray-400">
                        Артикул: {item.article || item.id}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Link
                      href={`/admin/products/${item.id}`}
                      className="rounded-2xl bg-white px-3 py-2.5 text-center text-xs font-medium text-gray-700"
                    >
                      Редактировать
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleStatus(item.id)}
                      className="rounded-2xl bg-white px-3 py-2.5 text-xs font-medium text-gray-700"
                    >
                      {item.status === "Активен" ? "Скрыть" : "Активировать"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-2xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
