"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, GripVertical, Trash2, X } from "lucide-react";
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

  return {
    id: row.id,
    name: row.name || "",
    brand: row.brand || "",
    gender,
    category: normalizeCategory(row.category, gender),
    country: row.country || "",
    price: Number(row.price) || 0,
    oldPrice: Number(row.old_price) || 0,
    badge: row.badge || "Без бейджа",
    status: row.status === "Скрыт" ? "Скрыт" : "Активен",
    description: row.description || "",
    article: (row.article || "").replace(/\D/g, "").slice(0, 7),
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    stock: row.stock && typeof row.stock === "object" ? row.stock : {},
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
  const [draggedImage, setDraggedImage] = useState<{
    color: string;
    index: number;
  } | null>(null);

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

    setProduct({ ...product, sizes: nextSizes, stock: nextStock });
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

  const moveImage = (color: string, fromIndex: number, toIndex: number) => {
    if (!product || fromIndex === toIndex) return;

    const arr = [...(product.colorImages[color] || [])];
    if (!arr[fromIndex] || toIndex < 0 || toIndex >= arr.length) return;

    const [picked] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, picked);

    setProduct({
      ...product,
      image: product.image === picked ? picked : product.image,
      colorImages: { ...product.colorImages, [color]: arr },
    });
    setDraggedImage({ color, index: toIndex });
  };

  const handleImageDragEnter = (color: string, index: number) => {
    if (!draggedImage || draggedImage.color !== color) return;
    moveImage(color, draggedImage.index, index);
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

      setMessage("Изменения сохранены");
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
      <div className="rounded-[22px] bg-white p-5 text-[13px] text-[#697386] shadow-sm">
        Загрузка товара...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-[22px] bg-white p-5 text-[13px] text-[#697386] shadow-sm">
        Товар не найден
      </div>
    );
  }

  const inputClass =
    "mt-1.5 h-10 w-full rounded-[13px] bg-[#F4F6FA] px-3 text-[14px] outline-none";
  const labelClass = "text-[11px] font-medium text-[#697386]";
  const cardClass = "rounded-[22px] bg-white p-4 shadow-sm";

  return (
    <main className="mx-auto max-w-[480px] pb-28 text-[#101114]">
      <header className="sticky top-0 z-20 -mx-2 mb-3 bg-[#F3F4F8]/95 px-2 py-2 backdrop-blur">
        <div className="flex items-center justify-between gap-2 rounded-[20px] bg-white px-3 py-3 shadow-sm">
          <Link
            href="/admin/products"
            className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#F4F6FA] text-[#7F8997]"
            aria-label="Назад"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-[18px] font-semibold">Редактировать</h1>
            <p className="mt-0.5 truncate text-[11px] text-[#8A94A3]">
              {product.article || product.id}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#FFF1F2] text-[#E11D48]"
            aria-label="Удалить"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </header>

      <div className="space-y-3">
        {message ? (
          <div className="rounded-[16px] bg-white px-3 py-2 text-[12px] text-[#101114] shadow-sm">
            {message}
          </div>
        ) : null}

        <section className={cardClass}>
          <div className="flex gap-3">
            <div className="h-[86px] w-[86px] shrink-0 overflow-hidden rounded-[18px] bg-[#F4F6FA]">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] text-[#8A94A3]">
                  Нет фото
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <label className={labelClass}>Название</label>
              <input
                value={product.name}
                onChange={(event) => setProductField("name", event.target.value)}
                className={inputClass}
                placeholder="Название товара"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label>
                  <span className={labelClass}>Цена</span>
                  <input
                    value={product.price}
                    onChange={(event) =>
                      setProductField("price", Number(event.target.value.replace(/\D/g, "")) || 0)
                    }
                    inputMode="numeric"
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>Старая</span>
                  <input
                    value={product.oldPrice}
                    onChange={(event) =>
                      setProductField(
                        "oldPrice",
                        Number(event.target.value.replace(/\D/g, "")) || 0
                      )
                    }
                    inputMode="numeric"
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-[16px] font-semibold">Основное</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label>
              <span className={labelClass}>Бренд</span>
              <select
                value={product.brand}
                onChange={(event) => setProductField("brand", event.target.value)}
                disabled={brandsLoading || brands.length === 0}
                className={inputClass}
              >
                {brands.length === 0 ? (
                  <option value="">
                    {brandsLoading ? "Загрузка..." : "Нет брендов"}
                  </option>
                ) : (
                  brands.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label>
              <span className={labelClass}>Статус</span>
              <select
                value={product.status}
                onChange={(event) =>
                  setProductField("status", event.target.value as ProductStatus)
                }
                className={inputClass}
              >
                {statusOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              <span className={labelClass}>Раздел</span>
              <select
                value={product.gender}
                onChange={(event) => {
                  const nextGender = event.target.value as ProductGender;
                  setProduct((prev) =>
                    prev
                      ? {
                          ...prev,
                          gender: nextGender,
                          category: getCategoryOptions(nextGender)[0],
                        }
                      : prev
                  );
                }}
                className={inputClass}
              >
                {genderOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              <span className={labelClass}>Категория</span>
              <select
                value={product.category}
                onChange={(event) =>
                  setProductField("category", event.target.value as ProductCategory)
                }
                className={inputClass}
              >
                {categoryOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              <span className={labelClass}>Страна</span>
              <input
                value={product.country}
                onChange={(event) => setProductField("country", event.target.value)}
                className={inputClass}
                placeholder="Турция"
              />
            </label>

            <label>
              <span className={labelClass}>Артикул</span>
              <input
                value={product.article}
                onChange={(event) =>
                  setProductField(
                    "article",
                    event.target.value.replace(/\D/g, "").slice(0, 7)
                  )
                }
                inputMode="numeric"
                className={inputClass}
                placeholder="1234567"
              />
            </label>
          </div>

          <label className="mt-2 block">
            <span className={labelClass}>Бейдж</span>
            <select
              value={product.badge}
              onChange={(event) => setProductField("badge", event.target.value)}
              disabled={badgesLoading}
              className={inputClass}
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
          </label>

          <label className="mt-2 block">
            <span className={labelClass}>Описание</span>
            <textarea
              value={product.description}
              onChange={(event) =>
                setProductField("description", event.target.value)
              }
              rows={4}
              className="mt-1.5 w-full resize-none rounded-[13px] bg-[#F4F6FA] px-3 py-2 text-[14px] outline-none"
              placeholder="Описание товара"
            />
          </label>
        </section>

        <section className={cardClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">Размеры</h2>
            <span className="rounded-[10px] bg-[#F4F6FA] px-2 py-1 text-[11px] text-[#697386]">
              {totalStock} шт
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {sizeOptions.map((size) => {
              const active = product.sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`h-8 min-w-10 rounded-[11px] px-2 text-[12px] font-medium ${
                    active ? "bg-[#101114] text-white" : "bg-[#F4F6FA] text-[#697386]"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>

          {product.sizes.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {product.sizes.map((size) => (
                <label
                  key={size}
                  className="flex h-10 items-center justify-between rounded-[13px] bg-[#F4F6FA] px-3"
                >
                  <span className="text-[12px] font-medium">{size}</span>
                  <input
                    value={product.stock[size] ?? 0}
                    onChange={(event) => updateSizeStock(size, event.target.value)}
                    inputMode="numeric"
                    className="h-8 w-14 rounded-[10px] bg-white text-center text-[13px] font-medium outline-none"
                  />
                </label>
              ))}
            </div>
          ) : null}
        </section>

        <section className={cardClass}>
          <h2 className="text-[16px] font-semibold">Цвета и фото</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {colorOptions.map((color) => {
              const active = product.colors.includes(color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleColor(color)}
                  className={`flex h-8 items-center gap-1.5 rounded-[11px] px-2 text-[12px] font-medium ${
                    active ? "bg-[#101114] text-white" : "bg-[#F4F6FA] text-[#697386]"
                  }`}
                >
                  <span
                    className={`h-3.5 w-3.5 rounded-full ${
                      color === "Белый" ? "border border-[#CBD5E1]" : ""
                    }`}
                    style={{ backgroundColor: colorSwatches[color] || "#E5E7EB" }}
                  />
                  {color}
                </button>
              );
            })}
          </div>

          {product.colors.length > 0 ? (
            <>
              <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setActiveColor(color)}
                    className={`shrink-0 rounded-[11px] px-3 py-2 text-[12px] font-medium ${
                      activeColor === color
                        ? "bg-[#101114] text-white"
                        : "bg-[#F4F6FA] text-[#697386]"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>

              {activeColor ? (
                <div className="mt-2">
                  <label className="block rounded-[14px] bg-[#F4F6FA] px-3 py-3 text-center text-[12px] font-medium text-[#101114]">
                    {uploading ? "Загружаем..." : `Загрузить фото: ${activeColor}`}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) =>
                        handleImageUpload(activeColor, event.target.files)
                      }
                      className="hidden"
                    />
                  </label>

                  {activeImages.length > 0 ? (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {activeImages.map((url, index) => (
                        <div
                          key={`${url}-${index}`}
                          draggable
                          onDragStart={() => setDraggedImage({ color: activeColor, index })}
                          onDragEnter={() => handleImageDragEnter(activeColor, index)}
                          onDragEnd={() => setDraggedImage(null)}
                          onPointerDown={() => setDraggedImage({ color: activeColor, index })}
                          onPointerEnter={() => handleImageDragEnter(activeColor, index)}
                          onPointerUp={() => setDraggedImage(null)}
                          onPointerCancel={() => setDraggedImage(null)}
                          className={`overflow-hidden rounded-[14px] bg-[#F4F6FA] transition ${
                            draggedImage?.color === activeColor &&
                            draggedImage.index === index
                              ? "scale-[.98] opacity-70"
                              : ""
                          }`}
                          style={{ touchAction: "none" }}
                        >
                          <div className="relative">
                            <img
                              src={url}
                              alt={`${activeColor} ${index + 1}`}
                              className="h-[96px] w-full object-cover"
                              draggable={false}
                            />
                            <div className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-[8px] bg-black/55 text-white">
                              <GripVertical size={14} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-px bg-[#E8ECF2]">
                            <button
                              type="button"
                              onPointerDown={(event) => event.stopPropagation()}
                              onClick={() => makeMainImage(activeColor, index)}
                              className="flex h-7 items-center justify-center bg-white text-[#15803D]"
                              aria-label="Главное"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) => event.stopPropagation()}
                              onClick={() => removeColorImage(activeColor, index)}
                              className="flex h-7 items-center justify-center bg-white text-[#E11D48]"
                              aria-label="Удалить фото"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-[12px] text-[#8A94A3]">
                      Для выбранного цвета пока нет фото.
                    </p>
                  )}
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-[70px] z-[90] px-3">
        <div className="mx-auto flex max-w-[480px] gap-2 rounded-[20px] bg-white p-2 shadow-[0_-10px_30px_rgba(15,23,42,.12)]">
          <button
            type="button"
            onClick={saveChanges}
            disabled={saving || brandsLoading || badgesLoading || uploading}
            className="h-11 flex-1 rounded-[15px] bg-[#101114] text-[14px] font-medium text-white disabled:opacity-60"
          >
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </div>
    </main>
  );
}
