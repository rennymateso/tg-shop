"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { products } from "../data/products";

function getDiscountPercent(oldPrice: number | null, price: number) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavoriteIds(saved);
  }, []);

  const favoriteProducts = useMemo(
    () => products.filter((p) => favoriteIds.includes(p.id)),
    [favoriteIds]
  );

  const toggleFavorite = (id: string) => {
    const updated = favoriteIds.includes(id)
      ? favoriteIds.filter((item) => item !== id)
      : [...favoriteIds, id];

    setFavoriteIds(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-3 pt-5 pb-32">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-white px-4 py-2 text-sm text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
        >
          ← Назад
        </button>

        <h1 className="text-[20px] font-medium">Избранное</h1>

        <div className="w-[86px]" />
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="rounded-[24px] bg-white p-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-[16px] font-medium text-black">Избранное пусто</p>
          <p className="mt-2 text-sm text-gray-400">
            Добавьте товары, чтобы вернуться к ним позже
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {favoriteProducts.map((p) => {
            const discountPercent = getDiscountPercent(p.oldPrice, p.price);

            return (
              <div
                key={p.id}
                onClick={() => router.push(`/product?id=${p.id}`)}
                className="cursor-pointer overflow-hidden rounded-[20px] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.05)] transition-all duration-300 active:scale-[0.985]"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[#EAEAEA]">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(p.id);
                    }}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="black"
                      stroke="black"
                      strokeWidth="1.7"
                    >
                      <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
                    </svg>
                  </button>
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
                      {p.oldPrice && (
                        <span className="text-[12px] font-normal leading-none text-gray-400 line-through">
                          {p.oldPrice} ₽
                        </span>
                      )}

                      <span className="text-[16px] font-semibold leading-none tracking-[-0.02em] text-[#16A34A]">
                        {p.price} ₽
                      </span>

                      {discountPercent > 0 && (
                        <span className="rounded-full bg-[#E8F7EE] px-1.5 py-0.5 text-[10px] font-medium text-[#16A34A]">
                          -{discountPercent}%
                        </span>
                      )}
                    </div>
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