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
  Белый: "#F5F5F0",
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
      <circle cx="11" cy="11" r="7" /><path d="M20 20L17 17" />
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill={active ? "#111" : "none"} stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
    </svg>
  );
}
function IconCart() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function IconTruck() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h8v10h-1" />
      <path d="M14 10h3l3 3v4h-1" />
      <circle cx="7.5" cy="17.5" r="1.5" /><circle cx="17.5" cy="17.5" r="1.5" />
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
    if (sessionStorage.getItem("montreaux_splash_shown") === "1") { setShowSplash(false); return; }
    const t = setTimeout(() => { setShowSplash(false); sessionStorage.setItem("montreaux_splash_shown", "1"); }, 3000);
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

  const handleTouchStart = (id: string, x: number) => { touchStartMapRef.current[id] = x; };
  const handleTouchEnd = (id: string, x: number, total: number) => {
    const start = touchStartMapRef.current[id];
    if (start == null) return;
    const diff = start - x;
    if (Math.abs(diff) > 40) {
      setCardImageIndexes((prev) => {
        const cur = prev[id] || 0;
        const next = diff > 0 ? (cur >= total - 1 ? 0 : cur + 1) : (cur <= 0 ? total - 1 : cur - 1);
        return { ...prev, [id]: next };
      });
    }
    touchStartMapRef.current[id] = null;
  };

  return (
    <>
      {showSplash && <AppSplash />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Serif+Display:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

        html {
          overscroll-behavior-x: none;
        }

        body {
          overflow-x: hidden !important;
          max-width: 100vw !important;
          overscroll-behavior: none;
        }

        .mn-page {
          font-family: 'DM Sans', -apple-system, sans-serif;
          background: #EEECEA;
          color: #111;
          min-height: 100vh;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          padding-bottom: 110px;
        }

        .mn-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(238,236,234,0.94);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          padding-top: env(safe-area-inset-top, 0px);
        }
        .mn-header-inner {
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 16px;
        }
        .mn-logo-btn {
          background: none; border: none; cursor: pointer; padding: 6px; text-align: center;
        }
        .mn-logo-name {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 19px;
          font-weight: 400;
          letter-spacing: 0.22em;
          color: #111;
          line-height: 1;
        }
        .mn-logo-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 8px;
          letter-spacing: 0.42em;
          color: #aaa;
          text-transform: uppercase;
          margin-top: 2px;
          font-weight: 300;
        }

        .mn-search {
          margin: 12px 14px 0;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          height: 44px;
          color: #bbb;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .mn-search:focus-within {
          border-color: rgba(0,0,0,0.2);
          box-shadow: 0 0 0 3px rgba(0,0,0,0.04);
          color: #555;
        }
        .mn-search input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: #111;
          letter-spacing: 0.01em;
        }
        .mn-search input::placeholder { color: #c0bfbc; }

        .mn-tabs {
          margin: 10px 14px 0;
          background: rgba(0,0,0,0.06);
          border-radius: 12px;
          padding: 3px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px;
        }
        .mn-tab {
          border: none;
          border-radius: 9px;
          padding: 9px 0;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: #888;
          letter-spacing: 0.01em;
        }
        .mn-tab.active {
          background: #111;
          color: #fff;
          font-weight: 500;
          box-shadow: 0 2px 10px rgba(0,0,0,0.14);
        }

        .mn-cats-wrap {
          margin: 14px 0 0;
          overflow-x: auto;
          padding: 0 14px;
          scrollbar-width: none;
        }
        .mn-cats-wrap::-webkit-scrollbar { display: none; }
        .mn-cats-inner { display: flex; gap: 7px; min-width: max-content; padding-right: 14px; }
        .mn-cat-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 13px;
          border-radius: 10px;
          border: 1px solid transparent;
          background: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: #666;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s ease;
          flex-shrink: 0;
        }
        .mn-cat-btn.active { background: #111; color: #fff; border-color: #111; }

        .mn-banner {
          margin: 14px 14px 0;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          height: 178px;
          display: block;
          border: none;
          cursor: pointer;
          width: calc(100% - 28px);
          padding: 0;
        }
        .mn-banner img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .mn-banner-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(108deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 55%, transparent 100%);
        }
        .mn-banner-content { position: absolute; left: 18px; top: 18px; }
        .mn-banner-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.6);
          font-weight: 300;
        }
        .mn-banner-title {
          font-family: 'DM Serif Display', serif;
          font-size: 27px;
          color: #fff;
          line-height: 1.04;
          margin-top: 5px;
          font-weight: 400;
        }
        .mn-banner-cta {
          margin-top: 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #fff;
          color: #111;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.04em;
          padding: 7px 14px;
          border-radius: 8px;
        }

        .mn-section-label {
          margin: 18px 14px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mn-section-line { flex: 1; height: 1px; background: rgba(0,0,0,0.09); }
        .mn-section-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #bbb;
          font-weight: 400;
        }

        .mn-chips {
          margin: 11px 14px 0;
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .mn-chips::-webkit-scrollbar { display: none; }
        .mn-chip {
          flex-shrink: 0;
          padding: 7px 13px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 400;
          border: 1px solid rgba(0,0,0,0.09);
          background: #fff;
          color: #888;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s;
        }
        .mn-chip.active { background: #111; color: #fff; border-color: #111; }

        .mn-sort-row {
          margin: 9px 14px 0;
          display: grid;
          grid-template-columns: 1fr 1fr 44px;
          gap: 7px;
        }
        .mn-sort-btn {
          height: 40px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 10px;
          padding: 0 11px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 5px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #555;
          cursor: pointer;
          min-width: 0;
        }
        .mn-sort-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
        .mn-filter-btn {
          height: 40px;
          width: 44px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #555;
        }
        .mn-dropdown {
          position: absolute;
          top: 46px; left: 0; right: 0;
          z-index: 300;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 12px;
          padding: 5px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.1);
          max-height: 230px;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .mn-dropdown::-webkit-scrollbar { display: none; }
        .mn-dropdown button {
          display: block; width: 100%; text-align: left;
          padding: 9px 11px; border-radius: 7px;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 400;
          color: #444; border: none; cursor: pointer; background: transparent;
          transition: background 0.12s;
        }
        .mn-dropdown button:hover { background: #F5F4F2; }
        .mn-dropdown button.active { background: #111; color: #fff; font-weight: 500; }

        .mn-grid {
          margin: 12px 14px 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .mn-card {
          background: #fff;
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid rgba(0,0,0,0.05);
          transition: transform 0.18s ease;
        }
        .mn-card:active { transform: scale(0.985); }

        .mn-card-img-wrap {
          position: relative;
          aspect-ratio: 3/4;
          overflow: hidden;
          background: #F2F1EF;
        }
        .mn-card-img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.3s ease;
        }

        .mn-badge {
          position: absolute;
          top: 9px; left: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 600;
          letter-spacing: 0.04em;
          padding: 3px 7px;
          border-radius: 5px;
        }
        .mn-badge-sale { background: #E53935; color: #fff; }
        .mn-badge-new { background: #111; color: #fff; }

        .mn-heart-btn {
          position: absolute;
          top: 8px; right: 8px; z-index: 10;
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(6px);
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          box-shadow: 0 1px 6px rgba(0,0,0,0.08);
        }

        .mn-dots {
          position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 3px;
        }
        .mn-dot {
          height: 4px; border-radius: 2px;
          background: rgba(255,255,255,0.55);
          transition: all 0.2s ease;
        }
        .mn-dot.active { background: #fff; }

        .mn-card-body {
          padding: 10px 11px 12px;
          position: relative;
        }
        .mn-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mn-card-brand {
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #aaa;
          font-weight: 400;
        }
        .mn-foreign {
          font-family: 'DM Sans', sans-serif;
          font-size: 8px;
          letter-spacing: 0.04em;
          padding: 2px 6px;
          background: #F0EFED;
          border-radius: 4px;
          color: #999;
          white-space: nowrap;
        }
        .mn-card-name {
          margin-top: 3px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: #111;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 30px;
          letter-spacing: -0.01em;
        }
        .mn-swatches { display: flex; align-items: center; gap: 5px; margin-top: 8px; }
        .mn-swatch {
          width: 13px; height: 13px; border-radius: 50%;
          border: 1.5px solid transparent;
          cursor: pointer; flex-shrink: 0;
          transition: transform 0.15s, border-color 0.15s;
        }
        .mn-swatch.active { border-color: #111; transform: scale(1.18); }
        .mn-swatch.white { border-color: #ccc; }
        .mn-extra { font-size: 9px; color: #bbb; }
        .mn-prices {
          margin-top: 9px;
          display: flex; align-items: flex-end; gap: 5px;
        }
        .mn-old-price { font-size: 10px; color: #bbb; text-decoration: line-through; line-height: 1; }
        .mn-price {
          font-family: 'DM Serif Display', serif;
          font-size: 16px; font-weight: 400; color: #111;
          line-height: 1; letter-spacing: -0.01em;
        }
        .mn-delivery {
          margin-top: 7px;
          display: flex; align-items: center; gap: 5px;
          font-size: 10px; color: #c0bfbc; font-weight: 300;
        }
        .mn-cart-btn {
          width: 100%;
          margin-top: 10px;
          height: 36px;
          background: #111;
          border: none;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          cursor: pointer;
          transition: background 0.15s;
        }
        .mn-cart-btn:active { background: #333; }

        .mn-empty {
          margin: 24px 14px 0;
          padding: 44px 20px;
          background: #fff;
          border-radius: 16px;
          text-align: center;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .mn-empty-title {
          font-family: 'DM Serif Display', serif;
          font-size: 17px; color: #111; font-weight: 400;
        }
        .mn-empty-sub { margin-top: 6px; font-size: 13px; color: #bbb; font-weight: 300; }
      `}</style>

      <div className="mn-page">

        {/* HEADER */}
        <header className="mn-header">
          <div className="mn-header-inner">
            <button className="mn-logo-btn" type="button" onClick={resetPage}>
              <div className="mn-logo-name">MONTREAUX</div>
              <div className="mn-logo-sub">Fashion</div>
            </button>
          </div>
        </header>

        {/* SEARCH */}
        <div className="mn-search">
          <IconSearch />
          <input placeholder="Поиск по коллекции..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* DEPARTMENT TABS */}
        <div className="mn-tabs">
          {departments.map((dep) => (
            <button
              key={dep}
              type="button"
              className={`mn-tab${selectedDepartment === dep ? " active" : ""}`}
              onClick={() => { setSelectedDepartment(dep); setSelectedBrand("Все бренды"); setSelectedAvailability("Все товары"); setSearch(""); }}
            >
              {dep}
            </button>
          ))}
        </div>

        {/* CATEGORIES */}
        <div className="mn-cats-wrap">
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

        {/* BANNER */}
        <button className="mn-banner" type="button" onClick={() => router.push(banners[0].link)}>
          <img src={banners[0].image} alt={banners[0].alt} />
          <div className="mn-banner-overlay" />
          <div className="mn-banner-content">
            <div className="mn-banner-eyebrow">Новая коллекция</div>
            <div className="mn-banner-title">Весна<br />Лето 2026</div>
            <div className="mn-banner-cta">Смотреть <IconArrow /></div>
          </div>
        </button>

        {/* DIVIDER */}
        <div className="mn-section-label">
          <div className="mn-section-line" />
          <span className="mn-section-text">Каталог</span>
          <div className="mn-section-line" />
        </div>

        {/* CHIPS */}
        <div className="mn-chips">
          {["Все товары", "В наличии", "Из-за рубежа"].map((opt) => (
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

        {/* SORT ROW */}
        <div className="mn-sort-row">
          <div style={{ position: "relative" }} ref={brandMenuRef}>
            <button type="button" className="mn-sort-btn" onClick={() => setShowBrandMenu((p) => !p)}>
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

          <div style={{ position: "relative" }} ref={sortMenuRef}>
            <button type="button" className="mn-sort-btn" onClick={() => setShowSortMenu((p) => !p)}>
              <span>{selectedSort}</span><IconChevron />
            </button>
            {showSortMenu && (
              <div className="mn-dropdown" style={{ right: 0, left: "auto", minWidth: "180px" }}>
                {sortOptions.map((opt) => (
                  <button key={opt} className={selectedSort === opt ? "active" : ""} onClick={() => { setSelectedSort(opt); setShowSortMenu(false); }}>{opt}</button>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: "relative" }} ref={availMenuRef}>
            <button type="button" className="mn-filter-btn" onClick={() => setShowAvailabilityMenu((p) => !p)}>
              <IconFilter />
            </button>
            {showAvailabilityMenu && (
              <div className="mn-dropdown" style={{ right: 0, left: "auto", minWidth: "170px" }}>
                {["Все товары", "В наличии", "Из-за рубежа"].map((opt) => (
                  <button key={opt} className={selectedAvailability === opt ? "active" : ""} onClick={() => { setSelectedAvailability(opt); setShowAvailabilityMenu(false); }}>{opt}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PRODUCTS */}
        {filteredProducts.length === 0 ? (
          <div className="mn-empty">
            <div className="mn-empty-title">{selectedDepartment === "Женщинам" ? "Женский раздел в разработке" : "Ничего не найдено"}</div>
            <div className="mn-empty-sub">{selectedDepartment === "Женщинам" ? "Скоро здесь появятся товары" : "Попробуйте изменить фильтры"}</div>
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
                          <div key={i} className={`mn-dot${i === curIdx ? " active" : ""}`} style={{ width: i === curIdx ? "12px" : "4px" }} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mn-card-body">
                    <div className="mn-card-top">
                      <span className="mn-card-brand">{p.brand}</span>
                      {isForeign && <span className="mn-foreign">зарубеж</span>}
                    </div>

                    <div className="mn-card-name">{p.name}</div>

                    {visColors.length > 0 && (
                      <div className="mn-swatches">
                        {visColors.map((color, idx) => (
                          <button
                            key={`${p.id}-${color}-${idx}`}
                            type="button"
                            className={`mn-swatch${selColor === color ? " active" : ""}${color === "Белый" ? " white" : ""}`}
                            style={{ backgroundColor: colorSwatches[color] || "#ccc" }}
                            onClick={(e) => { e.stopPropagation(); setSelectedCardColors((prev) => ({ ...prev, [p.id]: color })); setCardImageIndexes((prev) => ({ ...prev, [p.id]: 0 })); }}
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
                      <IconTruck /><span>Доставка 7–14 дней</span>
                    </div>

                    <button type="button" className="mn-cart-btn" onClick={(e) => e.stopPropagation()} aria-label="Добавить в корзину">
                      <IconCart />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <BottomNav />
      </div>
    </>
  );
}