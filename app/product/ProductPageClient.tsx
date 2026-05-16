"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent, type TouchEvent } from "react";
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
  defaultColor?: string;
  type?: "top" | "bottom";
  category: string;
  colors: string[];
  sizes: string[];
  composition?: string[];
  description?: string;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

const colorSwatches: Record<string, string> = {
  Черный: "#111111",
  Белый: "#F5F5F5",
  Серый: "#A7A7A7",
  Синий: "#243B63",
  Бежевый: "#D8CBB8",
  Зеленый: "#68745D",
  Коричневый: "#7A5230",
  Красный: "#B23A3A",
  Розовый: "#EBC4C8",
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
  { label: "31", sub: "46–48" },
  { label: "32", sub: "48" },
  { label: "33", sub: "48–50" },
  { label: "34", sub: "50" },
  { label: "36", sub: "52" },
  { label: "38", sub: "54" },
];

function getDefaultSize(product: Product | null) {
  if (!product) return "S";
  if (product.type === "bottom") return "30";
  return "S";
}

function getDiscountPercent(oldPrice: number | null, price: number) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function formatPrice(value: number | null | undefined) {
  if (!value) return "";
  return value.toLocaleString("ru-RU");
}

function readCart(): CartItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem("cart") || "[]") as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(cart: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

function getProductCount(cart: CartItem[], productId: string) {
  return cart
    .filter((item) => item.id === productId)
    .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

function IconBack() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18 9 12l6-6" />
    </svg>
  );
}

