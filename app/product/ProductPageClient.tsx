"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import BottomNav from "../components/BottomNav";

export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  badge: string;
  image: string;
  images: string[];
  colorImages?: Record<string, string>;
  galleryByColor?: Record<string, string[]>;
  defaultColor: string;
  type: "top" | "bottom";
  category: "Футболки" | "Поло" | "Джинсы" | "Брюки" | "Костюмы";
  colors: string[];
  sizes: string[];
  composition: string[];
  description: string;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

function getDiscountPercent(oldPrice: number | null, price: number) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function formatPrice(value: number | null | undefined) {
  if (!value) return "";
  return value.toLocaleString("ru-RU");
}

function getCartProductCount(productId: string) {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]") as CartItem[];
    if (!Array.isArray(cart)) return 0;

    return cart
      .filter((item) => item.id === productId)
      .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  } catch {
    return 0;
  }
}

function ShieldIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 19 6v5c0 4.6-2.9 8.4-7 10-4.1-1.6-7-5.4-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

type SizeTableRow = {
  size: string;
  ru: string;
  width: string;
  length: string;
};

function getSizeTableRows(product: Product | null): SizeTableRow[] {
  const category = product?.category?.toLowerCase() || "";
  const isBottom = product?.type === "bottom" || category.includes("джинс") || category.includes("брюк") || category.includes("юбк");

  if (isBottom) {
    return [
      { size: "30", ru: "46", width: "76 см", length: "81 см" },
      { size: "31", ru: "46–48", width: "79 см", length: "81 см" },
      { size: "32", ru: "48", width: "81 см", length: "81 см" },
      { size: "33", ru: "48–50", width: "84 см", length: "81 см" },
      { size: "34", ru: "50", width: "86 см", length: "86 см" },
      { size: "36", ru: "52", width: "91 см", length: "86 см" },
      { size: "38", ru: "54", width: "97 см", length: "86 см" },
    ];
  }

  const isWomen = category.includes("плать") || category.includes("юбк") || category.includes("жен");

  if (isWomen) {
    return [
      { size: "S", ru: "42–44", width: "37 см", length: "57 см" },
      { size: "M", ru: "46–48", width: "39 см", length: "58 см" },
      { size: "L", ru: "48–50", width: "42 см", length: "60 см" },
      { size: "XL", ru: "50–52", width: "44 см", length: "61 см" },
      { size: "XXL", ru: "52–54", width: "46 см", length: "62 см" },
    ];
  }

  if (category.includes("поло")) {
    return [
      { size: "S", ru: "44–46", width: "50 см", length: "70 см" },
      { size: "M", ru: "46–48", width: "52 см", length: "72 см" },
      { size: "L", ru: "48–50", width: "54 см", length: "74 см" },
      { size: "XL", ru: "50–52", width: "56 см", length: "76 см" },
      { size: "XXL", ru: "52–54", width: "58 см", length: "78 см" },
    ];
  }

  return [
    { size: "S", ru: "44–46", width: "49 см", length: "70 см" },
    { size: "M", ru: "46–48", width: "52 см", length: "72 см" },
    { size: "L", ru: "48–50", width: "55 см", length: "74 см" },
    { size: "XL", ru: "50–52", width: "58 см", length: "76 см" },
    { size: "XXL", ru: "52–54", width: "61 см", length: "78 см" },
  ];
}

