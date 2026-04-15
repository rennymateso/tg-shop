"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice: number | null;
  badge: string;
};

export default function Home() {
  const router = useRouter();

  const products: Product[] = [
    {
      id: "1",
      name: "Футболка Premium",
      price: 3500,
      oldPrice: 4500,
      badge: "Новинка",
    },
    {
      id: "2",
      name: "Поло Classic",
      price: 4500,
      oldPrice: null,
      badge: "Скидка",
    },
    {
      id: "3",
      name: "Джинсы Slim",
      price: 6500,
      oldPrice: null,
      badge: "В наличии",
    },
    {
      id: "4",
      name: "Футболка Basic",
      price: 2900,
      oldPrice: null,
      badge: "Доступно к заказу",
    },
  ];

  const [favorites, setFavorites] = useState<string[]>([]);

  // загрузка из localStorage
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(data);
  }, []);

  // toggle favorites
  const toggleFavorite = (id: string) => {
    let updated: string[];

    if (favorites.includes(id)) {
      updated = favorites.filter((i) => i !== id);
    } else {
      updated = [...favorites, id];
    }

    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 py-6 pb-24">

      {/* LOGO */}
      <h1 className="text-2xl font-light text-center tracking-[6px]">
        MONTREAUX
      </h1>

      {/* SEARCH */}
      <input
        placeholder="Поиск товаров..."
        className="w-full mt-5 p-3 rounded-xl bg-white outline-none"
      />

      {/* CATEGORIES */}
      <div className="mt-4 flex gap-4 text-sm text-gray-600 overflow-x-auto">
        <span>Футболки</span>
        <span>Поло</span>
        <span>Джинсы</span>
        <span>Брюки</span>
      </div>

      {/* PRODUCTS GRID */}
      <div className="mt-6 grid grid-cols-2 gap-3">

        {products.map((p) => (
          <div
            key={p.id}
            className="bg-white p-3 rounded-2xl relative"
          >

            {/* FAVORITE */}
            <button
              onClick={() => toggleFavorite(p.id)}
              className="absolute top-2 right-2 text-lg"
            >
              {favorites.includes(p.id) ? "❤️" : "🤍"}
            </button>

            {/* IMAGE */}
            <div className="h-32 bg-gray-100 rounded-xl mb-3 relative">

              {/* BADGE (WHITE ALWAYS) */}
              <div className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded bg-white text-black">
                {p.badge}
              </div>

            </div>

            {/* NAME */}
            <h2 className="text-sm font-medium">{p.name}</h2>

            {/* PRICE */}
            <div className="flex gap-2 items-center mt-1">

              {p.oldPrice && (
                <span className="text-gray-400 line-through text-xs">
                  {p.oldPrice} ₽
                </span>
              )}

              <span className="font-bold text-sm">
                {p.price} ₽
              </span>

            </div>

            {/* BUTTON */}
            <button
              onClick={() => router.push(`/product?id=${p.id}`)}
              className="w-full mt-2 bg-black text-white py-2 rounded-xl text-xs"
            >
              В корзину
            </button>

          </div>
        ))}

      </div>

      {/* BOTTOM MENU */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 text-sm">

        <button onClick={() => router.push("/")}>Главная</button>
        <button onClick={() => router.push("/favorites")}>Избранное</button>
        <button onClick={() => router.push("/cart")}>Корзина</button>
        <button onClick={() => router.push("/profile")}>Профиль</button>

      </div>

    </main>
  );
}