"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import BottomNav from "./components/BottomNav";
import AppSplash from "./components/AppSplash";
import { getTelegramWebApp } from "./lib/telegram-mini-app";

const departments = ["Мужчинам", "Женщинам"] as const;
const mensCategories = ["Все", "Футболки", "Поло", "Джинсы", "Брюки", "Костюмы"] as const;
const womensCategories = ["Все", "Платья", "Футболки", "Рубашки", "Брюки", "Юбки"] as const;
const sortOptions = ["По популярности", "Сначала дешевле", "Сначала дороже", "Скидки", "Новинки"] as const;
const banners = [{ image: "/banner.jpg", alt: "Весна Лето 2026", link: "/" }] as const;
const availabilityOptions = ["Все товары", "В наличии", "Из-за рубежа"] as const;

type Department = (typeof departments)[number];
type MensCategory = (typeof mensCategories)[number];
type WomensCategory = (typeof womensCategories)[number];
type SortOption = (typeof sortOptions)[number];
type BrandRow = { id: string; name: string; created_at: string };
type BadgeRow = { id: string; name: string; created_at: string };

export type HomeProduct = {
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
  description?: string;
};

const colorSwatches: Record<string, string> = {
  Черный: "#111111",
  Белый: "#F7F5EF",
  Серый: "#9E9E9E",
  Синий: "#2563EB",
  Бежевый: "#C8B49A",
  Зеленый: "#4A7A3D",
  Коричневый: "#7A5230",
};

const categoryHints: Record<string, string> = {
  Все: "Весь каталог",
  Футболки: "База на каждый день",
  Поло: "Smart casual",
  Джинсы: "Denim selection",
  Брюки: "Классика и casual",
  Костюмы: "Деловой стиль",
  Платья: "Женственные образы",
  Рубашки: "Офис и casual",
  Юбки: "Лёгкие силуэты",
};

function getDiscountPercent(oldPrice: number | null, price: number) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function formatPrice(value: number | null | undefined) {
  if (!value) return "";
  return value.toLocaleString("ru-RU");
}

function getExtraColorsCount(colors: string[]) {
  return Math.max((colors || []).length - 3, 0);
}

// ── UI icons ───────────────────────────────────────────────────────────────
function IconSearch() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L17 17" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M7 12h10" />
      <path d="M10 17h4" />
    </svg>
  );
}

