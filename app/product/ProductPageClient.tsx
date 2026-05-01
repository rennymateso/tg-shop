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

function getDeliveryLabel(badge: string) {
  return badge.trim().toLowerCase() === "из-за рубежа"
    ? "Доставка 7–14 дней"
    : "Доставка 1–2 дня";
}

function getStockLabel(badge: string) {
  return badge.trim().toLowerCase() === "из-за рубежа"
    ? "Из-за рубежа"
    : "В наличии";
}

function TruckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h8v10h-1" />
      <path d="M14 10h3l3 3v4h-1" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function CottonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3c-1.7 0-3 1.3-3 3 0 .4.1.8.2 1.2A4.5 4.5 0 0 0 5 11.5C5 14 7 16 9.5 16H10V9.5" />
      <path d="M12 3c1.7 0 3 1.3 3 3 0 .4-.1.8-.2 1.2A4.5 4.5 0 0 1 19 11.5C19 14 17 16 14.5 16H14V9.5" />
      <path d="M10 16v3" />
      <path d="M14 16v3" />
      <path d="M8 21h8" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 7h12l-1 12H7L6 7Z" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function mapSizeSubLabel(type: Product["type"], size: string) {
  if (type === "bottom") {
    const map: Record<string, string> = {
      "30": "46",
      "31": "46-48",
      "32": "48",
      "33": "48-50",
      "34": "50",
      "36": "52",
      "38": "54",
    };
    return map[size] || "";
  }

  const map: Record<string, string> = {
    S: "46",
    M: "48",
    L: "50",
    XL: "52",
    XXL: "54",
  };
  return map[size] || "";
}

