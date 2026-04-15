"use client";

import Link from "next/link";

export default function Home() {
  const products = [
    {
      id: 1,
      name: "Футболка Premium",
      price: 3500,
      oldPrice: 5000,
      badge: "Скидка",
    },
    {
      id: 2,
      name: "Поло Classic",
      price: 4500,
      oldPrice: 4500,
      badge: "Новинка",
    },
    {
      id: 3,
      name: "Джинсы Slim",
      price: 6500,
      oldPrice: 8000,
      badge: "В наличии",
    },
    {
      id: 4,
      name: "Спортивный костюм",
      price: 7900,
      oldPrice: 9900,
      badge: "Доступно к заказу",
    },
  ];

  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case "Новинка":
        return "bg-white text-black border border-black";
      case "Скидка":
        return "bg-yellow-400 text-black";
      case "В наличии":
        return "bg-green-500 text-white";
      case "Доступно к заказу":
        return "bg-gray-400 text-white";
      default:
        return "bg-black text-white";
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-black pb-24 font-light">

      {/* HEADER */}
      <div className="p-4">

        <h1 className="text-3xl font-light tracking-[6px] text-center">
          MONTREAUX
        </h1>

        {/* SEARCH */}
        <input
          className="mt-4 w-full bg-white rounded-xl p-3 text-sm outline-none"
          placeholder="Поиск товаров..."
        />

        {/* CATEGORIES (TEXT ONLY) */}
        <div className="flex gap-6 overflow-x-auto mt-4 text-sm text-gray-500">
          {["Футболки", "Поло", "Джинсы", "Костюмы", "Шорты"].map((c) => (
            <div key={c} className="whitespace-nowrap">
              {c}
            </div>
          ))}
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/product?id=${p.id}`}
            className="bg-white rounded-2xl p-3 relative"
          >

            {/* BADGE */}
            <div
              className={`absolute top-2 left-2 text-[10px] px-2 py-1 rounded ${getBadgeStyle(
                p.badge
              )}`}
            >
              {p.badge}
            </div>

            {/* IMAGE */}
            <div className="h-36 bg-gray-100 rounded-xl mb-2"></div>

            <h2 className="text-sm font-light">{p.name}</h2>

            {/* PRICE */}
            <div className="flex gap-2 items-center mt-1">
              <span className="font-medium">{p.price} ₽</span>
              <span className="line-through text-gray-400 text-xs">
                {p.oldPrice} ₽
              </span>
            </div>

          </Link>
        ))}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-[#F5F5F5] flex justify-around p-4 text-sm text-gray-700">

        <a href="/" className="font-medium">
          Главная
        </a>

        <a href="/cart" className="font-medium">
          Корзина
        </a>

        <a href="/profile" className="font-medium">
          Профиль
        </a>

      </div>

    </main>
  );
}