"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import BottomNav from "./components/BottomNav";
import AppSplash from "./components/AppSplash";
import { getTelegramWebApp } from "./lib/telegram-mini-app";

const departments = ["Мужская одежда", "Женская одежда"] as const;
const mensCategories = ["Все", "Футболки", "Поло", "Джинсы", "Брюки", "Костюмы"] as const;
const womensCategories = ["Все", "Платья", "Футболки", "Рубашки", "Брюки", "Юбки"] as const;
const sortOptions = ["По умолчанию", "Сначала дешевле", "Сначала дороже"] as const;

const banners = [
  {
    image: "/banner.jpg",
    alt: "Баннер",
    link: "/",
  },
] as const;

type Department = (typeof departments)[number];
type MensCategory = (typeof mensCategories)[number];
type WomensCategory = (typeof womensCategories)[number];
type SortOption = (typeof sortOptions)[number];

type BrandRow = {
  id: string;
  name: string;
  created_at: string;
};

type BadgeRow = {
  id: string;
  name: string;
  created_at: string;
};

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
  defaultColor: string;
  type: "top" | "bottom";
  category: "Футболки" | "Поло" | "Джинсы" | "Брюки" | "Костюмы";
  colors: string[];
  sizes: string[];
  description: string;
};

const colorSwatches: Record<string, string> = {
  Черный: "#111111",
  Белый: "#F5F5F5",
  Серый: "#8F8F8F",
  Синий: "#243B63",
  Бежевый: "#D8CBB8",
  Зеленый: "#7C8D74",
  Коричневый: "#7A5230",
};

function getDiscountPercent(oldPrice: number | null, price: number) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function formatPriceNumber(value: number | null | undefined) {
  if (!value) return "";
  return value.toLocaleString("ru-RU");
}

function getExtraColorsLabel(colors: string[] | undefined) {
  const count = Array.isArray(colors) ? colors.length : 0;
  const extra = count - 3;

  if (extra <= 0) return "";
  if (extra === 1) return "+1";
  return `+${extra}`;
}

function getDeliveryLabel() {
  return "Доставка 7–14 дней";
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L17 17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h3l4 4v2h-7" />
      <circle cx="7" cy="18" r="1.5" />
      <circle cx="17" cy="18" r="1.5" />
    </svg>
  );
}

function CategoryIcon({ name }: { name: string }) {
  const p = {
    width: 22,
    height: 22,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "Все") {
    return (
      <svg {...p}>
        <rect x="7" y="7" width="6" height="6" rx="1.4" />
        <rect x="19" y="7" width="6" height="6" rx="1.4" />
        <rect x="7" y="19" width="6" height="6" rx="1.4" />
        <rect x="19" y="19" width="6" height="6" rx="1.4" />
      </svg>
    );
  }

  if (name === "Футболки") {
    return (
      <svg {...p}>
        <path d="M11 7h3a2 2 0 0 0 4 0h3l5 4-3 5-2.2-1.3V26H11.2V14.7L9 16l-3-5 5-4Z" />
      </svg>
    );
  }

  if (name === "Поло") {
    return (
      <svg {...p}>
        <path d="M10 7h12l3 4v15H7V11l3-4Z" />
        <path d="M11 7l5 5 5-5" />
        <path d="M16 12v5" />
        <path d="M13.5 17h5" />
      </svg>
    );
  }

  if (name === "Джинсы") {
    return (
      <svg {...p}>
        <path d="M11 6h10l1.4 20h-5.1L16 14.2 14.7 26H9.6L11 6Z" />
        <path d="M11 10h10" />
        <path d="M16 6v8" />
        <path d="M13 10v2" />
        <path d="M19 10v2" />
      </svg>
    );
  }

  if (name === "Брюки") {
    return (
      <svg {...p}>
        <path d="M12 6h8l1.5 20h-4.4L16 13.5 14.9 26h-4.4L12 6Z" />
        <path d="M12 10h8" />
        <path d="M16 6v7.5" />
      </svg>
    );
  }

  if (name === "Костюмы") {
    return (
      <svg {...p}>
        <path d="M10 7h12l3 5v14H7V12l3-5Z" />
        <path d="M12 7l4 6 4-6" />
        <path d="M16 13v13" />
        <path d="M11 18h3" />
        <path d="M18 18h3" />
      </svg>
    );
  }

  if (name === "Платья") {
    return (
      <svg {...p}>
        <path d="M12 6h8l2 6-3 2 4 12H9l4-12-3-2 2-6Z" />
        <path d="M14 6c.4 1.4 1.1 2.1 2 2.1S17.6 7.4 18 6" />
      </svg>
    );
  }

  if (name === "Рубашки") {
    return (
      <svg {...p}>
        <path d="M10 7h12l3 4v15H7V11l3-4Z" />
        <path d="M11 7l5 5 5-5" />
        <path d="M16 12v14" />
        <path d="M12 17h8" />
      </svg>
    );
  }

  if (name === "Юбки") {
    return (
      <svg {...p}>
        <path d="M12 8h8l4 18H8l4-18Z" />
        <path d="M11 8V5h10v3" />
        <path d="M14 12l-2 14" />
        <path d="M18 12l2 14" />
      </svg>
    );
  }

  return (
    <svg {...p}>
      <circle cx="16" cy="16" r="10" />
    </svg>
  );
}

