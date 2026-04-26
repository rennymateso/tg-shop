"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function ProductPageClient({
  initialProduct,
  initialError,
}: {
  initialProduct: Product | null;
  initialError: string;
}) {
  const router = useRouter();

  const [product] = useState<Product | null>(initialProduct);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState(
    initialProduct?.defaultColor || ""
  );
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

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
  const description = product?.description || "";
  const canOrder = selectedSizes.length > 0 && !!selectedColor;
  const discountPercent = product
    ? getDiscountPercent(product.oldPrice, product.price)
    : 0;

  const toggleSize = (value: string) => {
    setSelectedSizes((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const selectColor = (value: string) => {
    setSelectedColor(value);
    setSelectedSizes([]);
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

  const addToCart = () => {
    if (!product || !canOrder) return;

    const existingCart: CartItem[] = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    const newItems: CartItem[] = selectedSizes.map((size) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      size,
      color: selectedColor,
      quantity: 1,
    }));

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

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-[76px] pb-32">
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={toggleFavorite}
          aria-label="В избранное"
          className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl transition-all duration-200 active:scale-[0.99] ${
            favorites.includes(product.id)
              ? "bg-black text-white"
              : "bg-white text-black shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
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
      </div>

      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <div
          className="relative aspect-[3/4] overflow-hidden bg-[#ECECEC]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={activeImage || product.image || "/products/product-1.jpg"}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/products/product-1.jpg";
            }}
          />

          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-black shadow"
                aria-label="Предыдущее фото"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={nextImage}
                className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-black shadow"
                aria-label="Следующее фото"
              >
                ›
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {galleryImages.map((_, index) => (
              <button
                key={`${product.id}-dot-${index}`}
                type="button"
                onClick={() => setActiveImageIndex(index)}
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
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-[11px] uppercase tracking-[0.16em] text-gray-400">
              {product.brand}
            </div>

            <div className="text-[11px] uppercase tracking-[0.16em] text-gray-400">
              {article}
            </div>
          </div>

          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {product.oldPrice && (
                <span className="text-[14px] font-normal leading-none text-gray-400 line-through">
                  {product.oldPrice} ₽
                </span>
              )}

              <span className="text-[21px] font-semibold leading-none tracking-[-0.02em] text-[#16A34A]">
                {product.price} ₽
              </span>

              {discountPercent > 0 && (
                <span className="rounded-full bg-[#E8F7EE] px-1.5 py-0.5 text-[10px] font-medium text-[#16A34A]">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {product.badge ? (
              <div
                className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-medium ${
                  product.badge === "Из-за рубежа"
                    ? "bg-black text-white"
                    : "bg-[#F5F5F5] text-black"
                }`}
              >
                {product.badge}
              </div>
            ) : null}
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm text-gray-500">Размер</p>
            <div className="grid grid-cols-5 gap-1.5">
              {sizes.map((s) => (
                <button
                  key={s.label}
                  onClick={() => toggleSize(s.label)}
                  className={`rounded-xl border px-1.5 py-2 text-center transition-all duration-200 active:scale-95 ${
                    selectedSizes.includes(s.label)
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-black"
                  }`}
                >
                  <div className="text-[11px] font-medium">{s.label}</div>
                  <div
                    className={`mt-0.5 text-[9px] ${
                      selectedSizes.includes(s.label)
                        ? "text-white/70"
                        : "text-gray-400"
                    }`}
                  >
                    {s.sub}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-2 text-[12px] text-gray-400">
              {selectedSizes.length > 0
                ? `Выбрано размеров: ${selectedSizes.join(", ")}`
                : "Можно выбрать несколько размеров"}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm text-gray-500">Цвет</p>
            <div className="grid grid-cols-4 gap-2">
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
                    onClick={() => selectColor(c)}
                    className={`overflow-hidden rounded-2xl border bg-white transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? "border-black ring-2 ring-black/10"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="aspect-[3/4] w-full overflow-hidden bg-[#ECECEC]">
                      <img
                        src={preview}
                        alt={c}
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

            <div className="mt-2 text-[12px] text-gray-400">
              {selectedColor ? `Выбран цвет: ${selectedColor}` : "Выберите цвет"}
            </div>
          </div>

          {product.composition.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm text-gray-500">Состав</p>
              <div className="flex flex-wrap gap-2">
                {product.composition.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-[#F5F5F5] px-3 py-1.5 text-[12px] text-gray-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5">
            <h1 className="text-[24px] font-medium leading-tight text-black">
              {product.name}
            </h1>
          </div>

          <div className="mt-5">
            <p className="text-[14px] leading-6 text-gray-600">
              {description.length > 110 && !showFullDescription
                ? `${description.slice(0, 110)}...`
                : description}
            </p>

            {description.length > 110 && (
              <button
                onClick={() => setShowFullDescription((prev) => !prev)}
                className="mt-2 text-[13px] text-black underline underline-offset-2"
              >
                {showFullDescription ? "Свернуть" : "Читать полностью"}
              </button>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#F7F7F7] px-4 py-3">
            <span className="text-sm text-gray-500">Товаров к добавлению</span>
            <span className="text-[18px] font-semibold tracking-[-0.02em] text-black">
              {selectedSizes.length * (selectedColor ? 1 : 0)}
            </span>
          </div>

          <div className="mt-5">
            <button
              onClick={addToCart}
              disabled={!canOrder}
              className={`w-full rounded-2xl py-3.5 text-sm font-medium transition-all duration-200 ${
                !canOrder
                  ? "bg-gray-200 text-gray-500"
                  : justAdded
                  ? "bg-[#16A34A] text-white"
                  : "bg-black text-white active:scale-[0.99]"
              }`}
            >
              {!canOrder
                ? "Добавить в корзину"
                : justAdded
                ? "Добавлено"
                : "Добавить в корзину"}
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}