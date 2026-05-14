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
  Белый: "#F7F6F1",
  Серый: "#9E9E9E",
  Синий: "#2563EB",
  Бежевый: "#C8B49A",
  Зеленый: "#4A7A3D",
  Коричневый: "#7A5230",
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

// ── Icons ──────────────────────────────────────────────────────────────────
function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L17 17" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function IconHeart({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "#111" : "none"} stroke="#111" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h8v10h-1" />
      <path d="M14 10h3l3 3v4h-1" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function CategoryIcon({ name }: { name: string }) {
  const p = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "Все") return <svg {...p}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
  if (name === "Футболки") return <svg {...p}><path d="M8 4 5 6.5 3 10l3 2 1-1v9h10v-9l1 1 3-2-2-3.5L16 4h-2a2 2 0 0 1-4 0H8Z" /></svg>;
  if (name === "Поло") return <svg {...p}><path d="M8 4h8l3 3v13H5V7l3-3Z" /><path d="M9 4 12 7l3-3" /><path d="M12 7v5" /></svg>;
  if (name === "Джинсы" || name === "Брюки") return <svg {...p}><path d="M8 4h8l1 16h-4l-1-10-1 10H7L8 4Z" /><path d="M8 7h8" /></svg>;
  if (name === "Костюмы") return <svg {...p}><path d="M8 5h8l2 4v11h-5l-1-6-1 6H6V9l2-4Z" /><path d="M7 12h10" /></svg>;
  if (name === "Платья") return <svg {...p}><path d="M9 4h6l2 5-3 2v9H10v-9L7 9Z" /></svg>;
  if (name === "Рубашки") return <svg {...p}><path d="M8 4 5 6.5 3 10l3 2 1-1v9h10v-9l1 1 3-2-2-3.5L16 4h-2v4H10V4H8Z" /></svg>;
  if (name === "Юбки") return <svg {...p}><path d="M8 8h8l2 12H6L8 8Z" /><path d="M9 8V5h6v3" /></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="8" /></svg>;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function HomePageClient({
  initialProducts,
  initialBrands,
}: {
  initialProducts: HomeProduct[];
  initialBrands: BrandRow[];
  initialBadges: BadgeRow[];
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
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.brand.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase());
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

  return (
    <>
      {showSplash && <AppSplash />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html { overscroll-behavior-x: none; }
        body { overflow-x: hidden !important; max-width: 100vw !important; overscroll-behavior: none; }
        button, input { font: inherit; }
        button:focus-visible, input:focus-visible { outline: 2px solid rgba(17, 17, 17, 0.55); outline-offset: 2px; }

        .mn-page {
          --bg: #f4f1ec;
          --surface: #ffffff;
          --surface-soft: #faf8f5;
          --text: #141414;
          --muted: #7a766f;
          --muted-light: #aaa49b;
          --line: rgba(20, 20, 20, 0.08);
          --line-strong: rgba(20, 20, 20, 0.14);
          --dark: #111111;
          --radius-lg: 24px;
          --radius-md: 18px;
          --radius-sm: 13px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background:
            radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 280px),
            linear-gradient(180deg, #f7f4ef 0%, var(--bg) 45%, #eeeae3 100%);
          color: var(--text);
          min-height: 100vh;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          padding-bottom: calc(112px + env(safe-area-inset-bottom, 0px));
        }

        .mn-shell {
          width: min(100%, 860px);
          margin: 0 auto;
        }

        .mn-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(247, 244, 239, 0.86);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border-bottom: 1px solid var(--line);
          padding-top: env(safe-area-inset-top, 0px);
        }

        .mn-header-inner {
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 16px;
        }

        .mn-logo-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 7px 6px;
          text-align: left;
        }

        .mn-logo-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: var(--text);
          line-height: 1;
        }

        .mn-logo-sub {
          font-size: 8px;
          letter-spacing: 0.42em;
          color: var(--muted-light);
          text-transform: uppercase;
          margin-top: 3px;
          font-weight: 600;
        }

        .mn-header-meta {
          min-width: 34px;
          height: 34px;
          padding: 0 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.68);
          border: 1px solid var(--line);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: var(--text);
          box-shadow: 0 8px 20px rgba(31, 26, 18, 0.05);
        }

        .mn-hero {
          padding: 14px 14px 0;
        }

        .mn-search {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--line);
          border-radius: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 13px;
          height: 48px;
          color: var(--muted-light);
          box-shadow: 0 10px 30px rgba(31, 26, 18, 0.05);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .mn-search:focus-within {
          background: #fff;
          border-color: rgba(17, 17, 17, 0.22);
          box-shadow: 0 0 0 4px rgba(17, 17, 17, 0.045), 0 14px 34px rgba(31, 26, 18, 0.08);
          color: var(--text);
        }

        .mn-search input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
        }

        .mn-search input::placeholder { color: #b3aea6; font-weight: 400; }

        .mn-search-clear {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: none;
          background: #f1eee8;
          color: var(--muted);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mn-tabs {
          margin-top: 12px;
          background: rgba(17, 17, 17, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.55);
          border-radius: 18px;
          padding: 4px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
        }

        .mn-tab {
          border: none;
          border-radius: 14px;
          padding: 11px 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
          background: transparent;
          color: var(--muted);
        }

        .mn-tab.active {
          background: var(--dark);
          color: #fff;
          box-shadow: 0 12px 24px rgba(17, 17, 17, 0.18);
        }

        .mn-tab:active { transform: scale(0.985); }

        .mn-cats-wrap {
          margin: 14px -14px 0;
          overflow-x: auto;
          padding: 0 14px;
          scrollbar-width: none;
        }

        .mn-cats-wrap::-webkit-scrollbar { display: none; }
        .mn-cats-inner { display: flex; gap: 8px; min-width: max-content; padding-right: 14px; }

        .mn-cat-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 38px;
          padding: 8px 13px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(255, 255, 255, 0.84);
          font-size: 12px;
          font-weight: 700;
          color: var(--muted);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s ease;
          flex-shrink: 0;
          box-shadow: 0 7px 18px rgba(31, 26, 18, 0.035);
        }

        .mn-cat-btn.active {
          background: var(--dark);
          color: #fff;
          border-color: var(--dark);
          box-shadow: 0 12px 24px rgba(17, 17, 17, 0.16);
        }

        .mn-banner {
          margin-top: 16px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          position: relative;
          min-height: 196px;
          display: block;
          border: 1px solid rgba(255, 255, 255, 0.38);
          cursor: pointer;
          width: 100%;
          padding: 0;
          background: #211d18;
          box-shadow: 0 18px 46px rgba(31, 26, 18, 0.16);
        }

        .mn-banner img {
          width: 100%;
          height: 100%;
          min-height: 196px;
          object-fit: cover;
          display: block;
          transform: scale(1.01);
          transition: transform 0.45s ease;
        }

        .mn-banner:active img { transform: scale(1.035); }

        .mn-banner-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(105deg, rgba(10, 8, 6, 0.74) 0%, rgba(10, 8, 6, 0.36) 47%, rgba(10, 8, 6, 0.08) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.28));
        }

        .mn-banner-content {
          position: absolute;
          inset: 0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
        }

        .mn-banner-eyebrow {
          display: inline-flex;
          align-items: center;
          min-height: 24px;
          padding: 0 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: rgba(255,255,255,0.78);
          font-size: 9px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          font-weight: 700;
          backdrop-filter: blur(8px);
        }

        .mn-banner-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(30px, 8vw, 48px);
          color: #fff;
          line-height: 0.94;
          margin-top: 16px;
          font-weight: 600;
          letter-spacing: -0.035em;
          text-align: left;
        }

        .mn-banner-bottom {
          width: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
        }

        .mn-banner-note {
          max-width: 190px;
          font-size: 12px;
          line-height: 1.35;
          color: rgba(255,255,255,0.76);
          text-align: left;
        }

        .mn-banner-cta {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #fff;
          color: var(--text);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: -0.01em;
          padding: 10px 14px;
          border-radius: 999px;
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.16);
        }

        .mn-catalog-head {
          margin: 22px 14px 0;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
        }

        .mn-catalog-kicker {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted-light);
          font-weight: 800;
        }

        .mn-catalog-title {
          margin-top: 4px;
          font-size: 22px;
          line-height: 1.05;
          letter-spacing: -0.055em;
          font-weight: 800;
          color: var(--text);
        }

        .mn-catalog-count {
          flex-shrink: 0;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid var(--line);
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
        }

        .mn-controls {
          margin: 12px 14px 0;
          padding: 10px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.74);
          box-shadow: 0 14px 34px rgba(31, 26, 18, 0.055);
        }

        .mn-chips {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 2px;
        }

        .mn-chips::-webkit-scrollbar { display: none; }

        .mn-chip {
          flex-shrink: 0;
          min-height: 35px;
          padding: 8px 13px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid var(--line);
          background: #fff;
          color: var(--muted);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s ease;
        }

        .mn-chip.active {
          background: var(--dark);
          color: #fff;
          border-color: var(--dark);
          box-shadow: 0 10px 20px rgba(17, 17, 17, 0.14);
        }

        .mn-sort-row {
          margin-top: 9px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 44px;
          gap: 8px;
        }

        .mn-control-wrap { position: relative; min-width: 0; }

        .mn-sort-btn, .mn-filter-btn {
          height: 42px;
          background: var(--surface-soft);
          border: 1px solid var(--line);
          border-radius: 14px;
          color: var(--text);
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
        }

        .mn-sort-btn {
          width: 100%;
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 7px;
          font-size: 12px;
          font-weight: 700;
          min-width: 0;
        }

        .mn-sort-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; text-align: left; }

        .mn-filter-btn {
          width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mn-sort-btn:active, .mn-filter-btn:active { transform: scale(0.98); }
        .mn-sort-btn.is-open, .mn-filter-btn.is-open { background: #111; color: #fff; border-color: #111; }

        .mn-dropdown {
          position: absolute;
          top: 49px;
          left: 0;
          right: 0;
          z-index: 300;
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 6px;
          box-shadow: 0 18px 50px rgba(22, 18, 14, 0.16);
          max-height: 250px;
          overflow-y: auto;
          scrollbar-width: none;
        }

        .mn-dropdown::-webkit-scrollbar { display: none; }

        .mn-dropdown button {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 11px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          border: none;
          cursor: pointer;
          background: transparent;
          transition: background 0.14s ease, color 0.14s ease;
        }

        .mn-dropdown button:hover { background: #f4f1ec; }
        .mn-dropdown button.active { background: #111; color: #fff; }

        .mn-active-tools {
          margin-top: 9px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: var(--muted);
          font-size: 12px;
          font-weight: 600;
        }

        .mn-reset-btn {
          border: none;
          background: transparent;
          color: var(--text);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          padding: 4px 0;
        }

        .mn-grid {
          margin: 12px 14px 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .mn-card {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 22px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid rgba(20, 20, 20, 0.055);
          box-shadow: 0 12px 28px rgba(31, 26, 18, 0.06);
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .mn-card:active { transform: scale(0.985); }

        @media (hover: hover) {
          .mn-card:hover {
            transform: translateY(-3px);
            border-color: rgba(20, 20, 20, 0.11);
            box-shadow: 0 18px 38px rgba(31, 26, 18, 0.10);
          }
          .mn-card:hover .mn-card-img { transform: scale(1.035); }
          .mn-cat-btn:hover, .mn-chip:hover { border-color: var(--line-strong); }
        }

        .mn-card-img-wrap {
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #eeeae4;
        }

        .mn-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.34s ease;
        }

        .mn-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: -0.01em;
          padding: 0 8px;
          border-radius: 999px;
          box-shadow: 0 8px 18px rgba(0,0,0,0.12);
        }

        .mn-badge-sale { background: #d8372f; color: #fff; }
        .mn-badge-new { background: #111; color: #fff; }

        .mn-heart-btn {
          position: absolute;
          top: 9px;
          right: 9px;
          z-index: 10;
          width: 36px;
          height: 36px;
          border-radius: 999px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(0,0,0,0.10);
          transition: transform 0.16s ease, background 0.16s ease;
        }

        .mn-heart-btn:active { transform: scale(0.92); }

        .mn-dots {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;
          padding: 5px 7px;
          border-radius: 999px;
          background: rgba(17,17,17,0.18);
          backdrop-filter: blur(8px);
        }

        .mn-dot {
          height: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,0.55);
          transition: all 0.2s ease;
        }

        .mn-dot.active { background: #fff; }

        .mn-card-body {
          padding: 12px 12px 13px;
          position: relative;
        }

        .mn-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .mn-card-brand {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted-light);
          font-weight: 800;
        }

        .mn-foreign {
          flex-shrink: 0;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: -0.01em;
          padding: 4px 6px;
          background: #f1eee8;
          border-radius: 999px;
          color: var(--muted);
          white-space: nowrap;
        }

        .mn-card-name {
          margin-top: 5px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.24;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 32px;
          letter-spacing: -0.025em;
        }

        .mn-swatches {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          min-height: 18px;
        }

        .mn-swatch {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.88);
          box-shadow: 0 0 0 1px rgba(17,17,17,0.12);
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .mn-swatch.active {
          transform: scale(1.13);
          box-shadow: 0 0 0 2px #111;
        }

        .mn-extra { font-size: 10px; color: var(--muted-light); font-weight: 700; }

        .mn-prices {
          margin-top: 11px;
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 5px;
        }

        .mn-old-price {
          font-size: 11px;
          color: var(--muted-light);
          text-decoration: line-through;
          line-height: 1;
          font-weight: 600;
        }

        .mn-price {
          font-size: 17px;
          font-weight: 800;
          color: var(--text);
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .mn-delivery {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: var(--muted);
          font-weight: 600;
        }

        .mn-cart-btn {
          width: 100%;
          margin-top: 11px;
          height: 38px;
          background: #111;
          border: none;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #fff;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          transition: transform 0.15s ease, background 0.15s ease;
        }

        .mn-cart-btn:active { transform: scale(0.98); background: #2b2b2b; }

        .mn-empty {
          margin: 14px;
          padding: 42px 22px;
          background: rgba(255, 255, 255, 0.86);
          border-radius: 24px;
          text-align: center;
          border: 1px solid rgba(20,20,20,0.06);
          box-shadow: 0 14px 34px rgba(31, 26, 18, 0.055);
        }

        .mn-empty-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          color: var(--text);
          font-weight: 600;
          line-height: 1.1;
        }

        .mn-empty-sub {
          margin: 8px auto 0;
          max-width: 240px;
          font-size: 13px;
          line-height: 1.45;
          color: var(--muted);
          font-weight: 500;
        }

        .mn-empty-action {
          margin-top: 18px;
          height: 42px;
          border: none;
          border-radius: 999px;
          padding: 0 18px;
          background: #111;
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        @media (min-width: 620px) {
          .mn-header-inner, .mn-hero, .mn-catalog-head, .mn-controls, .mn-grid, .mn-empty { margin-left: auto; margin-right: auto; }
          .mn-hero, .mn-catalog-head, .mn-controls, .mn-grid { width: calc(100% - 32px); }
          .mn-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
          .mn-banner { min-height: 260px; }
          .mn-banner img { min-height: 260px; }
        }

        @media (max-width: 370px) {
          .mn-grid { gap: 9px; }
          .mn-card-body { padding: 10px; }
          .mn-card-name { font-size: 12px; }
          .mn-price { font-size: 16px; }
          .mn-cart-btn span { display: none; }
          .mn-sort-row { grid-template-columns: minmax(0, 1fr) 44px; }
          .mn-sort-row .mn-control-wrap:nth-child(2) { grid-column: 1 / -1; grid-row: 2; }
          .mn-sort-row .mn-control-wrap:nth-child(3) { grid-column: 2; grid-row: 1; }
        }
      `}</style>

      <div className="mn-page">
        <div className="mn-shell">
          {/* HEADER */}
          <header className="mn-header">
            <div className="mn-header-inner">
              <button className="mn-logo-btn" type="button" onClick={resetPage} aria-label="На главную">
                <div className="mn-logo-name">MONTREAUX</div>
                <div className="mn-logo-sub">Fashion</div>
              </button>
              <div className="mn-header-meta" aria-label={`Товаров найдено: ${filteredProducts.length}`}>
                {filteredProducts.length}
              </div>
            </div>
          </header>

          {/* HERO / SEARCH / NAV */}
          <section className="mn-hero" aria-label="Главный экран каталога">
            <div className="mn-search">
              <IconSearch />
              <input
                placeholder="Найти бренд, товар или категорию"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Поиск по каталогу"
              />
              {search.trim() && (
                <button type="button" className="mn-search-clear" onClick={() => setSearch("")} aria-label="Очистить поиск">
                  <IconClose />
                </button>
              )}
            </div>

            <div className="mn-tabs" role="tablist" aria-label="Раздел каталога">
              {departments.map((dep) => (
                <button
                  key={dep}
                  type="button"
                  role="tab"
                  aria-selected={selectedDepartment === dep}
                  className={`mn-tab${selectedDepartment === dep ? " active" : ""}`}
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

            <div className="mn-cats-wrap" aria-label="Категории">
              <div className="mn-cats-inner">
                {currentCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`mn-cat-btn${currentCategory === cat ? " active" : ""}`}
                    onClick={() => {
                      if (selectedDepartment === "Мужчинам") setSelectedMensCategory(cat as MensCategory);
                      else setSelectedWomensCategory(cat as WomensCategory);
                    }}
                  >
                    <CategoryIcon name={cat} />
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button className="mn-banner" type="button" onClick={() => router.push(banners[0].link)}>
              <img src={banners[0].image} alt={banners[0].alt} />
              <div className="mn-banner-overlay" />
              <div className="mn-banner-content">
                <div>
                  <div className="mn-banner-eyebrow">Новая коллекция</div>
                  <div className="mn-banner-title">Весна<br />Лето 2026</div>
                </div>
                <div className="mn-banner-bottom">
                  <div className="mn-banner-note">Лаконичные силуэты, базовые оттенки и вещи на каждый день.</div>
                  <div className="mn-banner-cta">Смотреть <IconArrow /></div>
                </div>
              </div>
            </button>
          </section>

          {/* CATALOG HEADER */}
          <div className="mn-catalog-head">
            <div>
              <div className="mn-catalog-kicker">Каталог</div>
              <div className="mn-catalog-title">Подборка товаров</div>
            </div>
            <div className="mn-catalog-count">{filteredProducts.length} шт.</div>
          </div>

          {/* FILTERS */}
          <section className="mn-controls" aria-label="Фильтры каталога">
            <div className="mn-chips">
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

            <div className="mn-sort-row">
              <div className="mn-control-wrap" ref={brandMenuRef}>
                <button type="button" className={`mn-sort-btn${showBrandMenu ? " is-open" : ""}`} onClick={() => setShowBrandMenu((p) => !p)} aria-expanded={showBrandMenu}>
                  <span>{selectedBrand}</span>
                  <IconChevron />
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
                <button type="button" className={`mn-sort-btn${showSortMenu ? " is-open" : ""}`} onClick={() => setShowSortMenu((p) => !p)} aria-expanded={showSortMenu}>
                  <span>{selectedSort}</span>
                  <IconChevron />
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
                  <div className="mn-dropdown" style={{ right: 0, left: "auto", minWidth: "175px" }}>
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
                <button type="button" className="mn-reset-btn" onClick={resetFilters}>Сбросить</button>
              </div>
            )}
          </section>

          {/* PRODUCTS */}
          {filteredProducts.length === 0 ? (
            <div className="mn-empty">
              <div className="mn-empty-title">{selectedDepartment === "Женщинам" ? "Женский раздел в разработке" : "Ничего не найдено"}</div>
              <div className="mn-empty-sub">{selectedDepartment === "Женщинам" ? "Скоро здесь появятся товары и отдельные подборки." : "Попробуйте изменить категорию, бренд или очистить поиск."}</div>
              <button type="button" className="mn-empty-action" onClick={resetFilters}>Сбросить фильтры</button>
            </div>
          ) : (
            <div className="mn-grid">
              {filteredProducts.map((p) => {
                const discount = getDiscountPercent(p.oldPrice, p.price);
                const selColor = selectedCardColors[p.id] || p.defaultColor || p.colors?.[0] || "";
                const gallery = selColor ? p.galleryByColor?.[selColor] || [] : [];
                const colorImg = selColor ? p.colorImages?.[selColor] : "";
                const imgs = gallery.length > 0 ? gallery : colorImg ? [colorImg] : p.images?.length ? p.images : [p.image];
                const total = imgs.length || 1;
                const curIdx = cardImageIndexes[p.id] || 0;
                const curImg = imgs[curIdx] || p.image || "/products/product-1.jpg";
                const visColors = (p.colors || []).slice(0, 3);
                const extraColors = getExtraColorsCount(p.colors || []);
                const isForeign = p.badge?.trim().toLowerCase() === "из-за рубежа";

                return (
                  <article
                    key={p.id}
                    className="mn-card"
                    onClick={() => router.push(`/product?id=${p.id}`)}
                    onMouseEnter={() => router.prefetch(`/product?id=${p.id}`)}
                  >
                    <div
                      className="mn-card-img-wrap"
                      onTouchStart={(e) => handleTouchStart(p.id, e.touches[0]?.clientX ?? 0)}
                      onTouchEnd={(e) => handleTouchEnd(p.id, e.changedTouches[0]?.clientX ?? 0, total)}
                    >
                      <img src={curImg} alt={p.name} className="mn-card-img" onError={(e) => { e.currentTarget.src = "/products/product-1.jpg"; }} />

                      {discount > 0 && <div className="mn-badge mn-badge-sale">−{discount}%</div>}
                      {p.badge === "Новинка" && !discount && <div className="mn-badge mn-badge-new">Новинка</div>}

                      <button type="button" className="mn-heart-btn" onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }} aria-label="В избранное">
                        <IconHeart active={favorites.includes(p.id)} />
                      </button>

                      {total > 1 && (
                        <div className="mn-dots">
                          {Array.from({ length: Math.min(total, 4) }).map((_, i) => (
                            <div key={i} className={`mn-dot${i === curIdx ? " active" : ""}`} style={{ width: i === curIdx ? "13px" : "4px" }} />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mn-card-body">
                      <div className="mn-card-top">
                        <span className="mn-card-brand">{p.brand}</span>
                        {isForeign && <span className="mn-foreign">из-за рубежа</span>}
                      </div>

                      <div className="mn-card-name">{p.name}</div>

                      {visColors.length > 0 && (
                        <div className="mn-swatches">
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
                          {extraColors > 0 && <span className="mn-extra">+{extraColors}</span>}
                        </div>
                      )}

                      <div className="mn-prices">
                        {p.oldPrice ? <span className="mn-old-price">{formatPrice(p.oldPrice)} ₽</span> : null}
                        <span className="mn-price">{formatPrice(p.price)} ₽</span>
                      </div>

                      <div className="mn-delivery">
                        <IconTruck />
                        <span>Доставка 7–14 дней</span>
                      </div>

                      <button type="button" className="mn-cart-btn" onClick={(e) => e.stopPropagation()} aria-label="Добавить в корзину">
                        <IconCart />
                        <span>В корзину</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <BottomNav />
        </div>
      </div>
    </>
  );
}