function IconHeart({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "#111111" : "none"} stroke="#111111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h8v10h-1" />
      <path d="M14 10h3l3 3v4h-1" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// ── Category clothing icons. Unified stroke SVG set, no broken assets. ─────
function CategoryIcon({ name }: { name: string }) {
  const p = { width: 28, height: 28, viewBox: "0 0 32 32", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (name === "Все") {
    return (
      <svg {...p}>
        <rect x="6" y="6" width="8" height="8" rx="2" />
        <rect x="18" y="6" width="8" height="8" rx="2" />
        <rect x="6" y="18" width="8" height="8" rx="2" />
        <rect x="18" y="18" width="8" height="8" rx="2" />
      </svg>
    );
  }

  if (name === "Футболки") {
    return (
      <svg {...p}>
        <path d="M11 6h3a2 2 0 0 0 4 0h3l5 4-3 5-2-1.3V26H11V13.7L9 15l-3-5 5-4Z" />
        <path d="M14 7.5c.7.8 1.3 1.1 2 1.1s1.3-.3 2-1.1" />
      </svg>
    );
  }

  if (name === "Поло" || name === "Рубашки") {
    return (
      <svg {...p}>
        <path d="M10 6h12l3 4v16H7V10l3-4Z" />
        <path d="M11 6l5 5 5-5" />
        <path d="M16 11v7" />
        <path d="M12 17h8" />
      </svg>
    );
  }

  if (name === "Джинсы" || name === "Брюки") {
    return (
      <svg {...p}>
        <path d="M11 6h10l1.4 20h-5.2L16 14.5 14.8 26H9.6L11 6Z" />
        <path d="M11 10h10" />
        <path d="M16 6v8.5" />
        <path d="M13 10v2" />
        <path d="M19 10v2" />
      </svg>
    );
  }

  if (name === "Костюмы") {
    return (
      <svg {...p}>
        <path d="M10 6h12l3 6v14H7V12l3-6Z" />
        <path d="M12 7l4 5 4-5" />
        <path d="M16 12v14" />
        <path d="M11 17h3" />
        <path d="M18 17h3" />
      </svg>
    );
  }

  if (name === "Платья") {
    return (
      <svg {...p}>
        <path d="M12 6h8l2 6-3 2 4 12H9l4-12-3-2 2-6Z" />
        <path d="M14 6c.4 1.4 1.1 2.2 2 2.2S17.6 7.4 18 6" />
        <path d="M13 14h6" />
      </svg>
    );
  }

  if (name === "Юбки") {
    return (
      <svg {...p}>
        <path d="M12 8h8l4 18H8l4-18Z" />
        <path d="M11 8V5h10v3" />
        <path d="M14 11l-2 15" />
        <path d="M18 11l2 15" />
      </svg>
    );
  }

  return (
    <svg {...p}>
      <circle cx="16" cy="16" r="10" />
    </svg>
  );
}

export default function HomePageClient({
  initialProducts,
  initialBrands,
}: {
  initialProducts: HomeProduct[];
  initialBrands: BrandRow[];
  initialBadges?: BadgeRow[];
}) {
  const router = useRouter();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department>("Мужчинам");
  const [selectedMensCategory, setSelectedMensCategory] = useState<MensCategory>("Все");
  const [selectedWomensCategory, setSelectedWomensCategory] = useState<WomensCategory>("Все");
  const [selectedBrand, setSelectedBrand] = useState("Все бренды");
  const [selectedSort, setSelectedSort] = useState<SortOption>("По популярности");
  const [selectedAvailability, setSelectedAvailability] = useState("Все товары");
  const [search, setSearch] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showBrandMenu, setShowBrandMenu] = useState(false);
  const [showAvailabilityMenu, setShowAvailabilityMenu] = useState(false);
  const [cardImageIndexes, setCardImageIndexes] = useState<Record<string, number>>({});
  const [selectedCardColors, setSelectedCardColors] = useState<Record<string, string>>({});

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const brandMenuRef = useRef<HTMLDivElement>(null);
  const availMenuRef = useRef<HTMLDivElement>(null);
  const touchStartMapRef = useRef<Record<string, number | null>>({});

  useEffect(() => {
    const tg = getTelegramWebApp();
    tg?.ready();
    tg?.expand();
  }, []);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("montreaux_splash_shown") === "1") {
      setShowSplash(false);
      return;
    }
    const t = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem("montreaux_splash_shown", "1");
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) setShowSortMenu(false);
      if (brandMenuRef.current && !brandMenuRef.current.contains(e.target as Node)) setShowBrandMenu(false);
      if (availMenuRef.current && !availMenuRef.current.contains(e.target as Node)) setShowAvailabilityMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
    window.dispatchEvent(new Event("favorites-updated"));
  };

  const resetPage = () => {
    setSelectedDepartment("Мужчинам");
    setSelectedMensCategory("Все");
    setSelectedWomensCategory("Все");
    setSelectedBrand("Все бренды");
    setSelectedSort("По популярности");
    setSelectedAvailability("Все товары");
    setSearch("");
    setShowSortMenu(false);
    setShowBrandMenu(false);
    setShowAvailabilityMenu(false);
    router.push("/");
  };

  const resetFilters = () => {
    setSelectedBrand("Все бренды");
    setSelectedSort("По популярности");
    setSelectedAvailability("Все товары");
    setSearch("");
    if (selectedDepartment === "Мужчинам") setSelectedMensCategory("Все");
    else setSelectedWomensCategory("Все");
  };

  const currentCategory = selectedDepartment === "Мужчинам" ? selectedMensCategory : selectedWomensCategory;
  const currentCategories = selectedDepartment === "Мужчинам" ? mensCategories : womensCategories;
  const departmentProducts = useMemo(() => (selectedDepartment === "Женщинам" ? [] : initialProducts), [initialProducts, selectedDepartment]);

  const filteredProducts = useMemo(() => {
    const result = departmentProducts.filter((item) => {
      const matchCat = currentCategory === "Все" || item.category === currentCategory;
      const matchBrand = selectedBrand === "Все бренды" || item.brand === selectedBrand;
      const query = search.trim().toLowerCase();
      const matchSearch = !query || item.name.toLowerCase().includes(query) || item.brand.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
      const matchAvail = selectedAvailability === "Все товары" || item.badge === selectedAvailability;
      return matchCat && matchBrand && matchSearch && matchAvail;
    });
    if (selectedSort === "Сначала дешевле") return [...result].sort((a, b) => a.price - b.price);
    if (selectedSort === "Сначала дороже") return [...result].sort((a, b) => b.price - a.price);
    if (selectedSort === "Скидки") return [...result].sort((a, b) => getDiscountPercent(b.oldPrice, b.price) - getDiscountPercent(a.oldPrice, a.price));
    if (selectedSort === "Новинки") return [...result].filter((i) => i.badge === "Новинка");
    return result;
  }, [departmentProducts, currentCategory, selectedBrand, selectedSort, selectedAvailability, search]);

  const activeFiltersCount = [
    currentCategory !== "Все",
    selectedBrand !== "Все бренды",
    selectedSort !== "По популярности",
    selectedAvailability !== "Все товары",
    search.trim().length > 0,
  ].filter(Boolean).length;

  const newProducts = useMemo(() => {
    const list = departmentProducts.filter((p) => p.badge === "Новинка");
    return (list.length ? list : departmentProducts).slice(0, 8);
  }, [departmentProducts]);

  const popularProducts = useMemo(() => filteredProducts.slice(0, 4), [filteredProducts]);

  const handleTouchStart = (id: string, x: number) => {
    touchStartMapRef.current[id] = x;
  };

  const handleTouchEnd = (id: string, x: number, total: number) => {
    const start = touchStartMapRef.current[id];
    if (start == null) return;
    const diff = start - x;
    if (Math.abs(diff) > 40) {
      setCardImageIndexes((prev) => {
        const cur = prev[id] || 0;
        const next = diff > 0 ? (cur >= total - 1 ? 0 : cur + 1) : cur <= 0 ? total - 1 : cur - 1;
        return { ...prev, [id]: next };
      });
    }
    touchStartMapRef.current[id] = null;
  };

  const renderProductCard = (p: HomeProduct, mode: "grid" | "rail" = "grid") => {
    const discount = getDiscountPercent(p.oldPrice, p.price);
    const selColor = selectedCardColors[p.id] || p.defaultColor || p.colors?.[0] || "";
    const gallery = selColor ? p.galleryByColor?.[selColor] || [] : [];
    const colorImg = selColor ? p.colorImages?.[selColor] : "";
    const imgs = gallery.length > 0 ? gallery : colorImg ? [colorImg] : p.images?.length ? p.images : [p.image];
    const total = imgs.length || 1;
    const curIdx = Math.min(cardImageIndexes[p.id] || 0, total - 1);
    const curImg = imgs[curIdx] || p.image || "/products/product-1.jpg";
    const visColors = (p.colors || []).slice(0, 4);
    const extraColors = getExtraColorsCount(p.colors || []);
    const isForeign = p.badge?.trim().toLowerCase() === "из-за рубежа";

    return (
      <article
        key={`${mode}-${p.id}`}
        className={`mn-product-card ${mode === "rail" ? "mn-product-card-rail" : ""}`}
        onClick={() => router.push(`/product?id=${p.id}`)}
        onMouseEnter={() => router.prefetch(`/product?id=${p.id}`)}
      >
        <div
          className="mn-product-media"
          onTouchStart={(e) => handleTouchStart(p.id, e.touches[0]?.clientX ?? 0)}
          onTouchEnd={(e) => handleTouchEnd(p.id, e.changedTouches[0]?.clientX ?? 0, total)}
        >
          <img src={curImg} alt={p.name} className="mn-product-img" loading="lazy" onError={(e) => { e.currentTarget.src = "/products/product-1.jpg"; }} />

          {discount > 0 && <div className="mn-badge mn-badge-sale">−{discount}%</div>}
          {p.badge === "Новинка" && !discount && <div className="mn-badge mn-badge-new">Новинка</div>}

          <button type="button" className="mn-heart-btn" onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }} aria-label="Добавить в избранное">
            <IconHeart active={favorites.includes(p.id)} />
          </button>

          {total > 1 && (
            <div className="mn-photo-dots" aria-hidden="true">
              {Array.from({ length: Math.min(total, 5) }).map((_, i) => (
                <span key={i} className={`mn-photo-dot${i === curIdx ? " active" : ""}`} />
              ))}
            </div>
          )}
        </div>

        <div className="mn-product-body">
          <div className="mn-product-brand-row">
            <span className="mn-product-brand">{p.brand}</span>
            {isForeign && <span className="mn-import-label">import</span>}
          </div>

          <div className="mn-product-name">{p.name}</div>

          {visColors.length > 0 && (
            <div className="mn-swatches" aria-label="Цвета товара">
              {visColors.map((color, idx) => (
                <button
                  key={`${p.id}-${color}-${idx}`}
                  type="button"
                  className={`mn-swatch${selColor === color ? " active" : ""}`}
                  style={{ backgroundColor: colorSwatches[color] || "#ccc" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCardColors((prev) => ({ ...prev, [p.id]: color }));
                    setCardImageIndexes((prev) => ({ ...prev, [p.id]: 0 }));
                  }}
                  aria-label={`Цвет ${color}`}
                />
              ))}
              {extraColors > 0 && <span className="mn-extra-colors">+{extraColors}</span>}
            </div>
          )}

          <div className="mn-price-row">
            <span className="mn-price">{formatPrice(p.price)} ₽</span>
            {p.oldPrice ? <span className="mn-old-price">{formatPrice(p.oldPrice)} ₽</span> : null}
          </div>

          <div className="mn-card-footer">
            <div className="mn-delivery"><IconTruck /> 7–14 дней</div>
            <button type="button" className="mn-cart-mini" onClick={(e) => e.stopPropagation()} aria-label="Добавить в корзину">
              <IconCart />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <>
      {showSplash && <AppSplash />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html { overscroll-behavior-x: none; background: #f6f6f6; }
        body { margin: 0; overflow-x: hidden !important; max-width: 100vw !important; overscroll-behavior: none; background: #f6f6f6; }
        button, input { font: inherit; }
        button { touch-action: manipulation; }
        button:focus-visible, input:focus-visible { outline: 2px solid rgba(17,17,17,.44); outline-offset: 2px; }

        .mn-page {
          --bg: #f6f6f6;
          --card: #ffffff;
          --ink: #111111;
          --text: #2a2a2a;
          --muted: #7a7a7a;
          --soft: #f1f1f1;
          --line: rgba(17,17,17,.08);
          --line-strong: rgba(17,17,17,.16);
          --accent: #111111;
          --sale: #e03131;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          min-height: 100vh;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          color: var(--ink);
          background: var(--bg);
          padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
        }

        .mn-shell {
          width: min(100%, 560px);
          margin: 0 auto;
          overflow-x: clip;
        }

        .mn-shop-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(246,246,246,.96);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          padding: calc(env(safe-area-inset-top, 0px) + 8px) 12px 10px;
          border-bottom: 1px solid rgba(17,17,17,.05);
        }

        .mn-shop-header-row {
          min-height: 44px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
        }

        .mn-brand-button {
          min-width: 0;
          border: none;
          background: transparent;
          padding: 0;
          text-align: left;
          cursor: pointer;
        }

        .mn-brand-name {
          display: block;
          font-size: 23px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.05em;
          color: var(--ink);
          white-space: nowrap;
        }

        .mn-brand-subtitle {
          display: block;
          margin-top: 4px;
          color: var(--muted);
          font-size: 11px;
          line-height: 1;
          font-weight: 700;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mn-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mn-icon-btn {
          position: relative;
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid var(--line);
          background: #fff;
          color: var(--ink);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mn-icon-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: var(--sale);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 900;
          border: 2px solid #fff;
        }

        .mn-search-bar {
          margin-top: 10px;
          height: 46px;
          border-radius: 14px;
          background: #fff;
          border: 1px solid var(--line);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          color: var(--muted);
        }

        .mn-search-bar input {
          flex: 1;
          min-width: 0;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: var(--ink);
          font-size: 14px;
          font-weight: 600;
        }

        .mn-search-bar input::placeholder { color: #9b9b9b; font-weight: 500; }

        .mn-clear-search {
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 999px;
          background: #f1f1f1;
          color: #555;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mn-main {
          padding-top: 12px;
        }

        .mn-department-tabs {
          margin: 0 12px;
          padding: 3px;
          border-radius: 14px;
          background: #e9e9e9;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px;
        }

        .mn-department-tab {
          min-height: 38px;
          border: none;
          border-radius: 12px;
          background: transparent;
          color: #676767;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .mn-department-tab.active {
          background: #fff;
          color: #111;
          box-shadow: 0 2px 8px rgba(17,17,17,.08);
        }

        .mn-section {
          margin-top: 18px;
        }

        .mn-section-head {
          padding: 0 12px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
        }

        .mn-section-title {
          margin: 0;
          color: var(--ink);
          font-size: 20px;
          line-height: 1.1;
          letter-spacing: -0.045em;
          font-weight: 900;
        }

        .mn-section-subtitle {
          margin-top: 4px;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.25;
          font-weight: 600;
        }

        .mn-section-link {
          border: none;
          background: transparent;
          color: #111;
          font-size: 12px;
          line-height: 1;
          font-weight: 900;
          cursor: pointer;
          padding: 5px 0;
          white-space: nowrap;
        }

        .mn-categories-grid {
          margin: 12px 12px 0;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .mn-category-tile {
          min-width: 0;
          min-height: 104px;
          border: 1px solid var(--line);
          border-radius: 18px;
          background: #fff;
          color: #111;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 8px;
          cursor: pointer;
        }

        .mn-category-tile.active {
          border-color: #111;
          background: #111;
          color: #fff;
        }

        .mn-category-icon {
          width: 46px;
          height: 46px;
          border-radius: 15px;
          background: #f4f4f4;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: currentColor;
        }

        .mn-category-tile.active .mn-category-icon {
          background: rgba(255,255,255,.13);
        }

        .mn-category-name {
          max-width: 100%;
          color: currentColor;
          font-size: 12px;
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -0.025em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mn-category-hint {
          max-width: 86px;
          color: currentColor;
          opacity: .6;
          font-size: 9px;
          line-height: 1.15;
          font-weight: 700;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .mn-promo {
          margin: 18px 12px 0;
          min-height: 158px;
          border: none;
          border-radius: 22px;
          overflow: hidden;
          position: relative;
          display: block;
          width: calc(100% - 24px);
          padding: 0;
          text-align: left;
          background: #191919;
          cursor: pointer;
        }

        .mn-promo img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: .72;
        }

        .mn-promo::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(0,0,0,.74), rgba(0,0,0,.28) 58%, rgba(0,0,0,.04));
        }

        .mn-promo-content {
          position: relative;
          z-index: 2;
          min-height: 158px;
          padding: 17px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
        }

        .mn-promo-label {
          min-height: 26px;
          padding: 0 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.15);
          border: 1px solid rgba(255,255,255,.2);
          color: rgba(255,255,255,.88);
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        .mn-promo-title {
          max-width: 230px;
          color: #fff;
          font-size: 28px;
          line-height: .95;
          letter-spacing: -0.06em;
          font-weight: 900;
        }

        .mn-promo-bottom {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #111;
          background: #fff;
          min-height: 38px;
          padding: 0 13px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
        }

        .mn-rail {
          margin-top: 12px;
          padding: 0 12px 4px;
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
          scroll-snap-type: x proximity;
        }

        .mn-rail::-webkit-scrollbar { display: none; }

        .mn-filters-card {
          margin: 12px 12px 0;
          padding: 10px;
          border-radius: 18px;
          background: #fff;
          border: 1px solid var(--line);
        }

        .mn-availability-row {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .mn-availability-row::-webkit-scrollbar { display: none; }

        .mn-chip {
          flex: 0 0 auto;
          min-height: 36px;
          padding: 0 12px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: #f7f7f7;
          color: #4f4f4f;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .mn-chip.active {
          background: #111;
          border-color: #111;
          color: #fff;
        }

        .mn-filter-row {
          margin-top: 8px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 42px;
          gap: 7px;
        }

        .mn-control-wrap { position: relative; min-width: 0; }

        .mn-select-btn, .mn-filter-btn {
          width: 100%;
          height: 42px;
          border: 1px solid var(--line);
          border-radius: 13px;
          background: #fff;
          color: #111;
          cursor: pointer;
        }

        .mn-select-btn {
          padding: 0 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          font-size: 12px;
          font-weight: 800;
        }

        .mn-select-btn span {
          min-width: 0;
          flex: 1;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          text-align: left;
        }

        .mn-filter-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .mn-select-btn.is-open, .mn-filter-btn.is-open {
          background: #111;
          color: #fff;
          border-color: #111;
        }

        .mn-dropdown {
          position: absolute;
          top: 48px;
          left: 0;
          right: 0;
          z-index: 300;
          padding: 6px;
          border-radius: 16px;
          background: #fff;
          border: 1px solid var(--line);
          box-shadow: 0 16px 44px rgba(0,0,0,.16);
          max-height: 252px;
          overflow-y: auto;
          scrollbar-width: none;
        }

        .mn-dropdown::-webkit-scrollbar { display: none; }

        .mn-dropdown button {
          width: 100%;
          min-height: 40px;
          border: none;
          border-radius: 11px;
          background: transparent;
          color: #111;
          text-align: left;
          padding: 0 10px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .mn-dropdown button.active {
          background: #111;
          color: #fff;
        }

        .mn-active-tools {
          margin-top: 9px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
        }

        .mn-reset-btn {
          border: none;
          background: transparent;
          color: #111;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          padding: 4px 0;
        }

        .mn-product-grid {
          margin: 12px 12px 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .mn-product-card {
          min-width: 0;
          border-radius: 16px;
          background: #fff;
          border: 1px solid rgba(17,17,17,.06);
          overflow: hidden;
          cursor: pointer;
          text-align: left;
          transform: none !important;
          transition: box-shadow .18s ease, border-color .18s ease;
        }

        .mn-product-card-rail {
          flex: 0 0 154px;
          scroll-snap-align: start;
        }

        .mn-product-card:active {
          transform: none !important;
        }

        @media (hover: hover) {
          .mn-product-card:hover {
            border-color: rgba(17,17,17,.12);
            box-shadow: 0 8px 24px rgba(0,0,0,.06);
          }
        }

        .mn-product-media {
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #f0f0f0;
          touch-action: pan-y;
        }

        .mn-product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transform: none !important;
          transition: opacity .18s ease;
        }

        .mn-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          min-height: 23px;
          padding: 0 8px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          font-weight: 900;
        }

        .mn-badge-sale { background: var(--sale); color: #fff; }
        .mn-badge-new { background: #111; color: #fff; }

        .mn-heart-btn {
          position: absolute;
          top: 7px;
          right: 7px;
          z-index: 10;
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid rgba(17,17,17,.06);
          background: rgba(255,255,255,.92);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mn-heart-btn:active { transform: none !important; }

        .mn-photo-dots {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 8px;
          display: flex;
          gap: 4px;
        }

        .mn-photo-dot {
          height: 3px;
          flex: 1;
          border-radius: 999px;
          background: rgba(255,255,255,.45);
        }

        .mn-photo-dot.active { background: #fff; }

        .mn-product-body {
          padding: 9px 9px 10px;
        }

        .mn-product-brand-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
        }

        .mn-product-brand {
          min-width: 0;
          color: var(--muted);
          font-size: 9px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: .12em;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mn-import-label {
          flex: 0 0 auto;
          color: #666;
          background: #f0f0f0;
          border-radius: 999px;
          padding: 3px 6px;
          font-size: 9px;
          font-weight: 900;
          line-height: 1;
        }

        .mn-product-name {
          margin-top: 6px;
          min-height: 34px;
          color: #111;
          font-size: 13px;
          line-height: 1.28;
          letter-spacing: -0.025em;
          font-weight: 700;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .mn-swatches {
          min-height: 18px;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mn-swatch {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px rgba(17,17,17,.16);
          cursor: pointer;
        }

        .mn-swatch.active {
          box-shadow: 0 0 0 2px #111;
        }

        .mn-extra-colors {
          color: var(--muted);
          font-size: 10px;
          font-weight: 800;
        }

        .mn-price-row {
          margin-top: 8px;
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 5px;
        }

        .mn-price {
          color: #111;
          font-size: 17px;
          line-height: 1;
          letter-spacing: -0.045em;
          font-weight: 900;
        }

        .mn-old-price {
          color: #9b9b9b;
          font-size: 11px;
          line-height: 1;
          font-weight: 700;
          text-decoration: line-through;
        }

        .mn-card-footer {
          margin-top: 9px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 36px;
          gap: 7px;
          align-items: center;
        }

        .mn-delivery {
          min-width: 0;
          height: 36px;
          padding: 0 8px;
          border-radius: 12px;
          background: #f7f7f7;
          color: #6f6f6f;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
        }

        .mn-cart-mini {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 12px;
          background: #111;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mn-empty {
          margin: 12px;
          padding: 34px 18px;
          border-radius: 20px;
          background: #fff;
          border: 1px solid var(--line);
          text-align: center;
        }

        .mn-empty-title {
          color: #111;
          font-size: 22px;
          line-height: 1.05;
          letter-spacing: -0.045em;
          font-weight: 900;
        }

        .mn-empty-sub {
          max-width: 260px;
          margin: 8px auto 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.4;
          font-weight: 600;
        }

        .mn-empty-action {
          margin-top: 16px;
          min-height: 42px;
          padding: 0 16px;
          border: none;
          border-radius: 14px;
          background: #111;
          color: #fff;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        @media (min-width: 430px) {
          .mn-product-card-rail { flex-basis: 168px; }
          .mn-promo { min-height: 178px; }
          .mn-promo-content { min-height: 178px; }
        }

        @media (max-width: 374px) {
          .mn-shop-header { padding-left: 10px; padding-right: 10px; }
          .mn-brand-name { font-size: 21px; }
          .mn-brand-subtitle { font-size: 10px; }
          .mn-icon-btn { width: 39px; height: 39px; border-radius: 13px; }
          .mn-categories-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; margin-left: 10px; margin-right: 10px; }
          .mn-category-tile { min-height: 98px; padding: 8px 6px; border-radius: 16px; }
          .mn-category-icon { width: 42px; height: 42px; }
          .mn-category-name { font-size: 11px; }
          .mn-promo, .mn-filters-card, .mn-product-grid { margin-left: 10px; margin-right: 10px; }
          .mn-promo { width: calc(100% - 20px); }
          .mn-section-head { padding-left: 10px; padding-right: 10px; }
          .mn-product-grid { gap: 8px; }
          .mn-product-body { padding: 8px; }
          .mn-product-name { font-size: 12px; min-height: 31px; }
          .mn-price { font-size: 16px; }
          .mn-delivery { font-size: 9px; padding: 0 6px; }
        }

        @media (max-width: 340px) {
          .mn-header-actions { gap: 6px; }
          .mn-icon-btn { width: 37px; height: 37px; }
          .mn-brand-name { font-size: 19px; }
          .mn-search-bar { height: 44px; }
          .mn-filter-row { grid-template-columns: minmax(0,1fr) 42px; }
          .mn-filter-row .mn-control-wrap:nth-child(2) { grid-column: 1 / -1; grid-row: 2; }
          .mn-filter-row .mn-control-wrap:nth-child(3) { grid-column: 2; grid-row: 1; }
          .mn-category-hint { display: none; }
          .mn-category-tile { min-height: 84px; }
        }
      `}</style>

      <div className="mn-page">
        <div className="mn-shell">
          <header className="mn-shop-header">
            <div className="mn-shop-header-row">
              <button className="mn-brand-button" type="button" onClick={resetPage} aria-label="На главную">
                <span className="mn-brand-name">MONTREAUX</span>
                <span className="mn-brand-subtitle">магазин одежды • доставка 7–14 дней</span>
              </button>

              <div className="mn-header-actions">
                <button className="mn-icon-btn" type="button" onClick={() => router.push("/cart")} aria-label="Корзина">
                  <IconCart />
                </button>
                <button className="mn-icon-btn" type="button" onClick={() => router.push("/profile")} aria-label="Профиль">
                  <IconProfile />
                  {activeFiltersCount > 0 && <span className="mn-icon-badge">{activeFiltersCount}</span>}
                </button>
              </div>
            </div>

            <div className="mn-search-bar">
              <IconSearch />
              <input
                placeholder="Искать одежду, бренд или категорию"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Поиск товаров"
              />
              {search.trim() && (
                <button type="button" className="mn-clear-search" onClick={() => setSearch("")} aria-label="Очистить поиск">
                  <IconClose />
                </button>
              )}
            </div>
          </header>

          <main className="mn-main">
            <div className="mn-department-tabs" role="tablist" aria-label="Раздел магазина">
              {departments.map((dep) => (
                <button
                  key={dep}
                  type="button"
                  role="tab"
                  aria-selected={selectedDepartment === dep}
                  className={`mn-department-tab${selectedDepartment === dep ? " active" : ""}`}
                  onClick={() => {
                    setSelectedDepartment(dep);
                    setSelectedBrand("Все бренды");
                    setSelectedAvailability("Все товары");
                    setSearch("");
                  }}
                >
                  {dep}
                </button>
              ))}
            </div>

            <section className="mn-section" aria-label="Категории одежды">
              <div className="mn-section-head">
                <div>
                  <h2 className="mn-section-title">Категории</h2>
                  <div className="mn-section-subtitle">Быстрый переход к нужной одежде</div>
                </div>
                {currentCategory !== "Все" && <button className="mn-section-link" type="button" onClick={() => selectedDepartment === "Мужчинам" ? setSelectedMensCategory("Все") : setSelectedWomensCategory("Все")}>Все</button>}
              </div>

              <div className="mn-categories-grid">
                {currentCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`mn-category-tile${currentCategory === cat ? " active" : ""}`}
                    onClick={() => {
                      if (selectedDepartment === "Мужчинам") setSelectedMensCategory(cat as MensCategory);
                      else setSelectedWomensCategory(cat as WomensCategory);
                    }}
                  >
                    <span className="mn-category-icon"><CategoryIcon name={cat} /></span>
                    <span className="mn-category-name">{cat}</span>
                    <span className="mn-category-hint">{categoryHints[cat] || "Подборка"}</span>
                  </button>
                ))}
              </div>
            </section>

            <button className="mn-promo" type="button" onClick={() => router.push(banners[0].link)} aria-label="Открыть коллекцию Весна Лето 2026">
              <img src={banners[0].image} alt={banners[0].alt} onError={(e) => { e.currentTarget.src = "/products/product-1.jpg"; }} />
              <div className="mn-promo-content">
                <span className="mn-promo-label">Новая коллекция</span>
                <div className="mn-promo-title">Весна / Лето 2026</div>
                <span className="mn-promo-bottom">Смотреть товары <IconArrow /></span>
              </div>
            </button>

            {newProducts.length > 0 && (
              <section className="mn-section" aria-label="Новинки">
                <div className="mn-section-head">
                  <div>
                    <h2 className="mn-section-title">Новинки</h2>
                    <div className="mn-section-subtitle">Свежие поступления в каталоге</div>
                  </div>
                  <button className="mn-section-link" type="button" onClick={() => setSelectedSort("Новинки")}>Все</button>
                </div>
                <div className="mn-rail">
                  {newProducts.map((p) => renderProductCard(p, "rail"))}
                </div>
              </section>
            )}

            {popularProducts.length > 0 && selectedSort === "По популярности" && search.trim().length === 0 && currentCategory === "Все" && (
              <section className="mn-section" aria-label="Популярное">
                <div className="mn-section-head">
                  <div>
                    <h2 className="mn-section-title">Популярное</h2>
                    <div className="mn-section-subtitle">То, что чаще выбирают покупатели</div>
                  </div>
                </div>
                <div className="mn-product-grid">
                  {popularProducts.map((p) => renderProductCard(p))}
                </div>
              </section>
            )}

            <section className="mn-section" aria-label="Каталог товаров">
              <div className="mn-section-head">
                <div>
                  <h2 className="mn-section-title">Каталог</h2>
                  <div className="mn-section-subtitle">{filteredProducts.length} товаров найдено</div>
                </div>
                {activeFiltersCount > 0 && <button className="mn-section-link" type="button" onClick={resetFilters}>Сбросить</button>}
              </div>

              <div className="mn-filters-card">
                <div className="mn-availability-row">
                  {availabilityOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`mn-chip${selectedAvailability === opt ? " active" : ""}`}
                      onClick={() => setSelectedAvailability(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="mn-filter-row">
                  <div className="mn-control-wrap" ref={brandMenuRef}>
                    <button type="button" className={`mn-select-btn${showBrandMenu ? " is-open" : ""}`} onClick={() => setShowBrandMenu((p) => !p)} aria-expanded={showBrandMenu}>
                      <span>{selectedBrand}</span><IconChevron />
                    </button>
                    {showBrandMenu && (
                      <div className="mn-dropdown">
                        <button className={selectedBrand === "Все бренды" ? "active" : ""} onClick={() => { setSelectedBrand("Все бренды"); setShowBrandMenu(false); }}>Все бренды</button>
                        {initialBrands.map((b) => (
                          <button key={b.id} className={selectedBrand === b.name ? "active" : ""} onClick={() => { setSelectedBrand(b.name); setShowBrandMenu(false); }}>{b.name}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mn-control-wrap" ref={sortMenuRef}>
                    <button type="button" className={`mn-select-btn${showSortMenu ? " is-open" : ""}`} onClick={() => setShowSortMenu((p) => !p)} aria-expanded={showSortMenu}>
                      <span>{selectedSort}</span><IconChevron />
                    </button>
                    {showSortMenu && (
                      <div className="mn-dropdown" style={{ right: 0, left: "auto", minWidth: "190px" }}>
                        {sortOptions.map((opt) => (
                          <button key={opt} className={selectedSort === opt ? "active" : ""} onClick={() => { setSelectedSort(opt); setShowSortMenu(false); }}>{opt}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mn-control-wrap" ref={availMenuRef}>
                    <button type="button" className={`mn-filter-btn${showAvailabilityMenu ? " is-open" : ""}`} onClick={() => setShowAvailabilityMenu((p) => !p)} aria-label="Фильтр наличия" aria-expanded={showAvailabilityMenu}>
                      <IconFilter />
                    </button>
                    {showAvailabilityMenu && (
                      <div className="mn-dropdown" style={{ right: 0, left: "auto", minWidth: "178px" }}>
                        {availabilityOptions.map((opt) => (
                          <button key={opt} className={selectedAvailability === opt ? "active" : ""} onClick={() => { setSelectedAvailability(opt); setShowAvailabilityMenu(false); }}>{opt}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="mn-active-tools">
                    <span>Активных фильтров: {activeFiltersCount}</span>
                    <button type="button" className="mn-reset-btn" onClick={resetFilters}>Очистить</button>
                  </div>
                )}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="mn-empty">
                  <div className="mn-empty-title">{selectedDepartment === "Женщинам" ? "Женский раздел скоро откроется" : "Ничего не найдено"}</div>
                  <div className="mn-empty-sub">{selectedDepartment === "Женщинам" ? "Мы готовим женскую витрину и подборки под новый сезон." : "Попробуйте изменить категорию, бренд или очистить поиск."}</div>
                  <button type="button" className="mn-empty-action" onClick={resetFilters}>Сбросить фильтры</button>
                </div>
              ) : (
                <div className="mn-product-grid">
                  {filteredProducts.map((p) => renderProductCard(p))}
                </div>
              )}
            </section>
          </main>

          <BottomNav />
        </div>
      </div>
    </>
  );
}
