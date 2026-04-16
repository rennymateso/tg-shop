"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { products } from "../data/products";

export default function FavoritesPage() {
  const router = useRouter();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavoriteIds(data);
  }, []);

  const favorites = useMemo(() => {
    return products.filter((item) => favoriteIds.includes(item.id));
  }, [favoriteIds]);

  const removeFavorite = (id: string) => {
    const updated = favoriteIds.filter((item) => item !== id);
    setFavoriteIds(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-5 pb-32">
      <div className="mb-5 flex items-center justify-between animate-[fadeIn_.3s_ease]">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-white px-4 py-2 text-sm text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-transform duration-200 active:scale-95"
        >
          ← Назад
        </button>

        <h1 className="text-[20px] font-medium">Избранное</h1>

        <div className="w-[86px]" />
      </div>

      {favorites.length === 0 && (
        <div className="rounded-[28px] bg-white p-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)] animate-[fadeIn_.35s_ease]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F3F3]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="1.6"
            >
              <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
            </svg>
          </div>

          <p className="mt-4 text-[16px] font-medium text-black">
            Нет товаров в избранном
          </p>

          <p className="mt-2 text-sm text-gray-400">
            Сохраняйте понравившиеся модели, чтобы вернуться к ним позже
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition-transform duration-200 active:scale-[0.99]"
          >
            Перейти в каталог
          </button>
        </div>
      )}

      <div className="space-y-4">
        {favorites.map((item) => (
          <div
            key={item.id}
            onClick={() => router.push(`/product?id=${item.id}`)}
            className="cursor-pointer rounded-[28px] bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)] active:scale-[0.99] animate-[fadeIn_.35s_ease]"
          >
            <div className="flex gap-4">
              <div className="w-[88px] shrink-0 overflow-hidden rounded-[20px] bg-[#ECECEC] aspect-[3/4]">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-[11px] text-gray-400">
                      <span className="uppercase tracking-[0.14em]">
                        {item.brand}
                      </span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>

                    <h2 className="text-[15px] font-medium leading-[1.3] text-black">
                      {item.name}
                    </h2>

                    <div className="mt-2 flex items-center gap-2">
                      {item.oldPrice && (
                        <span className="text-[12px] text-gray-400 line-through">
                          {item.oldPrice} ₽
                        </span>
                      )}

                      <span className="text-[16px] font-semibold text-black">
                        {item.price} ₽
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(item.id);
                    }}
                    className="whitespace-nowrap text-xs text-gray-400 transition-colors duration-200 hover:text-black"
                  >
                    удалить
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <BottomNav />
    </main>
  );
}