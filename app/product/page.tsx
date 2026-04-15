"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProductPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    setId(searchParams.get("id"));
  }, [searchParams]);

  const products: any = {
    1: {
      name: "Футболка Premium",
      price: 3500,
    },
    2: {
      name: "Поло Classic",
      price: 4500,
    },
    3: {
      name: "Джинсы Slim",
      price: 6500,
    },
  };

  const product = id ? products[id as keyof typeof products] : null;

  if (!id) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Загрузка...
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen p-4">
        Товар не найден
      </main>
    );
  }

  const addToCart = () => {
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

  return (
    <main className="min-h-screen bg-[#F5F5F5] p-4">

      {/* HEADER */}
      <button onClick={() => router.back()}>
        ← Назад
      </button>

      {/* PRODUCT */}
      <div className="mt-6 bg-white p-4 rounded-2xl">

        <div className="h-64 bg-gray-100 rounded-xl mb-4" />

        <h1 className="text-xl font-light">
          {product.name}
        </h1>

        <p className="text-lg mt-2 font-bold">
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