"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

function getDiscountPercent(oldPrice: number | null, price: number) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function formatPrice(value: number | null | undefined) {
  if (!value) return "";
  return value.toLocaleString("ru-RU");
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

function IconBag() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.3 8.2h11.4l.8 10.8a1.6 1.6 0 0 1-1.6 1.7H7.1A1.6 1.6 0 0 1 5.5 19l.8-10.8Z" />
      <path d="M9.2 8.2V7a2.8 2.8 0 0 1 5.6 0v1.2" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h3l4 4v2h-7" />
      <circle cx="7" cy="18" r="1.5" />
      <circle cx="17" cy="18" r="1.5" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 19 6v5c0 4.6-2.9 8.4-7 10-4.1-1.6-7-5.4-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconRotate() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 1-15.5 6.2" />
      <path d="M3 12A9 9 0 0 1 18.5 5.8" />
      <path d="M18 2v4h4" />
      <path d="M6 22v-4H2" />
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
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState(initialProduct?.defaultColor || "");
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
  const discountPercent = product ? getDiscountPercent(product.oldPrice, product.price) : 0;
  const isForeign = product?.badge?.trim().toLowerCase() === "из-за рубежа";

  const toggleFavorite = () => {
    if (!product) return;

    const updated = favorites.includes(product.id)
      ? favorites.filter((i) => i !== product.id)
      : [...favorites, product.id];

    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
    window.dispatchEvent(new Event("favorites-updated"));
  };

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
    const half = rect.width / 2;

    if (clickX >= half) nextImage();
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
      // Пользователь мог закрыть системное окно шаринга.
    }
  };

  const addToCart = () => {
    if (!product || !canOrder) return;

    const existingCart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");

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
      <>
        <style>{`
          .mp-page {
            min-height: 100vh;
            min-height: 100dvh;
            background: #f5f5f5;
            padding: calc(env(safe-area-inset-top, 0px) + 74px) 16px 32px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .mp-empty {
            border-radius: 24px;
            background: #fff;
            padding: 24px;
            box-shadow: 0 12px 34px rgba(0,0,0,.06);
          }
        `}</style>

        <main className="mp-page">
          <div className="mp-empty">
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

        button, input {
          font: inherit;
        }

        .mp-page {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          overflow-x: hidden;
          background: #f5f5f5;
          color: #111;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif;
          padding-bottom: calc(104px + env(safe-area-inset-bottom, 0px));
        }

        .mp-shell {
          width: min(100%, 520px);
          margin: 0 auto;
          position: relative;
        }

        .mp-hero {
          position: relative;
          min-height: 56vh;
          height: min(62vh, 620px);
          background: #ededed;
          overflow: hidden;
        }

        .mp-hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          user-select: none;
        }

        .mp-topbar {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          z-index: 20;
          padding: calc(env(safe-area-inset-top, 0px) + 58px) 16px 0;
          display: grid;
          grid-template-columns: 46px 1fr auto;
          align-items: center;
          gap: 10px;
          pointer-events: none;
        }

        .mp-icon-btn {
          width: 44px;
          height: 44px;
          border: 0;
          border-radius: 999px;
          background: rgba(255,255,255,.86);
          color: #111;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 22px rgba(0,0,0,.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          pointer-events: auto;
          cursor: pointer;
        }

        .mp-icon-btn.active {
          background: #111;
          color: #fff;
        }

        .mp-logo {
          text-align: center;
          color: rgba(17,17,17,.86);
          font-size: 16px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: .36em;
          transform: translateX(.18em);
          text-shadow: 0 1px 12px rgba(255,255,255,.55);
        }

        .mp-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: auto;
        }

        .mp-dots {
          position: absolute;
          left: 50%;
          bottom: 18px;
          z-index: 12;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 5px 7px;
          border-radius: 999px;
          background: rgba(0,0,0,.08);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .mp-dot {
          width: 5px;
          height: 5px;
          border: 0;
          padding: 0;
          border-radius: 999px;
          background: rgba(255,255,255,.48);
          cursor: pointer;
        }

        .mp-dot.active {
          width: 15px;
          background: rgba(255,255,255,.92);
        }

        .mp-thumbs {
          position: relative;
          z-index: 16;
          display: flex;
          gap: 9px;
          overflow-x: auto;
          padding: 0 16px;
          margin-top: -86px;
          scrollbar-width: none;
        }

        .mp-thumbs::-webkit-scrollbar {
          display: none;
        }

        .mp-thumb {
          flex: 0 0 auto;
          width: 68px;
          height: 86px;
          padding: 0;
          border: 2px solid rgba(255,255,255,.88);
          border-radius: 12px;
          background: #eee;
          overflow: hidden;
          box-shadow: 0 8px 22px rgba(0,0,0,.10);
          cursor: pointer;
        }

        .mp-thumb.active {
          border-color: #111;
        }

        .mp-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .mp-card {
          position: relative;
          z-index: 15;
          margin: 14px 0 0;
          border-radius: 28px 28px 0 0;
          background: #fff;
          padding: 22px 16px 26px;
          box-shadow: 0 -10px 34px rgba(0,0,0,.07);
        }

        .mp-title-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: start;
        }

        .mp-brand {
          margin-bottom: 6px;
          color: #8d8d8d;
          font-size: 11px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .mp-title {
          color: #111;
          font-size: 25px;
          line-height: 1.05;
          font-weight: 650;
          letter-spacing: -.05em;
        }

        .mp-stock {
          margin-top: 28px;
          color: #35a853;
          font-size: 13px;
          line-height: 1;
          font-weight: 500;
          white-space: nowrap;
        }

        .mp-stock::before {
          content: "";
          display: inline-block;
          width: 7px;
          height: 7px;
          margin-right: 6px;
          border-radius: 999px;
          background: #66b84d;
          vertical-align: 1px;
        }

        .mp-price-row {
          margin-top: 11px;
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 7px;
        }

        .mp-old-price {
          color: #9b9b9b;
          font-size: 14px;
          line-height: 1;
          font-weight: 500;
          text-decoration: line-through;
        }

        .mp-discount {
          color: #e13a3a;
          font-size: 13px;
          line-height: 1;
          font-weight: 650;
        }

        .mp-price {
          color: #111;
          font-size: 25px;
          line-height: 1;
          font-weight: 700;
          letter-spacing: -.045em;
        }

        .mp-meta {
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .mp-article {
          color: #aaa;
          font-size: 11px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: .08em;
        }

        .mp-foreign {
          padding: 6px 9px;
          border-radius: 999px;
          background: #f3f3f3;
          color: #555;
          font-size: 11px;
          line-height: 1;
          font-weight: 500;
          white-space: nowrap;
        }

        .mp-benefits {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .mp-benefit {
          min-height: 66px;
          border-radius: 18px;
          background: #f7f7f7;
          color: #111;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-align: center;
        }

        .mp-benefit svg {
          color: #111;
        }

        .mp-benefit-title {
          color: #111;
          font-size: 10.5px;
          line-height: 1.12;
          font-weight: 600;
        }

        .mp-benefit-sub {
          margin-top: 1px;
          color: #777;
          font-size: 9.5px;
          line-height: 1.05;
          font-weight: 500;
        }

        .mp-section {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid rgba(0,0,0,.08);
        }

        .mp-section-title {
          color: #111;
          font-size: 14px;
          line-height: 1;
          font-weight: 600;
        }

        .mp-section-muted {
          color: #999;
          font-weight: 450;
        }

        .mp-colors {
          margin-top: 13px;
          display: flex;
          align-items: center;
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }

        .mp-colors::-webkit-scrollbar {
          display: none;
        }

        .mp-color {
          flex: 0 0 auto;
          width: 36px;
          height: 36px;
          border: 1px solid rgba(0,0,0,.10);
          border-radius: 999px;
          background: transparent;
          padding: 3px;
          cursor: pointer;
        }

        .mp-color.active {
          border-color: #111;
        }

        .mp-color-inner {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,.08);
        }

        .mp-sizes {
          margin-top: 13px;
          display: grid;
          grid-template-columns: repeat(5, minmax(0,1fr));
          gap: 8px;
        }

        .mp-size {
          min-height: 52px;
          border: 1px solid rgba(0,0,0,.10);
          border-radius: 12px;
          background: #fff;
          color: #111;
          cursor: pointer;
        }

        .mp-size.active {
          background: #111;
          border-color: #111;
          color: #fff;
        }

        .mp-size-label {
          font-size: 14px;
          line-height: 1;
          font-weight: 650;
        }

        .mp-size-sub {
          margin-top: 3px;
          color: currentColor;
          opacity: .48;
          font-size: 10px;
          line-height: 1;
          font-weight: 500;
        }

        .mp-description {
          color: #555;
          font-size: 14px;
          line-height: 1.55;
          font-weight: 400;
        }

        .mp-more {
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

        .mp-composition {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .mp-composition span {
          border-radius: 999px;
          background: #f5f5f5;
          color: #555;
          padding: 8px 11px;
          font-size: 12px;
          line-height: 1;
          font-weight: 500;
        }

        .mp-buybar {
          position: fixed;
          left: 50%;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
          z-index: 80;
          width: min(calc(100vw - 28px), 492px);
          transform: translateX(-50%);
          display: grid;
          grid-template-columns: minmax(0,1fr) 56px;
          gap: 10px;
        }

        .mp-buy {
          height: 56px;
          border: 0;
          border-radius: 16px;
          background: #111;
          color: #fff;
          font-size: 15px;
          line-height: 1;
          font-weight: 650;
          cursor: pointer;
          box-shadow: 0 12px 30px rgba(0,0,0,.18);
        }

        .mp-buy:disabled {
          background: #dcdcdc;
          color: #858585;
          box-shadow: none;
          cursor: not-allowed;
        }

        .mp-buy.added {
          background: #168b43;
          color: #fff;
        }

        .mp-cart-short {
          height: 56px;
          border: 0;
          border-radius: 16px;
          background: #111;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 30px rgba(0,0,0,.18);
          cursor: pointer;
        }

        .mp-cart-short:disabled {
          background: #dcdcdc;
          color: #858585;
          box-shadow: none;
          cursor: not-allowed;
        }

        @media (max-width: 370px) {
          .mp-topbar {
            padding-left: 12px;
            padding-right: 12px;
            grid-template-columns: 42px 1fr auto;
          }

          .mp-icon-btn {
            width: 40px;
            height: 40px;
          }

          .mp-logo {
            font-size: 14px;
            letter-spacing: .30em;
          }

          .mp-hero {
            height: min(60vh, 560px);
          }

          .mp-thumb {
            width: 60px;
            height: 78px;
          }

          .mp-title {
            font-size: 23px;
          }

          .mp-price {
            font-size: 23px;
          }

          .mp-benefits {
            gap: 6px;
          }

          .mp-benefit {
            padding-left: 5px;
            padding-right: 5px;
          }

          .mp-sizes {
            gap: 6px;
          }
        }
      `}</style>

      <main className="mp-page">
        <div className="mp-shell">
          <section
            className="mp-hero"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={handleImageTap}
            aria-label="Галерея товара"
          >
            <img
              src={activeImage || product.image || "/products/product-1.jpg"}
              alt={product.name}
              className="mp-hero-img"
              onError={(e) => {
                e.currentTarget.src = "/products/product-1.jpg";
              }}
            />

            <div className="mp-topbar">
              <button type="button" className="mp-icon-btn" onClick={(e) => { e.stopPropagation(); router.back(); }} aria-label="Назад">
                <IconBack />
              </button>

              <div className="mp-logo">MONTREAUX</div>

              <div className="mp-actions">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite();
                  }}
                  aria-label="В избранное"
                  className={`mp-icon-btn${favorites.includes(product.id) ? " active" : ""}`}
                >
                  <IconHeart active={favorites.includes(product.id)} />
                </button>

                <button type="button" onClick={(e) => { e.stopPropagation(); handleShare(); }} className="mp-icon-btn" aria-label="Поделиться">
                  <IconShare />
                </button>
              </div>
            </div>

            {galleryImages.length > 1 && (
              <div className="mp-dots" aria-hidden="true">
                {galleryImages.map((_, index) => (
                  <button
                    key={`${product.id}-dot-${index}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(index);
                    }}
                    className={`mp-dot${index === activeImageIndex ? " active" : ""}`}
                    aria-label={`Фото ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </section>

          {galleryImages.length > 1 && (
            <div className="mp-thumbs" aria-label="Миниатюры товара">
              {galleryImages.map((img, index) => (
                <button
                  type="button"
                  key={`${product.id}-thumb-${index}`}
                  className={`mp-thumb${index === activeImageIndex ? " active" : ""}`}
                  onClick={() => setActiveImageIndex(index)}
                  aria-label={`Открыть фото ${index + 1}`}
                >
                  <img
                    src={img || product.image || "/products/product-1.jpg"}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.src = "/products/product-1.jpg";
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          <section className="mp-card">
            <div className="mp-title-row">
              <div>
                <div className="mp-brand">{product.brand}</div>
                <h1 className="mp-title">{product.name}</h1>
              </div>

              <div className="mp-stock">В наличии</div>
            </div>

            <div className="mp-price-row">
              {product.oldPrice ? (
                <span className="mp-old-price">{formatPrice(product.oldPrice)} ₽</span>
              ) : null}
              {discountPercent > 0 ? (
                <span className="mp-discount">−{discountPercent}%</span>
              ) : null}
              <span className="mp-price">{formatPrice(product.price)} ₽</span>
            </div>

            <div className="mp-meta">
              <span className="mp-article">{article}</span>
              {isForeign ? <span className="mp-foreign">из-за рубежа</span> : null}
            </div>

            <div className="mp-benefits">
              <div className="mp-benefit">
                <IconTruck />
                <div>
                  <div className="mp-benefit-title">Доставка</div>
                  <div className="mp-benefit-sub">7–14 дней</div>
                </div>
              </div>

              <div className="mp-benefit">
                <IconRotate />
                <div>
                  <div className="mp-benefit-title">Возврат</div>
                  <div className="mp-benefit-sub">до 14 дней</div>
                </div>
              </div>

              <div className="mp-benefit">
                <IconShield />
                <div>
                  <div className="mp-benefit-title">Проверка</div>
                  <div className="mp-benefit-sub">качества</div>
                </div>
              </div>
            </div>

            <div className="mp-section">
              <div className="mp-section-title">
                Цвет: <span className="mp-section-muted">{selectedColor || "Выберите"}</span>
              </div>

              <div className="mp-colors">
                {product.colors.map((color) => {
                  const isSelected = selectedColor === color;

                  return (
                    <button
                      type="button"
                      key={color}
                      className={`mp-color${isSelected ? " active" : ""}`}
                      onClick={() => selectColor(color)}
                      aria-label={`Цвет ${color}`}
                    >
                      <span
                        className="mp-color-inner"
                        style={{ backgroundColor: colorSwatches[color] || "#d4d4d4" }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mp-section">
              <div className="mp-section-title">
                Размер:{" "}
                <span className="mp-section-muted">
                  {selectedSizes.length > 0 ? selectedSizes.join(", ") : "Выберите"}
                </span>
              </div>

              <div className="mp-sizes">
                {sizes.map((s) => (
                  <button
                    type="button"
                    key={s.label}
                    onClick={() => toggleSize(s.label)}
                    className={`mp-size${selectedSizes.includes(s.label) ? " active" : ""}`}
                  >
                    <div className="mp-size-label">{s.label}</div>
                    <div className="mp-size-sub">{s.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {product.composition.length > 0 && (
              <div className="mp-section">
                <div className="mp-section-title" style={{ marginBottom: 12 }}>Состав</div>
                <div className="mp-composition">
                  {product.composition.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            )}

            {description ? (
              <div className="mp-section">
                <div className="mp-section-title" style={{ marginBottom: 10 }}>Описание</div>
                <p className="mp-description">
                  {description.length > 130 && !showFullDescription
                    ? `${description.slice(0, 130)}...`
                    : description}
                </p>

                {description.length > 130 && (
                  <button
                    type="button"
                    onClick={() => setShowFullDescription((prev) => !prev)}
                    className="mp-more"
                  >
                    {showFullDescription ? "Свернуть" : "Читать полностью"}
                  </button>
                )}
              </div>
            ) : null}
          </section>
        </div>

        <div className="mp-buybar">
          <button
            type="button"
            onClick={addToCart}
            disabled={!canOrder}
            className={`mp-buy${justAdded ? " added" : ""}`}
          >
            {!canOrder ? "Выберите размер" : justAdded ? "Добавлено" : "Добавить в корзину"}
          </button>

          <button
            type="button"
            onClick={addToCart}
            disabled={!canOrder}
            className="mp-cart-short"
            aria-label="Добавить в корзину"
          >
            <IconBag />
          </button>
        </div>
      </main>
    </>
  );
}
