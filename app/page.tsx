"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const products = [
    {
      id: "1",
      name: "Футболка Premium",
      oldPrice: 4500,
      price: 3500,
      badge: "Скидка",
    },
    {
      id: "2",
      name: "Поло Classic",
      oldPrice: null,
      price: 4500,
      badge: "Новинка",
    },
    {
      id: "3",
      name: "Джинсы Slim",
      oldPrice: null,
      price: 6500,
      badge: "В наличии",
    },
  ];

  const badgeColor = (badge: string) => {
    switch (badge) {
      case "Новинка":
        return "bg-white text-black";
      case "Скидка":
        return "bg-yellow-300 text-black";
      case "В наличии":
        return "bg-green-500 text-white";
      case "Доступно к заказу":
        return "bg-gray-400 text-white";
      default:
        return "bg-gray-200";
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 py-6 pb-20">

      {/* LOGO */}
      <h1 className="text-2xl font-light text-center tracking-[6px]">
        MONTREAUX
      </h1>

      {/* SEARCH */}
      <div className="mt-5">
        <input
          placeholder="Поиск товаров..."
          className="w-full p-3 rounded-xl bg-white outline-none"
        />
      </div>

      {/* CATEGORIES */}
      <div className="mt-4 text-sm text-gray-600 flex gap-4 overflow-x-auto">
        <span>Футболки</span>
        <span>Поло</span>
        <span>Джинсы</span>
        <span>Спорт</span>
        <span>Брюки</span>
      </div>

      {/* PRODUCTS */}
      <div className="mt-6 grid gap-4">

        {products.map((p) => (
          <div
            key={p.id}
            onClick={() => router.push(`/product?id=${p.id}`)}
            className="bg-white p-4 rounded-2xl active:scale-[0.98] transition cursor-pointer"
          >

            {/* IMAGE */}
            <div className="h-40 bg-gray-100 rounded-xl mb-3 relative">

              {/* BADGE */}
              <div
                className={`absolute top-2 left-2 text-xs px-2 py-1 rounded ${badgeColor(
                  p.badge
                )}`}
              >
                {p.badge}
              </div>

            </div>

            {/* NAME */}
            <h2 className="font-medium">{p.name}</h2>

            {/* PRICE */}
            <div className="flex items-center gap-2 mt-1">

              {p.oldPrice && (
                <span className="text-gray-400 line-through text-sm">
                  {p.oldPrice} ₽
                </span>
              )}

              <span className="font-bold">
                {p.price} ₽
              </span>

            </div>

          </div>
        ))}

      </div>

      {/* BOTTOM MENU */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 text-sm">

        <button onClick={() => router.push("/")}>Меню</button>
        <button onClick={() => router.push("/cart")}>Корзина</button>
        <button onClick={() => router.push("/profile")}>Профиль</button>

      </div>

    </main>
  );
}