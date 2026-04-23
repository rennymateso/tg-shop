"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import BottomNav from "./components/BottomNav";
import { supabase } from "./lib/supabase";

const categories = ["Все", "Футболки", "Поло", "Джинсы", "Брюки", "Костюмы"] as const;
const brands = [
  "Все бренды",
  "Lacoste",
  "Polo Ralph Lauren",
  "Tommy Hilfiger",
  "Calvin Klein",
  "GANT",
  "BOSS",
  "Emporio Armani",
  "Armani Exchange",
  "Beymen Club",
  "Loro Piana",
  "Brunello Cucinelli",
  "BORZ",
  "Massimo Carino",
  "Другие бренды",
] as const;
const sortOptions = ["По умолчанию", "Сначала дешевле", "Сначала дороже"] as const;
const badgeFilters = ["Все", "Новинки", "В наличии", "Из-за рубежа", "Скидки"] as const;

const banners = [
  {
    image: "/banner.jpg",
    alt: "Баннер",
    link: "/",
  },
] as const;

type Category = (typeof categories)[number];
type Brand = (typeof brands)[number];
type SortOption = (typeof sortOptions)[number];
type BadgeFilter = (typeof badgeFilters)[number];

type Product = {
  id: string;
  name: string;
  brand:
    | "Lacoste"
    | "Polo Ralph Lauren"
    | "Tommy Hilfiger"
    | "Calvin Klein"
    | "GANT"
    | "BOSS"
    | "Emporio Armani"
    | "Armani Exchange"
    | "Beymen Club"
    | "Loro Piana"
    | "Brunello Cucinelli"
    | "BORZ"
    | "Massimo Carino"
    | "Другие бренды";
  price: number;
  oldPrice: number | null;
  badge: "Новинка" | "Скидка" | "В наличии" | "Из-за рубежа";
  image: string;
  images: string[];
  colorImages?: Record<string, string>;
  type: "top" | "bottom";
  category: "Футболки" | "Поло" | "Джинсы" | "Брюки" | "Костюмы";
  colors: string[];
  sizes: string[];
  description: string;
};

type ProductRow = {
  id: string;
  name: string;
  brand: Product["brand"];
  category: Product["category"];
  price: number;
  old_price: number;
  badge: Product["badge"];
  status: "Активен" | "Скрыт";
  description: string;
  article: string;
  sizes: string[] | null;
  colors: string[] | null;
  image: string;
  color_images: Record<string, string[]> | null;
  created_at: string;
  updated_at: string;
};

function getDiscountPercent(oldPrice: number | null, price: number) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function mapRowToProduct(row: ProductRow): Product {
  const normalizedColorImages: Record<string, string> = {};

  if (row.color_images && typeof row.color_images === "object") {
    Object.entries(row.color_images).forEach(([color, images]) => {
      if (Array.isArray(images) && images.length > 0) {
        normalizedColorImages[color] = images[0];
      }
    });
  }

  const galleryFromDb =
    row.color_images && typeof row.color_images === "object"
      ? Object.values(row.color_images)
          .filter((value) => Array.isArray(value))
          .flat()
      : [];

  const uniqueImages = Array.from(
    new Set([row.image, ...galleryFromDb].filter(Boolean))
  );

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: row.price,
    oldPrice: row.old_price || null,
    badge: row.badge,
    image: row.image || uniqueImages[0] || "/products/product-1.jpg",
    images:
      uniqueImages.length > 0
        ? uniqueImages
        : [row.image || "/products/product-1.jpg"],
    colorImages: normalizedColorImages,
    type:
      row.category === "Джинсы" || row.category === "Брюки"
        ? "bottom"
        : "top",
    category: row.category,
    colors: Array.isArray(row.colors) ? row.colors : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    description: row.description || "",
  };
}