export default function ProductPageClient({
  initialProduct,
  initialError,
}: {
  initialProduct: Product | null;
  initialError: string;
}) {
  const [product] = useState<Product | null>(initialProduct);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState(
    initialProduct?.defaultColor || ""
  );
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const touchStartXRef = useRef<number | null>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(Array.isArray(data) ? data : []);
  }, []);

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

  const discountPercent = product
    ? getDiscountPercent(product.oldPrice, product.price)
    : 0;

  const canOrder = selectedSizes.length > 0 && !!selectedColor;

  const toggleSize = (value: string) => {
    setSelectedSizes((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

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

    if (clickX >= half) nextImage();
    else prevImage();
  };

  const addToCart = () => {
    if (!product || !canOrder) return;

    const existingCart: CartItem[] = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    const newItems: CartItem[] = [];

    selectedSizes.forEach((size) => {
      newItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        size,
        color: selectedColor,
        quantity,
      });
    });

    const updatedCart = [...existingCart];

    newItems.forEach((newItem) => {
      const existingIndex = updatedCart.findIndex(
        (item) =>
          item.id === newItem.id &&
          item.size === newItem.size &&
          item.color === newItem.color
      );

      if (existingIndex >= 0) {
        updatedCart[existingIndex].quantity += newItem.quantity;
      } else {
        updatedCart.push(newItem);
      }
    });

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cart-updated"));

    setJustAdded(true);

    if (addedTimerRef.current) {
      clearTimeout(addedTimerRef.current);
    }

    addedTimerRef.current = setTimeout(() => {
      setJustAdded(false);
    }, 1800);
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

  const currentColorPreviewList = product.colors.map((c) => {
    const preview =
      product.galleryByColor?.[c]?.[0] ||
      product.colorImages?.[c] ||
      product.image ||
      "/products/product-1.jpg";

    return { color: c, preview };
  });

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-[18px] pb-32">
      <div className="overflow-hidden rounded-[34px] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
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
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite();
            }}
            aria-label="В избранное"
            className={`absolute right-4 top-4 flex h-[46px] w-[46px] items-center justify-center rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition ${
              favorites.includes(product.id)
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            <svg
              width="20"
              height="20"
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
                    ? "h-2 w-7 bg-white"
                    : "h-2 w-2 bg-white/45"
                }`}
                aria-label={`Фото ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="-mt-6 rounded-t-[34px] bg-white px-5 pb-5 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#747C8E]">
                {product.brand}
              </p>
              <h1 className="mt-2 text-[22px] font-medium leading-[1.15] text-[#101828]">
                {product.name}
              </h1>
              <p className="mt-2 text-[13px] text-[#98A2B3]">
                ART-{product.id}
              </p>
            </div>

            <div className="shrink-0 pt-1 text-right">
              <div className="inline-flex items-center gap-1 rounded-full bg-[#EAF8EC] px-3 py-1.5 text-[12px] font-medium text-[#3C9A4D]">
                <CheckIcon />
                <span>{getStockLabel(product.badge)}</span>
              </div>

              <div className="mt-3 flex items-center justify-end gap-1.5 text-[13px] text-[#8B93A8]">
                <TruckIcon />
                <span>{getDeliveryLabel(product.badge)}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-[26px] font-semibold leading-none tracking-[-0.03em] text-[#0F172A]">
              {formatPrice(product.price)} ₽
            </span>

            {product.oldPrice ? (
              <span className="text-[15px] text-[#98A2B3] line-through">
                {formatPrice(product.oldPrice)} ₽
              </span>
            ) : null}

            {discountPercent > 0 && (
              <span className="rounded-full bg-[#EDF8EE] px-3 py-1 text-[14px] font-medium text-[#5B9B61]">
                -{discountPercent}%
              </span>
            )}
          </div>

          <div className="mt-5 border-t border-[#ECEFF3]" />

          <div className="mt-5">
            <p className="mb-3 text-[16px] font-medium text-[#101828]">Размер</p>

            <div className="grid grid-cols-5 gap-2">
              {product.sizes.map((size) => {
                const selected = selectedSizes.includes(size);
                const sub = mapSizeSubLabel(product.type, size);

                return (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`rounded-[16px] border px-2 py-3 text-center transition ${
                      selected
                        ? "border-[#18233B] bg-white shadow-[inset_0_0_0_1px_#18233B]"
                        : "border-[#E5E7EB] bg-white"
                    }`}
                  >
                    <div className="text-[15px] font-medium text-[#101828]">
                      {size}
                    </div>
                    <div className="mt-1 text-[12px] text-[#98A2B3]">{sub}</div>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-[13px] text-[#8B93A8]">
              Можно выбрать несколько размеров
            </p>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-[16px] font-medium text-[#101828]">
              Цвет:{" "}
              <span className="font-normal text-[#667085]">{selectedColor}</span>
            </p>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {currentColorPreviewList.map(({ color, preview }) => {
                const selected = selectedColor === color;

                return (
                  <button
                    key={color}
                    onClick={() => selectColor(color)}
                    className={`shrink-0 overflow-hidden rounded-[16px] border transition ${
                      selected
                        ? "border-[#18233B] shadow-[inset_0_0_0_1px_#18233B]"
                        : "border-[#E5E7EB]"
                    }`}
                  >
                    <div className="h-[78px] w-[78px] overflow-hidden bg-[#ECECEC]">
                      <img
                        src={preview}
                        alt={color}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/products/product-1.jpg";
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#ECEFF3] pt-5">
            <div>
              <p className="mb-3 text-[16px] font-medium text-[#101828]">Состав</p>
              <div className="flex items-start gap-3 text-[#667085]">
                <div className="mt-0.5 text-[#8B93A8]">
                  <CottonIcon />
                </div>
                <div className="text-[15px] leading-6">
                  {product.composition.length > 0
                    ? product.composition.join(", ")
                    : "Состав не указан"}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-[16px] font-medium text-[#101828]">
                Описание
              </p>
              <div className="text-[15px] leading-6 text-[#667085]">
                {product.description || "Описание отсутствует"}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[#ECEFF3] pt-5">
            <div className="flex items-end gap-4">
              <div className="shrink-0">
                <p className="mb-3 text-[16px] font-medium text-[#101828]">
                  Количество
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white text-[22px] text-[#667085]"
                  >
                    −
                  </button>

                  <span className="min-w-[18px] text-center text-[20px] font-medium text-[#101828]">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white text-[22px] text-[#667085]"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={addToCart}
                disabled={!canOrder}
                className={`flex h-[64px] flex-1 items-center justify-center gap-3 rounded-[18px] px-5 text-[18px] font-medium text-white transition ${
                  !canOrder
                    ? "bg-[#BFC6D4]"
                    : justAdded
                    ? "bg-[#16A34A]"
                    : "bg-[linear-gradient(135deg,#08205A_0%,#001848_100%)] shadow-[0_16px_36px_rgba(0,24,72,0.28)]"
                }`}
              >
                <span>{justAdded ? "Добавлено" : "Добавить в корзину"}</span>
                <BagIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}