function IconHeart({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9 9.7 4.6c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5Z" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
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
  const [selectedColor, setSelectedColor] = useState(initialProduct?.defaultColor || initialProduct?.colors?.[0] || "");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [cartProductCount, setCartProductCount] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const touchStartXRef = useRef<number | null>(null);

  const sizes = product?.type === "bottom" ? bottomSizes : topSizes;
  const article = product ? `ART-${product.id}` : "";
  const discountPercent = product ? getDiscountPercent(product.oldPrice, product.price) : 0;
  const defaultSize = getDefaultSize(product);

  const galleryImages = useMemo(() => {
    if (!product) return [];

    const colorGallery = selectedColor ? product.galleryByColor?.[selectedColor] || [] : [];
    if (colorGallery.length > 0) return colorGallery;

    const colorImage = selectedColor ? product.colorImages?.[selectedColor] : "";
    if (colorImage) return [colorImage];

    return product.images?.length ? product.images : [product.image];
  }, [product, selectedColor]);

  const activeImage = galleryImages[activeImageIndex] || product?.image || "/products/product-1.jpg";

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    const syncCartCount = () => {
      if (!product) return;
      setCartProductCount(getProductCount(readCart(), product.id));
    };

    syncCartCount();

    window.addEventListener("cart-updated", syncCartCount);
    window.addEventListener("storage", syncCartCount);

    return () => {
      window.removeEventListener("cart-updated", syncCartCount);
      window.removeEventListener("storage", syncCartCount);
    };
  }, [product]);

  const getColorPreview = (color: string) => {
    if (!product) return "/products/product-1.jpg";

    const gallery = product.galleryByColor?.[color] || [];
    const colorImage = product.colorImages?.[color];

    return gallery[0] || colorImage || product.image || "/products/product-1.jpg";
  };

  const toggleFavorite = () => {
    if (!product) return;

    const updated = favorites.includes(product.id)
      ? favorites.filter((i) => i !== product.id)
      : [...favorites, product.id];

    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
    window.dispatchEvent(new Event("favorites-updated"));
  };

  const selectColor = (value: string) => {
    setSelectedColor(value);
    setActiveImageIndex(0);
  };

  const nextImage = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev >= galleryImages.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev <= 0 ? galleryImages.length - 1 : prev - 1));
  };

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
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

  const handleImageTap = (e: MouseEvent<HTMLDivElement>) => {
    if (galleryImages.length <= 1) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    if (clickX >= rect.width / 2) nextImage();
    else prevImage();
  };

  const handleShare = async () => {
    if (!product) return;

    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = product.name;

    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
      } else if (navigator.clipboard && url) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // пользователь мог закрыть системное окно шаринга
    }
  };

  const addCurrentSelectionToCart = () => {
    if (!product || !selectedColor || !selectedSize) return 0;

    const cart = readCart();
    const existingIndex = cart.findIndex(
      (item) =>
        item.id === product.id &&
        item.size === selectedSize &&
        item.color === selectedColor
    );

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        size: selectedSize,
        color: selectedColor,
        quantity: 1,
      });
    }

    writeCart(cart);

    const newCount = getProductCount(cart, product.id);
    setCartProductCount(newCount);

    setSelectedSize(defaultSize);
    return newCount;
  };

  const decreaseProductCount = () => {
    if (!product) return;

    const cart = readCart();
    const index = cart.findIndex((item) => item.id === product.id);

    if (index < 0) return;

    cart[index].quantity -= 1;

    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }

    writeCart(cart);
    setCartProductCount(getProductCount(cart, product.id));
  };

  const buyNow = () => {
    addCurrentSelectionToCart();
    router.push("/cart");
  };

  if (!product) {
    return (
      <>
        <style>{`
          .pp-empty-page {
            min-height: 100vh;
            background: #f5f5f5;
            padding: calc(env(safe-area-inset-top, 0px) + 96px) 16px 32px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          .pp-empty-card {
            border-radius: 24px;
            background: #fff;
            padding: 24px;
            box-shadow: 0 12px 34px rgba(0,0,0,.06);
          }
        `}</style>

        <main className="pp-empty-page">
          <div className="pp-empty-card">
            <p style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>Товар не найден</p>
            {initialError && (
              <p style={{ marginTop: 8, wordBreak: "break-word", fontSize: 12, color: "#999" }}>
                {initialError}
              </p>
            )}
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                marginTop: 18,
                height: 42,
                padding: "0 16px",
                border: 0,
                borderRadius: 14,
                background: "#111",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Назад
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{`
        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        body {
          overflow-x: hidden;
          background: #f5f5f5;
        }

        button {
          font: inherit;
        }

        .pp-page {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          overflow-x: hidden;
          background: #f5f5f5;
          color: #111;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif;
          padding-bottom: calc(190px + env(safe-area-inset-bottom, 0px));
        }

        .pp-shell {
          width: min(100%, 520px);
          margin: 0 auto;
          position: relative;
        }

        .pp-hero {
          position: relative;
          margin-top: calc(env(safe-area-inset-top, 0px) + 92px);
          height: min(53vh, 520px);
          min-height: 390px;
          overflow: hidden;
          background: #ededed;
          border-radius: 0 0 24px 24px;
        }

        .pp-hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          user-select: none;
        }

        .pp-topbar {
          position: fixed;
          left: 50%;
          top: calc(env(safe-area-inset-top, 0px) + 52px);
          z-index: 70;
          width: min(calc(100vw - 24px), 496px);
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: none;
        }

        .pp-top-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: auto;
        }

        .pp-icon-btn {
          width: 42px;
          height: 42px;
          border: 0;
          border-radius: 999px;
          background: rgba(255,255,255,.88);
          color: #111;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 22px rgba(0,0,0,.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          cursor: pointer;
        }

        .pp-icon-btn.active {
          background: #111;
          color: #fff;
        }

        .pp-dots {
          position: absolute;
          left: 50%;
          bottom: 13px;
          z-index: 12;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 4px 6px;
          border-radius: 999px;
          background: rgba(0,0,0,.10);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .pp-dot {
          width: 4px;
          height: 4px;
          border: 0;
          padding: 0;
          border-radius: 999px;
          background: rgba(255,255,255,.38);
          cursor: pointer;
        }

        .pp-dot.active {
          width: 12px;
          background: rgba(255,255,255,.68);
        }

        .pp-card {
          position: relative;
          z-index: 12;
          margin-top: -20px;
          border-radius: 28px 28px 0 0;
          background: #fff;
          padding: 24px 16px 28px;
          box-shadow: 0 -10px 34px rgba(0,0,0,.06);
        }

        .pp-brand-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .pp-brand {
          min-width: 0;
          color: #8f8f8f;
          font-size: 11px;
          line-height: 1;
          font-weight: 400;
          letter-spacing: .16em;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pp-article {
          flex: 0 0 auto;
          color: #aaa;
          font-size: 10.5px;
          line-height: 1;
          font-weight: 400;
          letter-spacing: .08em;
          white-space: nowrap;
        }

        .pp-title-row {
          margin-top: 10px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: start;
        }

        .pp-title {
          color: #111;
          font-size: 27px;
          line-height: 1.05;
          font-weight: 650;
          letter-spacing: -0.055em;
          margin: 0;
        }

        .pp-foreign {
          margin-top: 3px;
          padding: 8px 11px;
          border-radius: 999px;
          background: #f2f2f2;
          color: #5f5f5f;
          font-size: 12px;
          line-height: 1;
          font-weight: 500;
          white-space: nowrap;
        }

        .pp-price-row {
          margin-top: 14px;
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 8px;
          white-space: nowrap;
        }

        .pp-old-price {
          color: #9b9b9b;
          font-size: 15px;
          line-height: 1;
          font-weight: 500;
          text-decoration: line-through;
        }

        .pp-discount {
          color: #e13a3a;
          font-size: 15px;
          line-height: 1;
          font-weight: 650;
        }

        .pp-price {
          color: #128243;
          font-size: 30px;
          line-height: 1;
          font-weight: 720;
          letter-spacing: -.055em;
        }

        .pp-section {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid rgba(0,0,0,.08);
        }

        .pp-section:first-of-type {
          margin-top: 20px;
        }

        .pp-section-title {
          color: #111;
          font-size: 15px;
          line-height: 1;
          font-weight: 600;
        }

        .pp-section-muted {
          color: #999;
          font-weight: 450;
        }

        .pp-sizes {
          margin-top: 13px;
          display: grid;
          grid-template-columns: repeat(5, minmax(0,1fr));
          gap: 8px;
        }

        .pp-size {
          min-height: 52px;
          border: 1px solid rgba(0,0,0,.10);
          border-radius: 12px;
          background: #fff;
          color: #111;
          cursor: pointer;
        }

        .pp-size.active {
          background: #111;
          border-color: #111;
          color: #fff;
        }

        .pp-size-label {
          font-size: 14px;
          line-height: 1;
          font-weight: 650;
        }

        .pp-size-sub {
          margin-top: 3px;
          color: currentColor;
          opacity: .48;
          font-size: 10px;
          line-height: 1;
          font-weight: 500;
        }

        .pp-color-images {
          margin-top: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }

        .pp-color-images::-webkit-scrollbar {
          display: none;
        }

        .pp-color-img {
          flex: 0 0 auto;
          width: 62px;
          height: 78px;
          border: 1px solid rgba(0,0,0,.10);
          border-radius: 13px;
          background: #f2f2f2;
          padding: 0;
          overflow: hidden;
          cursor: pointer;
        }

        .pp-color-img.active {
          border: 2px solid #111;
        }

        .pp-color-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .pp-description {
          color: #555;
          font-size: 14px;
          line-height: 1.55;
          font-weight: 400;
          margin: 0;
        }

        .pp-more {
          margin-top: 9px;
          border: 0;
          background: transparent;
          color: #111;
          padding: 0;
          font-size: 13px;
          line-height: 1;
          font-weight: 600;
          cursor: pointer;
        }

        .pp-composition {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .pp-composition span {
          border-radius: 999px;
          background: #f5f5f5;
          color: #555;
          padding: 8px 11px;
          font-size: 12px;
          line-height: 1;
          font-weight: 500;
        }

        .pp-buybar {
          position: fixed;
          left: 50%;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 92px);
          z-index: 80;
          width: min(calc(100vw - 28px), 492px);
          transform: translateX(-50%);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .pp-action-btn {
          height: 56px;
          border: 0;
          border-radius: 16px;
          color: #fff;
          font-size: 14px;
          line-height: 1;
          font-weight: 650;
          cursor: pointer;
          box-shadow: 0 12px 30px rgba(0,0,0,.14);
        }

        .pp-cart-btn {
          background: #111;
        }

        .pp-buy-btn {
          background: #128243;
        }

        .pp-counter {
          height: 56px;
          border-radius: 16px;
          background: #111;
          color: #fff;
          display: grid;
          grid-template-columns: 44px 1fr 44px;
          align-items: center;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(0,0,0,.14);
        }

        .pp-counter button {
          height: 100%;
          border: 0;
          background: transparent;
          color: #fff;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
        }

        .pp-counter span {
          text-align: center;
          font-size: 13px;
          line-height: 1;
          font-weight: 650;
          white-space: nowrap;
        }

        @media (max-width: 370px) {
          .pp-hero {
            margin-top: calc(env(safe-area-inset-top, 0px) + 88px);
            min-height: 360px;
          }

          .pp-topbar {
            top: calc(env(safe-area-inset-top, 0px) + 48px);
            width: min(calc(100vw - 20px), 496px);
          }

          .pp-icon-btn {
            width: 40px;
            height: 40px;
          }

          .pp-title {
            font-size: 24px;
          }

          .pp-price {
            font-size: 27px;
          }

          .pp-sizes {
            gap: 6px;
          }

          .pp-color-img {
            width: 56px;
            height: 72px;
          }

          .pp-buybar {
            width: min(calc(100vw - 20px), 492px);
            gap: 8px;
          }

          .pp-action-btn,
          .pp-counter {
            height: 54px;
            border-radius: 15px;
          }
        }
      `}</style>

      <main className="pp-page">
        <div className="pp-shell">
          <div className="pp-topbar">
            <button
              type="button"
              className="pp-icon-btn"
              onClick={() => router.back()}
              aria-label="Назад"
            >
              <IconBack />
            </button>

            <div className="pp-top-actions">
              <button
                type="button"
                onClick={toggleFavorite}
                aria-label="В избранное"
                className={`pp-icon-btn${favorites.includes(product.id) ? " active" : ""}`}
              >
                <IconHeart active={favorites.includes(product.id)} />
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="pp-icon-btn"
                aria-label="Поделиться"
              >
                <IconShare />
              </button>
            </div>
          </div>

          <section
            className="pp-hero"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={handleImageTap}
            aria-label="Галерея товара"
          >
            <img
              src={activeImage}
              alt={product.name}
              className="pp-hero-img"
              onError={(e) => {
                e.currentTarget.src = "/products/product-1.jpg";
              }}
            />

            {galleryImages.length > 1 && (
              <div className="pp-dots" aria-hidden="true">
                {galleryImages.map((_, index) => (
                  <button
                    key={`${product.id}-dot-${index}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(index);
                    }}
                    className={`pp-dot${index === activeImageIndex ? " active" : ""}`}
                    aria-label={`Фото ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="pp-card">
            <div className="pp-brand-row">
              <div className="pp-brand">{product.brand}</div>
              <div className="pp-article">{article}</div>
            </div>

            <div className="pp-title-row">
              <h1 className="pp-title">{product.name}</h1>
              <div className="pp-foreign">из-за рубежа</div>
            </div>

            <div className="pp-price-row">
              {product.oldPrice ? (
                <span className="pp-old-price">{formatPrice(product.oldPrice)} ₽</span>
              ) : null}
              {discountPercent > 0 ? (
                <span className="pp-discount">−{discountPercent}%</span>
              ) : null}
              <span className="pp-price">{formatPrice(product.price)} ₽</span>
            </div>

            <div className="pp-section">
              <div className="pp-section-title">
                Размер: <span className="pp-section-muted">{selectedSize}</span>
              </div>

              <div className="pp-sizes">
                {sizes.map((s) => (
                  <button
                    type="button"
                    key={s.label}
                    onClick={() => setSelectedSize(s.label)}
                    className={`pp-size${selectedSize === s.label ? " active" : ""}`}
                  >
                    <div className="pp-size-label">{s.label}</div>
                    <div className="pp-size-sub">{s.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pp-section">
              <div className="pp-section-title">
                Цвет: <span className="pp-section-muted">{selectedColor || "Выберите"}</span>
              </div>

              <div className="pp-color-images">
                {product.colors.map((color) => {
                  const preview = getColorPreview(color);

                  return (
                    <button
                      type="button"
                      key={color}
                      className={`pp-color-img${selectedColor === color ? " active" : ""}`}
                      onClick={() => selectColor(color)}
                      aria-label={`Цвет ${color}`}
                      title={color}
                    >
                      <img
                        src={preview}
                        alt={color}
                        onError={(e) => {
                          e.currentTarget.src = "/products/product-1.jpg";
                          e.currentTarget.style.backgroundColor = colorSwatches[color] || "#ddd";
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {product.composition && product.composition.length > 0 && (
              <div className="pp-section">
                <div className="pp-section-title" style={{ marginBottom: 12 }}>Состав</div>
                <div className="pp-composition">
                  {product.composition.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            )}

            {product.description ? (
              <div className="pp-section">
                <div className="pp-section-title" style={{ marginBottom: 10 }}>Описание</div>
                <p className="pp-description">
                  {product.description.length > 130 && !showFullDescription
                    ? `${product.description.slice(0, 130)}...`
                    : product.description}
                </p>

                {product.description.length > 130 && (
                  <button
                    type="button"
                    onClick={() => setShowFullDescription((prev) => !prev)}
                    className="pp-more"
                  >
                    {showFullDescription ? "Свернуть" : "Читать полностью"}
                  </button>
                )}
              </div>
            ) : null}
          </section>
        </div>

        <div className="pp-buybar">
          {cartProductCount > 0 ? (
            <div className="pp-counter" aria-label="Количество в корзине">
              <button type="button" onClick={decreaseProductCount} aria-label="Уменьшить количество">
                −
              </button>
              <span>{cartProductCount} в корзине</span>
              <button type="button" onClick={addCurrentSelectionToCart} aria-label="Увеличить количество">
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={addCurrentSelectionToCart}
              className="pp-action-btn pp-cart-btn"
            >
              Добавить в корзину
            </button>
          )}

          <button
            type="button"
            onClick={buyNow}
            className="pp-action-btn pp-buy-btn"
          >
            Купить сейчас
          </button>
        </div>

        <BottomNav />
      </main>
    </>
  );
}
