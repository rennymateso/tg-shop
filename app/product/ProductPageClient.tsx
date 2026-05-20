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

function formatPrice(value: number | null | undefined) {
  if (!value) return "";
  return value.toLocaleString("ru-RU");
}

function getDefaultSize(product: Product | null) {
  if (!product) return "S";

  if (product.sizes?.includes("S")) return "S";
  if (product.sizes?.length) return product.sizes[0];

  return product.type === "bottom" ? "30" : "S";
}

function getProductionCountry(product: Product) {
  return product.badge?.trim().toLowerCase() === "из-за рубежа"
    ? "Импорт"
    : "Россия";
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

function IconBack() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 18 9 12l6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconHeart({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path
        d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9 9.7 4.6c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCopy({ copied }: { copied: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={copied ? "#16A34A" : "currentColor"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {copied ? (
        <path d="m5 12 4 4L19 6" />
      ) : (
        <>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </>
      )}
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 19 6v5c0 4.6-2.9 8.4-7 10-4.1-1.6-7-5.4-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s ease" }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
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
  const [selectedSize, setSelectedSize] = useState(getDefaultSize(initialProduct));
  const [selectedColor, setSelectedColor] = useState(
    initialProduct?.defaultColor || initialProduct?.colors?.[0] || ""
  );
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const [cartProductCount, setCartProductCount] = useState(0);
  const [articleCopied, setArticleCopied] = useState(false);
  const [openInfoSection, setOpenInfoSection] = useState<"description" | "characteristics" | null>(null);

  const touchStartXRef = useRef<number | null>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (!product) return;

    setSelectedSize(getDefaultSize(product));
    setSelectedColor(product.defaultColor || product.colors?.[0] || "");
    setCartProductCount(getCartProductCount(product.id));
  }, [product]);

  useEffect(() => {
    const syncCartCount = () => {
      if (!product) return;
      setCartProductCount(getCartProductCount(product.id));
    };

    window.addEventListener("cart-updated", syncCartCount);
    window.addEventListener("storage", syncCartCount);

    return () => {
      window.removeEventListener("cart-updated", syncCartCount);
      window.removeEventListener("storage", syncCartCount);
    };
  }, [product]);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
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
  const description = product?.description || "";
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

    if (Math.abs(diff) > 55) {
      if (diff > 0) {
        nextImage();
      } else if (activeImageIndex === 0) {
        router.back();
      } else {
        prevImage();
      }
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

  const copyArticle = async () => {
    if (!article) return;

    try {
      await navigator.clipboard?.writeText(article);
      setArticleCopied(true);

      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setArticleCopied(false), 1300);
    } catch {
      setArticleCopied(false);
    }
  };

  const addToCart = () => {
    if (!product || !selectedSize || !selectedColor) return;

    const existingCart: CartItem[] = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    const existingIndex = existingCart.findIndex(
      (item) =>
        item.id === product.id &&
        item.size === selectedSize &&
        item.color === selectedColor
    );

    if (existingIndex >= 0) {
      existingCart[existingIndex].quantity += 1;
    } else {
      existingCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        size: selectedSize,
        color: selectedColor,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));
    window.dispatchEvent(new Event("cart-updated"));

    setCartProductCount(getCartProductCount(product.id));
    setJustAdded(true);
    setSelectedSize(getDefaultSize(product));

    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);

    addedTimerRef.current = setTimeout(() => {
      setJustAdded(false);
    }, 1400);
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&display=swap');

        .pd-product-page {
          font-family: 'Onest', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }

        .pd-price-row {
          margin-top: 0;
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 5px;
          white-space: nowrap;
          font-family: 'Onest', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }

        .pd-price {
          color: #128243;
          font-size: 17px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.045em;
          font-family: 'Onest', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }

        .pd-old-price {
          color: #999;
          font-size: 11px;
          line-height: 1;
          font-weight: 500;
          text-decoration: line-through;
          font-family: 'Onest', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }

        .pd-discount-inline {
          color: #e13a3a;
          font-size: 11px;
          line-height: 1;
          font-weight: 700;
          font-family: 'Onest', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
      `}</style>

      <main className="pd-product-page min-h-screen bg-[#F5F5F5] px-4 pt-[76px] pb-32">
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
              router.back();
            }}
            aria-label="Назад"
            className="absolute left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow-[0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md"
          >
            <IconBack />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite();
            }}
            aria-label="В избранное"
            className={`absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md ${
              favorites.includes(product.id)
                ? "bg-black text-white"
                : "bg-white/90 text-black"
            }`}
          >
            <IconHeart active={favorites.includes(product.id)} />
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
          <div className="mb-4">
            <div className="pd-price-row">
              {product.oldPrice ? (
                <span className="pd-old-price">{formatPrice(product.oldPrice)} ₽</span>
              ) : null}

              {discountPercent > 0 ? (
                <span className="pd-discount-inline">−{discountPercent}%</span>
              ) : null}

              <span className="pd-price">{formatPrice(product.price)} ₽</span>
            </div>

            <div className="mt-4 h-px w-full bg-[#ECECEC]" />
          </div>

          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[10px] font-normal uppercase tracking-[0.14em] text-gray-400">
                {product.brand}
              </div>

              <h1 className="mt-1 text-[24px] font-medium leading-tight text-black">
                {product.name}
              </h1>
            </div>

            {product.badge ? (
              <div className="mt-[1px] shrink-0 rounded-full bg-[#F3F3F3] px-3 py-1 text-[10px] font-normal text-[#777]">
                {product.badge}
              </div>
            ) : null}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-normal text-gray-500">Размер</p>
              <button
                type="button"
                className="text-[12px] font-normal text-gray-400 underline underline-offset-2"
              >
                таблица размеров
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {sizes.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSelectedSize(s.label)}
                  className={`rounded-xl border px-1.5 py-2 text-center transition-all duration-200 active:scale-95 ${
                    selectedSize === s.label
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-black"
                  }`}
                >
                  <div className="text-[11px] font-normal">{s.label}</div>
                  <div
                    className={`mt-0.5 text-[9px] ${
                      selectedSize === s.label
                        ? "text-white/70"
                        : "text-gray-400"
                    }`}
                  >
                    {s.sub}
                  </div>
                </button>
              ))}
            </div>

          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-normal text-gray-500">Цвет</p>
            <div className="grid grid-cols-5 gap-2">
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
                    className={`overflow-hidden rounded-xl border bg-white transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? "border-black ring-1 ring-black/10"
                        : "border-gray-200"
                    }`}
                    aria-label={`Цвет ${c}`}
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

          <div className="mt-5 overflow-hidden rounded-2xl border border-black/5 bg-white">
            <button
              type="button"
              onClick={() =>
                setOpenInfoSection((prev) =>
                  prev === "description" ? null : "description"
                )
              }
              className="flex w-full items-center justify-between px-4 py-4 text-left"
            >
              <span className="text-[14px] font-normal text-black">Описание</span>
              <span className="text-gray-400">
                <IconChevron open={openInfoSection === "description"} />
              </span>
            </button>

            {openInfoSection === "description" && (
              <div className="border-t border-black/5 px-4 pb-4 pt-3">
                <p className="text-[13px] leading-6 text-[#555]">
                  {description || "Описание товара скоро появится."}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                setOpenInfoSection((prev) =>
                  prev === "characteristics" ? null : "characteristics"
                )
              }
              className="flex w-full items-center justify-between border-t border-black/5 px-4 py-4 text-left"
            >
              <span className="text-[14px] font-normal text-black">
                Характеристики
              </span>
              <span className="text-gray-400">
                <IconChevron open={openInfoSection === "characteristics"} />
              </span>
            </button>

            {openInfoSection === "characteristics" && (
              <div className="border-t border-black/5 px-4 pb-4 pt-2">
                <div className="divide-y divide-black/5">
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <span className="text-[12px] text-[#999]">Артикул</span>
                    <button
                      type="button"
                      onClick={copyArticle}
                      className="flex items-center gap-1 text-right text-[12px] text-[#555]"
                    >
                      {article}
                      <IconCopy copied={articleCopied} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <span className="text-[12px] text-[#999]">
                      Страна-изготовитель
                    </span>
                    <span className="text-right text-[12px] text-[#555]">
                      {getProductionCountry(product)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <span className="text-[12px] text-[#999]">Материал</span>
                    <span className="text-right text-[12px] text-[#555]">
                      {product.composition?.[0] || "Не указан"}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 py-2.5">
                    <span className="text-[12px] text-[#999]">
                      Состав материала
                    </span>
                    <span className="max-w-[190px] text-right text-[12px] leading-5 text-[#555]">
                      {product.composition.length > 0
                        ? product.composition.join(", ")
                        : "Не указан"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <span className="text-[12px] text-[#999]">Тип</span>
                    <span className="text-right text-[12px] text-[#555]">
                      {product.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <span className="text-[12px] text-[#999]">Пол</span>
                    <span className="text-right text-[12px] text-[#555]">
                      Мужской
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5">
            <button
              onClick={addToCart}
              className={`w-full rounded-2xl py-3.5 text-sm font-normal transition-all duration-200 ${
                justAdded
                  ? "bg-[#16A34A] text-white"
                  : "bg-black text-white active:scale-[0.99]"
              }`}
            >
              {justAdded
                ? "Добавлено"
                : cartProductCount > 0
                ? `Добавить в корзину · ${cartProductCount}`
                : "Добавить в корзину"}
            </button>

            <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1">
                <IconShield />
                Ваши данные защищены
              </span>
              <span className="inline-flex items-center gap-1">
                <IconLock />
                Безопасная оплата
              </span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
      </main>
    </>
  );
}