export default function ProductPageClient({
  initialProduct,
  initialError,
}: {
  initialProduct: Product | null;
  initialError: string;
}) {
  const [product] = useState<Product | null>(initialProduct);

  const getInitialSize = () => {
    if (!initialProduct) return "S";
    if (initialProduct.sizes?.includes("S")) return "S";
    return initialProduct.sizes?.[0] || "S";
  };

  const [selectedSize, setSelectedSize] = useState<string>(getInitialSize);
  const [selectedColor, setSelectedColor] = useState(
    initialProduct?.defaultColor || initialProduct?.colors?.[0] || ""
  );
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const [cartProductCount, setCartProductCount] = useState(0);
  const [showSizeTable, setShowSizeTable] = useState(false);
  const [articleCopied, setArticleCopied] = useState(false);

  const touchStartXRef = useRef<number | null>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (!product) return;

    const syncCount = () => {
      setCartProductCount(getCartProductCount(product.id));
    };

    syncCount();

    window.addEventListener("cart-updated", syncCount);
    window.addEventListener("storage", syncCount);
    window.addEventListener("focus", syncCount);

    return () => {
      window.removeEventListener("cart-updated", syncCount);
      window.removeEventListener("storage", syncCount);
      window.removeEventListener("focus", syncCount);
    };
  }, [product]);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) {
        clearTimeout(addedTimerRef.current);
      }
    };
  }, []);

  const galleryImages = useMemo(() => {
    if (!product) return [];

    const colorGallery = product.galleryByColor?.[selectedColor] || [];

    if (colorGallery.length > 0) return colorGallery;

    const colorImage = selectedColor ? product.colorImages?.[selectedColor] : "";

    if (colorImage) return [colorImage];

    return product.images?.length ? product.images : [product.image];
  }, [product, selectedColor]);

  const activeImage = galleryImages[activeImageIndex] || product?.image || "";

  const toggleFavorite = () => {
    if (!product) return;

    const updated = favorites.includes(product.id)
      ? favorites.filter((i) => i !== product.id)
      : [...favorites, product.id];

    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
    window.dispatchEvent(new Event("favorites-updated"));
  };

  const topSizes = [
    { label: "S", sub: "46" },
    { label: "M", sub: "48" },
    { label: "L", sub: "50" },
    { label: "XL", sub: "52" },
    { label: "XXL", sub: "54" },
  ];

  const bottomSizes = [
    { label: "30", sub: "46" },
    { label: "31", sub: "46-48" },
    { label: "32", sub: "48" },
    { label: "33", sub: "48-50" },
    { label: "34", sub: "50" },
    { label: "36", sub: "52" },
    { label: "38", sub: "54" },
  ];

  const sizes = product?.type === "bottom" ? bottomSizes : topSizes;
  const article = product ? `ART-${product.id}` : "";
  const sizeTableRows = getSizeTableRows(product);
  const description = product?.description || "";
  const canOrder = !!selectedSize && !!selectedColor;
  const discountPercent = product
    ? getDiscountPercent(product.oldPrice, product.price)
    : 0;

  const selectColor = (value: string) => {
    setSelectedColor(value);
    setActiveImageIndex(0);
    setJustAdded(false);
  };

  const nextImage = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) =>
      prev >= galleryImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) =>
      prev <= 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? null;
    if (endX === null) return;

    const diff = touchStartXRef.current - endX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) nextImage();
      else prevImage();
    }

    touchStartXRef.current = null;
  };

  const handleImageTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (galleryImages.length <= 1) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const half = rect.width / 2;

    if (clickX >= half) {
      nextImage();
    } else {
      prevImage();
    }
  };

  const copyArticle = async () => {
    if (!article) return;

    try {
      await navigator.clipboard.writeText(article);
      setArticleCopied(true);
      window.setTimeout(() => setArticleCopied(false), 1400);
    } catch {
      setArticleCopied(false);
    }
  };

  const addToCart = () => {
    if (!product || !canOrder) return;

    const existingCart: CartItem[] = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    const updatedCart = [...existingCart];

    const existingIndex = updatedCart.findIndex(
      (item) =>
        item.id === product.id &&
        item.size === selectedSize &&
        item.color === selectedColor
    );

    if (existingIndex >= 0) {
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        size: selectedSize,
        color: selectedColor,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cart-updated"));

    setCartProductCount(getCartProductCount(product.id));
    setJustAdded(true);

    if (addedTimerRef.current) {
      clearTimeout(addedTimerRef.current);
    }

    addedTimerRef.current = setTimeout(() => {
      setJustAdded(false);
    }, 1500);
  };

  if (!product) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] px-4 pt-[76px] pb-32">
        <div className="mb-5 flex items-center justify-center">
          <h1 className="text-[20px] font-medium">Товар</h1>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-sm text-gray-500">Товар не найден</p>
          {initialError && (
            <p className="mt-2 break-words text-xs text-gray-400">
              {initialError}
            </p>
          )}
        </div>

        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-[76px] pb-32">
      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <div
          className="relative aspect-[3/4] overflow-hidden bg-[#ECECEC]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={handleImageTap}
        >
          <img
            src={activeImage || product.image || "/products/product-1.jpg"}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/products/product-1.jpg";
            }}
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite();
            }}
            aria-label="В избранное"
            className={`absolute right-3 top-3 z-20 flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-[0.98] ${
              favorites.includes(product.id)
                ? "bg-black text-white"
                : "bg-white/90 text-black shadow-[0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={favorites.includes(product.id) ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {galleryImages.map((_, index) => (
              <button
                key={`${product.id}-dot-${index}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex(index);
                }}
                className={`block rounded-full ${
                  index === activeImageIndex
                    ? "h-1.5 w-4 bg-white"
                    : "h-1.5 w-1.5 bg-white/45"
                }`}
                aria-label={`Фото ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="mb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-[11px] uppercase tracking-[0.16em] text-gray-400">
                {product.brand}
              </div>

              <button
                type="button"
                onClick={copyArticle}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F5F5F5] px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-gray-400 active:scale-[0.98]"
                aria-label="Скопировать артикул"
              >
                <span>{articleCopied ? "Скопировано" : article}</span>
                <CopyIcon />
              </button>
            </div>

            <h1 className="mt-2 text-[24px] font-medium leading-tight text-black">
              {product.name}
            </h1>
          </div>

          <div className="mb-3 mt-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {product.oldPrice && (
                <span className="text-[14px] font-normal leading-none text-gray-400 line-through">
                  {formatPrice(product.oldPrice)} ₽
                </span>
              )}

              <span className="text-[22px] font-semibold leading-none tracking-[-0.02em] text-[#2B2824]">
                {formatPrice(product.price)} ₽
              </span>

              {discountPercent > 0 && (
                <span className="rounded-full bg-[#F5F5F5] px-1.5 py-0.5 text-[10px] font-medium text-[#D92D20]">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {product.badge ? (
              <div className="shrink-0 rounded-full bg-[#F2F2F2] px-3 py-1 text-[10px] font-medium text-[#666]">
                {product.badge}
              </div>
            ) : null}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-end justify-between gap-3">
              <p className="text-sm text-gray-500">Размер</p>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {sizes.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setSelectedSize(s.label)}
                  className={`rounded-xl border px-1.5 py-2 text-center transition-all duration-200 active:scale-95 ${
                    selectedSize === s.label
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-black"
                  }`}
                >
                  <div className="text-[11px] font-medium">{s.label}</div>
                  <div
                    className={`mt-0.5 text-[9px] ${
                      selectedSize === s.label ? "text-white/70" : "text-gray-400"
                    }`}
                  >
                    {s.sub}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 text-[12px]">
              <span className="text-gray-400">Выбран размер: {selectedSize}</span>

              <button
                type="button"
                onClick={() => setShowSizeTable(true)}
                className="text-[11px] text-gray-400 underline underline-offset-2"
              >
                таблица размеров
              </button>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm text-gray-500">Цвет</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.colors.map((c) => {
                const preview =
                  product.galleryByColor?.[c]?.[0] ||
                  product.colorImages?.[c] ||
                  product.image ||
                  "/products/product-1.jpg";

                const isSelected = selectedColor === c;

                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => selectColor(c)}
                    className={`h-[58px] w-[46px] shrink-0 overflow-hidden rounded-xl border bg-white transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? "border-[#2B2824] ring-1 ring-black/10"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={preview}
                      alt={c}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/products/product-1.jpg";
                      }}
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-2 text-[12px] text-gray-400">
              {selectedColor ? `Выбран цвет: ${selectedColor}` : "Выберите цвет"}
            </div>
          </div>

          {product.composition.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-black">Состав и уход</p>
                <span className="text-[11px] text-gray-400">детали изделия</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[18px] bg-[#F7F7F7] p-3">
                  <div className="text-[11px] text-gray-400">Основной состав</div>
                  <div className="mt-2 text-[15px] font-medium text-[#2B2824]">
                    {product.composition.join(", ")}
                  </div>
                  <div className="mt-2 text-[11px] leading-4 text-gray-400">
                    Материал приятный к телу и подходит для ежедневной носки.
                  </div>
                </div>

                <div className="rounded-[18px] bg-[#F7F7F7] p-3">
                  <div className="text-[11px] text-gray-400">Уход</div>
                  <div className="mt-2 text-[13px] leading-5 text-[#2B2824]">
                    Деликатная стирка до 30°C
                  </div>
                  <div className="mt-1 text-[13px] leading-5 text-[#2B2824]">
                    Не отбеливать
                  </div>
                  <div className="mt-1 text-[13px] leading-5 text-[#2B2824]">
                    Сушить естественно
                  </div>
                </div>
              </div>

              <div className="mt-2 rounded-[18px] bg-[#F7F7F7] px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-gray-400">Категория</span>
                  <span className="text-[13px] text-[#2B2824]">{product.category}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5">
            <p className="text-[14px] leading-6 text-gray-600">
              {description.length > 110 && !showFullDescription
                ? `${description.slice(0, 110)}...`
                : description}
            </p>

            {description.length > 110 && (
              <button
                type="button"
                onClick={() => setShowFullDescription((prev) => !prev)}
                className="mt-2 text-[13px] text-black underline underline-offset-2"
              >
                {showFullDescription ? "Свернуть" : "Читать полностью"}
              </button>
            )}
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={addToCart}
              disabled={!canOrder}
              className={`relative w-full rounded-2xl py-3.5 text-sm font-medium transition-all duration-200 ${
                justAdded
                  ? "bg-[#16A34A] text-white"
                  : "bg-black text-white active:scale-[0.99]"
              }`}
            >
              <span>
                {justAdded ? "Добавлено" : "Добавить в корзину"}
              </span>

              {cartProductCount > 0 && (
                <span className="absolute right-4 top-1/2 flex h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white px-2 text-[12px] font-semibold text-black">
                  {cartProductCount}
                </span>
              )}
            </button>

            <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1">
                <ShieldIcon />
                Ваши данные защищены
              </span>

              <span className="inline-flex items-center gap-1">
                <LockIcon />
                Безопасная оплата
              </span>
            </div>
          </div>
        </div>
      </div>

      {showSizeTable && (
        <div className="fixed inset-0 z-[120] flex items-end bg-black/35 px-3 pb-3">
          <div className="w-full rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[16px] font-medium text-black">Таблица размеров</p>
              <button
                type="button"
                onClick={() => setShowSizeTable(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F5] text-[18px] text-black"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <div className="grid grid-cols-4 bg-[#F7F7F7] px-3 py-2 text-[11px] text-gray-400">
                <span>Размер</span>
                <span>RU</span>
                <span>Ширина</span>
                <span>Длина</span>
              </div>

              {sizeTableRows.map((row) => (
                <div
                  key={`table-${row.size}`}
                  className="grid grid-cols-4 border-t border-gray-100 px-3 py-2 text-[12px] text-gray-700"
                >
                  <span>{row.size}</span>
                  <span>{row.ru}</span>
                  <span>{row.width}</span>
                  <span>{row.length}</span>
                </div>
              ))}
            </div>

            <p className="mt-3 text-[11px] leading-4 text-gray-400">
              Замеры ориентировочные: ширина — по груди/талии, длина — по спинке или внутреннему шву.
            </p>

            <button
              type="button"
              onClick={() => setShowSizeTable(false)}
              className="mt-4 w-full rounded-2xl bg-black py-3 text-sm font-medium text-white"
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
