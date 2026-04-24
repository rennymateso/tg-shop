"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type ProductStatus = "Активен" | "Скрыт";
type ProductCategory =
  | "Футболки"
  | "Поло"
  | "Джинсы"
  | "Брюки"
  | "Костюмы";

type BrandRow = {
  id: string;
  name: string;
  created_at: string;
};

type BadgeRow = {
  id: string;
  name: string;
  created_at: string;
};

type AdminProduct = {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  oldPrice: number;
  badge: string;
  status: ProductStatus;
  description: string;
  article: string;
  sizes: string[];
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
  category: string;
  price: number;
  old_price: number;
  badge: string | null;
  status: string;
  description: string;
  article: string;
  sizes: string[] | null;
  colors: string[] | null;
  image: string;
  color_images: Record<string, string[]> | null;
  created_at: string;
  updated_at: string;
};

const statusOptions: ProductStatus[] = ["Активен", "Скрыт"];

const categoryOptions: ProductCategory[] = [
  "Футболки",
  "Поло",
  "Джинсы",
  "Брюки",
  "Костюмы",
];

function mapRowToProduct(row: ProductRow): AdminProduct {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category as ProductCategory,
    price: row.price,
    oldPrice: row.old_price,
    badge: row.badge || "Без бейджа",
    status: row.status as ProductStatus,
    description: row.description || "",
    article: row.article || "",
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    colors: Array.isArray(row.colors) ? row.colors : [],
    image: row.image || "",
    colorImages: row.color_images || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function generateArticleNumber() {
  return `ART-${Math.floor(100000 + Math.random() * 900000)}`;
}

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadBrands = async () => {
      setBrandsLoading(true);

      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        setMessage(`Ошибка загрузки брендов: ${error.message}`);
        setBrands([]);
        setBrandsLoading(false);
        return;
      }

      setBrands((data || []) as BrandRow[]);
      setBrandsLoading(false);
    };

    loadBrands();
  }, []);

  useEffect(() => {
    const loadBadges = async () => {
      setBadgesLoading(true);

      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        setMessage(`Ошибка загрузки бейджей: ${error.message}`);
        setBadges([]);
        setBadgesLoading(false);
        return;
      }

      setBadges((data || []) as BadgeRow[]);
      setBadgesLoading(false);
    };

    loadBadges();
  }, []);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setProduct(null);
        setMessage(error?.message || "Товар не найден");
        setLoading(false);
        return;
      }

      setProduct(mapRowToProduct(data as ProductRow));
      setLoading(false);
    };

    loadProduct();
  }, [id]);

  const discountPercent = useMemo(() => {
    if (!product) return 0;
    if (product.oldPrice <= product.price) return 0;
    return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  }, [product]);

  const saveChanges = async () => {
    if (!product) return;

    if (!product.name.trim()) {
      setMessage("Введите название товара");
      return;
    }

    if (!product.brand.trim()) {
      setMessage("Выберите бренд товара");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const now = new Date().toISOString();

      const { error } = await supabase
        .from("products")
        .update({
          name: product.name,
          brand: product.brand,
          category: product.category,
          price: product.price,
          old_price: product.oldPrice,
          badge: product.badge === "Без бейджа" ? null : product.badge,
          status: product.status,
          description: product.description,
          article: product.article.trim() || generateArticleNumber(),
          sizes: product.sizes,
          colors: product.colors,
          image: product.image,
          color_images: product.colorImages,
          updated_at: now,
        })
        .eq("id", id);

      if (error) {
        setMessage(`Ошибка сохранения: ${error.message}`);
        setSaving(false);
        return;
      }

      setProduct((prev) =>
        prev
          ? {
              ...prev,
              updatedAt: now,
            }
          : prev
      );
      setMessage("Изменения сохранены.");
      setSaving(false);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Не удалось сохранить изменения"
      );
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Удалить товар?");
    if (!confirmed) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      setMessage(`Ошибка удаления: ${error.message}`);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="rounded-[24px] bg-white p-6 text-sm text-gray-500 shadow-sm">
        Загрузка товара...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-[24px] bg-white p-6 text-sm text-gray-500 shadow-sm">
        Товар не найден
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">Редактировать товар</h1>
          <p className="mt-1 text-sm text-gray-400">{product.id}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/admin/products"
            className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-medium text-gray-700 shadow-sm"
          >
            Назад
          </Link>

          <button
            onClick={handleDelete}
            className="rounded-2xl bg-red-50 px-5 py-3 text-sm font-medium text-red-600"
          >
            Удалить
          </button>

          <button
            onClick={saveChanges}
            disabled={saving || brandsLoading || badgesLoading}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-[24px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <section className="rounded-[28px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-black">Основные данные</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-gray-500">Название</label>
              <input
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">Бренд</label>
              <select
                value={product.brand}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    brand: e.target.value,
                  })
                }
                disabled={brandsLoading || brands.length === 0}
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none disabled:opacity-60"
              >
                {brands.length === 0 ? (
                  <option value="">
                    {brandsLoading ? "Загрузка брендов..." : "Нет брендов"}
                  </option>
                ) : (
                  <>
                    {!brands.some((item) => item.name === product.brand) && (
                      <option value={product.brand}>{product.brand}</option>
                    )}
                    {brands.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">Категория</label>
              <select
                value={product.category}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    category: e.target.value as ProductCategory,
                  })
                }
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              >
                {categoryOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">Цена</label>
              <input
                value={product.price}
                onChange={(e) =>
                  setProduct({ ...product, price: Number(e.target.value || 0) })
                }
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">Старая цена</label>
              <input
                value={product.oldPrice}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    oldPrice: Number(e.target.value || 0),
                  })
                }
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">Бейдж</label>
              <select
                value={product.badge}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    badge: e.target.value,
                  })
                }
                disabled={badgesLoading}
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none disabled:opacity-60"
              >
                <option value="Без бейджа">Без бейджа</option>
                {!badges.some((item) => item.name === product.badge) &&
                  product.badge !== "Без бейджа" && (
                    <option value={product.badge}>{product.badge}</option>
                  )}
                {badges.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">Статус</label>
              <select
                value={product.status}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    status: e.target.value as ProductStatus,
                  })
                }
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              >
                {statusOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">Артикул</label>
              <div className="flex gap-2">
                <input
                  value={product.article}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      article: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setProduct({
                      ...product,
                      article: generateArticleNumber(),
                    })
                  }
                  className="shrink-0 rounded-2xl bg-black px-4 text-sm text-white"
                >
                  Новый
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-gray-500">Описание</label>
              <textarea
                value={product.description}
                onChange={(e) =>
                  setProduct({ ...product, description: e.target.value })
                }
                rows={5}
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            </div>
          </div>
        </section>

        <aside className="rounded-[28px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-black">Предпросмотр</h2>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-black/5 bg-[#FAFAFA]">
            <div className="aspect-[3/4] bg-[#ECECEC]">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            <div className="p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                {product.brand}
              </p>

              <h3 className="mt-2 text-[16px] font-medium text-black">
                {product.name}
              </h3>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-400 line-through">
                  {product.oldPrice} ₽
                </span>

                <span className="text-[18px] font-semibold text-[#16A34A]">
                  {product.price} ₽
                </span>

                {discountPercent > 0 && (
                  <span className="rounded-full bg-[#E8F7EE] px-2 py-0.5 text-xs text-[#16A34A]">
                    -{discountPercent}%
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {product.badge !== "Без бейджа" && (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      product.badge.trim().toLowerCase() === "из-за рубежа"
                        ? "bg-black text-white"
                        : "bg-[#F5F5F5] text-gray-700"
                    }`}
                  >
                    {product.badge}
                  </span>
                )}

                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    product.status === "Активен"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {product.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>Артикул: {product.article}</p>
                <p>Размеров: {product.sizes.length}</p>
                <p>Цветов: {product.colors.length}</p>
                <p>Обновлен: {product.updatedAt}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}