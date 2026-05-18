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

function getDefaultSize(product: Product | null) {
  if (!product) return "S";
  return product.type === "bottom" ? "30" : "S";
}

function IconBack() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18 9 12l6-6" />
    </svg>
  );
}

function IconHeart({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9 9.7 4.6c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5Z" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 19 6v5c0 4.6-2.9 8.4-7 10-4.1-1.6-7-5.4-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
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
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [cartProductCount, setCartProductCount] = useState(0);

  const touchStartXRef = useRef<number | null>(null);

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
  const discountPercent = product ? getDiscountPercent(product.oldPrice, product.price) : 0;
  const defaultSize = getDefaultSize(product);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const colorGallery = product.galleryByColor?.[selectedColor] || [];
    if (colorGallery.length > 0) return colorGallery;
    const colorImage = product.colorImages?.[selectedColor];
    if (colorImage) return [colorImage];
    return product.images?.length ? product.images : [product.image];
  }, [product, selectedColor]);

  const activeImage = galleryImages[activeImageIndex] || product?.image || "";

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

  const getColorPreview = (color: string) => {
    if (!product) return "/products/product-1.jpg";
    return (
      product.galleryByColor?.[color]?.[0] ||
      product.colorImages?.[color] ||
      product.image ||
      "/products/product-1.jpg"
    );
  };

  const nextImage = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev >= galleryImages.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev <= 0 ? galleryImages.length - 1 : prev - 1));
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
      // пользователь мог закрыть шаринг
    }
  };

  const addCurrentSelectionToCart = () => {
    if (!product || !selectedSize || !selectedColor) return 0;

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
          .pd-page {
            min-height: 844px;
            background: #f5f5f5;
            padding: 124px 16px 120px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .pd-empty {
            border-radius: 22px;
            background: #fff;
            padding: 22px;
            color: #111;
          }
        `}</style>

        <main className="pd-page">
          <div className="pd-empty">
            <p style={{ fontSize: 16, fontWeight: 500 }}>Товар не найден</p>
            {initialError && (
              <p style={{ marginTop: 8, fontSize: 12, color: "#999", wordBreak: "break-word" }}>
                {initialError}
              </p>
            )}
          </div>
          <BottomNav />
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

        .pd-page {
          width: 100%;
          min-height: 844px;
          overflow-x: hidden;
          background: #f5f5f5;
          color: #111;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif;
          padding-bottom: 228px;
        }

        .pd-shell {
          width: min(100%, 390px);
          margin: 0 auto;
        }

        .pd-topbar {
          position: fixed;
          left: 50%;
          top: 72px;
          z-index: 70;
          width: min(358px, calc(100vw - 32px));
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: none;
        }

        .pd-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: auto;
        }

        .pd-icon-btn {
          width: 40px;
          height: 40px;
          border: 0;
          border-radius: 999px;
          background: rgba(255,255,255,.92);
          color: #111;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0,0,0,.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          cursor: pointer;
        }

        .pd-icon-btn.active {
          background: #111;
          color: #fff;
        }

        .pd-hero {
          position: relative;
          margin-top: 124px;
          height: 374px;
          overflow: hidden;
          background: #ececec;
          border-radius: 0 0 22px 22px;
        }

        .pd-hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          user-select: none;
        }

        .pd-dots {
          position: absolute;
          left: 50%;
          bottom: 12px;
          z-index: 12;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 4px 6px;
          border-radius: 999px;
          background: rgba(0,0,0,.07);
        }

        .pd-dot {
          width: 4px;
          height: 4px;
          border: 0;
          padding: 0;
          border-radius: 999px;
          background: rgba(255,255,255,.38);
          cursor: pointer;
        }

        .pd-dot.active {
          width: 12px;
          background: rgba(255,255,255,.65);
        }

        .pd-card {
          margin-top: -12px;
          border-radius: 24px 24px 0 0;
          background: #fff;
          padding: 20px 16px 26px;
          box-shadow: 0 -8px 24px rgba(0,0,0,.05);
        }

        .pd-brand-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .pd-brand {
          min-width: 0;
          color: #8f8f8f;
          font-size: 11px;
          line-height: 1;
          font-weight: 400;
          letter-spacing: .14em;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pd-article {
          flex: 0 0 auto;
          color: #aaa;
          font-size: 10.5px;
          line-height: 1;
          font-weight: 400;
          letter-spacing: .06em;
          white-space: nowrap;
        }

        .pd-title-row {
          margin-top: 10px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: start;
        }

        .pd-title {
          margin: 0;
          color: #111;
          font-size: 24px;
          line-height: 1.08;
          font-weight: 500;
          letter-spacing: -0.05em;
        }

        .pd-foreign {
          margin-top: 2px;
          padding: 7px 10px;
          border-radius: 999px;
          background: #f2f2f2;
          color: #666;
          font-size: 11px;
          line-height: 1;
          font-weight: 400;
          white-space: nowrap;
        }

        .pd-price-row {
          margin-top: 13px;
          display: flex;
          align-items: baseline;
          gap: 8px;
          white-space: nowrap;
        }

        .pd-old-price {
          color: #9b9b9b;
          font-size: 14px;
          line-height: 1;
          font-weight: 400;
          text-decoration: line-through;
        }

        .pd-discount {
          color: #e13a3a;
          font-size: 14px;
          line-height: 1;
          font-weight: 500;
        }

        .pd-price {
          color: #12B76A;
          font-size: 27px;
          line-height: 1;
          font-weight: 600;
          letter-spacing: -0.052em;
        }

        .pd-section {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(0,0,0,.075);
        }

        .pd-section-title {
          color: #111;
          font-size: 14px;
          line-height: 1;
          font-weight: 500;
        }

        .pd-muted {
          color: #999;
          font-weight: 400;
        }

        .pd-sizes {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(5, minmax(0,1fr));
          gap: 7px;
        }

        .pd-size {
          min-height: 48px;
          border: 1px solid rgba(0,0,0,.1);
          border-radius: 12px;
          background: #fff;
          color: #111;
          cursor: pointer;
        }

        .pd-size.active {
          background: #111;
          border-color: #111;
          color: #fff;
        }

        .pd-size-label {
          font-size: 14px;
          line-height: 1;
          font-weight: 500;
        }

        .pd-size-sub {
          margin-top: 3px;
          color: currentColor;
          opacity: .5;
          font-size: 9.5px;
          line-height: 1;
          font-weight: 400;
        }

        .pd-colors {
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 9px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }

        .pd-colors::-webkit-scrollbar {
          display: none;
        }

        .pd-color {
          flex: 0 0 auto;
          width: 54px;
          height: 68px;
          border: 1px solid rgba(0,0,0,.10);
          border-radius: 13px;
          background: #f2f2f2;
          padding: 0;
          overflow: hidden;
          cursor: pointer;
        }

        .pd-color.active {
          border: 2px solid #111;
        }

        .pd-color img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .pd-composition {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .pd-composition span {
          border-radius: 999px;
          background: #f5f5f5;
          color: #555;
          padding: 8px 11px;
          font-size: 12px;
          line-height: 1;
          font-weight: 400;
        }

        .pd-description {
          margin: 0;
          color: #555;
          font-size: 14px;
          line-height: 1.55;
          font-weight: 400;
        }

        .pd-more {
          margin-top: 9px;
          border: 0;
          background: transparent;
          color: #111;
          padding: 0;
          font-size: 13px;
          line-height: 1;
          font-weight: 500;
          cursor: pointer;
        }

        .pd-buybar {
          position: fixed;
          left: 50%;
          bottom: 104px;
          z-index: 80;
          width: min(362px, calc(100vw - 28px));
          transform: translateX(-50%);
          padding-top: 10px;
          background: linear-gradient(180deg, rgba(245,245,245,0), rgba(245,245,245,.96) 32%, rgba(245,245,245,.96));
        }

        .pd-buyrow {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .pd-action {
          height: 52px;
          border: 0;
          border-radius: 15px;
          color: #fff;
          font-size: 13.5px;
          line-height: 1;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(0,0,0,.10);
        }

        .pd-buy {
          background: #12B76A;
        }

        .pd-cart {
          background: #111;
        }

        .pd-counter {
          height: 52px;
          border-radius: 15px;
          background: #111;
          color: #fff;
          display: grid;
          grid-template-columns: 40px 1fr 40px;
          align-items: center;
          overflow: hidden;
          box-shadow: 0 10px 24px rgba(0,0,0,.10);
        }

        .pd-counter button {
          height: 100%;
          border: 0;
          background: transparent;
          color: #fff;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }

        .pd-counter span {
          text-align: center;
          font-size: 12.5px;
          line-height: 1;
          font-weight: 500;
          white-space: nowrap;
        }

        .pd-security {
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #8b8b8b;
          font-size: 10.5px;
          line-height: 1;
          font-weight: 400;
          white-space: nowrap;
        }

        .pd-security span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        @media (max-width: 370px) {
          .pd-shell {
            width: min(100%, 370px);
          }

          .pd-topbar {
            top: 68px;
            width: min(342px, calc(100vw - 28px));
          }

          .pd-hero {
            margin-top: 118px;
            height: 344px;
          }

          .pd-title {
            font-size: 22px;
          }

          .pd-price {
            font-size: 25px;
          }

          .pd-sizes {
            gap: 6px;
          }

          .pd-color {
            width: 50px;
            height: 64px;
          }

          .pd-buybar {
            width: min(348px, calc(100vw - 22px));
          }

          .pd-security {
            gap: 7px;
            font-size: 9.8px;
          }
        }
      `}</style>

      <main className="pd-page">
        <div className="pd-shell">
          <div className="pd-topbar">
            <button
              type="button"
              className="pd-icon-btn"
              onClick={() => router.back()}
              aria-label="Назад"
            >
              <IconBack />
            </button>

            <div className="pd-actions">
              <button
                type="button"
                onClick={toggleFavorite}
                aria-label="В избранное"
                className={`pd-icon-btn${favorites.includes(product.id) ? " active" : ""}`}
              >
                <IconHeart active={favorites.includes(product.id)} />
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="pd-icon-btn"
                aria-label="Поделиться"
              >
                <IconShare />
              </button>
            </div>
          </div>

          <section
            className="pd-hero"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={handleImageTap}
            aria-label="Галерея товара"
          >
            <img
              src={activeImage || product.image || "/products/product-1.jpg"}
              alt={product.name}
              className="pd-hero-img"
              onError={(e) => {
                e.currentTarget.src = "/products/product-1.jpg";
              }}
            />

            {galleryImages.length > 1 && (
              <div className="pd-dots" aria-hidden="true">
                {galleryImages.map((_, index) => (
                  <button
                    key={`${product.id}-dot-${index}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(index);
                    }}
                    className={`pd-dot${index === activeImageIndex ? " active" : ""}`}
                    aria-label={`Фото ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="pd-card">
            <div className="pd-brand-row">
              <div className="pd-brand">{product.brand}</div>
              <div className="pd-article">{article}</div>
            </div>

            <div className="pd-title-row">
              <h1 className="pd-title">{product.name}</h1>
              <div className="pd-foreign">из-за рубежа</div>
            </div>

            <div className="pd-price-row">
              {product.oldPrice ? (
                <span className="pd-old-price">{formatPrice(product.oldPrice)} ₽</span>
              ) : null}
              {discountPercent > 0 ? (
                <span className="pd-discount">−{discountPercent}%</span>
              ) : null}
              <span className="pd-price">{formatPrice(product.price)} ₽</span>
            </div>

            <div className="pd-section">
              <div className="pd-section-title">
                Размер: <span className="pd-muted">{selectedSize}</span>
              </div>

              <div className="pd-sizes">
                {sizes.map((s) => (
                  <button
                    type="button"
                    key={s.label}
                    onClick={() => setSelectedSize(s.label)}
                    className={`pd-size${selectedSize === s.label ? " active" : ""}`}
                  >
                    <div className="pd-size-label">{s.label}</div>
                    <div className="pd-size-sub">{s.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pd-section">
              <div className="pd-section-title">
                Цвет: <span className="pd-muted">{selectedColor || "Выберите"}</span>
              </div>

              <div className="pd-colors">
                {product.colors.map((color) => {
                  const preview = getColorPreview(color);

                  return (
                    <button
                      type="button"
                      key={color}
                      className={`pd-color${selectedColor === color ? " active" : ""}`}
                      onClick={() => selectColor(color)}
                      aria-label={`Цвет ${color}`}
                      title={color}
                    >
                      <img
                        src={preview}
                        alt={color}
                        onError={(e) => {
                          e.currentTarget.src = "/products/product-1.jpg";
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {product.composition.length > 0 && (
              <div className="pd-section">
                <div className="pd-section-title" style={{ marginBottom: 12 }}>Состав</div>
                <div className="pd-composition">
                  {product.composition.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            )}

            {description ? (
              <div className="pd-section">
                <div className="pd-section-title" style={{ marginBottom: 10 }}>Описание</div>
                <p className="pd-description">
                  {description.length > 130 && !showFullDescription
                    ? `${description.slice(0, 130)}...`
                    : description}
                </p>

                {description.length > 130 && (
                  <button
                    type="button"
                    onClick={() => setShowFullDescription((prev) => !prev)}
                    className="pd-more"
                  >
                    {showFullDescription ? "Свернуть" : "Читать полностью"}
                  </button>
                )}
              </div>
            ) : null}
          </section>
        </div>

        <div className="pd-buybar">
          <div className="pd-buyrow">
            <button type="button" onClick={buyNow} className="pd-action pd-buy">
              Купить сейчас
            </button>

            {cartProductCount > 0 ? (
              <div className="pd-counter" aria-label="Количество в корзине">
                <button type="button" onClick={decreaseProductCount} aria-label="Уменьшить количество">
                  −
                </button>
                <span>{cartProductCount} в корзине</span>
                <button type="button" onClick={addCurrentSelectionToCart} aria-label="Увеличить количество">
                  +
                </button>
              </div>
            ) : (
              <button type="button" onClick={addCurrentSelectionToCart} className="pd-action pd-cart">
                Добавить
              </button>
            )}
          </div>

          <div className="pd-security" aria-label="Информация о безопасности">
            <span>
              <IconShield />
              Ваши данные защищены
            </span>
            <span>
              <IconLock />
              Безопасная оплата
            </span>
          </div>
        </div>

        <BottomNav />
      </main>
    </>
  );
}
