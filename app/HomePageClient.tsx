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

const banners = [
  {
    image: "/banner.jpg",
    alt: "Весна Лето 2026",
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
  defaultColor?: string;
  type?: "top" | "bottom";
  category: string;
  colors: string[];
  sizes: string[];
  description?: string;
};

const colorSwatches: Record<string, string> = {
  Черный: "#050505",
  Белый: "#FFFFFF",
  Серый: "#7D7D78",
  Синий: "#0D1830",
  Бежевый: "#D8C4A9",
  Зеленый: "#6F7659",
  Коричневый: "#7A5230",
};

function CategoryIcon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "Все") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" rx="1.5" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" />
      </svg>
    );
  }

  if (name === "Футболки") {
    return (
      <svg {...common}>
        <path d="M8 4 5 6.5 3 10l3 2 1-1v9h10v-9l1 1 3-2-2-3.5L16 4h-2a2 2 0 0 1-4 0H8Z" />
      </svg>
    );
  }

  if (name === "Поло") {
    return (
      <svg {...common}>
        <path d="M8 4h8l3 3v13H5V7l3-3Z" />
        <path d="M9 4 12 7l3-3" />
        <path d="M12 7v5" />
      </svg>
    );
  }

  if (name === "Джинсы" || name === "Брюки") {
    return (
      <svg {...common}>
        <path d="M8 4h8l1 16h-4l-1-10-1 10H7L8 4Z" />
        <path d="M8 7h8" />
      </svg>
    );
  }

  if (name === "Костюмы") {
    return (
      <svg {...common}>
        <path d="M8 5h8l2 4v11h-5l-1-6-1 6H6V9l2-4Z" />
        <path d="M7 12h10" />
        <path d="M8 20h8" />
      </svg>
    );
  }

  if (name === "Платья") {
    return (
      <svg {...common}>
        <path d="M9 4h6l1 5 3 11H5L8 9l1-5Z" />
        <path d="M9 4a3 3 0 0 0 6 0" />
      </svg>
    );
  }

  if (name === "Рубашки") {
    return (
      <svg {...common}>
        <path d="M8 4h8l3 3v13H5V7l3-3Z" />
        <path d="M9 4 12 7l3-3" />
        <path d="M12 7v13" />
      </svg>
    );
  }

  if (name === "Юбки") {
    return (
      <svg {...common}>
        <path d="M8 5h8l3 15H5L8 5Z" />
        <path d="M8 8h8" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h8v10h-1" />
      <path d="M14 10h3l3 3v4h-1" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L17 17" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  );
}

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

      if (availabilityMenuRef.current && !availabilityMenuRef.current.contains(event.target as Node)) {
        setShowAvailabilityMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];

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

  const currentCategory =
    selectedDepartment === "Мужчинам" ? selectedMensCategory : selectedWomensCategory;

  const currentCategories =
    selectedDepartment === "Мужчинам" ? mensCategories : womensCategories;

  const departmentProducts = useMemo(() => {
    if (selectedDepartment === "Женщинам") return [];
    return initialProducts;
  }, [initialProducts, selectedDepartment]);

  const filteredProducts = useMemo(() => {
    const result = departmentProducts.filter((item) => {
      const matchesCategory =
        currentCategory === "Все" || item.category === currentCategory;

      const matchesBrand =
        selectedBrand === "Все бренды" || item.brand === selectedBrand;

      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.brand.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());

      const matchesAvailability =
        selectedAvailability === "Все товары" || item.badge === selectedAvailability;

      return matchesCategory && matchesBrand && matchesSearch && matchesAvailability;
    });

    if (selectedSort === "Сначала дешевле") {
      return [...result].sort((a, b) => a.price - b.price);
    }

    if (selectedSort === "Сначала дороже") {
      return [...result].sort((a, b) => b.price - a.price);
    }

    if (selectedSort === "Скидки") {
      return [...result].sort(
        (a, b) =>
          getDiscountPercent(b.oldPrice, b.price) -
          getDiscountPercent(a.oldPrice, a.price)
      );
    }

    if (selectedSort === "Новинки") {
      return [...result].filter((item) => item.badge === "Новинка");
    }

    return result;
  }, [
    departmentProducts,
    currentCategory,
    selectedBrand,
    selectedSort,
    selectedAvailability,
    search,
  ]);

  const nextCardImage = (productId: string, totalImages: number) => {
    if (totalImages <= 1) return;

    setCardImageIndexes((prev) => {
      const currentIndex = prev[productId] || 0;
      const nextIndex = currentIndex >= totalImages - 1 ? 0 : currentIndex + 1;

      return { ...prev, [productId]: nextIndex };
    });
  };

  const prevCardImage = (productId: string, totalImages: number) => {
    if (totalImages <= 1) return;

    setCardImageIndexes((prev) => {
      const currentIndex = prev[productId] || 0;
      const nextIndex = currentIndex <= 0 ? totalImages - 1 : currentIndex - 1;

      return { ...prev, [productId]: nextIndex };
    });
  };

  const handleCardTouchStart = (productId: string, clientX: number) => {
    touchStartMapRef.current[productId] = clientX;
  };

  const handleCardTouchEnd = (
    productId: string,
    clientX: number,
    totalImages: number
  ) => {
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

      <main className="min-h-screen bg-[#F5F5F5] px-3 pt-[76px] pb-32 text-black">
        <div className="mb-4 flex items-center justify-center">
          <button type="button" onClick={resetPage} className="text-center">
            <p className="text-[18px] font-semibold tracking-[0.13em] text-black">
              MONTREAUX
            </p>
            <p className="mt-0.5 text-[8px] uppercase tracking-[0.32em] text-gray-400">
              Fashion
            </p>
          </button>
        </div>

        <div className="rounded-[22px] bg-white p-3 shadow-[0_12px_34px_rgba(15,23,42,0.055)]">
          <div className="rounded-[17px] bg-[#F5F5F5] px-3.5 py-3">
            <div className="flex items-center gap-3 text-gray-400">
              <SearchIcon />

              <input
                placeholder="Поиск товаров..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="mt-3 rounded-[16px] bg-[#F2F2F2] p-1">
            <div className="grid grid-cols-2 gap-1">
              {departments.map((department) => (
                <button
                  key={department}
                  type="button"
                  onClick={() => {
                    setSelectedDepartment(department);
                    setSelectedBrand("Все бренды");
                    setSelectedAvailability("Все товары");
                    setSearch("");
                  }}
                  className={`rounded-[13px] px-4 py-2.5 text-[13px] font-medium transition-all ${
                    selectedDepartment === department
                      ? "bg-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.13)]"
                      : "text-[#525252]"
                  }`}
                >
                  {department}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <div className="flex min-w-max gap-3 pr-6">
              {currentCategories.map((category) => {
                const isActive = currentCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      if (selectedDepartment === "Мужчинам") {
                        setSelectedMensCategory(category as MensCategory);
                      } else {
                        setSelectedWomensCategory(category as WomensCategory);
                      }
                    }}
                    className="w-[64px] shrink-0"
                  >
                    <div
                      className={`flex h-[56px] w-[64px] items-center justify-center rounded-[15px] transition ${
                        isActive
                          ? "bg-black text-white shadow-[0_10px_22px_rgba(0,0,0,0.16)]"
                          : "bg-[#F6F6F6] text-black"
                      }`}
                    >
                      <CategoryIcon name={category} />
                    </div>

                    <p
                      className={`mt-1.5 truncate text-center text-[11px] ${
                        isActive ? "font-medium text-black" : "text-[#525252]"
                      }`}
                    >
                      {category}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-[20px] bg-white shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
          <button
            type="button"
            onClick={() => router.push(banners[0].link)}
            className="relative block h-[176px] w-full overflow-hidden"
          >
            <img
              src={banners[0].image}
              alt={banners[0].alt}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/58 via-black/24 to-transparent" />

            <div className="absolute left-4 top-4 max-w-[190px] text-left">
              <p className="text-[11px] text-white/75">Новая коллекция</p>
              <h2 className="mt-1 text-[24px] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
                Весна Лето 2026
              </h2>
              <span className="mt-4 inline-flex rounded-[10px] bg-white px-4 py-2 text-[12px] font-medium text-black">
                Смотреть
              </span>
            </div>
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {["Все товары", "В наличии", "Из-за рубежа"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSelectedAvailability(option)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-[12px] font-medium transition ${
                selectedAvailability === option
                  ? "border border-black bg-white text-black"
                  : "bg-white text-[#525252]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
          <div className="relative" ref={brandMenuWrapRef}>
            <button
              type="button"
              onClick={() => setShowBrandMenu((prev) => !prev)}
              className="flex h-[42px] w-full items-center justify-between rounded-[13px] bg-white px-3 text-[12px] font-medium text-black shadow-[0_6px_18px_rgba(0,0,0,0.04)]"
            >
              <span className="truncate">{selectedBrand}</span>
              <ChevronDownIcon />
            </button>

            {showBrandMenu && (
              <div className="absolute left-0 top-[48px] z-50 max-h-72 w-full overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrand("Все бренды");
                    setShowBrandMenu(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-[13px] ${
                    selectedBrand === "Все бренды" ? "bg-black text-white" : "text-gray-700"
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
                      selectedBrand === brand.name ? "bg-black text-white" : "text-gray-700"
                    }`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={sortMenuRef}>
            <button
              type="button"
              onClick={() => setShowSortMenu((prev) => !prev)}
              className="flex h-[42px] w-full items-center justify-between rounded-[13px] bg-white px-3 text-[12px] font-medium text-black shadow-[0_6px_18px_rgba(0,0,0,0.04)]"
            >
              <span className="truncate">{selectedSort}</span>
              <ChevronDownIcon />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 top-[48px] z-50 w-full rounded-2xl bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSelectedSort(option);
                      setShowSortMenu(false);
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-[13px] ${
                      selectedSort === option ? "bg-black text-white" : "text-gray-700"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={availabilityMenuRef}>
            <button
              type="button"
              onClick={() => setShowAvailabilityMenu((prev) => !prev)}
              className="flex h-[42px] w-[44px] items-center justify-center rounded-[13px] bg-white text-black shadow-[0_6px_18px_rgba(0,0,0,0.04)]"
            >
              <FilterIcon />
            </button>

            {showAvailabilityMenu && (
              <div className="absolute right-0 top-[48px] z-50 w-52 rounded-2xl bg-white p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
                {["Все товары", "В наличии", "Из-за рубежа"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSelectedAvailability(option);
                      setShowAvailabilityMenu(false);
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-[13px] ${
                      selectedAvailability === option ? "bg-black text-white" : "text-gray-700"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mt-4 rounded-[22px] bg-white p-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
            <p className="text-[16px] font-medium text-black">
              {selectedDepartment === "Женщинам" ? "Женский раздел пока в разработке" : "Ничего не найдено"}
            </p>
            <p className="mt-2 text-sm text-gray-400">
              {selectedDepartment === "Женщинам" ? "Скоро здесь появятся товары" : "Попробуйте изменить фильтры"}
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-[8px]">
            {filteredProducts.map((p) => {
              const discountPercent = getDiscountPercent(p.oldPrice, p.price);
              const imageCount = p.images?.length || 1;
              const currentImageIndex = cardImageIndexes[p.id] || 0;
              const currentImage =
                p.images?.[currentImageIndex] ||
                p.image ||
                "/products/product-1.jpg";
              const visibleColors = (p.colors || []).slice(0, 4);
              const extraColorsCount = getExtraColorsCount(p.colors || []);
              const isForeign = p.badge?.trim().toLowerCase() === "из-за рубежа";

              return (
                <article
                  key={p.id}
                  onClick={() => router.push(`/product?id=${p.id}`)}
                  onMouseEnter={() => router.prefetch(`/product?id=${p.id}`)}
                  className="cursor-pointer overflow-hidden rounded-[12px] bg-white shadow-[0_8px_22px_rgba(0,0,0,0.07)]"
                >
                  <div
                    className="relative aspect-[4/5] overflow-hidden bg-white"
                    onTouchStart={(e) =>
                      handleCardTouchStart(p.id, e.touches[0]?.clientX ?? 0)
                    }
                    onTouchEnd={(e) =>
                      handleCardTouchEnd(
                        p.id,
                        e.changedTouches[0]?.clientX ?? 0,
                        imageCount
                      )
                    }
                  >
                    <img
                      src={currentImage}
                      alt={p.name}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/products/product-1.jpg";
                      }}
                    />

                    {isForeign && (
                      <div className="absolute left-[7px] top-[7px] rounded-[3px] bg-black/45 px-[6px] py-[4px] text-[8px] font-semibold uppercase leading-none tracking-[-0.01em] text-white backdrop-blur-sm">
                        Из-за рубежа
                      </div>
                    )}

                    {discountPercent > 0 && (
                      <div
                        className="absolute bottom-0 left-0 bg-[#F2381D] pb-[4px] pl-[7px] pr-[15px] pt-[4px] text-[9px] font-semibold leading-none text-white"
                        style={{
                          clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 100%, 0 100%)",
                        }}
                      >
                        -{discountPercent}%
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(p.id);
                      }}
                      className="absolute right-[10px] top-[10px] z-20 text-black drop-shadow-[0_1px_5px_rgba(255,255,255,0.85)]"
                      aria-label="В избранное"
                    >
                      <HeartIcon active={favorites.includes(p.id)} />
                    </button>
                  </div>

                  <div className="px-[11px] pb-[12px] pt-[10px]">
                    <p className="truncate text-[9px] font-medium uppercase tracking-[0.13em] text-[#9B9B9B]">
                      {p.brand}
                    </p>

                    <h3 className="mt-[4px] line-clamp-2 min-h-[28px] text-[12px] font-medium leading-[1.15] tracking-[-0.01em] text-[#111111]">
                      {p.name}
                    </h3>

                    <div className="mt-[9px] flex items-center gap-[5px]">
                      {visibleColors.map((color, index) => (
                        <span
                          key={`${p.id}-${color}-${index}`}
                          className={`block h-[13px] w-[13px] rounded-full border ${
                            color === "Белый" ? "border-[#CFCFCF]" : "border-black/10"
                          }`}
                          style={{
                            backgroundColor: colorSwatches[color] || "#D1D5DB",
                          }}
                        />
                      ))}

                      {extraColorsCount > 0 && (
                        <span className="text-[10px] font-medium text-[#707070]">
                          +{extraColorsCount}
                        </span>
                      )}
                    </div>

                    <div className="mt-[11px] flex items-end justify-between gap-2">
                      <div className="flex min-w-0 items-end gap-[7px]">
                        {p.oldPrice ? (
                          <span className="text-[12px] font-medium leading-none text-[#A3A3A3] line-through">
                            {formatPrice(p.oldPrice)} ₽
                          </span>
                        ) : null}

                        <span className="text-[18px] font-semibold leading-none tracking-[-0.03em] text-[#37A536]">
                          {formatPrice(p.price)} ₽
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#6D5CFF] text-white shadow-[0_8px_16px_rgba(109,92,255,0.34)]"
                        aria-label="Добавить в корзину"
                      >
                        <CartIcon />
                      </button>
                    </div>

                    <div className="mt-[10px] flex items-center gap-[5px] text-[9px] font-medium text-[#666]">
                      <TruckIcon />
                      <span>Доставка 7–14 дней</span>
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