"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, GripVertical, RotateCcw, X } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { uploadProductImage } from "../../../lib/upload-product-image";

type ProductStatus = "Активен" | "Скрыт";
type BadgeType =
  | "Без бейджа"
  | "Новинка"
  | "Скидка"
  | "В наличии"
  | "Из-за рубежа";

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

type ColorGalleryMap = Record<string, string[]>;

type BrandRow = {
  id: string;
  name: string;
  created_at: string;
};

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

const badgeOptions: BadgeType[] = [
  "Без бейджа",
  "Новинка",
  "Скидка",
  "В наличии",
  "Из-за рубежа",
];

const statusOptions: ProductStatus[] = ["Активен", "Скрыт"];

const compositionOptions = [
  "Хлопок",
  "Вискоза",
  "Лен",
  "Шерсть",
  "Полиэстер",
  "Эластан",
  "Кашемир",
  "Шёлк",
  "Акрил",
  "Нейлон",
] as const;

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

function makeArticle() {
  const value = Date.now().toString().slice(-7);
  return value.padStart(7, "0");
}

function createProductId() {
  return `P-${Date.now()}`;
}

export default function AdminNewProductPage() {
  const router = useRouter();

  const [draftProductId, setDraftProductId] = useState(createProductId);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [gender, setGender] = useState<ProductGender>("Мужская одежда");
  const [category, setCategory] = useState<ProductCategory>("Поло");
  const [country, setCountry] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [badge, setBadge] = useState<BadgeType>("Без бейджа");
  const [status, setStatus] = useState<ProductStatus>("Активен");
  const [description, setDescription] = useState("");
  const [article, setArticle] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [stockBySize, setStockBySize] = useState<Record<string, number>>({});
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedComposition, setSelectedComposition] = useState<string[]>([]);
  const [activeColor, setActiveColor] = useState<string>("");
  const [colorImages, setColorImages] = useState<ColorGalleryMap>({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
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

      const safeBrands = (data || []) as BrandRow[];
      setBrands(safeBrands);

      if (safeBrands.length > 0) {
        setBrand(safeBrands[0].name);
      }

      setBrandsLoading(false);
    };

    loadBrands();
  }, []);

  useEffect(() => {
    const options =
      gender === "Мужская одежда" ? mensCategoryOptions : womensCategoryOptions;

    if (!options.includes(category)) {
      setCategory(options[0]);
    }
  }, [gender, category]);

  const categoryOptions = useMemo(
    () => (gender === "Мужская одежда" ? mensCategoryOptions : womensCategoryOptions),
    [gender]
  );

  const totalStock = useMemo(() => {
    return selectedSizes.reduce(
      (sum, size) => sum + Math.max(0, Number(stockBySize[size]) || 0),
      0
    );
  }, [selectedSizes, stockBySize]);

  const availableSizes = useMemo(
    () =>
      selectedSizes.filter((size) => Math.max(0, Number(stockBySize[size]) || 0) > 0),
    [selectedSizes, stockBySize]
  );

  const activeImages = activeColor ? colorImages[activeColor] || [] : [];

  const previewImage = useMemo(() => {
    if (activeColor && colorImages[activeColor]?.length) {
      return colorImages[activeColor][0];
    }

    const firstColorWithImages = selectedColors.find(
      (color) => colorImages[color]?.length
    );

    return firstColorWithImages ? colorImages[firstColorWithImages][0] : "";
  }, [activeColor, colorImages, selectedColors]);

  const toggleSize = (value: string) => {
    setSelectedSizes((prev) => {
      const exists = prev.includes(value);
      const next = exists
        ? prev.filter((item) => item !== value)
        : [...prev, value];

      setStockBySize((current) => {
        const updated = { ...current };

        if (exists) {
          delete updated[value];
        } else {
          updated[value] = updated[value] || 0;
        }

        return updated;
      });

      return next;
    });
  };

  const updateSizeStock = (size: string, value: string) => {
    const quantity = Math.max(0, Number(value.replace(/\D/g, "")) || 0);
    setStockBySize((prev) => ({ ...prev, [size]: quantity }));
  };

  const toggleColor = (value: string) => {
    setSelectedColors((prev) => {
      const exists = prev.includes(value);
      const next = exists
        ? prev.filter((item) => item !== value)
        : [...prev, value];

      if (!exists) {
        setActiveColor(value);
      } else if (activeColor === value) {
        setActiveColor(next[0] || "");
      }

      setColorImages((current) => {
        if (!exists) return current;
        const updated = { ...current };
        delete updated[value];
        return updated;
      });

      return next;
    });
  };

  const toggleComposition = (value: string) => {
    setSelectedComposition((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleColorImagesUpload = async (color: string, files: FileList | null) => {
    if (!color || !files || files.length === 0) return;

    const current = colorImages[color] || [];
    const freeSlots = 6 - current.length;

    if (freeSlots <= 0) {
      setMessage(`Для цвета ${color} уже загружено 6 фото`);
      return;
    }

    try {
      setIsUploadingImages(true);
      setMessage("");

      const pickedFiles = Array.from(files).slice(0, freeSlots);
      const uploadedUrls: string[] = [];

      for (const file of pickedFiles) {
        const publicUrl = await uploadProductImage(file, draftProductId, color);
        uploadedUrls.push(publicUrl);
      }

      setColorImages((prev) => ({
        ...prev,
        [color]: [...(prev[color] || []), ...uploadedUrls],
      }));

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
      setIsUploadingImages(false);
    }
  };

  const removeColorImage = (color: string, index: number) => {
    setColorImages((prev) => ({
      ...prev,
      [color]: (prev[color] || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const makeMainImage = (color: string, index: number) => {
    setColorImages((prev) => {
      const arr = [...(prev[color] || [])];
      if (!arr[index]) return prev;
      const picked = arr[index];
      arr.splice(index, 1);
      arr.unshift(picked);
      return { ...prev, [color]: arr };
    });
  };

  const moveImage = (color: string, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setColorImages((prev) => {
      const arr = [...(prev[color] || [])];
      if (!arr[fromIndex] || toIndex < 0 || toIndex >= arr.length) return prev;

      const [picked] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, picked);
      return { ...prev, [color]: arr };
    });
    setDraggedImage({ color, index: toIndex });
  };

  const handleImageDragEnter = (color: string, index: number) => {
    if (!draggedImage || draggedImage.color !== color) return;
    moveImage(color, draggedImage.index, index);
  };

  const fillArticle = () => {
    setArticle(makeArticle());
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage("Введите название товара");
      return;
    }

    if (!brand.trim()) {
      setMessage("Выберите бренд");
      return;
    }

    if (!price.trim()) {
      setMessage("Введите цену товара");
      return;
    }

    if (!country.trim()) {
      setMessage("Введите страну изготовления");
      return;
    }

    if (selectedSizes.length === 0) {
      setMessage("Выберите хотя бы один размер");
      return;
    }

    if (selectedColors.length === 0) {
      setMessage("Выберите хотя бы один цвет");
      return;
    }

    if (selectedComposition.length === 0) {
      setMessage("Выберите хотя бы один состав");
      return;
    }

    if (totalStock <= 0 || availableSizes.length === 0) {
      setMessage("Укажите количество хотя бы для одного размера");
      return;
    }

    const hasImages = selectedColors.some(
      (color) => (colorImages[color] || []).length > 0
    );

    if (!hasImages) {
      setMessage("Добавьте хотя бы одно фото");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");

      const finalArticle = article || makeArticle();
      const now = new Date().toISOString();
      const productId = draftProductId;

      const { error } = await supabase.from("products").insert({
        id: productId,
        name: name.trim(),
        brand,
        gender,
        category,
        country: country.trim(),
        price: Number(price),
        old_price: Number(oldPrice || price),
        badge: badge === "Без бейджа" ? null : badge,
        status,
        description: description.trim(),
        article: finalArticle,
        sizes: availableSizes,
        stock: stockBySize,
        colors: selectedColors,
        composition: selectedComposition,
        image: previewImage || "",
        color_images: colorImages,
        created_at: now,
        updated_at: now,
      });

      if (error) {
        setMessage(`Ошибка сохранения: ${error.message}`);
        setIsSaving(false);
        return;
      }

      router.push(`/admin/products/${productId}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить товар");
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setDraftProductId(createProductId());
    setName("");
    setBrand(brands[0]?.name || "");
    setGender("Мужская одежда");
    setCategory("Поло");
    setCountry("");
    setPrice("");
    setOldPrice("");
    setBadge("Без бейджа");
    setStatus("Активен");
    setDescription("");
    setArticle("");
    setSelectedSizes([]);
    setStockBySize({});
    setSelectedColors([]);
    setSelectedComposition([]);
    setActiveColor("");
    setColorImages({});
    setMessage("");
  };

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
            <h1 className="truncate text-[18px] font-semibold">Добавить товар</h1>
            <p className="mt-0.5 truncate text-[11px] text-[#8A94A3]">
              Новый товар
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#F4F6FA] text-[#7F8997]"
            aria-label="Очистить"
          >
            <RotateCcw size={17} />
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
              {previewImage ? (
                <img
                  src={previewImage}
                  alt={name || "Товар"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-center text-[11px] text-[#8A94A3]">
                  Фото
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <label className={labelClass}>Название</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
                placeholder="Название товара"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label>
                  <span className={labelClass}>Цена</span>
                  <input
                    value={price}
                    onChange={(event) =>
                      setPrice(event.target.value.replace(/\D/g, ""))
                    }
                    inputMode="numeric"
                    className={inputClass}
                    placeholder="0"
                  />
                </label>
                <label>
                  <span className={labelClass}>Старая</span>
                  <input
                    value={oldPrice}
                    onChange={(event) =>
                      setOldPrice(event.target.value.replace(/\D/g, ""))
                    }
                    inputMode="numeric"
                    className={inputClass}
                    placeholder="0"
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
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
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
                value={status}
                onChange={(event) => setStatus(event.target.value as ProductStatus)}
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
                value={gender}
                onChange={(event) => setGender(event.target.value as ProductGender)}
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
                value={category}
                onChange={(event) => setCategory(event.target.value as ProductCategory)}
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
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className={inputClass}
                placeholder="Турция"
              />
            </label>

            <label>
              <span className={labelClass}>Артикул</span>
              <div className="mt-1.5 flex gap-1.5">
                <input
                  value={article}
                  onChange={(event) =>
                    setArticle(event.target.value.replace(/\D/g, "").slice(0, 7))
                  }
                  inputMode="numeric"
                  className="h-10 min-w-0 flex-1 rounded-[13px] bg-[#F4F6FA] px-3 text-[14px] outline-none"
                  placeholder="1234567"
                />
                <button
                  type="button"
                  onClick={fillArticle}
                  className="h-10 rounded-[13px] bg-[#101114] px-2.5 text-[11px] font-medium text-white"
                >
                  Авто
                </button>
              </div>
            </label>
          </div>

          <label className="mt-2 block">
            <span className={labelClass}>Бейдж</span>
            <select
              value={badge}
              onChange={(event) => setBadge(event.target.value as BadgeType)}
              className={inputClass}
            >
              {badgeOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="mt-2 block">
            <span className={labelClass}>Описание</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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
              const active = selectedSizes.includes(size);
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

          {selectedSizes.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {selectedSizes.map((size) => (
                <label
                  key={size}
                  className="flex h-10 items-center justify-between rounded-[13px] bg-[#F4F6FA] px-3"
                >
                  <span className="text-[12px] font-medium">{size}</span>
                  <input
                    value={stockBySize[size] ?? 0}
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
          <h2 className="text-[16px] font-semibold">Состав</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {compositionOptions.map((item) => {
              const active = selectedComposition.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleComposition(item)}
                  className={`h-8 rounded-[11px] px-2.5 text-[12px] font-medium ${
                    active ? "bg-[#101114] text-white" : "bg-[#F4F6FA] text-[#697386]"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-[16px] font-semibold">Цвета и фото</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {colorOptions.map((color) => {
              const active = selectedColors.includes(color);
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

          {selectedColors.length > 0 ? (
            <>
              <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {selectedColors.map((color) => (
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
                    {isUploadingImages ? "Загружаем..." : `Загрузить фото: ${activeColor}`}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) =>
                        handleColorImagesUpload(activeColor, event.target.files)
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
            onClick={handleSave}
            disabled={isSaving || brandsLoading || isUploadingImages}
            className="h-11 flex-1 rounded-[15px] bg-[#101114] text-[14px] font-medium text-white disabled:opacity-60"
          >
            {isSaving ? "Сохраняем..." : "Создать товар"}
          </button>
        </div>
      </div>
    </main>
  );
}
