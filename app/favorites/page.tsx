"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  price: number;
};

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Product[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(data);
  }, []);

  const removeFavorite = (id: string) => {
    const updated = favorites.filter((item) => item.id !== id);
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] p-4 pb-24">

      {/* TITLE */}
      <h1 className="text-xl font-semibold mb-4">
        Избранное
      </h1>

      {/* EMPTY */}
      {favorites.length === 0 && (
        <div className="bg-white p-6 rounded-2xl text-center">

          <p className="text-gray-500">
            Нет товаров в избранном
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-black text-white px-4 py-2 rounded-xl"
          >
            Перейти в каталог
          </button>

        </div>
      )}

      {/* LIST */}
      <div className="space-y-3">

        {favorites.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-2xl flex justify-between items-center"
          >

            <div>
              <h2 className="font-medium">{item.name}</h2>
              <p className="font-bold mt-1">{item.price} ₽</p>
            </div>

            <button
              onClick={() => removeFavorite(item.id)}
              className="text-red-500 text-sm"
            >
              удалить
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