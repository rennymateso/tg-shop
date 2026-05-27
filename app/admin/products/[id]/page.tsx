"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { uploadProductImage } from "../../../lib/upload-product-image";

type ProductStatus = "Активен" | "Скрыт";
type ProductGender = "Мужская одежда" | "Женская одежда";

type ProductCategory =
  | "Футболки"
  | "Поло"
  | "Джинсы"
  | "Брюки"
  | "Костюмы"
  | "Платья"
  | "Рубашки"
  | "Юбки";

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
  gender: ProductGender;
  category: ProductCategory;
  country: string;
  price: number;
  oldPrice: number;
  badge: string;
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

const statusOptions: ProductStatus[] = ["Активен", "Скрыт"];
const genderOptions: ProductGender[] = ["Мужская одежда", "Женская одежда"];

const mensCategoryOptions: ProductCategory[] = [
  "Футболки",
  "Поло",
  "Джинсы",
  "Брюки",
  "Костюмы",
];

const womensCategoryOptions: ProductCategory[] = [
  "Платья",
  "Футболки",
  "Рубашки",
  "Брюки",
  "Юбки",
];

const sizeOptions = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "30",
  "31",
  "32",
  "33",
  "34",
  "36",
  "38",
] as const;

const colorOptions = [
  "Черный",
  "Белый",
  "Серый",
  "Синий",
  "Бежевый",
  "Зеленый",
  "Коричневый",
] as const;

const colorSwatches: Record<string, string> = {
  Черный: "#111111",
  Белый: "#FFFFFF",
  Серый: "#9CA3AF",
  Синий: "#1D3557",
  Бежевый: "#D6C2A1",
  Зеленый: "#3F6B4B",
  Коричневый: "#7A5230",
};

function getCategoryOptions(gender: ProductGender) {
  return gender === "Мужская одежда" ? mensCategoryOptions : womensCategoryOptions;
}

function normalizeGender(value: string | null | undefined): ProductGender {
  return value === "Женская одежда" ? "Женская одежда" : "Мужская одежда";
}

function normalizeCategory(value: string, gender: ProductGender): ProductCategory {
  const options = getCategoryOptions(gender);
  return options.includes(value as ProductCategory)
    ? (value as ProductCategory)
    : options[0];
}

function generateArticleNumber() {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
}