export default function Home() {
  const router = useRouter();

  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>("Все");
  const [selectedBrand, setSelectedBrand] = useState<Brand>("Все бренды");
  const [selectedSort, setSelectedSort] = useState<SortOption>("По умолчанию");
  const [selectedBadge, setSelectedBadge] = useState<BadgeFilter>("Все");
  const [search, setSearch] = useState("");
  const [activeBanner] = useState(0);

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showBrandMenu, setShowBrandMenu] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const brandMenuWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(data);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "Активен")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Ошибка загрузки товаров:", error.message);
        setProducts([]);
        setLoading(false);
        return;
      }

      const mapped = ((data || []) as ProductRow[]).map(mapRowToProduct);
      setProducts(mapped);
      setLoading(false);
    };

    loadProducts();
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
  };

  const resetPage = () => {
    setSelectedCategory("Все");
    setSelectedBrand("Все бренды");
    setSelectedSort("По умолчанию");
    setSelectedBadge("Все");
    setSearch("");
    setShowSortMenu(false);
    setShowBrandMenu(false);
    router.push("/");
  };

  const filteredProducts = useMemo(() => {
    const result = products.filter((item) => {
      const matchesCategory =
        selectedCategory === "Все" || item.category === selectedCategory;

      const matchesBrand =
        selectedBrand === "Все бренды" || item.brand === selectedBrand;

      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.brand.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());

      const matchesBadge =
        selectedBadge === "Все" ||
        (selectedBadge === "Скидки" && item.badge === "Скидка") ||
        (selectedBadge === "Новинки" && item.badge === "Новинка") ||
        item.badge === selectedBadge;

      return matchesCategory && matchesBrand && matchesSearch && matchesBadge;
    });

    if (selectedSort === "Сначала дешевле") {
      return [...result].sort((a, b) => a.price - b.price);
    }

    if (selectedSort === "Сначала дороже") {
      return [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, selectedCategory, selectedBrand, selectedSort, selectedBadge, search]);

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-3 pt-4 pb-32">
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400">
          Menswear
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

      <div className="mt-5 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-2.5 py-1.5 text-[11px] border transition-all duration-200 active:scale-95 ${
                selectedCategory === category
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-30 mt-3">
        <div className="flex items-start gap-2">
          <div className="relative shrink-0" ref={brandMenuWrapRef}>
            <button
              type="button"
              onClick={() => setShowBrandMenu((prev) => !prev)}
              className={`max-w-[170px] truncate rounded-full border px-3 py-2 text-[11px] shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition-all ${
                showBrandMenu
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              {selectedBrand}
            </button>

            {showBrandMenu && (
              <div className="absolute left-0 top-12 z-50 w-56 max-h-72 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
                {brands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => {
                      setSelectedBrand(brand);
                      setShowBrandMenu(false);
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-[12px] ${
                      selectedBrand === brand
                        ? "bg-black text-white"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 overflow-x-auto">
            <div className="flex min-w-max gap-2 pb-1">
              {badgeFilters
                .filter((badge) => badge !== "Все")
                .map((badge) => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() =>
                      setSelectedBadge((prev) => (prev === badge ? "Все" : badge))
                    }
                    className={`shrink-0 rounded-full border px-3 py-2 text-[11px] transition-all duration-200 ${
                      selectedBadge === badge
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white text-gray-700"
                    }`}
                  >
                    {badge}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-medium text-black">Подборка</h2>

        <div className="relative shrink-0" ref={sortMenuRef}>
          <button
            type="button"
            onClick={() => setShowSortMenu((prev) => !prev)}
            className="text-[12px] text-gray-400"
          >
            {selectedSort}
          </button>

          {showSortMenu && (
            <div className="absolute right-0 top-6 z-30 w-40 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              {sortOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSelectedSort(option);
                    setShowSortMenu(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-[12px] ${
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

      {loading ? (
        <div className="rounded-[24px] bg-white p-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-[16px] font-medium text-black">Загрузка товаров...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-[24px] bg-white p-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-[16px] font-medium text-black">Ничего не найдено</p>
          <p className="mt-2 text-sm text-gray-400">
            Попробуйте изменить фильтры
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((p) => {
            const discountPercent = getDiscountPercent(p.oldPrice, p.price);
            const imageCount = p.images?.length || 1;

            return (
              <div
                key={p.id}
                onClick={() => router.push(`/product?id=${p.id}`)}
                className="group cursor-pointer overflow-hidden rounded-[20px] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.05)] transition-all duration-300 active:scale-[0.985]"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[#EAEAEA]">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />

                  <div
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur shadow-sm ${
                      p.badge === "Из-за рубежа"
                        ? "bg-black text-white"
                        : "bg-white/90 text-black"
                    }`}
                  >
                    {p.badge}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(p.id);
                    }}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm transition-transform duration-200 active:scale-90"
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

                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                    {Array.from({ length: imageCount }).map((_, index) => (
                      <span
                        key={`${p.id}-dot-${index}`}
                        className={`block rounded-full ${
                          index === 0
                            ? "h-1.5 w-1.5 bg-white"
                            : "h-1.5 w-1.5 bg-white/45"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex min-h-[150px] flex-col p-3">
                  <div className="h-[20px] overflow-hidden text-[10px] text-gray-400">
                    <span className="max-w-[110px] uppercase tracking-[0.14em] break-words">
                      {p.brand}
                    </span>
                  </div>

                  <h3 className="mt-1 min-h-[36px] text-[14px] font-medium leading-[1.2] text-black">
                    {p.name}
                  </h3>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-normal leading-none text-gray-400 line-through">
                        {p.oldPrice} ₽
                      </span>

                      <span className="text-[16px] font-semibold leading-none tracking-[-0.02em] text-[#16A34A]">
                        {p.price} ₽
                      </span>

                      {discountPercent > 0 && (
                        <span className="rounded-full bg-[#E8F7EE] px-1.5 py-0.5 text-[10px] font-medium text-[#16A34A]">
                          -{discountPercent}%
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/product?id=${p.id}`);
                      }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] transition-transform duration-200 active:scale-90"
                    >
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="black"
                        strokeWidth="1.7"
                      >
                        <path d="M6 6h15l-1.5 9h-12z" />
                        <path d="M6 6L5 3H2" />
                        <circle cx="9" cy="20" r="1" />
                        <circle cx="18" cy="20" r="1" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </main>
  );
}