"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import BottomNav from "./components/BottomNav";
import AppSplash from "./components/AppSplash";
import { getTelegramWebApp } from "./lib/telegram-mini-app";

const departments = ["Мужчинам", "Женщинам"] as const;
const mensCategories = ["Все", "Футболки", "Поло", "Джинсы", "Брюки", "Костюмы"] as const;
const womensCategories = ["Все", "Платья", "Футболки", "Рубашки", "Брюки", "Юбки"] as const;
const sortOptions = ["По популярности", "Сначала дешевле", "Сначала дороже", "Скидки", "Новинки"] as const;
const availabilityOptions = ["Все товары", "В наличии", "Из-за рубежа"] as const;
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
  Белый: "#F7F5EF",
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
  return Math.max((colors || []).length - 4, 0);
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L17 17" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M7 12h10" />
      <path d="M10 17h4" />
    </svg>
  );
}

function IconHeart({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "#111" : "none"} stroke="#111" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
    </svg>
  );
}

function IconDelivery() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h3l4 4v2h-7" />
      <circle cx="7" cy="18" r="1.5" />
      <circle cx="17" cy="18" r="1.5" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
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

    const timer = window.setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem("montreaux_splash_shown", "1");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) setShowSortMenu(false);
      if (brandMenuRef.current && !brandMenuRef.current.contains(event.target as Node)) setShowBrandMenu(false);
      if (availMenuRef.current && !availMenuRef.current.contains(event.target as Node)) setShowAvailabilityMenu(false);
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
      const query = search.trim().toLowerCase();
      const matchCat = currentCategory === "Все" || item.category === currentCategory;
      const matchBrand = selectedBrand === "Все бренды" || item.brand === selectedBrand;
      const matchSearch = !query || item.name.toLowerCase().includes(query) || item.brand.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
      const matchAvail = selectedAvailability === "Все товары" || item.badge === selectedAvailability;

      return matchCat && matchBrand && matchSearch && matchAvail;
    });

    if (selectedSort === "Сначала дешевле") return [...result].sort((a, b) => a.price - b.price);
    if (selectedSort === "Сначала дороже") return [...result].sort((a, b) => b.price - a.price);
    if (selectedSort === "Скидки") return [...result].sort((a, b) => getDiscountPercent(b.oldPrice, b.price) - getDiscountPercent(a.oldPrice, a.price));
    if (selectedSort === "Новинки") return [...result].filter((item) => item.badge === "Новинка");

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
        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        html {
          background: #f4f4f2;
          overscroll-behavior-x: none;
        }

        body {
          margin: 0;
          max-width: 100vw !important;
          overflow-x: hidden !important;
          background: #f4f4f2;
          overscroll-behavior: none;
        }

        button,
        input {
          font: inherit;
        }

        button {
          touch-action: manipulation;
        }

        .mn-page {
          --bg: #f4f4f2;
          --surface: #ffffff;
          --surface-soft: #eeeeeb;
          --text: #121212;
          --muted: #777777;
          --line: rgba(18, 18, 18, 0.08);
          --green: #168348;
          --red: #d93838;
          width: 100%;
          max-width: 100vw;
          min-height: 100vh;
          overflow-x: hidden;
          padding-bottom: calc(104px + env(safe-area-inset-bottom, 0px));
          background: var(--bg);
          color: var(--text);
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        }

        .mn-shell {
          width: min(100%, 520px);
          margin: 0 auto;
          overflow-x: clip;
        }

        .mn-header {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: calc(env(safe-area-inset-top, 0px) + 66px) 12px 10px;
          background: rgba(244, 244, 242, 0.97);
          border-bottom: 1px solid rgba(18, 18, 18, 0.04);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .mn-logo-btn {
          display: block;
          width: 100%;
          border: none;
          background: transparent;
          padding: 0;
          text-align: center;
          cursor: pointer;
        }

        .mn-logo-name {
          display: block;
          color: #111;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: clamp(19px, 5.2vw, 24px);
          line-height: 1;
          font-weight: 500;
          letter-spacing: 0.24em;
          white-space: nowrap;
          transform: translateX(4px);
        }

        .mn-search {
          height: 44px;
          margin-top: 13px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          gap: 9px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: #fff;
          color: #8a8a8a;
        }

        .mn-search input {
          width: 100%;
          min-width: 0;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #111;
          font-size: 14px;
          font-weight: 400;
        }

        .mn-search input::placeholder {
          color: #949494;
        }

        .mn-clear {
          width: 28px;
          height: 28px;
          flex: 0 0 auto;
          border: none;
          border-radius: 999px;
          background: #f0f0ee;
          color: #555;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mn-main {
          padding-top: 10px;
        }

        .mn-tabs {
          margin: 0 12px;
          padding: 3px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px;
          border-radius: 14px;
          background: #e7e7e4;
        }

        .mn-tab {
          height: 36px;
          border: none;
          border-radius: 12px;
          background: transparent;
          color: #666;
          font-size: 13px;
          font-weight: 400;
          cursor: pointer;
        }

        .mn-tab.active {
          background: #fff;
          color: #111;
          font-weight: 500;
          box-shadow: 0 2px 10px rgba(0,0,0,.055);
        }

        .mn-cats {
          margin: 11px 0 0;
          padding: 0 12px 2px;
          display: flex;
          gap: 7px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .mn-cats::-webkit-scrollbar {
          display: none;
        }

        .mn-cat {
          flex: 0 0 auto;
          height: 34px;
          min-width: 64px;
          padding: 0 12px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: #fff;
          color: #252525;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mn-cat.active {
          border-color: #111;
          background: #111;
          color: #fff;
        }

        .mn-cat-name {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          line-height: 1;
          font-weight: 400;
        }

        .mn-promo {
          width: calc(100% - 24px);
          height: 172px;
          margin: 14px 12px 0;
          position: relative;
          overflow: hidden;
          display: block;
          padding: 0;
          border: none;
          border-radius: 16px;
          background: #111;
          text-align: left;
          cursor: pointer;
        }

        .mn-promo img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.72;
        }

        .mn-promo::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(0,0,0,.72), rgba(0,0,0,.25) 62%, rgba(0,0,0,0));
        }

        .mn-promo-content {
          position: relative;
          z-index: 2;
          height: 100%;
          padding: 13px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
        }

        .mn-promo-label {
          color: rgba(255,255,255,.78);
          font-size: 9px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .mn-promo-title {
          max-width: 235px;
          color: #fff;
          font-size: 29px;
          line-height: .95;
          font-weight: 600;
          letter-spacing: -0.05em;
        }

        .mn-promo-cta {
          height: 31px;
          padding: 0 11px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          background: #fff;
          color: #111;
          font-size: 12px;
          font-weight: 500;
        }

        .mn-catalog-head {
          display: none;
        }

        .mn-title {
          margin: 0;
          color: #111;
          font-size: 20px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: -0.035em;
        }

        .mn-subtitle {
          margin-top: 4px;
          color: #777;
          font-size: 12px;
          line-height: 1.2;
          font-weight: 400;
        }

        .mn-reset {
          border: none;
          background: transparent;
          color: #111;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 0;
          white-space: nowrap;
        }

        .mn-filters {
          margin: 9px 12px 0;
          padding: 8px;
          border: 1px solid var(--line);
          border-radius: 15px;
          background: #fff;
        }

        .mn-chip-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
        }

        .mn-chip-row::-webkit-scrollbar {
          display: none;
        }

        .mn-chip {
          width: 100%;
          height: 34px;
          flex: 0 0 auto;
          padding: 0 8px;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: #f7f7f5;
          color: #555;
          font-size: 12px;
          font-weight: 400;
          cursor: pointer;
          white-space: nowrap;
        }

        .mn-chip.active {
          border-color: #111;
          background: #111;
          color: #fff;
        }

        .mn-filter-grid {
          margin-top: 7px;
          display: grid;
          grid-template-columns: minmax(0,1fr) minmax(0,1fr) 38px;
          gap: 6px;
        }

        .mn-control {
          position: relative;
          min-width: 0;
        }

        .mn-select,
        .mn-filter-btn {
          height: 38px;
          border: 1px solid var(--line);
          border-radius: 11px;
          background: #fff;
          color: #111;
          cursor: pointer;
        }

        .mn-select {
          width: 100%;
          padding: 0 9px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          font-size: 12px;
          font-weight: 400;
        }

        .mn-select span {
          min-width: 0;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: left;
        }

        .mn-filter-btn {
          width: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mn-select.is-open,
        .mn-filter-btn.is-open {
          border-color: #111;
          background: #111;
          color: #fff;
        }

        .mn-dropdown {
          position: absolute;
          top: 44px;
          left: 0;
          right: 0;
          z-index: 300;
          max-height: 238px;
          overflow-y: auto;
          padding: 6px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 14px 40px rgba(0,0,0,.16);
          scrollbar-width: none;
        }

        .mn-dropdown::-webkit-scrollbar {
          display: none;
        }

        .mn-dropdown button {
          width: 100%;
          min-height: 37px;
          padding: 0 10px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: #111;
          text-align: left;
          font-size: 13px;
          font-weight: 400;
          cursor: pointer;
        }

        .mn-dropdown button.active {
          background: #111;
          color: #fff;
        }

        .mn-grid {
          margin: 11px 12px 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 9px;
        }

        .mn-card {
          min-width: 0;
          overflow: hidden;
          border: 1px solid rgba(18,18,18,.06);
          border-radius: 14px;
          background: #fff;
          text-align: left;
          cursor: pointer;
          transform: none !important;
        }

        .mn-card:active {
          transform: none !important;
        }

        .mn-img-wrap {
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #e9e9e7;
          touch-action: pan-y;
        }

        .mn-img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          transform: none !important;
        }

        .mn-heart {
          position: absolute;
          top: 7px;
          right: 7px;
          z-index: 10;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0,0,0,.06);
          border-radius: 999px;
          background: rgba(255,255,255,.94);
          cursor: pointer;
        }

        .mn-dots {
          position: absolute;
          left: 50%;
          bottom: 8px;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .mn-dot {
          width: 5px;
          height: 5px;
          flex: 0 0 5px;
          border-radius: 999px;
          background: rgba(255,255,255,.6);
        }

        .mn-dot.active {
          width: 12px;
          flex-basis: 12px;
          background: rgba(255,255,255,.72);
        }

        .mn-body {
          padding: 8px 8px 9px;
        }

        .mn-brand-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 5px;
        }

        .mn-brand {
          min-width: 0;
          overflow: hidden;
          color: #777;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 10px;
          line-height: 1;
          font-weight: 400;
          letter-spacing: .01em;
        }

        .mn-foreign {
          flex: 0 0 auto;
          padding: 3px 6px;
          border-radius: 999px;
          background: #f0f0ee;
          color: #666;
          font-size: 9px;
          line-height: 1;
          font-weight: 400;
          white-space: nowrap;
        }

        .mn-name {
          min-height: 31px;
          margin-top: 5px;
          color: #111;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          font-size: 12.5px;
          line-height: 1.24;
          font-weight: 400;
          letter-spacing: -0.01em;
        }

        .mn-swatches {
          min-height: 20px;
          margin-top: 7px;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .mn-swatch {
          width: 17px;
          height: 17px;
          border: 2px solid #fff;
          border-radius: 999px;
          box-shadow: 0 0 0 1px rgba(17,17,17,.12);
          cursor: pointer;
        }

        .mn-swatch.active {
          box-shadow: 0 0 0 1.5px rgba(17,17,17,.45);
        }

        .mn-extra {
          color: #888;
          font-size: 10px;
          font-weight: 400;
        }

        .mn-price-row {
          margin-top: 8px;
          display: flex;
          align-items: baseline;
          flex-wrap: nowrap;
          gap: 5px;
          min-width: 0;
        }

        .mn-old-price {
          color: #9b9b9b;
          font-size: 11px;
          line-height: 1;
          font-weight: 400;
          text-decoration: line-through;
        }

        .mn-discount-inline {
          color: var(--red);
          font-size: 11px;
          line-height: 1;
          font-weight: 500;
        }

        .mn-price {
          color: var(--green);
          font-size: 17px;
          line-height: 1;
          font-weight: 600;
          letter-spacing: -0.035em;
        }

        .mn-delivery {
          margin-top: 7px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: #8b8b8b;
          font-size: 9.5px;
          line-height: 1;
          font-weight: 400;
        }

        .mn-empty {
          margin: 12px;
          padding: 30px 18px;
          border: 1px solid var(--line);
          border-radius: 17px;
          background: #fff;
          text-align: center;
        }

        .mn-empty-title {
          color: #111;
          font-size: 19px;
          line-height: 1.1;
          font-weight: 500;
          letter-spacing: -0.03em;
        }

        .mn-empty-sub {
          max-width: 250px;
          margin: 8px auto 0;
          color: #777;
          font-size: 13px;
          line-height: 1.4;
          font-weight: 400;
        }

        .mn-empty-action {
          height: 40px;
          margin-top: 14px;
          padding: 0 16px;
          border: none;
          border-radius: 12px;
          background: #111;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }

        @media (max-width: 370px) {
          .mn-header {
            padding-left: 10px;
            padding-right: 10px;
            padding-top: calc(env(safe-area-inset-top, 0px) + 62px);
          }

          .mn-logo-name {
            font-size: 20px;
            letter-spacing: 0.22em;
            transform: translateX(3px);
          }

          .mn-cats {
            padding-left: 10px;
            padding-right: 10px;
          }

          .mn-cat {
            min-width: 60px;
            height: 33px;
            padding: 0 10px;
          }

          .mn-promo,
          .mn-filters,
          .mn-grid,
          .mn-catalog-head,
          .mn-tabs {
            margin-left: 10px;
            margin-right: 10px;
          }

          .mn-promo {
            width: calc(100% - 20px);
          }

          .mn-grid {
            gap: 8px;
          }

          .mn-body {
            padding: 8px;
          }

          .mn-name {
            font-size: 12px;
            min-height: 30px;
          }

          .mn-price {
            font-size: 16px;
          }

          .mn-filter-grid {
            grid-template-columns: minmax(0,1fr) 38px;
          }

          .mn-filter-grid .mn-control:nth-child(2) {
            grid-column: 1 / -1;
            grid-row: 2;
          }

          .mn-filter-grid .mn-control:nth-child(3) {
            grid-column: 2;
            grid-row: 1;
          }
        }
      `}</style>

      <div className="mn-page">
        <div className="mn-shell">
          <header className="mn-header">
            <button className="mn-logo-btn" type="button" onClick={resetPage} aria-label="На главную">
              <span className="mn-logo-name">MONTREAUX</span>
            </button>

            <div className="mn-search">
              <IconSearch />
              <input
                placeholder="Искать одежду, бренд или категорию"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Поиск товаров"
              />
              {search.trim() && (
                <button type="button" className="mn-clear" onClick={() => setSearch("")} aria-label="Очистить поиск">
                  <IconClose />
                </button>
              )}
            </div>
          </header>

          <main className="mn-main">
            <div className="mn-tabs" role="tablist" aria-label="Раздел магазина">
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

            <div className="mn-cats" aria-label="Категории одежды">
              {currentCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`mn-cat${currentCategory === cat ? " active" : ""}`}
                  onClick={() => {
                    if (selectedDepartment === "Мужчинам") setSelectedMensCategory(cat as MensCategory);
                    else setSelectedWomensCategory(cat as WomensCategory);
                  }}
                >
                  <span className="mn-cat-name">{cat}</span>
                </button>
              ))}
            </div>

            <button className="mn-promo" type="button" onClick={() => router.push(banners[0].link)} aria-label="Открыть коллекцию Весна Лето 2026">
              <img src={banners[0].image} alt={banners[0].alt} onError={(e) => { e.currentTarget.src = "/products/product-1.jpg"; }} />
              <div className="mn-promo-content">
                <span className="mn-promo-label">Новая коллекция</span>
                <div className="mn-promo-title">Весна / Лето 2026</div>
                <span className="mn-promo-cta">Смотреть <IconArrow /></span>
              </div>
            </button>

            <section aria-label="Каталог товаров">
              <div className="mn-catalog-head">
                <div>
                  <h2 className="mn-title">Каталог</h2>
                  <div className="mn-subtitle">{filteredProducts.length} товаров</div>
                </div>
                {activeFiltersCount > 0 && <button className="mn-reset" type="button" onClick={resetFilters}>Сбросить</button>}
              </div>

              <div className="mn-filters">
                <div className="mn-chip-row">
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

                <div className="mn-filter-grid">
                  <div className="mn-control" ref={brandMenuRef}>
                    <button type="button" className={`mn-select${showBrandMenu ? " is-open" : ""}`} onClick={() => setShowBrandMenu((p) => !p)} aria-expanded={showBrandMenu}>
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

                  <div className="mn-control" ref={sortMenuRef}>
                    <button type="button" className={`mn-select${showSortMenu ? " is-open" : ""}`} onClick={() => setShowSortMenu((p) => !p)} aria-expanded={showSortMenu}>
                      <span>{selectedSort}</span><IconChevron />
                    </button>
                    {showSortMenu && (
                      <div className="mn-dropdown" style={{ right: 0, left: "auto", minWidth: "185px" }}>
                        {sortOptions.map((opt) => (
                          <button key={opt} className={selectedSort === opt ? "active" : ""} onClick={() => { setSelectedSort(opt); setShowSortMenu(false); }}>{opt}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mn-control" ref={availMenuRef}>
                    <button type="button" className={`mn-filter-btn${showAvailabilityMenu ? " is-open" : ""}`} onClick={() => setShowAvailabilityMenu((p) => !p)} aria-label="Фильтр наличия" aria-expanded={showAvailabilityMenu}>
                      <IconFilter />
                    </button>
                    {showAvailabilityMenu && (
                      <div className="mn-dropdown" style={{ right: 0, left: "auto", minWidth: "170px" }}>
                        {availabilityOptions.map((opt) => (
                          <button key={opt} className={selectedAvailability === opt ? "active" : ""} onClick={() => { setSelectedAvailability(opt); setShowAvailabilityMenu(false); }}>{opt}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="mn-empty">
                  <div className="mn-empty-title">{selectedDepartment === "Женщинам" ? "Женский раздел скоро откроется" : "Ничего не найдено"}</div>
                  <div className="mn-empty-sub">{selectedDepartment === "Женщинам" ? "Скоро здесь появятся товары." : "Попробуйте изменить фильтры или очистить поиск."}</div>
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
                    const curIdx = Math.min(cardImageIndexes[p.id] || 0, total - 1);
                    const curImg = imgs[curIdx] || p.image || "/products/product-1.jpg";
                    const visColors = (p.colors || []).slice(0, 4);
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
                          className="mn-img-wrap"
                          onTouchStart={(e) => handleTouchStart(p.id, e.touches[0]?.clientX ?? 0)}
                          onTouchEnd={(e) => handleTouchEnd(p.id, e.changedTouches[0]?.clientX ?? 0, total)}
                        >
                          <img src={curImg} alt={p.name} className="mn-img" loading="lazy" onError={(e) => { e.currentTarget.src = "/products/product-1.jpg"; }} />

                          <button type="button" className="mn-heart" onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }} aria-label="Добавить в избранное">
                            <IconHeart active={favorites.includes(p.id)} />
                          </button>

                          {total > 1 && (
                            <div className="mn-dots" aria-hidden="true">
                              {Array.from({ length: Math.min(total, 5) }).map((_, i) => (
                                <span key={i} className={`mn-dot${i === curIdx ? " active" : ""}`} />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mn-body">
                          <div className="mn-brand-row">
                            <span className="mn-brand">{p.brand}</span>
                            {isForeign && <span className="mn-foreign">из-за рубежа</span>}
                          </div>

                          <div className="mn-name">{p.name}</div>

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
                              {extraColors > 0 && <span className="mn-extra">+{extraColors}</span>}
                            </div>
                          )}

                          <div className="mn-price-row">
                            {p.oldPrice ? <span className="mn-old-price">{formatPrice(p.oldPrice)} ₽</span> : null}
                            {discount > 0 && <span className="mn-discount-inline">−{discount}%</span>}
                            <span className="mn-price">{formatPrice(p.price)} ₽</span>
                          </div>

                          <div className="mn-delivery">
                            <IconDelivery />
                            <span>Доставка 7–14 дней</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
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