function mapRowToProduct(row: ProductRow): AdminProduct {
  const gender = normalizeGender(row.gender);
  const sizes = Array.isArray(row.sizes) ? row.sizes : [];
  const stock = row.stock && typeof row.stock === "object" ? row.stock : {};

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    gender,
    category: normalizeCategory(row.category, gender),
    country: row.country || "",
    price: row.price,
    oldPrice: row.old_price,
    badge: row.badge || "Без бейджа",
    status: row.status === "Скрыт" ? "Скрыт" : "Активен",
    description: row.description || "",
    article: (row.article || "").replace(/\D/g, "").slice(0, 7),
    sizes,
    stock,
    colors: Array.isArray(row.colors) ? row.colors : [],
    image: row.image || "",
    colorImages: row.color_images || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
  const [activeColor, setActiveColor] = useState("");
  const [uploading, setUploading] = useState(false);

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

      const mapped = mapRowToProduct(data as ProductRow);
      setProduct(mapped);
      setActiveColor(mapped.colors[0] || "");
      setLoading(false);
    };

    loadProduct();
  }, [id]);

  const categoryOptions = useMemo(() => {
    return product ? getCategoryOptions(product.gender) : mensCategoryOptions;
  }, [product]);

  const discountPercent = useMemo(() => {
    if (!product || product.oldPrice <= product.price) return 0;
    return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  }, [product]);

  const totalStock = useMemo(() => {
    if (!product) return 0;
    return product.sizes.reduce(
      (sum, size) => sum + Math.max(0, Number(product.stock[size]) || 0),
      0
    );
  }, [product]);

  const availableSizes = useMemo(() => {
    if (!product) return [];
    return product.sizes.filter(
      (size) => Math.max(0, Number(product.stock[size]) || 0) > 0
    );
  }, [product]);

  const activeImages =
    product && activeColor ? product.colorImages[activeColor] || [] : [];

  const setProductField = <K extends keyof AdminProduct>(
    key: K,
    value: AdminProduct[K]
  ) => {
    setProduct((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const toggleSize = (size: string) => {
    if (!product) return;

    const exists = product.sizes.includes(size);
    const nextSizes = exists
      ? product.sizes.filter((item) => item !== size)
      : [...product.sizes, size];

    const nextStock = { ...product.stock };

    if (exists) {
      delete nextStock[size];
    } else {
      nextStock[size] = nextStock[size] || 0;
    }

    setProduct({
      ...product,
      sizes: nextSizes,
      stock: nextStock,
    });
  };

  const updateSizeStock = (size: string, value: string) => {
    if (!product) return;

    const quantity = Math.max(0, Number(value.replace(/\D/g, "")) || 0);

    setProduct({
      ...product,
      stock: {
        ...product.stock,
        [size]: quantity,
      },
    });
  };

  const toggleColor = (color: string) => {
    if (!product) return;

    const exists = product.colors.includes(color);
    const nextColors = exists
      ? product.colors.filter((item) => item !== color)
      : [...product.colors, color];

    const nextColorImages = { ...product.colorImages };

    if (exists) {
      delete nextColorImages[color];
    }

    const nextImage =
      product.image && (!exists || product.image !== product.colorImages[color]?.[0])
        ? product.image
        : Object.values(nextColorImages).flat()[0] || "";

    setProduct({
      ...product,
      colors: nextColors,
      colorImages: nextColorImages,
      image: nextImage,
    });

    if (!exists) {
      setActiveColor(color);
    } else if (activeColor === color) {
      setActiveColor(nextColors[0] || "");
    }
  };

  const handleImageUpload = async (color: string, files: FileList | null) => {
    if (!product || !color || !files || files.length === 0) return;

    const current = product.colorImages[color] || [];
    const freeSlots = 6 - current.length;

    if (freeSlots <= 0) {
      setMessage(`Для цвета ${color} уже загружено 6 фото`);
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      const pickedFiles = Array.from(files).slice(0, freeSlots);
      const uploadedUrls: string[] = [];

      for (const file of pickedFiles) {
        const publicUrl = await uploadProductImage(
          file,
          product.article || product.id,
          color
        );
        uploadedUrls.push(publicUrl);
      }

      const nextImages = [...current, ...uploadedUrls];

      setProduct({
        ...product,
        colorImages: {
          ...product.colorImages,
          [color]: nextImages,
        },
        image: product.image || nextImages[0] || "",
      });

      if (files.length > freeSlots) {
        setMessage(`Для цвета ${color} добавили только первые 6 фото`);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Ошибка загрузки фото: ${error.message}`
          : "Ошибка загрузки фото"
      );
    } finally {
      setUploading(false);
    }
  };

  const removeColorImage = (color: string, index: number) => {
    if (!product) return;

    const removedImage = product.colorImages[color]?.[index] || "";
    const nextImages = (product.colorImages[color] || []).filter(
      (_, itemIndex) => itemIndex !== index
    );

    const nextColorImages = {
      ...product.colorImages,
      [color]: nextImages,
    };

    const nextMainImage =
      product.image === removedImage
        ? Object.values(nextColorImages).flat()[0] || ""
        : product.image;

    setProduct({
      ...product,
      colorImages: nextColorImages,
      image: nextMainImage,
    });
  };

  const makeMainImage = (color: string, index: number) => {
    if (!product) return;

    const arr = [...(product.colorImages[color] || [])];

    if (!arr[index]) return;

    const picked = arr[index];
    arr.splice(index, 1);
    arr.unshift(picked);

    setProduct({
      ...product,
      image: picked,
      colorImages: {
        ...product.colorImages,
        [color]: arr,
      },
    });
  };

  const moveImageLeft = (color: string, index: number) => {
    if (!product || index <= 0) return;

    const arr = [...(product.colorImages[color] || [])];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];

    setProduct({
      ...product,
      colorImages: {
        ...product.colorImages,
        [color]: arr,
      },
    });
  };

  const moveImageRight = (color: string, index: number) => {
    if (!product) return;

    const arr = [...(product.colorImages[color] || [])];

    if (index >= arr.length - 1) return;

    [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];

    setProduct({
      ...product,
      colorImages: {
        ...product.colorImages,
        [color]: arr,
      },
    });
  };

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

    if (!product.country.trim()) {
      setMessage("Введите страну изготовления");
      return;
    }

    if (totalStock <= 0 || availableSizes.length === 0) {
      setMessage("Укажите количество хотя бы для одного размера");
      return;
    }

    const hasImages = product.colors.some(
      (color) => (product.colorImages[color] || []).length > 0
    );

    if (!hasImages) {
      setMessage("Добавьте хотя бы одно фото для товара");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const now = new Date().toISOString();
      const finalArticle =
        product.article.replace(/\D/g, "").slice(0, 7) || generateArticleNumber();
      const mainImage = product.image || Object.values(product.colorImages).flat()[0] || "";

      const { error } = await supabase
        .from("products")
        .update({
          name: product.name.trim(),
          brand: product.brand.trim(),
          gender: product.gender,
          category: product.category,
          country: product.country.trim(),
          price: product.price,
          old_price: product.oldPrice || product.price,
          badge: product.badge === "Без бейджа" ? null : product.badge,
          status: product.status,
          description: product.description,
          article: finalArticle,
          sizes: availableSizes,
          stock: product.stock,
          colors: product.colors,
          image: mainImage,
          color_images: product.colorImages,
          updated_at: now,
        })
        .eq("id", id);

      if (error) {
        setMessage(`Ошибка сохранения: ${error.message}`);
        setSaving(false);
        return;
      }

      setProduct({
        ...product,
        article: finalArticle,
        image: mainImage,
        sizes: availableSizes,
        updatedAt: now,
      });

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
      <style>{`
        input,
        textarea,
        select {
          font-size: 16px;
        }
      `}</style>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">
            Редактировать товар
          </h1>
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
            type="button"
            onClick={handleDelete}
            className="rounded-2xl bg-red-50 px-5 py-3 text-sm font-medium text-red-600"
          >
            Удалить
          </button>

          <button
            type="button"
            onClick={saveChanges}
            disabled={saving || brandsLoading || badgesLoading || uploading}
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
        <section className="space-y-6">
          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium text-black">Основные данные</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-gray-500">
                  Название
                </label>
                <input
                  value={product.name}
                  onChange={(e) => setProductField("name", e.target.value)}
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">Бренд</label>
                <select
                  value={product.brand}
                  onChange={(e) => setProductField("brand", e.target.value)}
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
                <label className="mb-2 block text-sm text-gray-500">Раздел</label>
                <select
                  value={product.gender}
                  onChange={(e) => {
                    const nextGender = e.target.value as ProductGender;
                    const options = getCategoryOptions(nextGender);

                    setProduct({
                      ...product,
                      gender: nextGender,
                      category: options.includes(product.category)
                        ? product.category
                        : options[0],
                    });
                  }}
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                >
                  {genderOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">
                  Категория
                </label>
                <select
                  value={product.category}
                  onChange={(e) =>
                    setProductField("category", e.target.value as ProductCategory)
                  }
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                >
                  {categoryOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">
                  Страна изготовления
                </label>
                <input
                  value={product.country}
                  onChange={(e) => setProductField("country", e.target.value)}
                  placeholder="Например: Турция"
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">Цена</label>
                <input
                  value={product.price}
                  onChange={(e) =>
                    setProductField("price", Number(e.target.value || 0))
                  }
                  inputMode="numeric"
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">
                  Старая цена
                </label>
                <input
                  value={product.oldPrice}
                  onChange={(e) =>
                    setProductField("oldPrice", Number(e.target.value || 0))
                  }
                  inputMode="numeric"
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">Бейдж</label>
                <select
                  value={product.badge}
                  onChange={(e) => setProductField("badge", e.target.value)}
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
                    setProductField("status", e.target.value as ProductStatus)
                  }
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                >
                  {statusOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">
                  Артикул / короткий код
                </label>
                <div className="flex gap-2">
                  <input
                    value={product.article}
                    onChange={(e) =>
                      setProductField(
                        "article",
                        e.target.value.replace(/\D/g, "").slice(0, 7)
                      )
                    }
                    inputMode="numeric"
                    placeholder="1234567"
                    className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setProductField("article", generateArticleNumber())}
                    className="shrink-0 rounded-2xl bg-black px-4 text-sm text-white"
                  >
                    Новый
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-gray-500">
                  Описание
                </label>
                <textarea
                  value={product.description}
                  onChange={(e) => setProductField("description", e.target.value)}
                  rows={5}
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium text-black">Размеры и остатки</h2>
            <p className="mt-1 text-sm text-gray-500">
              В магазин попадут только размеры, где количество больше 0.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {sizeOptions.map((size) => {
                const active = product.sizes.includes(size);

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`rounded-2xl px-4 py-2 text-sm transition ${
                      active ? "bg-black text-white" : "bg-[#F5F5F5] text-gray-700"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            {product.sizes.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {product.sizes.map((size) => (
                  <div
                    key={size}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-[#F5F5F5] p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-black">Размер {size}</p>
                      <p className="text-xs text-gray-500">Остаток, шт.</p>
                    </div>

                    <input
                      value={product.stock[size] ?? 0}
                      onChange={(e) => updateSizeStock(size, e.target.value)}
                      inputMode="numeric"
                      className="w-[88px] rounded-xl bg-white p-2.5 text-center text-sm outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-2xl bg-[#F7F7F7] p-3 text-sm text-gray-600">
              Общий остаток:{" "}
              <span className="font-medium text-black">{totalStock} шт.</span>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium text-black">Цвета и фото</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {colorOptions.map((color) => {
                const active = product.colors.includes(color);

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleColor(color)}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition ${
                      active ? "bg-black text-white" : "bg-[#F5F5F5] text-gray-700"
                    }`}
                  >
                    <span
                      className={`block h-4 w-4 rounded-full ${
                        color === "Белый" ? "border border-gray-300" : ""
                      }`}
                      style={{ backgroundColor: colorSwatches[color] || "#E5E7EB" }}
                    />
                    {color}
                  </button>
                );
              })}
            </div>

            {product.colors.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setActiveColor(color)}
                    className={`rounded-2xl px-4 py-2 text-sm ${
                      activeColor === color
                        ? "bg-black text-white"
                        : "bg-[#F5F5F5] text-gray-700"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            )}

            {!activeColor ? (
              <div className="mt-4 rounded-2xl bg-[#F7F7F7] p-5 text-sm text-gray-500">
                Выберите цвет, чтобы редактировать фото.
              </div>
            ) : (
              <div className="mt-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-black">
                    Фото цвета: {activeColor}
                  </p>
                  <span className="text-sm text-gray-500">
                    {activeImages.length}/6 фото
                  </span>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(activeColor, e.target.files)}
                  className="block w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:text-white"
                />

                {uploading && (
                  <p className="mt-3 text-sm text-gray-500">Загружаем фото...</p>
                )}

                {activeImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {activeImages.map((img, index) => (
                      <div
                        key={`${activeColor}-${img}-${index}`}
                        className="overflow-hidden rounded-2xl bg-[#F7F7F7] p-2"
                      >
                        <div className="relative">
                          <img
                            src={img}
                            alt={`${activeColor} ${index + 1}`}
                            className="h-[130px] w-full rounded-xl object-cover"
                          />

                          {product.image === img && (
                            <span className="absolute left-2 top-2 rounded-full bg-black px-2 py-1 text-[10px] text-white">
                              Главное
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => removeColorImage(activeColor, index)}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm text-black shadow"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="mt-2 grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => makeMainImage(activeColor, index)}
                            className="rounded-lg bg-black px-2 py-1.5 text-[10px] text-white"
                          >
                            Главная
                          </button>

                          <button
                            type="button"
                            onClick={() => moveImageLeft(activeColor, index)}
                            className="rounded-lg bg-white px-2 py-1.5 text-[10px] text-black"
                          >
                            ←
                          </button>

                          <button
                            type="button"
                            onClick={() => moveImageRight(activeColor, index)}
                            className="rounded-lg bg-white px-2 py-1.5 text-[10px] text-black"
                          >
                            →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                        ? "bg-[#F1F1F1] text-[#666]"
                        : product.badge.trim().toLowerCase() === "в наличии"
                          ? "bg-[#EAF8F0] text-[#16A34A]"
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
                <p>Раздел: {product.gender}</p>
                <p>Страна: {product.country || "Не указана"}</p>
                <p>Размеров с остатком: {availableSizes.length}</p>
                <p>Остаток: {totalStock} шт.</p>
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
