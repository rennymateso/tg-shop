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
  Белый: "#F8F7F2",
  Серый: "#9E9E9E",
  Синий: "#2563EB",
  Бежевый: "#C8B49A",
  Зеленый: "#4A7A3D",
  Коричневый: "#7A5230",
};

const categoryVisuals: Record<string, { label: string; tone: string; accent: string }> = {
  Все: { label: "ALL", tone: "linear-gradient(145deg,#191919,#4a4238)", accent: "#f5efe3" },
  Футболки: { label: "TEE", tone: "linear-gradient(145deg,#efe6d7,#cdbb9f)", accent: "#2b2118" },
  Поло: { label: "POLO", tone: "linear-gradient(145deg,#dfe7df,#91a48d)", accent: "#172014" },
  Джинсы: { label: "DENIM", tone: "linear-gradient(145deg,#d7e2ee,#496782)", accent: "#102033" },
  Брюки: { label: "PANTS", tone: "linear-gradient(145deg,#eee8df,#8d8172)", accent: "#201a15" },
  Костюмы: { label: "SUIT", tone: "linear-gradient(145deg,#e9e6e0,#1f1f1f)", accent: "#ffffff" },
  Платья: { label: "DRESS", tone: "linear-gradient(145deg,#f1dfdf,#ad7b7b)", accent: "#311616" },
  Рубашки: { label: "SHIRT", tone: "linear-gradient(145deg,#f3efe7,#a99578)", accent: "#241b12" },
  Юбки: { label: "SKIRT", tone: "linear-gradient(145deg,#eee3ed,#9b7c96)", accent: "#2a1425" },
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

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L17 17" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M7 12h10" />
      <path d="M10 17h4" />
    </svg>
  );
}

