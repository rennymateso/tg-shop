"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import BottomNav from "./components/BottomNav";
import { products } from "./data/products";

const categories = ["Все", "Футболки", "Поло", "Джинсы", "Брюки", "Костюмы"] as const;
const brands = [
  "Все бренды",
  "MONTREAUX",
  "Premium Line",
  "Classic Line",
  "Urban Tailor",
  "North District",
  "Essential Studio",
] as const;
const sortOptions = ["По умолчанию", "Сначала дешевле", "Сначала дороже"] as const;

type Category = (typeof categories)[number];
type Brand = (typeof brands)[number];
type SortOption = (typeof sortOptions)[number];

export default function Home() {
  const router = useRouter();

  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>("Все");
  const [selectedBrand, setSelectedBrand] = useState<Brand>("Все бренды");
  const [selectedSort, setSelectedSort] = useState<SortOption>("По умолчанию");
  const [search, setSearch] = useState("");

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showBrandMenu, setShowBrandMenu] = useState(false);

  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const brandMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(data);
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
        brandMenuRef.current &&
        !brandMenuRef.current.contains(event.target as Node)
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

      return matchesCategory && matchesBrand && matchesSearch;
    });

    if (selectedSort === "Сначала дешевле") {
      return [...result].sort((a, b) => a.price - b.price);
    }

    if (selectedSort === "Сначала дороже") {
      return [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [selectedCategory, selectedBrand, selectedSort, search]);

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-6 pb-32">
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400">
          Menswear
        </p>

        <h1 className="mt-2 text-[30px] font-light tracking-[0.35em] text-black">
          MONTREAUX
        </h1>

        <p className="mt-3 text-[13px] text-gray-500">
          Новая коллекция мужской одежды
        </p>
      </div>

      <div className="mt-6">
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

      <div className="mt-5 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-3 py-2 text-[12px] border transition-all duration-200 active:scale-95 ${
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

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="relative shrink-0" ref={brandMenuRef}>
          <button
            type="button"
            onClick={() => setShowBrandMenu((prev) => !prev)}
            className="max-w-[170px] truncate rounded-full border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-700 shadow-[0_4px_14px_rgba(0,0,0,0.04)]"
          >
            {selectedBrand}
          </button>

          {showBrandMenu && (
            <div className="absolute left-0 top-10 z-30 w-52 max-h-60 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
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

        <div className="relative shrink-0" ref={sortMenuRef}>
          <button
            type="button"
            onClick={() => setShowSortMenu((prev) => !prev)}
            className="rounded-full border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-700 shadow-[0_4px_14px_rgba(0,0,0,0.04)]"
          >
            Сортировка
          </button>

          {showSortMenu && (
            <div className="absolute right-0 top-10 z-30 w-40 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
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

      <div className="mt-7 mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-medium text-black">Подборка</h2>
        <span className="text-[12px] text-gray-400">
          {filteredProducts.length} товара
        </span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-[24px] bg-white p-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-[16px] font-medium text-black">Ничего не найдено</p>
          <p className="mt-2 text-sm text-gray-400">
            Попробуйте изменить фильтры
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((p) => (
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

                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-black backdrop-blur shadow-sm">
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
              </div>

              <div className="flex min-h-[190px] flex-col p-3.5">
                <div className="h-[34px] overflow-hidden text-[10px] text-gray-400">
                  <div className="flex items-start gap-2 leading-[1.25]">
                    <span className="max-w-[90px] uppercase tracking-[0.14em] break-words">
                      {p.brand}
                    </span>
                    <span className="shrink-0">•</span>
                    <span className="truncate">{p.category}</span>
                  </div>
                </div>

                <h3 className="mt-2 min-h-[56px] text-[14px] font-medium leading-[1.3] text-black">
                  {p.name}
                </h3>

                <div className="mt-auto flex items-end justify-between gap-2">
                  <div className="flex min-h-[32px] items-end gap-2">
                    {p.oldPrice && (
                      <span className="text-[12px] font-normal text-gray-400 line-through">
                        {p.oldPrice} ₽
                      </span>
                    )}

                    <span className="text-[17px] font-semibold tracking-[-0.02em] text-black">
                      {p.price} ₽
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/product?id=${p.id}`);
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] transition-transform duration-200 active:scale-90"
                  >
                    <svg
                      width="18"
                      height="18"
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
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}