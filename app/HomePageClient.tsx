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
  const extra = count - 1;

  if (extra <= 0) return "";
  if (extra === 1) return "ещё 1 цвет";
  if (extra >= 2 && extra <= 4) return `ещё ${extra} цвета`;
  return `ещё ${extra} цветов`;
}

function getDeliveryLabel(badge: string) {
  return badge.trim().toLowerCase() === "из-за рубежа" ? "7–14 дней" : "1–3 дня";
}

function TruckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h8v10h-1" />
      <path d="M14 10h3l3 3v4h-1" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function PriceText({ value }: { value: number }) {
  return (
    <span className="inline-flex items-baseline gap-[2px]">
      <span>{formatPriceNumber(value)}</span>
      <span className="text-[0.88em] font-semibold opacity-90">₽</span>
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
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department>("Мужская одежда");
  const [selectedMensCategory, setSelectedMensCategory] =
    useState<MensCategory>("Все");
  const [selectedWomensCategory, setSelectedWomensCategory] =
    useState<WomensCategory>("Все");
  const [selectedBrand, setSelectedBrand] = useState("Все бренды");
  const [selectedSort, setSelectedSort] =
    useState<SortOption>("По умолчанию");
  const [selectedBadge, setSelectedBadge] = useState("Все");
  const [search, setSearch] = useState("");
  const [activeBanner] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showBrandMenu, setShowBrandMenu] = useState(false);

  const [cardImageIndexes, setCardImageIndexes] = useState<Record<string, number>>(
    {}
  );

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
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
        setShowSortMenu(false);
      }

      if (
        brandMenuWrapRef.current &&
        !brandMenuWrapRef.current.contains(event.target as Node)
      ) {
        setShowBrandMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter((i) => i !== id)
      : [...favorites, id];

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

  const handleCardTouchEnd = (
    productId: string,
    clientX: number,
    totalImages: number
  ) => {
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

  const currentCategory =
    selectedDepartment === "Мужская одежда"
      ? selectedMensCategory
      : selectedWomensCategory;

  const currentCategories =
    selectedDepartment === "Мужская одежда" ? mensCategories : womensCategories;

  const departmentProducts = useMemo(() => {
    if (selectedDepartment === "Женская одежда") {
      return [];
    }

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

      const matchesBadge =
        selectedBadge === "Все" || item.badge === selectedBadge;

      return matchesCategory && matchesBrand && matchesSearch && matchesBadge;
    });

    if (selectedSort === "Сначала дешевле") {
      return [...result].sort((a, b) => a.price - b.price);
    }

    if (selectedSort === "Сначала дороже") {
      return [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [
    departmentProducts,
    currentCategory,
    selectedBrand,
    selectedSort,
    selectedBadge,
    search,
  ]);

  return (
    <>
      {showSplash && <AppSplash />}

      <main className="min-h-screen bg-[#F5F5F5] px-3 pt-[76px] pb-32">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400">
            Fashion
          </p>

          <button
            type="button"
            onClick={resetPage}
            className="mt-2 text-[30px] font-light tracking-[0.35em] text-black"
          >
            MONTREAUX
          </button>
        </div>

        <div className="mt-4">
          <div className="rounded-[22px] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="1.8"
                className="shrink-0"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20L17 17" />
              </svg>

              <input
                placeholder="Поиск товаров..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-[24px] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={() => router.push(banners[activeBanner].link)}
            className="relative block w-full"
          >
            <img
              src={banners[activeBanner].image}
              alt={banners[activeBanner].alt}
              className="block h-[150px] w-full object-cover"
            />
          </button>
        </div>

        <div className="mt-4">
          <div className="rounded-[22px] bg-[#F6F6F6] p-1">
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
                  className={`rounded-[18px] px-4 py-3 text-[14px] font-medium transition-all duration-200 ${
                    selectedDepartment === department
                      ? "bg-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
                      : "bg-transparent text-black"
                  }`}
                >
                  {department}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <div className="flex min-w-max gap-2">
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
                    className={`rounded-full px-4 py-2.5 text-[13px] transition-all duration-200 ${
                      isActive
                        ? "bg-black text-white"
                        : "bg-white text-[#4B5563]"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <div className="flex min-w-max gap-2">
              <button
                type="button"
                onClick={() => setSelectedBadge("Все")}
                className={`rounded-full px-4 py-2.5 text-[13px] transition-all duration-200 ${
                  selectedBadge === "Все"
                    ? "bg-black text-white"
                    : "bg-white text-[#4B5563]"
                }`}
              >
                Все
              </button>

              {initialBadges
                .filter((badge) =>
                  ["В наличии", "Из-за рубежа"].includes(badge.name)
                )
                .map((badge) => (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() =>
                      setSelectedBadge((prev) =>
                        prev === badge.name ? "Все" : badge.name
                      )
                    }
                    className={`rounded-full px-4 py-2.5 text-[13px] transition-all duration-200 ${
                      selectedBadge === badge.name
                        ? "bg-black text-white"
                        : "bg-white text-[#4B5563]"
                    }`}
                  >
                    {badge.name}
                  </button>
                ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="relative min-w-0 flex-1" ref={brandMenuWrapRef}>
              <button
                type="button"
                onClick={() => setShowBrandMenu((prev) => !prev)}
                className="flex items-center gap-1.5 text-[13px] font-medium text-black"
              >
                <span className="truncate">{selectedBrand}</span>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0 text-gray-400"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {showBrandMenu && (
                <div className="absolute left-0 top-8 z-50 max-h-72 w-full overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrand("Все бренды");
                      setShowBrandMenu(false);
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-[13px] ${
                      selectedBrand === "Все бренды"
                        ? "bg-black text-white"
                        : "text-gray-700 hover:bg-gray-50"
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
                        selectedBrand === brand.name
                          ? "bg-black text-white"
                          : "text-gray-700 hover:bg-gray-50"
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
                className="flex items-center gap-1.5 text-[13px] font-medium text-black"
              >
                <span>{selectedSort}</span>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-400"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-8 z-30 w-44 rounded-2xl bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setSelectedSort(option);
                        setShowSortMenu(false);
                      }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-[13px] ${
                        selectedSort === option
                          ? "bg-black text-white"
                          : "text-gray-700 hover:bg-gray-50"
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

        {filteredProducts.length === 0 ? (
          <div className="mt-4 rounded-[24px] bg-white p-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
            <p className="text-[16px] font-medium text-black">
              {selectedDepartment === "Женская одежда"
                ? "Женский раздел пока в разработке"
                : "Ничего не найдено"}
            </p>

            <p className="mt-2 text-sm text-gray-400">
              {selectedDepartment === "Женская одежда"
                ? "Скоро здесь появятся товары"
                : "Попробуйте изменить фильтры"}
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {filteredProducts.map((p) => {
              const discountPercent = getDiscountPercent(p.oldPrice, p.price);
              const imageCount = p.images?.length || 1;
              const currentImageIndex = cardImageIndexes[p.id] || 0;
              const currentImage =
                p.images[currentImageIndex] || p.image || "/products/product-1.jpg";
              const extraColorsLabel = getExtraColorsLabel(p.colors);
              const deliveryLabel = getDeliveryLabel(p.badge);
              const visibleColors = (p.colors || []).slice(0, 3);

              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/product?id=${p.id}`)}
                  onMouseEnter={() => prefetchProduct(p.id)}
                  onTouchStart={() => prefetchProduct(p.id)}
                  className="group cursor-pointer overflow-hidden rounded-[13px] bg-white shadow-[0_8px_22px_rgba(0,0,0,0.05)] transition-all duration-300 active:scale-[0.985]"
                >
                  <div
                    className="relative aspect-[3/4] overflow-hidden bg-[#EAEAEA]"
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
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/products/product-1.jpg";
                      }}
                    />

                    {p.badge.trim() && (
                      <div
                        className={`absolute left-3 top-3 rounded-full px-2 py-[4px] text-[9px] font-medium leading-none backdrop-blur shadow-sm ${
                          p.badge.trim().toLowerCase() === "из-за рубежа"
                            ? "bg-black text-white"
                            : "bg-white/90 text-black"
                        }`}
                      >
                        {p.badge}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(p.id);
                      }}
                      className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm transition-transform duration-200 active:scale-90"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={favorites.includes(p.id) ? "black" : "none"}
                        stroke="black"
                        strokeWidth="1.7"
                      >
                        <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
                      </svg>
                    </button>

                    <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
                      {Array.from({ length: imageCount }).map((_, index) => (
                        <span
                          key={`${p.id}-dot-${index}`}
                          className={`block rounded-full ${
                            index === currentImageIndex
                              ? "h-1.5 w-4 bg-white"
                              : "h-1.5 w-1.5 bg-white/45"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex min-h-[164px] flex-col px-3 pb-3 pt-2.5">
                    <div className="h-[18px] overflow-hidden text-[10px] text-gray-400">
                      <span className="max-w-[110px] break-words uppercase tracking-[0.14em]">
                        {p.brand}
                      </span>
                    </div>

                    <h3 className="mt-1 min-h-[34px] text-[14px] font-medium leading-[1.2] text-black">
                      {p.name}
                    </h3>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        {visibleColors.map((color, index) => (
                          <span
                            key={`${p.id}-${color}-${index}`}
                            className={`block h-3.5 w-3.5 rounded-full ${
                              color === "Белый" ? "border border-gray-300" : ""
                            }`}
                            style={{
                              backgroundColor: colorSwatches[color] || "#D1D5DB",
                            }}
                          />
                        ))}
                      </div>

                      {extraColorsLabel ? (
                        <span className="text-[11px] text-gray-400">
                          {extraColorsLabel}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-[17px] font-bold leading-none tracking-[-0.035em] text-[#16A34A]">
                        <PriceText value={p.price} />
                      </span>

                      {p.oldPrice ? (
                        <span className="text-[12px] font-medium leading-none text-[#A0A7B5] line-through">
                          <PriceText value={p.oldPrice} />
                        </span>
                      ) : null}

                      {discountPercent > 0 && (
                        <span className="text-[12px] font-semibold leading-none text-[#FF2F7D]">
                          -{discountPercent}%
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-gray-400">
                      <TruckIcon />
                      <span>{deliveryLabel}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <BottomNav />
      </main>
    </>
  );
}