"use client";

import { useRouter } from "next/navigation";

export default function ProductPage() {
  const router = useRouter();

  // берем id из URL через window (без useSearchParams — так стабильнее для Vercel)
  const id =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("id")
      : null;

  const products: Record<string, { name: string; price: number }> = {
    "1": { name: "Футболка Premium", price: 3500 },
    "2": { name: "Поло Classic", price: 4500 },
    "3": { name: "Джинсы Slim", price: 6500 },
  };

  const product = id ? products[id] : null;

  const addToCart = () => {
    if (!product || !id) return;

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    cart.push({
      id,
      name: product.name,
      price: product.price,
      qty: 1,
    });

    localStorage.setItem("cart", JSON.stringify(cart));

    router.push("/cart");
  };

  if (!product) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        Товар не найден
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] p-4">

      {/* назад */}
      <button onClick={() => router.back()} className="mb-4">
        ← Назад
      </button>

      {/* карточка */}
      <div className="bg-white p-4 rounded-2xl">

        <div className="h-64 bg-gray-100 rounded-xl mb-4" />

        <h1 className="text-xl font-semibold">
          {product.name}
        </h1>

        <p className="text-lg font-bold mt-2">
          {product.price} ₽
        </p>

        <button
          onClick={addToCart}
          className="w-full mt-6 bg-black text-white py-3 rounded-xl"
        >
          В корзину
        </button>

      </div>
    </main>
  );
}