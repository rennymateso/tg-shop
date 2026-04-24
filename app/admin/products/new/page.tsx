"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { uploadProductImage } from "../../../lib/upload-product-image";

type ProductStatus = "Активен" | "Скрыт";
type ProductCategory =
  | "Футболки"
  | "Поло"
  | "Джинсы"
  | "Брюки"
  | "Костюмы";

type ColorGalleryMap = Record<string, string[]>;

type BadgeRow = {
  id: string;
  name: string;
  created_at: string;
};

const brandOptions = [
  "Lacoste",
  "Polo Ralph Lauren",
  "Tommy Hilfiger",
  "Calvin Klein",
  "GANT",
  "BOSS",
  "Emporio Armani",
  "Armani Exchange",
  "Beymen Club",
  "Loro Piana",
  "Brunello Cucinelli",
  "BORZ",
  "Massimo Carino",
  "Другие бренды",
] as const;

const categoryOptions: ProductCategory[] = [
  "Футболки",
  "Поло",
  "Джинсы",
  "Брюки",
  "Костюмы",
];

const statusOptions: ProductStatus[] = ["Активен", "Скрыт"];

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

function makeArticle(name: string) {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-ZА-Я0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 14);

  return base ? `ART-${base}` : "ART-NEW";
}

function createProductId() {
  return `P-${Date.now()}`;
}

