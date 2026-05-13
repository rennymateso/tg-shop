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
  Черный: "#050505",
  Белый: "#F8F8F0",
  Серый: "#8B8B8B",
  Синий: "#1D4ED8",
  Бежевый: "#D8C4A9",
  Зеленый: "#4F7942",
  Коричневый: "#7A5230",
};

function CategoryIcon({ name, active }: { name: string; active: boolean }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: active ? "#C9A96E" : "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "Все") return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></svg>;
  if (name === "Футболки") return <svg {...common}><path d="M8 4 5 6.5 3 10l3 2 1-1v9h10v-9l1 1 3-2-2-3.5L16 4h-2a2 2 0 0 1-4 0H8Z" /></svg>;
  if (name === "Поло") return <svg {...common}><path d="M8 4h8l3 3v13H5V7l3-3Z" /><path d="M9 4 12 7l3-3" /><path d="M12 7v5" /></svg>;
  if (name === "Джинсы" || name === "Брюки") return <svg {...common}><path d="M8 4h8l1 16h-4l-1-10-1 10H7L8 4Z" /><path d="M8 7h8" /></svg>;
  if (name === "Костюмы") return <svg {...common}><path d="M8 5h8l2 4v11h-5l-1-6-1 6H6V9l2-4Z" /><path d="M7 12h10" /><path d="M8 20h8" /></svg>;
  if (name === "Платья") return <svg {...common}><path d="M9 4h6l2 5-3 2v9H10v-9L7 9Z" /></svg>;
  if (name === "Рубашки") return <svg {...common}><path d="M8 4 5 6.5 3 10l3 2 1-1v9h10v-9l1 1 3-2-2-3.5L16 4h-2v4H10V4H8Z" /></svg>;
  if (name === "Юбки") return <svg {...common}><path d="M8 8h8l2 12H6L8 8Z" /><path d="M9 8V5h6v3" /></svg>;

  return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
}

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

function TruckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h8v10h-1" />
      <path d="M14 10h3l3 3v4h-1" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill={active ? "#C9A96E" : "none"}
      stroke={active ? "#C9A96E" : "rgba(255,255,255,0.9)"}
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.9" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L17 17" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Inline styles (no Tailwind dependency for custom design tokens)
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0E0E0E 0%, #141414 50%, #0A0A0A 100%)",
    paddingTop: "0px",
    paddingBottom: "120px",
    color: "#F0EDE8",
    fontFamily: "'Georgia', 'Times New Roman', serif",
  } as React.CSSProperties,

  header: {
    position: "sticky" as const,
    top: 0,
    zIndex: 100,
    background: "rgba(12,12,12,0.88)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(201,169,110,0.12)",
    padding: "14px 20px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,

  logoWrap: {
    textAlign: "center" as const,
    cursor: "pointer",
  } as React.CSSProperties,

  logoText: {
    fontSize: "20px",
    fontWeight: 400,
    letterSpacing: "0.3em",
    color: "#F0EDE8",
    fontFamily: "'Georgia', serif",
    lineHeight: 1,
  } as React.CSSProperties,

  logoSub: {
    fontSize: "7px",
    letterSpacing: "0.45em",
    color: "#C9A96E",
    textTransform: "uppercase" as const,
    marginTop: "3px",
    fontFamily: "'Helvetica Neue', sans-serif",
    fontWeight: 300,
  } as React.CSSProperties,

  searchBar: {
    margin: "16px 16px 0",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(201,169,110,0.18)",
    borderRadius: "14px",
    padding: "11px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  } as React.CSSProperties,

  searchInput: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#F0EDE8",
    fontSize: "13px",
    width: "100%",
    fontFamily: "'Helvetica Neue', sans-serif",
    fontWeight: 300,
    letterSpacing: "0.02em",
  } as React.CSSProperties,

  deptToggle: {
    margin: "12px 16px 0",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "4px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4px",
  } as React.CSSProperties,

  deptBtn: (active: boolean): React.CSSProperties => ({
    padding: "9px 0",
    borderRadius: "10px",
    fontSize: "12px",
    letterSpacing: "0.08em",
    fontWeight: active ? 500 : 400,
    fontFamily: "'Helvetica Neue', sans-serif",
    background: active ? "linear-gradient(135deg, #C9A96E 0%, #A8894F 100%)" : "transparent",
    color: active ? "#0E0E0E" : "rgba(240,237,232,0.5)",
    border: "none",
    cursor: "pointer",
    transition: "all 0.25s ease",
  }),

  categoriesWrap: {
    margin: "16px 0 0",
    overflowX: "auto" as const,
    paddingLeft: "16px",
    scrollbarWidth: "none" as const,
  } as React.CSSProperties,

  categoriesInner: {
    display: "flex",
    gap: "10px",
    paddingRight: "16px",
    minWidth: "max-content",
  } as React.CSSProperties,

  categoryBtn: (active: boolean): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    border: "none",
    background: "transparent",
    padding: 0,
    flexShrink: 0,
    width: "58px",
  }),

  categoryIcon: (active: boolean): React.CSSProperties => ({
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: active
      ? "linear-gradient(135deg, rgba(201,169,110,0.2) 0%, rgba(168,137,79,0.15) 100%)"
      : "rgba(255,255,255,0.04)",
    border: active ? "1px solid rgba(201,169,110,0.4)" : "1px solid rgba(255,255,255,0.06)",
    color: active ? "#C9A96E" : "rgba(240,237,232,0.45)",
    transition: "all 0.2s ease",
  }),

  categoryLabel: (active: boolean): React.CSSProperties => ({
    fontSize: "10px",
    fontFamily: "'Helvetica Neue', sans-serif",
    fontWeight: active ? 500 : 400,
    color: active ? "#C9A96E" : "rgba(240,237,232,0.45)",
    letterSpacing: "0.02em",
    textAlign: "center",
    whiteSpace: "nowrap",
  }),

  bannerWrap: {
    margin: "16px 16px 0",
    borderRadius: "20px",
    overflow: "hidden",
    position: "relative" as const,
    height: "190px",
  } as React.CSSProperties,

  bannerImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  } as React.CSSProperties,

  bannerOverlay: {
    position: "absolute" as const,
    inset: 0,
    background: "linear-gradient(110deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)",
  } as React.CSSProperties,

  bannerGold: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: "2px",
    background: "linear-gradient(90deg, #C9A96E 0%, transparent 70%)",
  } as React.CSSProperties,

  bannerContent: {
    position: "absolute" as const,
    left: "18px",
    top: "18px",
    maxWidth: "180px",
  } as React.CSSProperties,

  bannerEyebrow: {
    fontSize: "9px",
    letterSpacing: "0.35em",
    textTransform: "uppercase" as const,
    color: "#C9A96E",
    fontFamily: "'Helvetica Neue', sans-serif",
    fontWeight: 300,
  } as React.CSSProperties,

  bannerTitle: {
    fontSize: "26px",
    fontWeight: 400,
    color: "#F0EDE8",
    fontFamily: "'Georgia', serif",
    lineHeight: 1.05,
    letterSpacing: "-0.02em",
    marginTop: "4px",
  } as React.CSSProperties,

  bannerCta: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "14px",
    padding: "7px 14px 7px 16px",
    borderRadius: "8px",
    background: "rgba(201,169,110,0.15)",
    border: "1px solid rgba(201,169,110,0.45)",
    color: "#C9A96E",
    fontSize: "11px",
    letterSpacing: "0.12em",
    fontFamily: "'Helvetica Neue', sans-serif",
    fontWeight: 500,
    backdropFilter: "blur(8px)",
  } as React.CSSProperties,

  filtersRow: {
    margin: "14px 16px 0",
    display: "flex",
    gap: "8px",
    overflowX: "auto" as const,
    scrollbarWidth: "none" as const,
  } as React.CSSProperties,

  filterChip: (active: boolean): React.CSSProperties => ({
    flexShrink: 0,
    padding: "7px 14px",
    borderRadius: "8px",
    fontSize: "11px",
    letterSpacing: "0.05em",
    fontFamily: "'Helvetica Neue', sans-serif",
    fontWeight: 400,
    background: active ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.04)",
    border: active ? "1px solid rgba(201,169,110,0.4)" : "1px solid rgba(255,255,255,0.07)",
    color: active ? "#C9A96E" : "rgba(240,237,232,0.5)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap" as const,
  }),

  sortRow: {
    margin: "10px 16px 0",
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "8px",
  } as React.CSSProperties,

  sortBtn: {
    height: "38px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "10px",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "rgba(240,237,232,0.7)",
    fontSize: "11px",
    letterSpacing: "0.02em",
    fontFamily: "'Helvetica Neue', sans-serif",
    cursor: "pointer",
    gap: "6px",
  } as React.CSSProperties,

  filterIconBtn: {
    height: "38px",
    width: "38px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(240,237,232,0.7)",
    cursor: "pointer",
    flexShrink: 0,
  } as React.CSSProperties,

  dropdown: {
    position: "absolute" as const,
    top: "44px",
    left: 0,
    right: 0,
    zIndex: 200,
    background: "#1A1A1A",
    border: "1px solid rgba(201,169,110,0.15)",
    borderRadius: "14px",
    padding: "6px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
    maxHeight: "260px",
    overflowY: "auto" as const,
  } as React.CSSProperties,

  dropdownItem: (active: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    textAlign: "left" as const,
    fontSize: "12px",
    fontFamily: "'Helvetica Neue', sans-serif",
    letterSpacing: "0.02em",
    cursor: "pointer",
    border: "none",
    background: active ? "rgba(201,169,110,0.15)" : "transparent",
    color: active ? "#C9A96E" : "rgba(240,237,232,0.7)",
    display: "block",
  }),

  productsGrid: {
    margin: "16px 16px 0",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  } as React.CSSProperties,

  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.2s ease, border-color 0.2s ease",
  } as React.CSSProperties,

  cardImageWrap: {
    position: "relative" as const,
    aspectRatio: "3/4",
    overflow: "hidden",
    background: "#1a1a1a",
  } as React.CSSProperties,

  cardImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
    transition: "transform 0.4s ease",
  } as React.CSSProperties,

  cardDiscount: {
    position: "absolute" as const,
    top: "10px",
    left: "10px",
    background: "linear-gradient(135deg, #C9A96E 0%, #A8894F 100%)",
    color: "#0E0E0E",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    fontFamily: "'Helvetica Neue', sans-serif",
    padding: "3px 7px",
    borderRadius: "6px",
  } as React.CSSProperties,

  heartBtn: {
    position: "absolute" as const,
    top: "8px",
    right: "8px",
    zIndex: 10,
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  } as React.CSSProperties,

  cardBody: {
    padding: "10px 11px 44px",
    position: "relative" as const,
  } as React.CSSProperties,

  cardBrand: {
    fontSize: "8px",
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
    color: "#C9A96E",
    fontFamily: "'Helvetica Neue', sans-serif",
    fontWeight: 400,
  } as React.CSSProperties,

  cardName: {
    marginTop: "4px",
    fontSize: "12px",
    fontFamily: "'Georgia', serif",
    color: "rgba(240,237,232,0.9)",
    lineHeight: 1.2,
    letterSpacing: "-0.01em",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
    minHeight: "29px",
  } as React.CSSProperties,

  colorsRow: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginTop: "8px",
  } as React.CSSProperties,

  colorSwatch: (color: string, active: boolean, isWhite: boolean): React.CSSProperties => ({
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    backgroundColor: colorSwatches[color] || "#555",
    border: active
      ? "2px solid #C9A96E"
      : isWhite
      ? "1.5px solid rgba(255,255,255,0.3)"
      : "1.5px solid rgba(255,255,255,0.08)",
    cursor: "pointer",
    flexShrink: 0,
    transition: "transform 0.15s ease",
    transform: active ? "scale(1.15)" : "scale(1)",
  }),

  cardPriceRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "6px",
    marginTop: "10px",
  } as React.CSSProperties,

  cardOldPrice: {
    fontSize: "10px",
    color: "rgba(240,237,232,0.3)",
    textDecoration: "line-through",
    fontFamily: "'Helvetica Neue', sans-serif",
    lineHeight: 1,
  } as React.CSSProperties,

  cardPrice: {
    fontSize: "16px",
    fontWeight: 500,
    fontFamily: "'Georgia', serif",
    color: "#F0EDE8",
    lineHeight: 1,
    letterSpacing: "-0.02em",
  } as React.CSSProperties,

  cardDelivery: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginTop: "8px",
    color: "rgba(240,237,232,0.28)",
    fontSize: "9px",
    fontFamily: "'Helvetica Neue', sans-serif",
    letterSpacing: "0.02em",
  } as React.CSSProperties,

  addToCartBtn: {
    position: "absolute" as const,
    bottom: "10px",
    right: "10px",
    width: "34px",
    height: "34px",
    background: "linear-gradient(135deg, #C9A96E 0%, #A8894F 100%)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0E0E0E",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(201,169,110,0.35)",
    flexShrink: 0,
  } as React.CSSProperties,

  emptyState: {
    margin: "20px 16px 0",
    padding: "40px 20px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "20px",
    textAlign: "center" as const,
  } as React.CSSProperties,

  sectionDivider: {
    margin: "20px 16px 0",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  } as React.CSSProperties,

  dividerLine: {
    flex: 1,
    height: "1px",
    background: "rgba(201,169,110,0.15)",
  } as React.CSSProperties,

  dividerText: {
    fontSize: "9px",
    letterSpacing: "0.3em",
    textTransform: "uppercase" as const,
    color: "#C9A96E",
    fontFamily: "'Helvetica Neue', sans-serif",
    fontWeight: 300,
  } as React.CSSProperties,

  foreignBadge: {
    display: "inline-flex",
    padding: "2px 7px",
    background: "rgba(201,169,110,0.1)",
    border: "1px solid rgba(201,169,110,0.2)",
    borderRadius: "5px",
    fontSize: "7px",
    letterSpacing: "0.08em",
    color: "#C9A96E",
    fontFamily: "'Helvetica Neue', sans-serif",
    marginLeft: "auto",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
};

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

  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const brandMenuWrapRef = useRef<HTMLDivElement | null>(null);
  const availabilityMenuRef = useRef<HTMLDivElement | null>(null);
  const touchStartMapRef = useRef<Record<string, number | null>>({});

  useEffect(() => {
    const webApp = getTelegramWebApp();
    webApp?.ready();
    webApp?.expand();
  }, []);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    const splashShown = sessionStorage.getItem("montreaux_splash_shown");
    if (splashShown === "1") { setShowSplash(false); return; }
    const timer = window.setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem("montreaux_splash_shown", "1");
    }, 3000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) setShowSortMenu(false);
      if (brandMenuWrapRef.current && !brandMenuWrapRef.current.contains(event.target as Node)) setShowBrandMenu(false);
      if (availabilityMenuRef.current && !availabilityMenuRef.current.contains(event.target as Node)) setShowAvailabilityMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id) ? favorites.filter((i) => i !== id) : [...favorites, id];
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

  const departmentProducts = useMemo(() => {
    if (selectedDepartment === "Женщинам") return [];
    return initialProducts;
  }, [initialProducts, selectedDepartment]);

  const filteredProducts = useMemo(() => {
    const result = departmentProducts.filter((item) => {
      const matchesCategory = currentCategory === "Все" || item.category === currentCategory;
      const matchesBrand = selectedBrand === "Все бренды" || item.brand === selectedBrand;
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.brand.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      const matchesAvailability = selectedAvailability === "Все товары" || item.badge === selectedAvailability;
      return matchesCategory && matchesBrand && matchesSearch && matchesAvailability;
    });

    if (selectedSort === "Сначала дешевле") return [...result].sort((a, b) => a.price - b.price);
    if (selectedSort === "Сначала дороже") return [...result].sort((a, b) => b.price - a.price);
    if (selectedSort === "Скидки") return [...result].sort((a, b) => getDiscountPercent(b.oldPrice, b.price) - getDiscountPercent(a.oldPrice, a.price));
    if (selectedSort === "Новинки") return [...result].filter((item) => item.badge === "Новинка");
    return result;
  }, [departmentProducts, currentCategory, selectedBrand, selectedSort, selectedAvailability, search]);

  const nextCardImage = (productId: string, totalImages: number) => {
    if (totalImages <= 1) return;
    setCardImageIndexes((prev) => {
      const cur = prev[productId] || 0;
      return { ...prev, [productId]: cur >= totalImages - 1 ? 0 : cur + 1 };
    });
  };

  const prevCardImage = (productId: string, totalImages: number) => {
    if (totalImages <= 1) return;
    setCardImageIndexes((prev) => {
      const cur = prev[productId] || 0;
      return { ...prev, [productId]: cur <= 0 ? totalImages - 1 : cur - 1 };
    });
  };

  const handleCardTouchStart = (productId: string, clientX: number) => {
    touchStartMapRef.current[productId] = clientX;
  };

  const handleCardTouchEnd = (productId: string, clientX: number, totalImages: number) => {
    const startX = touchStartMapRef.current[productId];
    if (startX == null) return;
    const diff = startX - clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextCardImage(productId, totalImages);
      else prevCardImage(productId, totalImages);
    }
    touchStartMapRef.current[productId] = null;
  };

  return (
    <>
      {showSplash && <AppSplash />}

      <div style={styles.page}>
        {/* ── STICKY HEADER ── */}
        <header style={styles.header}>
          <button type="button" onClick={resetPage} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={styles.logoWrap}>
              <div style={styles.logoText}>MONTREAUX</div>
              <div style={styles.logoSub}>Fashion House</div>
            </div>
          </button>
        </header>

        {/* ── SEARCH ── */}
        <div style={styles.searchBar}>
          <SearchIcon />
          <input
            placeholder="Поиск по коллекции..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* ── DEPARTMENT TOGGLE ── */}
        <div style={styles.deptToggle}>
          {departments.map((dep) => (
            <button
              key={dep}
              type="button"
              onClick={() => {
                setSelectedDepartment(dep);
                setSelectedBrand("Все бренды");
                setSelectedAvailability("Все товары");
                setSearch("");
              }}
              style={styles.deptBtn(selectedDepartment === dep)}
            >
              {dep}
            </button>
          ))}
        </div>

        {/* ── CATEGORIES ── */}
        <div style={styles.categoriesWrap}>
          <div style={styles.categoriesInner}>
            {currentCategories.map((cat) => {
              const isActive = currentCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    if (selectedDepartment === "Мужчинам") setSelectedMensCategory(cat as MensCategory);
                    else setSelectedWomensCategory(cat as WomensCategory);
                  }}
                  style={styles.categoryBtn(isActive)}
                >
                  <div style={styles.categoryIcon(isActive)}>
                    <CategoryIcon name={cat} active={isActive} />
                  </div>
                  <span style={styles.categoryLabel(isActive)}>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── BANNER ── */}
        <div style={{ margin: "16px 16px 0" }}>
          <button
            type="button"
            onClick={() => router.push(banners[0].link)}
            style={{ ...styles.bannerWrap, width: "100%", padding: 0, border: "none", cursor: "pointer" }}
          >
            <img src={banners[0].image} alt={banners[0].alt} style={styles.bannerImg} />
            <div style={styles.bannerOverlay} />
            <div style={styles.bannerGold} />
            <div style={styles.bannerContent}>
              <div style={styles.bannerEyebrow}>Новая коллекция</div>
              <div style={styles.bannerTitle}>Весна Лето 2026</div>
              <div style={styles.bannerCta}>
                Смотреть
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </div>
          </button>
        </div>

        {/* ── DIVIDER ── */}
        <div style={styles.sectionDivider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>Каталог</span>
          <div style={styles.dividerLine} />
        </div>

        {/* ── AVAILABILITY CHIPS ── */}
        <div style={styles.filtersRow}>
          {["Все товары", "В наличии", "Из-за рубежа"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSelectedAvailability(opt)}
              style={styles.filterChip(selectedAvailability === opt)}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* ── SORT / BRAND ROW ── */}
        <div style={styles.sortRow}>
          {/* Brand dropdown */}
          <div style={{ position: "relative" }} ref={brandMenuWrapRef}>
            <button type="button" onClick={() => setShowBrandMenu((p) => !p)} style={styles.sortBtn}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{selectedBrand}</span>
              <ChevronDownIcon />
            </button>
            {showBrandMenu && (
              <div style={styles.dropdown}>
                <button type="button" onClick={() => { setSelectedBrand("Все бренды"); setShowBrandMenu(false); }} style={styles.dropdownItem(selectedBrand === "Все бренды")}>
                  Все бренды
                </button>
                {initialBrands.map((b) => (
                  <button key={b.id} type="button" onClick={() => { setSelectedBrand(b.name); setShowBrandMenu(false); }} style={styles.dropdownItem(selectedBrand === b.name)}>
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort dropdown */}
          <div style={{ position: "relative" }} ref={sortMenuRef}>
            <button type="button" onClick={() => setShowSortMenu((p) => !p)} style={styles.sortBtn}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{selectedSort}</span>
              <ChevronDownIcon />
            </button>
            {showSortMenu && (
              <div style={{ ...styles.dropdown, right: 0, left: "auto" }}>
                {sortOptions.map((opt) => (
                  <button key={opt} type="button" onClick={() => { setSelectedSort(opt); setShowSortMenu(false); }} style={styles.dropdownItem(selectedSort === opt)}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter icon */}
          <div style={{ position: "relative" }} ref={availabilityMenuRef}>
            <button type="button" onClick={() => setShowAvailabilityMenu((p) => !p)} style={styles.filterIconBtn}>
              <FilterIcon />
            </button>
            {showAvailabilityMenu && (
              <div style={{ ...styles.dropdown, right: 0, left: "auto", minWidth: "180px" }}>
                {["Все товары", "В наличии", "Из-за рубежа"].map((opt) => (
                  <button key={opt} type="button" onClick={() => { setSelectedAvailability(opt); setShowAvailabilityMenu(false); }} style={styles.dropdownItem(selectedAvailability === opt)}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── PRODUCTS GRID ── */}
        {filteredProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: "15px", fontFamily: "'Georgia', serif", color: "rgba(240,237,232,0.7)", marginBottom: "8px" }}>
              {selectedDepartment === "Женщинам" ? "Женский раздел пока в разработке" : "Ничего не найдено"}
            </p>
            <p style={{ fontSize: "12px", fontFamily: "'Helvetica Neue', sans-serif", color: "rgba(240,237,232,0.3)", letterSpacing: "0.03em" }}>
              {selectedDepartment === "Женщинам" ? "Скоро здесь появятся товары" : "Попробуйте изменить фильтры"}
            </p>
          </div>
        ) : (
          <div style={styles.productsGrid}>
            {filteredProducts.map((p) => {
              const discountPercent = getDiscountPercent(p.oldPrice, p.price);
              const selectedColor = selectedCardColors[p.id] || p.defaultColor || p.colors?.[0] || "";
              const colorGallery = selectedColor ? p.galleryByColor?.[selectedColor] || [] : [];
              const colorImage = selectedColor ? p.colorImages?.[selectedColor] : "";
              const baseImages = colorGallery.length > 0 ? colorGallery : colorImage ? [colorImage] : p.images?.length ? p.images : [p.image];
              const imageCount = baseImages.length || 1;
              const currentImageIndex = cardImageIndexes[p.id] || 0;
              const currentImage = baseImages[currentImageIndex] || p.image || "/products/product-1.jpg";
              const visibleColors = (p.colors || []).slice(0, 4);
              const extraColorsCount = getExtraColorsCount(p.colors || []);
              const isForeign = p.badge?.trim().toLowerCase() === "из-за рубежа";

              return (
                <article
                  key={p.id}
                  onClick={() => router.push(`/product?id=${p.id}`)}
                  onMouseEnter={() => router.prefetch(`/product?id=${p.id}`)}
                  style={styles.card}
                >
                  {/* Image */}
                  <div
                    style={styles.cardImageWrap}
                    onTouchStart={(e) => handleCardTouchStart(p.id, e.touches[0]?.clientX ?? 0)}
                    onTouchEnd={(e) => handleCardTouchEnd(p.id, e.changedTouches[0]?.clientX ?? 0, imageCount)}
                  >
                    <img
                      src={currentImage}
                      alt={p.name}
                      style={styles.cardImg}
                      onError={(e) => { e.currentTarget.src = "/products/product-1.jpg"; }}
                    />

                    {/* Subtle bottom gradient on image */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent)", pointerEvents: "none" }} />

                    {discountPercent > 0 && (
                      <div style={styles.cardDiscount}>−{discountPercent}%</div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
                      style={styles.heartBtn}
                      aria-label="В избранное"
                    >
                      <HeartIcon active={favorites.includes(p.id)} />
                    </button>

                    {/* Image dots */}
                    {imageCount > 1 && (
                      <div style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "4px" }}>
                        {Array.from({ length: Math.min(imageCount, 4) }).map((_, i) => (
                          <div key={i} style={{ width: i === currentImageIndex ? "14px" : "5px", height: "5px", borderRadius: "3px", background: i === currentImageIndex ? "#C9A96E" : "rgba(255,255,255,0.4)", transition: "all 0.2s ease" }} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div style={styles.cardBody}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={styles.cardBrand}>{p.brand}</span>
                      {isForeign && <span style={styles.foreignBadge}>зарубеж</span>}
                    </div>

                    <div style={styles.cardName}>{p.name}</div>

                    {/* Color swatches */}
                    {visibleColors.length > 0 && (
                      <div style={styles.colorsRow}>
                        {visibleColors.map((color, idx) => (
                          <button
                            key={`${p.id}-${color}-${idx}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCardColors((prev) => ({ ...prev, [p.id]: color }));
                              setCardImageIndexes((prev) => ({ ...prev, [p.id]: 0 }));
                            }}
                            style={styles.colorSwatch(color, selectedColor === color, color === "Белый")}
                            aria-label={`Цвет ${color}`}
                          />
                        ))}
                        {extraColorsCount > 0 && (
                          <span style={{ fontSize: "9px", color: "rgba(201,169,110,0.6)", fontFamily: "'Helvetica Neue', sans-serif" }}>+{extraColorsCount}</span>
                        )}
                      </div>
                    )}

                    {/* Price */}
                    <div style={styles.cardPriceRow}>
                      {p.oldPrice ? <span style={styles.cardOldPrice}>{formatPrice(p.oldPrice)} ₽</span> : null}
                      <span style={styles.cardPrice}>{formatPrice(p.price)} ₽</span>
                    </div>

                    {/* Delivery */}
                    <div style={styles.cardDelivery}>
                      <TruckIcon />
                      <span>7–14 дней</span>
                    </div>

                    {/* Add to cart */}
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      style={styles.addToCartBtn}
                      aria-label="Добавить в корзину"
                    >
                      <CartIcon />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <BottomNav />
      </div>

      {/* Global style overrides */}
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        input::placeholder { color: rgba(240,237,232,0.25); }
        input { caret-color: #C9A96E; }
        article:active { transform: scale(0.985); }
        button { -webkit-appearance: none; }
      `}</style>
    </>
  );
}