function IconHeart({ active }: { active: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill={active ? "#111" : "none"} stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h8v10h-1" />
      <path d="M14 10h3l3 3v4h-1" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

function CategoryMark({ name }: { name: string }) {
  const visual = categoryVisuals[name] || categoryVisuals["Все"];
  return (
    <span className="mn-category-mark" style={{ background: visual.tone, color: visual.accent }}>
      {visual.label}
    </span>
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

  const heroProduct = filteredProducts[0] || departmentProducts[0] || initialProducts[0];
  const heroImage = heroProduct?.image || heroProduct?.images?.[0] || banners[0].image;

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
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html { overscroll-behavior-x: none; background: #f6f2ea; }
        body { margin: 0; overflow-x: hidden !important; max-width: 100vw !important; overscroll-behavior: none; background: #f6f2ea; }
        button, input { font: inherit; }
        button { touch-action: manipulation; }
        button:focus-visible, input:focus-visible { outline: 2px solid rgba(19, 19, 17, 0.5); outline-offset: 2px; }

        .mn-page {
          --page: #f6f2ea;
          --ink: #151411;
          --soft-ink: #6f685e;
          --muted: #9d9488;
          --paper: #fffdf8;
          --paper-strong: #ffffff;
          --line: rgba(28, 25, 20, 0.09);
          --line-strong: rgba(28, 25, 20, 0.16);
          --gold: #b8925a;
          --dark: #151411;
          --radius-xl: 30px;
          --radius-lg: 24px;
          --radius-md: 18px;
          font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          min-height: 100vh;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          color: var(--ink);
          background:
            radial-gradient(circle at 50% -80px, rgba(255,255,255,0.92), rgba(255,255,255,0) 220px),
            linear-gradient(180deg, #fbf8f2 0%, var(--page) 38%, #efe9dd 100%);
          padding-bottom: calc(112px + env(safe-area-inset-bottom, 0px));
        }

        .mn-shell {
          width: min(100%, 760px);
          margin: 0 auto;
          overflow-x: clip;
        }

        .mn-topbar {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: calc(env(safe-area-inset-top, 0px) + 8px) 14px 8px;
          background: linear-gradient(180deg, rgba(251,248,242,0.96), rgba(251,248,242,0.84));
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border-bottom: 1px solid rgba(28, 25, 20, 0.055);
        }

        .mn-topbar-inner {
          height: 46px;
          display: grid;
          grid-template-columns: 42px 1fr 42px;
          align-items: center;
          gap: 8px;
        }

        .mn-round-action {
          width: 42px;
          height: 42px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: rgba(255,255,255,0.82);
          color: var(--ink);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 10px 26px rgba(34, 28, 20, 0.055);
        }

        .mn-logo-btn {
          min-width: 0;
          justify-self: center;
          border: none;
          background: transparent;
          text-align: center;
          padding: 0 4px;
          cursor: pointer;
        }

        .mn-logo-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 23px;
          font-weight: 700;
          line-height: 0.92;
          letter-spacing: 0.135em;
          white-space: nowrap;
          color: var(--ink);
        }

        .mn-logo-sub {
          margin-top: 2px;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .mn-top-count {
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: #151411;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
          margin-left: -10px;
          margin-top: -18px;
          border: 2px solid #fffdf8;
        }

        .mn-hero {
          padding: 10px 14px 0;
        }

        .mn-hero-card {
          position: relative;
          min-height: 286px;
          border-radius: 34px;
          overflow: hidden;
          background: #191713;
          border: 1px solid rgba(255,255,255,0.58);
          box-shadow: 0 26px 56px rgba(42, 33, 22, 0.18);
        }

        .mn-hero-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.04);
          opacity: 0.8;
        }

        .mn-hero-layer {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(11,10,8,0.16) 0%, rgba(11,10,8,0.24) 42%, rgba(11,10,8,0.78) 100%),
            linear-gradient(115deg, rgba(10,9,7,0.84) 0%, rgba(10,9,7,0.18) 58%, rgba(10,9,7,0) 100%);
        }

        .mn-hero-content {
          position: relative;
          z-index: 2;
          min-height: 286px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .mn-hero-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .mn-pill-light {
          min-height: 30px;
          padding: 0 12px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.13);
          border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.84);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          backdrop-filter: blur(12px);
        }

        .mn-hero-title {
          max-width: 245px;
          margin-top: 54px;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(42px, 12vw, 58px);
          font-weight: 700;
          line-height: 0.82;
          letter-spacing: -0.065em;
          color: #fffdf8;
        }

        .mn-hero-description {
          max-width: 235px;
          margin-top: 14px;
          color: rgba(255,255,255,0.78);
          font-size: 13px;
          font-weight: 600;
          line-height: 1.38;
        }

        .mn-hero-bottom {
          margin-top: 22px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
        }

        .mn-primary-cta {
          height: 46px;
          padding: 0 18px;
          border: none;
          border-radius: 999px;
          background: #fffdf8;
          color: #151411;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 16px 28px rgba(0,0,0,0.2);
        }

        .mn-hero-stat {
          min-width: 74px;
          padding: 9px 10px;
          border-radius: 20px;
          background: rgba(255,255,255,0.13);
          border: 1px solid rgba(255,255,255,0.18);
          color: #fffdf8;
          text-align: center;
          backdrop-filter: blur(12px);
        }

        .mn-hero-stat strong {
          display: block;
          font-size: 18px;
          line-height: 1;
          font-weight: 900;
        }

        .mn-hero-stat span {
          display: block;
          margin-top: 3px;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.11em;
          color: rgba(255,255,255,0.66);
          font-weight: 800;
        }

        .mn-search-dock {
          position: relative;
          z-index: 3;
          margin: -24px 12px 0;
          height: 54px;
          border-radius: 22px;
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(255,255,255,0.88);
          box-shadow: 0 18px 42px rgba(41, 32, 21, 0.16);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 13px;
          color: var(--muted);
        }

        .mn-search-dock input {
          flex: 1;
          min-width: 0;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: var(--ink);
          font-size: 14px;
          font-weight: 700;
        }

        .mn-search-dock input::placeholder { color: #aaa196; font-weight: 600; }

        .mn-search-clear {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          border: none;
          background: #f2eee6;
          color: var(--soft-ink);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mn-segment {
          margin-top: 14px;
          height: 48px;
          padding: 4px;
          border-radius: 999px;
          background: rgba(21,20,17,0.07);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
        }

        .mn-segment-btn {
          border: none;
          border-radius: 999px;
          background: transparent;
          color: var(--soft-ink);
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
        }

        .mn-segment-btn.active {
          background: var(--dark);
          color: #fffdf8;
          box-shadow: 0 12px 26px rgba(21,20,17,0.18);
        }

        .mn-section {
          margin-top: 24px;
        }

        .mn-section-head {
          padding: 0 14px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
        }

        .mn-kicker {
          font-size: 10px;
          line-height: 1;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--gold);
          font-weight: 900;
        }

        .mn-section-title {
          margin-top: 5px;
          font-size: 22px;
          line-height: 1.05;
          letter-spacing: -0.055em;
          font-weight: 900;
          color: var(--ink);
        }

        .mn-count-chip {
          height: 32px;
          padding: 0 11px;
          border-radius: 999px;
          background: rgba(255,255,255,0.72);
          border: 1px solid var(--line);
          display: inline-flex;
          align-items: center;
          color: var(--soft-ink);
          font-size: 12px;
          font-weight: 900;
        }

        .mn-category-strip {
          margin-top: 12px;
          padding: 0 14px 4px;
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
          scroll-snap-type: x proximity;
        }

        .mn-category-strip::-webkit-scrollbar { display: none; }

        .mn-category-card {
          position: relative;
          flex: 0 0 116px;
          height: 126px;
          border: 1px solid rgba(255,255,255,0.78);
          border-radius: 26px;
          padding: 11px;
          overflow: hidden;
          cursor: pointer;
          text-align: left;
          color: var(--ink);
          box-shadow: 0 14px 32px rgba(41, 32, 21, 0.09);
          scroll-snap-align: start;
        }

        .mn-category-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.36), rgba(255,255,255,0.02));
          pointer-events: none;
        }

        .mn-category-card.active {
          outline: 2px solid #151411;
          outline-offset: -2px;
        }

        .mn-category-name {
          position: relative;
          z-index: 2;
          display: block;
          margin-top: 34px;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: -0.035em;
        }

        .mn-category-caption {
          position: relative;
          z-index: 2;
          display: block;
          margin-top: 3px;
          max-width: 82px;
          font-size: 10px;
          line-height: 1.2;
          font-weight: 800;
          opacity: 0.72;
        }

        .mn-category-mark {
          position: absolute;
          top: 11px;
          left: 11px;
          z-index: 2;
          min-width: 42px;
          height: 24px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 8px;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.08em;
          box-shadow: 0 8px 18px rgba(0,0,0,0.12);
        }

        .mn-category-art {
          position: absolute;
          right: -14px;
          bottom: -16px;
          width: 78px;
          height: 78px;
          border-radius: 30px;
          background: rgba(255,255,255,0.26);
          transform: rotate(-18deg);
          z-index: 1;
        }

        .mn-category-art::before {
          content: "";
          position: absolute;
          inset: 13px;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.42);
        }

        .mn-controls-panel {
          margin: 18px 14px 0;
          border-radius: 28px;
          padding: 12px;
          background: rgba(255,253,248,0.78);
          border: 1px solid rgba(255,255,255,0.9);
          box-shadow: 0 18px 42px rgba(41, 32, 21, 0.08);
        }

        .mn-availability {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 7px;
        }

        .mn-chip {
          min-height: 38px;
          border-radius: 16px;
          border: 1px solid var(--line);
          background: #fff;
          color: var(--soft-ink);
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          padding: 0 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mn-chip.active {
          background: #151411;
          color: #fffdf8;
          border-color: #151411;
        }

        .mn-filter-grid {
          margin-top: 9px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 46px;
          gap: 8px;
        }

        .mn-control-wrap { position: relative; min-width: 0; }

        .mn-select-btn, .mn-filter-btn {
          height: 46px;
          width: 100%;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: #fff;
          color: var(--ink);
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(41,32,21,0.035);
        }

        .mn-select-btn {
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 12px;
          font-weight: 900;
        }

        .mn-select-btn span {
          min-width: 0;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: left;
        }

        .mn-filter-btn {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mn-select-btn.is-open, .mn-filter-btn.is-open {
          background: #151411;
          border-color: #151411;
          color: #fffdf8;
        }

        .mn-dropdown {
          position: absolute;
          top: 52px;
          left: 0;
          right: 0;
          z-index: 300;
          padding: 7px;
          border-radius: 20px;
          background: #fffdf8;
          border: 1px solid var(--line);
          box-shadow: 0 22px 54px rgba(29, 24, 18, 0.2);
          max-height: 260px;
          overflow-y: auto;
          scrollbar-width: none;
        }

        .mn-dropdown::-webkit-scrollbar { display: none; }

        .mn-dropdown button {
          width: 100%;
          min-height: 42px;
          border: none;
          border-radius: 14px;
          background: transparent;
          color: var(--ink);
          text-align: left;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .mn-dropdown button.active {
          background: #151411;
          color: #fffdf8;
        }

        .mn-active-tools {
          margin-top: 10px;
          padding: 0 2px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
          font-weight: 800;
          color: var(--soft-ink);
        }

        .mn-reset-btn {
          border: none;
          background: transparent;
          color: #151411;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          padding: 4px 0;
        }

        .mn-product-grid {
          margin: 14px 14px 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 12px;
        }

        .mn-product-card {
          min-width: 0;
          border: none;
          border-radius: 26px;
          overflow: hidden;
          background: #fffdf8;
          box-shadow: 0 16px 36px rgba(41,32,21,0.09);
          cursor: pointer;
          text-align: left;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .mn-product-card:active { transform: scale(0.985); }

        .mn-image-box {
          position: relative;
          aspect-ratio: 0.74;
          overflow: hidden;
          background: #e9e2d7;
        }

        .mn-product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.32s ease;
        }

        .mn-product-gradient {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 52%;
          background: linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.18));
          pointer-events: none;
        }

        .mn-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          min-height: 26px;
          padding: 0 9px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: -0.01em;
          box-shadow: 0 10px 20px rgba(0,0,0,0.14);
        }

        .mn-badge-sale { background: #d63a32; color: #fff; }
        .mn-badge-new { background: #151411; color: #fffdf8; }

        .mn-heart-btn {
          position: absolute;
          top: 9px;
          right: 9px;
          z-index: 10;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(12px);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(0,0,0,0.11);
        }

        .mn-dots {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;
          padding: 5px 7px;
          border-radius: 999px;
          background: rgba(21,20,17,0.26);
          backdrop-filter: blur(10px);
        }

        .mn-dot {
          height: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,0.55);
          transition: all 0.2s ease;
        }

        .mn-dot.active { background: #fffdf8; }

        .mn-product-info {
          padding: 12px 12px 13px;
        }

        .mn-product-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .mn-brand {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 9px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: 0.17em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .mn-foreign {
          flex-shrink: 0;
          max-width: 74px;
          min-height: 21px;
          padding: 0 7px;
          border-radius: 999px;
          background: #f0e9de;
          color: #776a59;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 900;
          white-space: nowrap;
        }

        .mn-product-name {
          margin-top: 7px;
          min-height: 35px;
          color: var(--ink);
          font-size: 13px;
          line-height: 1.28;
          letter-spacing: -0.035em;
          font-weight: 900;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .mn-swatches {
          min-height: 20px;
          margin-top: 9px;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .mn-swatch {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          border: 2px solid #fffdf8;
          box-shadow: 0 0 0 1px rgba(21,20,17,0.14);
          cursor: pointer;
        }

        .mn-swatch.active { box-shadow: 0 0 0 2px #151411; }
        .mn-extra { font-size: 10px; font-weight: 900; color: var(--muted); }

        .mn-price-row {
          margin-top: 10px;
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 5px;
        }

        .mn-old-price {
          color: var(--muted);
          text-decoration: line-through;
          font-size: 11px;
          font-weight: 700;
        }

        .mn-price {
          color: var(--ink);
          font-size: 18px;
          line-height: 1;
          letter-spacing: -0.06em;
          font-weight: 900;
        }

        .mn-delivery {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 5px;
          color: var(--soft-ink);
          font-size: 11px;
          line-height: 1;
          font-weight: 800;
        }

        .mn-cart-btn {
          width: 100%;
          height: 40px;
          margin-top: 12px;
          border: none;
          border-radius: 16px;
          background: #151411;
          color: #fffdf8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .mn-empty {
          margin: 14px;
          padding: 36px 18px;
          border-radius: 30px;
          text-align: center;
          background: #fffdf8;
          box-shadow: 0 18px 42px rgba(41,32,21,0.08);
          border: 1px solid rgba(255,255,255,0.9);
        }

        .mn-empty-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          color: var(--ink);
          font-size: 30px;
          line-height: 0.96;
          font-weight: 700;
          letter-spacing: -0.045em;
        }

        .mn-empty-sub {
          max-width: 260px;
          margin: 10px auto 0;
          color: var(--soft-ink);
          font-size: 13px;
          line-height: 1.42;
          font-weight: 700;
        }

        .mn-empty-action {
          margin-top: 18px;
          height: 44px;
          border: none;
          border-radius: 999px;
          padding: 0 18px;
          background: #151411;
          color: #fffdf8;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        @media (hover: hover) {
          .mn-product-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 24px 50px rgba(41,32,21,0.13);
          }
          .mn-product-card:hover .mn-product-img { transform: scale(1.035); }
          .mn-primary-cta:hover, .mn-cart-btn:hover { filter: brightness(1.03); }
        }

        @media (min-width: 560px) {
          .mn-hero-card, .mn-hero-content { min-height: 340px; }
          .mn-product-grid { grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; }
          .mn-category-card { flex-basis: 132px; }
        }

        @media (max-width: 390px) {
          .mn-logo-name { font-size: 21px; letter-spacing: 0.12em; }
          .mn-hero-card, .mn-hero-content { min-height: 270px; }
          .mn-hero-title { margin-top: 42px; font-size: 40px; }
          .mn-hero-description { font-size: 12px; max-width: 220px; }
          .mn-primary-cta { height: 43px; padding: 0 15px; }
          .mn-hero-stat { min-width: 66px; }
          .mn-category-card { flex-basis: 108px; height: 120px; border-radius: 24px; }
          .mn-filter-grid { grid-template-columns: minmax(0, 1fr) 46px; }
          .mn-filter-grid .mn-control-wrap:nth-child(2) { grid-column: 1 / -1; grid-row: 2; }
          .mn-filter-grid .mn-control-wrap:nth-child(3) { grid-column: 2; grid-row: 1; }
          .mn-product-grid { gap: 10px; }
          .mn-product-info { padding: 11px 10px 12px; }
          .mn-cart-btn span { display: none; }
        }

        @media (max-width: 340px) {
          .mn-topbar-inner { grid-template-columns: 38px 1fr 38px; }
          .mn-round-action { width: 38px; height: 38px; }
          .mn-logo-name { font-size: 19px; letter-spacing: 0.105em; }
          .mn-logo-sub { font-size: 7px; }
          .mn-hero { padding-left: 10px; padding-right: 10px; }
          .mn-section-head, .mn-category-strip, .mn-controls-panel, .mn-product-grid, .mn-empty { margin-left: 10px; margin-right: 10px; }
          .mn-section-head, .mn-category-strip { padding-left: 0; padding-right: 0; }
          .mn-product-name { font-size: 12px; }
          .mn-price { font-size: 16px; }
        }
      `}</style>

      <div className="mn-page">
        <div className="mn-shell">
          <header className="mn-topbar">
            <div className="mn-topbar-inner">
              <button className="mn-round-action" type="button" onClick={() => setSearch((v) => v)} aria-label="Поиск">
                <IconSearch />
              </button>

              <button className="mn-logo-btn" type="button" onClick={resetPage} aria-label="На главную">
                <div className="mn-logo-name">MONTREAUX</div>
                <div className="mn-logo-sub">Fashion Store</div>
              </button>

              <button className="mn-round-action" type="button" onClick={() => setShowAvailabilityMenu((p) => !p)} aria-label="Фильтры">
                <IconFilter />
                {activeFiltersCount > 0 && <span className="mn-top-count">{activeFiltersCount}</span>}
              </button>
            </div>
          </header>

          <main>
            <section className="mn-hero" aria-label="Главная витрина магазина">
              <div className="mn-hero-card">
                <img src={heroImage} alt="Новая коллекция MONTREAUX" className="mn-hero-bg" onError={(e) => { e.currentTarget.src = banners[0].image; }} />
                <div className="mn-hero-layer" />
                <div className="mn-hero-content">
                  <div className="mn-hero-topline">
                    <span className="mn-pill-light">Новая коллекция</span>
                    <span className="mn-pill-light">SS 2026</span>
                  </div>

                  <div>
                    <h1 className="mn-hero-title">Premium essentials</h1>
                    <p className="mn-hero-description">Одежда для чистого, собранного и дорогого повседневного образа.</p>
                  </div>

                  <div className="mn-hero-bottom">
                    <button type="button" className="mn-primary-cta" onClick={() => router.push(banners[0].link)}>
                      Смотреть каталог <IconArrow />
                    </button>
                    <div className="mn-hero-stat">
                      <strong>{filteredProducts.length}</strong>
                      <span>товаров</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mn-search-dock">
                <IconSearch />
                <input
                  placeholder="Поиск: бренд, товар, категория"
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

              <div className="mn-segment" role="tablist" aria-label="Раздел каталога">
                {departments.map((dep) => (
                  <button
                    key={dep}
                    type="button"
                    role="tab"
                    aria-selected={selectedDepartment === dep}
                    className={`mn-segment-btn${selectedDepartment === dep ? " active" : ""}`}
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
            </section>

            <section className="mn-section" aria-label="Категории">
              <div className="mn-section-head">
                <div>
                  <div className="mn-kicker">Навигация</div>
                  <div className="mn-section-title">Категории</div>
                </div>
                <span className="mn-count-chip">{currentCategories.length} разделов</span>
              </div>

              <div className="mn-category-strip">
                {currentCategories.map((cat) => {
                  const visual = categoryVisuals[cat] || categoryVisuals["Все"];
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`mn-category-card${currentCategory === cat ? " active" : ""}`}
                      style={{ background: visual.tone, color: visual.accent }}
                      onClick={() => {
                        if (selectedDepartment === "Мужчинам") setSelectedMensCategory(cat as MensCategory);
                        else setSelectedWomensCategory(cat as WomensCategory);
                      }}
                    >
                      <CategoryMark name={cat} />
                      <span className="mn-category-name">{cat}</span>
                      <span className="mn-category-caption">Быстрый подбор</span>
                      <span className="mn-category-art" />
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mn-section" aria-label="Каталог товаров">
              <div className="mn-section-head">
                <div>
                  <div className="mn-kicker">Shop now</div>
                  <div className="mn-section-title">Витрина</div>
                </div>
                <span className="mn-count-chip">{filteredProducts.length} шт.</span>
              </div>

              <div className="mn-controls-panel">
                <div className="mn-availability">
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
                  <div className="mn-control-wrap" ref={brandMenuRef}>
                    <button type="button" className={`mn-select-btn${showBrandMenu ? " is-open" : ""}`} onClick={() => setShowBrandMenu((p) => !p)} aria-expanded={showBrandMenu}>
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
                    <button type="button" className={`mn-select-btn${showSortMenu ? " is-open" : ""}`} onClick={() => setShowSortMenu((p) => !p)} aria-expanded={showSortMenu}>
                      <span>{selectedSort}</span>
                      <IconChevron />
                    </button>
                    {showSortMenu && (
                      <div className="mn-dropdown" style={{ right: 0, left: "auto", minWidth: "196px" }}>
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
                    <button type="button" className="mn-reset-btn" onClick={resetFilters}>Сбросить</button>
                  </div>
                )}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="mn-empty">
                  <div className="mn-empty-title">{selectedDepartment === "Женщинам" ? "Раздел скоро откроется" : "Ничего не найдено"}</div>
                  <div className="mn-empty-sub">{selectedDepartment === "Женщинам" ? "Мы готовим женскую витрину и подборки под новый сезон." : "Попробуйте изменить категорию, бренд или очистить поиск."}</div>
                  <button type="button" className="mn-empty-action" onClick={resetFilters}>Сбросить фильтры</button>
                </div>
              ) : (
                <div className="mn-product-grid">
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
                        className="mn-product-card"
                        onClick={() => router.push(`/product?id=${p.id}`)}
                        onMouseEnter={() => router.prefetch(`/product?id=${p.id}`)}
                      >
                        <div
                          className="mn-image-box"
                          onTouchStart={(e) => handleTouchStart(p.id, e.touches[0]?.clientX ?? 0)}
                          onTouchEnd={(e) => handleTouchEnd(p.id, e.changedTouches[0]?.clientX ?? 0, total)}
                        >
                          <img src={curImg} alt={p.name} className="mn-product-img" onError={(e) => { e.currentTarget.src = "/products/product-1.jpg"; }} />
                          <div className="mn-product-gradient" />

                          {discount > 0 && <div className="mn-badge mn-badge-sale">−{discount}%</div>}
                          {p.badge === "Новинка" && !discount && <div className="mn-badge mn-badge-new">Новинка</div>}

                          <button type="button" className="mn-heart-btn" onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }} aria-label="В избранное">
                            <IconHeart active={favorites.includes(p.id)} />
                          </button>

                          {total > 1 && (
                            <div className="mn-dots">
                              {Array.from({ length: Math.min(total, 4) }).map((_, i) => (
                                <div key={i} className={`mn-dot${i === curIdx ? " active" : ""}`} style={{ width: i === curIdx ? "14px" : "4px" }} />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mn-product-info">
                          <div className="mn-product-meta">
                            <span className="mn-brand">{p.brand}</span>
                            {isForeign && <span className="mn-foreign">import</span>}
                          </div>

                          <div className="mn-product-name">{p.name}</div>

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

                          <div className="mn-price-row">
                            {p.oldPrice ? <span className="mn-old-price">{formatPrice(p.oldPrice)} ₽</span> : null}
                            <span className="mn-price">{formatPrice(p.price)} ₽</span>
                          </div>

                          <div className="mn-delivery">
                            <IconTruck />
                            <span>7–14 дней</span>
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
            </section>
          </main>

          <BottomNav />
        </div>
      </div>
    </>
  );
}