function PriceText({ value }: { value: number }) {
  return (
    <span className="inline-flex items-baseline gap-[2px]">
      <span>{formatPriceNumber(value)}</span>
      <span className="text-[0.78em] font-semibold">₽</span>
    </span>
  );
}

export default function HomePageClient({
  initialProducts,
  initialBrands,
  initialBadges,
}: {
  initialProducts: HomeProduct[];
  initialBrands: BrandRow[];
  initialBadges: BadgeRow[];
}) {
  const router = useRouter();

  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department>("Мужская одежда");
  const [selectedMensCategory, setSelectedMensCategory] = useState<MensCategory>("Все");
  const [selectedWomensCategory, setSelectedWomensCategory] = useState<WomensCategory>("Все");
  const [selectedBrand, setSelectedBrand] = useState("Все бренды");
  const [selectedSort, setSelectedSort] = useState<SortOption>("По умолчанию");
  const [selectedBadge, setSelectedBadge] = useState("Все");
  const [search, setSearch] = useState("");
  const [activeBanner] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showBrandMenu, setShowBrandMenu] = useState(false);

  const [cardImageIndexes, setCardImageIndexes] = useState<Record<string, number>>({});

  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const brandMenuWrapRef = useRef<HTMLDivElement | null>(null);
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

    if (splashShown === "1") {
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
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }

      if (brandMenuWrapRef.current && !brandMenuWrapRef.current.contains(event.target as Node)) {
        setShowBrandMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id) ? favorites.filter((i) => i !== id) : [...favorites, id];

    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
    window.dispatchEvent(new Event("favorites-updated"));
  };

  const resetPage = () => {
    setSelectedDepartment("Мужская одежда");
    setSelectedMensCategory("Все");
    setSelectedWomensCategory("Все");
    setSelectedBrand("Все бренды");
    setSelectedSort("По умолчанию");
    setSelectedBadge("Все");
    setSearch("");
    setShowSortMenu(false);
    setShowBrandMenu(false);
    router.push("/");
  };

  const resetFilters = () => {
    setSelectedMensCategory("Все");
    setSelectedWomensCategory("Все");
    setSelectedBrand("Все бренды");
    setSelectedSort("По умолчанию");
    setSelectedBadge("Все");
    setSearch("");
    setShowSortMenu(false);
    setShowBrandMenu(false);
  };

  const prefetchProduct = (productId: string) => {
    router.prefetch(`/product?id=${productId}`);
  };

  const nextCardImage = (productId: string, totalImages: number) => {
    if (totalImages <= 1) return;

    setCardImageIndexes((prev) => {
      const currentIndex = prev[productId] || 0;
      const nextIndex = currentIndex >= totalImages - 1 ? 0 : currentIndex + 1;

      return {
        ...prev,
        [productId]: nextIndex,
      };
    });
  };

  const prevCardImage = (productId: string, totalImages: number) => {
    if (totalImages <= 1) return;

    setCardImageIndexes((prev) => {
      const currentIndex = prev[productId] || 0;
      const nextIndex = currentIndex <= 0 ? totalImages - 1 : currentIndex - 1;

      return {
        ...prev,
        [productId]: nextIndex,
      };
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
      if (diff > 0) {
        nextCardImage(productId, totalImages);
      } else {
        prevCardImage(productId, totalImages);
      }
    }

    touchStartMapRef.current[productId] = null;
  };

  const currentCategory = selectedDepartment === "Мужская одежда" ? selectedMensCategory : selectedWomensCategory;
  const currentCategories = selectedDepartment === "Мужская одежда" ? mensCategories : womensCategories;

  const departmentProducts = useMemo(() => {
    if (selectedDepartment === "Женская одежда") {
      return [];
    }

    return initialProducts;
  }, [initialProducts, selectedDepartment]);

  const filteredProducts = useMemo(() => {
    const result = departmentProducts.filter((item) => {
      const matchesCategory = currentCategory === "Все" || item.category === currentCategory;
      const matchesBrand = selectedBrand === "Все бренды" || item.brand === selectedBrand;

      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      const matchesBadge = selectedBadge === "Все" || item.badge === selectedBadge;

      return matchesCategory && matchesBrand && matchesSearch && matchesBadge;
    });

    if (selectedSort === "Сначала дешевле") {
      return [...result].sort((a, b) => a.price - b.price);
    }

    if (selectedSort === "Сначала дороже") {
      return [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [departmentProducts, currentCategory, selectedBrand, selectedSort, selectedBadge, search]);

  const activeFiltersCount = [
    currentCategory !== "Все",
    selectedBrand !== "Все бренды",
    selectedSort !== "По умолчанию",
    selectedBadge !== "Все",
    search.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <>
      {showSplash && <AppSplash />}

      <main className="min-h-screen overflow-x-hidden bg-[#F5F5F5] px-3 pb-32 pt-[70px]">
        <section className="text-center">
          <button type="button" onClick={resetPage} className="mx-auto block max-w-full text-[32px] font-semibold leading-none tracking-[0.16em] text-black">
            MONTREAUX
          </button>
        </section>

        <section className="mt-4">
          <div className="rounded-[20px] border border-black/[0.04] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.035)]">
            <div className="flex items-center gap-3 text-gray-400">
              <SearchIcon />

              <input
                placeholder="Искать одежду, бренд или категорию"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-[14px] font-medium text-black outline-none placeholder:text-gray-400"
              />

              {search.trim() ? (
                <button type="button" onClick={() => setSearch("")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500" aria-label="Очистить поиск">
                  <CloseIcon />
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-4">
          <div className="rounded-[20px] bg-[#E9E9E9] p-1">
            <div className="grid grid-cols-2 gap-1">
              {departments.map((department) => (
                <button
                  key={department}
                  type="button"
                  onClick={() => {
                    setSelectedDepartment(department);
                    setSelectedBrand("Все бренды");
                    setSelectedBadge("Все");
                    setSearch("");
                  }}
                  className={`rounded-[16px] px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                    selectedDepartment === department ? "bg-white text-black shadow-[0_4px_12px_rgba(0,0,0,0.07)]" : "text-[#666]"
                  }`}
                >
                  {department}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {currentCategories.map((category) => {
              const isActive = currentCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    if (selectedDepartment === "Мужская одежда") {
                      setSelectedMensCategory(category as MensCategory);
                    } else {
                      setSelectedWomensCategory(category as WomensCategory);
                    }
                  }}
                  className={`flex w-[78px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-[16px] border px-2 py-2.5 text-center transition-colors ${
                    isActive ? "border-black bg-black text-white" : "border-black/[0.06] bg-white text-black"
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-[11px] ${isActive ? "bg-white/15" : "bg-gray-100"}`}>
                    <CategoryIcon name={category} />
                  </span>
                  <span className="max-w-full truncate text-[10.5px] font-semibold leading-none">{category}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-3 overflow-hidden rounded-[22px] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
          <button type="button" onClick={() => router.push(banners[activeBanner].link)} className="relative block h-[132px] w-full overflow-hidden text-left">
            <img src={banners[activeBanner].image} alt={banners[activeBanner].alt} className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
            <span className="relative z-10 flex h-full flex-col items-start justify-between p-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">Новая коллекция</span>
              <span>
                <span className="block text-[26px] font-bold leading-[0.95] tracking-[-0.055em] text-white">Весна / Лето</span>
                <span className="block text-[26px] font-bold leading-[0.95] tracking-[-0.055em] text-white">2026</span>
              </span>
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold text-black">
                Смотреть <ArrowIcon />
              </span>
            </span>
          </button>
        </section>

        <section className="mt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-bold leading-none tracking-[-0.05em] text-black">Каталог</h2>
              <p className="mt-1 text-[12px] font-medium text-gray-500">{filteredProducts.length} товаров</p>
            </div>

            {activeFiltersCount > 0 ? (
              <button type="button" onClick={resetFilters} className="pb-0.5 text-[12px] font-semibold text-black">
                Сбросить
              </button>
            ) : null}
          </div>

          <div className="mt-3 rounded-[18px] border border-black/[0.05] bg-white p-2.5">
            <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setSelectedBadge("Все")}
                className={`h-8 shrink-0 rounded-[11px] px-3 text-[12px] font-semibold ${
                  selectedBadge === "Все" ? "bg-black text-white" : "bg-[#F5F5F5] text-[#555]"
                }`}
              >
                Все
              </button>

              {initialBadges
                .filter((badge) => ["В наличии", "Из-за рубежа"].includes(badge.name))
                .map((badge) => (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => setSelectedBadge((prev) => (prev === badge.name ? "Все" : badge.name))}
                    className={`h-8 shrink-0 rounded-[11px] px-3 text-[12px] font-semibold ${
                      selectedBadge === badge.name ? "bg-black text-white" : "bg-[#F5F5F5] text-[#555]"
                    }`}
                  >
                    {badge.name}
                  </button>
                ))}
            </div>

            <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
              <div className="relative min-w-0" ref={brandMenuWrapRef}>
                <button
                  type="button"
                  onClick={() => setShowBrandMenu((prev) => !prev)}
                  className="flex h-9 w-full items-center justify-between gap-1.5 rounded-[12px] border border-black/[0.06] bg-white px-3 text-[12px] font-semibold text-black"
                >
                  <span className="truncate">{selectedBrand}</span>
                  <ChevronIcon />
                </button>

                {showBrandMenu && (
                  <div className="absolute left-0 top-11 z-50 max-h-72 w-full overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBrand("Все бренды");
                        setShowBrandMenu(false);
                      }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-[13px] ${
                        selectedBrand === "Все бренды" ? "bg-black text-white" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Все бренды
                    </button>

                    {initialBrands.map((brand) => (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => {
                          setSelectedBrand(brand.name);
                          setShowBrandMenu(false);
                        }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-[13px] ${
                          selectedBrand === brand.name ? "bg-black text-white" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative shrink-0" ref={sortMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowSortMenu((prev) => !prev)}
                  className="flex h-9 items-center gap-1.5 rounded-[12px] border border-black/[0.06] bg-white px-3 text-[12px] font-semibold text-black"
                >
                  <span>{selectedSort}</span>
                  <ChevronIcon />
                </button>

                {showSortMenu && (
                  <div className="absolute right-0 top-11 z-30 w-44 rounded-2xl bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
                    {sortOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSelectedSort(option);
                          setShowSortMenu(false);
                        }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-[13px] ${
                          selectedSort === option ? "bg-black text-white" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {filteredProducts.length === 0 ? (
          <div className="mt-4 rounded-[22px] bg-white p-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
            <p className="text-[16px] font-semibold text-black">
              {selectedDepartment === "Женская одежда" ? "Женский раздел пока в разработке" : "Ничего не найдено"}
            </p>

            <p className="mt-2 text-sm text-gray-400">
              {selectedDepartment === "Женская одежда" ? "Скоро здесь появятся товары" : "Попробуйте изменить фильтры"}
            </p>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {filteredProducts.map((p) => {
              const discountPercent = getDiscountPercent(p.oldPrice, p.price);
              const imageCount = p.images?.length || 1;
              const currentImageIndex = Math.min(cardImageIndexes[p.id] || 0, imageCount - 1);
              const currentImage = p.images[currentImageIndex] || p.image || "/products/product-1.jpg";
              const extraColorsLabel = getExtraColorsLabel(p.colors);
              const visibleColors = (p.colors || []).slice(0, 3);
              const isForeign = p.badge.trim().toLowerCase() === "из-за рубежа";

              return (
                <article
                  key={p.id}
                  onClick={() => router.push(`/product?id=${p.id}`)}
                  onMouseEnter={() => prefetchProduct(p.id)}
                  onTouchStart={() => prefetchProduct(p.id)}
                  className="cursor-pointer overflow-hidden rounded-[14px] border border-black/[0.04] bg-white"
                >
                  <div
                    className="relative aspect-[3/4] overflow-hidden bg-[#EAEAEA]"
                    onTouchStart={(e) => handleCardTouchStart(p.id, e.touches[0]?.clientX ?? 0)}
                    onTouchEnd={(e) => handleCardTouchEnd(p.id, e.changedTouches[0]?.clientX ?? 0, imageCount)}
                  >
                    <img
                      src={currentImage}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/products/product-1.jpg";
                      }}
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(p.id);
                      }}
                      className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur"
                      aria-label="Добавить в избранное"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={favorites.includes(p.id) ? "black" : "none"} stroke="black" strokeWidth="1.7">
                        <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
                      </svg>
                    </button>

                    {imageCount > 1 ? (
                      <div className="pointer-events-none absolute bottom-2 left-2 right-2 z-20 flex items-center gap-1">
                        {Array.from({ length: Math.min(imageCount, 5) }).map((_, index) => (
                          <span key={`${p.id}-dot-${index}`} className={`h-[3px] flex-1 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-white/45"}`} />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="px-2.5 pb-2.5 pt-2">
                    <div className="flex min-h-[16px] items-center justify-between gap-1.5">
                      <span className="min-w-0 truncate text-[10px] font-normal leading-none text-gray-500">{p.brand}</span>
                      {isForeign ? (
                        <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-[3px] text-[9px] font-medium leading-none text-gray-500">
                          из-за рубежа
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-1.5 min-h-[32px] text-[12.5px] font-medium leading-[1.25] tracking-[-0.01em] text-black line-clamp-2">
                      {p.name}
                    </h3>

                    <div className="mt-2 flex min-h-[16px] items-center gap-1.5">
                      {visibleColors.map((color, index) => (
                        <span
                          key={`${p.id}-${color}-${index}`}
                          className={`block h-3 w-3 rounded-full ${color === "Белый" ? "border border-gray-300" : ""}`}
                          style={{
                            backgroundColor: colorSwatches[color] || "#D1D5DB",
                          }}
                        />
                      ))}

                      {extraColorsLabel ? (
                        <span className="text-[10px] font-medium text-gray-400">{extraColorsLabel}</span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                      <span className="text-[16px] font-bold leading-none tracking-[-0.035em] text-[#128243]">
                        <PriceText value={p.price} />
                      </span>

                      {p.oldPrice ? (
                        <span className="text-[11px] font-medium leading-none text-gray-400 line-through">
                          <PriceText value={p.oldPrice} />
                        </span>
                      ) : null}

                      {discountPercent > 0 ? (
                        <span className="text-[11px] font-semibold leading-none text-[#E13A3A]">-{discountPercent}%</span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex items-center gap-1 text-[9.5px] font-medium leading-none text-gray-400">
                      <DeliveryIcon />
                      <span>{getDeliveryLabel()}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <BottomNav />
      </main>
    </>
  );
}