export default function AdminNewProductPage() {
  const router = useRouter();

  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState<(typeof brandOptions)[number]>("Lacoste");
  const [category, setCategory] = useState<ProductCategory>("Поло");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [badge, setBadge] = useState("Без бейджа");
  const [status, setStatus] = useState<ProductStatus>("Активен");
  const [description, setDescription] = useState("");
  const [article, setArticle] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [activeColor, setActiveColor] = useState<string>("");
  const [colorImages, setColorImages] = useState<ColorGalleryMap>({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

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

      const safeBadges = (data || []) as BadgeRow[];
      setBadges(safeBadges);
      setBadgesLoading(false);
    };

    loadBadges();
  }, []);

  const discountPercent = useMemo(() => {
    const p = Number(price);
    const o = Number(oldPrice);
    if (!p || !o || o <= p) return 0;
    return Math.round(((o - p) / o) * 100);
  }, [price, oldPrice]);

  const activeImages = activeColor ? colorImages[activeColor] || [] : [];

  const previewImage = useMemo(() => {
    if (activeColor && colorImages[activeColor]?.length) {
      return colorImages[activeColor][0];
    }

    const firstColorWithImages = selectedColors.find(
      (color) => colorImages[color]?.length
    );

    if (firstColorWithImages) {
      return colorImages[firstColorWithImages][0];
    }

    return "";
  }, [activeColor, colorImages, selectedColors]);

  const totalImagesCount = useMemo(() => {
    return Object.values(colorImages).reduce((sum, arr) => sum + arr.length, 0);
  }, [colorImages]);

  const toggleSize = (value: string) => {
    setSelectedSizes((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const toggleColor = (value: string) => {
    setSelectedColors((prev) => {
      const exists = prev.includes(value);
      const next = exists
        ? prev.filter((item) => item !== value)
        : [...prev, value];

      if (!exists && !activeColor) setActiveColor(value);
      if (exists && activeColor === value) setActiveColor(next[0] || "");

      return next;
    });
  };

  const fillArticle = () => {
    setArticle(makeArticle(name));
  };

  const handleColorImagesUpload = async (color: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const current = colorImages[color] || [];
    const freeSlots = 6 - current.length;

    if (freeSlots <= 0) {
      setMessage(`Для цвета ${color} уже загружено 6 фото`);
      return;
    }

    try {
      setIsUploadingImages(true);
      setMessage("");

      const tempProductId = article.trim() || makeArticle(name) || createProductId();

      const pickedFiles = Array.from(files).slice(0, freeSlots);
      const uploadedUrls: string[] = [];

      for (const file of pickedFiles) {
        const publicUrl = await uploadProductImage(file, tempProductId, color);
        uploadedUrls.push(publicUrl);
      }

      setColorImages((prev) => ({
        ...prev,
        [color]: [...(prev[color] || []), ...uploadedUrls],
      }));

      setActiveColor(color);

      if (files.length > freeSlots) {
        setMessage(`Для цвета ${color} добавили только первые 6 фото`);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? `Ошибка загрузки фото: ${error.message}` : "Ошибка загрузки фото"
      );
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeColorImage = (color: string, index: number) => {
    setColorImages((prev) => ({
      ...prev,
      [color]: (prev[color] || []).filter((_, i) => i !== index),
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

  const moveImageLeft = (color: string, index: number) => {
    if (index <= 0) return;
    setColorImages((prev) => {
      const arr = [...(prev[color] || [])];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return { ...prev, [color]: arr };
    });
  };

  const moveImageRight = (color: string, index: number) => {
    setColorImages((prev) => {
      const arr = [...(prev[color] || [])];
      if (index >= arr.length - 1) return prev;
      [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
      return { ...prev, [color]: arr };
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage("Введите название товара");
      return;
    }

    if (!price.trim()) {
      setMessage("Введите цену товара");
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

    const hasImages = selectedColors.some(
      (color) => (colorImages[color] || []).length > 0
    );

    if (!hasImages) {
      setMessage("Добавьте хотя бы одно фото хотя бы для одного цвета");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");

      const now = new Date().toISOString();
      const finalArticle = article.trim() || makeArticle(name);
      const finalId = createProductId();

      const { error } = await supabase.from("products").insert({
        id: finalId,
        name: name.trim(),
        brand,
        category,
        price: Number(price),
        old_price: Number(oldPrice || price),
        badge: badge === "Без бейджа" ? null : badge,
        status,
        description: description.trim(),
        article: finalArticle,
        sizes: selectedSizes,
        colors: selectedColors,
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

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Не удалось сохранить товар"
      );
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setName("");
    setBrand("Lacoste");
    setCategory("Поло");
    setPrice("");
    setOldPrice("");
    setBadge("Без бейджа");
    setStatus("Активен");
    setDescription("");
    setArticle("");
    setSelectedSizes([]);
    setSelectedColors([]);
    setActiveColor("");
    setColorImages({});
    setMessage("Форма очищена.");
  };

  return (
    <>
      <div className="mb-6">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">Добавить товар</h1>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-[24px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]">
        <section className="space-y-6">
          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <button className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm">
                Сохранить как черновик
              </button>

              <button
                onClick={handleClear}
                className="rounded-2xl bg-red-50 px-5 py-3 text-sm font-medium text-red-600"
              >
                Очистить
              </button>
            </div>

            <h2 className="text-lg font-medium text-black">Основная информация</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-gray-500">Название товара</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Поло Premium"
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">Бренд</label>
                <select
                  value={brand}
                  onChange={(e) =>
                    setBrand(e.target.value as (typeof brandOptions)[number])
                  }
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                >
                  {brandOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">Категория</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
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
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="3500"
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">Старая цена</label>
                <input
                  value={oldPrice}
                  onChange={(e) => setOldPrice(e.target.value)}
                  placeholder="4500"
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">Бейдж</label>
                <select
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  disabled={badgesLoading}
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none disabled:opacity-60"
                >
                  <option value="Без бейджа">Без бейджа</option>
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
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
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
                    value={article}
                    onChange={(e) => setArticle(e.target.value)}
                    placeholder="ART-POLO-PREMIUM"
                    className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={fillArticle}
                    className="shrink-0 rounded-2xl bg-black px-4 text-sm text-white"
                  >
                    Сгенерировать
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-gray-500">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Введите подробное описание товара"
                  rows={5}
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium text-black">Размеры</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {sizeOptions.map((size) => {
                const active = selectedSizes.includes(size);
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
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium text-black">Цвета</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {colorOptions.map((color) => {
                const active = selectedColors.includes(color);
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
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-medium text-black">Фото по цвету</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Выбери цвет и загрузи до 6 фото именно для него.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setActiveColor(color)}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm ${
                      activeColor === color
                        ? "bg-black text-white"
                        : "bg-[#F5F5F5] text-gray-700"
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
                ))}
              </div>
            </div>

            {!activeColor ? (
              <div className="rounded-2xl bg-[#F7F7F7] p-5 text-sm text-gray-500">
                Выбери цвет выше, чтобы загружать фото именно для него.
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-black">Цвет: {activeColor}</p>
                  <span className="text-sm text-gray-500">
                    {activeImages.length}/6 фото
                  </span>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleColorImagesUpload(activeColor, e.target.files)}
                  className="block w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:text-white"
                />

                {isUploadingImages && (
                  <p className="mt-3 text-sm text-gray-500">Загружаем фото...</p>
                )}

                {activeImages.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="overflow-hidden rounded-2xl bg-[#F7F7F7] p-2">
                      <div className="relative">
                        <img
                          src={activeImages[0]}
                          alt={`${activeColor} главное`}
                          className="h-[180px] w-full rounded-xl object-cover"
                        />
                        <span className="absolute left-2 top-2 rounded-full bg-black px-2 py-1 text-[10px] text-white">
                          Главное
                        </span>
                        <button
                          type="button"
                          onClick={() => removeColorImage(activeColor, 0)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm text-black shadow"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {activeImages.length > 1 && (
                      <div className="grid grid-cols-2 gap-2">
                        {activeImages.slice(1).map((img, idx) => {
                          const realIndex = idx + 1;

                          return (
                            <div
                              key={`${activeColor}-${img}-${realIndex}`}
                              className="overflow-hidden rounded-2xl bg-[#F7F7F7] p-2"
                            >
                              <div className="relative">
                                <img
                                  src={img}
                                  alt={`${activeColor} ${realIndex + 1}`}
                                  className="h-[96px] w-full rounded-xl object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeColorImage(activeColor, realIndex)}
                                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-black shadow"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="mt-2 grid grid-cols-3 gap-1">
                                <button
                                  type="button"
                                  onClick={() => makeMainImage(activeColor, realIndex)}
                                  className="rounded-lg bg-black px-2 py-1.5 text-[10px] text-white"
                                >
                                  Главная
                                </button>

                                <button
                                  type="button"
                                  onClick={() => moveImageLeft(activeColor, realIndex)}
                                  className="rounded-lg bg-white px-2 py-1.5 text-[10px] text-black"
                                >
                                  ←
                                </button>

                                <button
                                  type="button"
                                  onClick={() => moveImageRight(activeColor, realIndex)}
                                  className="rounded-lg bg-white px-2 py-1.5 text-[10px] text-black"
                                >
                                  →
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={handleClear}
                className="rounded-2xl bg-red-50 px-5 py-3 text-sm font-medium text-red-600"
              >
                Очистить
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || isUploadingImages || badgesLoading}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {isSaving ? "Сохраняем..." : "Сохранить товар"}
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[24px] bg-white p-4 shadow-sm">
            <h2 className="text-base font-medium text-black">Предпросмотр</h2>

            <div className="mt-3 overflow-hidden rounded-[18px] border border-black/5 bg-[#FAFAFA]">
              <div className="mx-auto aspect-[3/4] max-w-[180px] bg-[#ECECEC]">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Предпросмотр товара"
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              <div className="p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-gray-400">
                  {brand}
                </p>

                <h3 className="mt-2 text-[15px] font-medium text-black">
                  {name || "Название товара"}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {oldPrice && (
                    <span className="text-xs text-gray-400 line-through">
                      {oldPrice} ₽
                    </span>
                  )}

                  <span className="text-[16px] font-semibold text-[#16A34A]">
                    {price || "0"} ₽
                  </span>

                  {discountPercent > 0 && (
                    <span className="rounded-full bg-[#E8F7EE] px-2 py-0.5 text-[10px] text-[#16A34A]">
                      -{discountPercent}%
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {badge !== "Без бейджа" && (
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] ${
                        badge === "Из-за рубежа"
                          ? "bg-black text-white"
                          : "bg-[#F5F5F5] text-gray-700"
                      }`}
                    >
                      {badge}
                    </span>
                  )}

                  <span
                    className={`rounded-full px-2 py-1 text-[10px] ${
                      status === "Активен"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                  <p>Артикул: {article || "ART-NEW"}</p>
                  <p>Размеров: {selectedSizes.length}</p>
                  <p>Цветов: {selectedColors.length}</p>
                  <p>Фото: {totalImagesCount}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}