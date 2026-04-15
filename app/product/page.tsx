"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = searchParams.get("id");

  const products: any = {
    1: {
      name: "Футболка Premium",
      price: 3500,
      oldPrice: 5000,
      type: "top",
      desc: "Премиальная хлопковая футболка",
    },
    2: {
      name: "Поло Classic",
      price: 4500,
      oldPrice: 4500,
      type: "top",
      desc: "Классическое поло",
    },
    3: {
      name: "Джинсы Slim",
      price: 6500,
      oldPrice: 8000,
      type: "bottom",
      desc: "Современные джинсы slim fit",
    },
  };

  const product = products[id as keyof typeof products];

  const [size, setSize] = useState("");

  if (!product) {
    return (
      <main className="p-4">
        Товар не найден
      </main>
    );
  }

  const topSizes = [
    { label: "S", num: "46" },
    { label: "M", num: "48" },
    { label: "L", num: "50" },
    { label: "XL", num: "52" },
    { label: "XXL", num: "54" },
  ];

  const bottomSizes = [
    { label: "30", num: "46" },
    { label: "31", num: "46-48" },
    { label: "32", num: "48" },
    { label: "33", num: "48-50" },
    { label: "34", num: "50" },
    { label: "36", num: "52" },
    { label: "38", num: "54" },
  ];

  const sizes = product.type === "bottom" ? bottomSizes : topSizes;

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    cart.push({
      id,
      name: product.name,
      price: product.price,
      size,
      qty: 1,
    });

    localStorage.setItem("cart", JSON.stringify(cart));

    router.push("/cart");
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] pb-24">

      {/* HEADER */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => router.back()}>
          ← Назад
        </button>

        <h1 className="text-sm font-light">
          {product.name}
        </h1>

        <div></div>
      </div>

      {/* IMAGE */}
      <div className="h-[380px] bg-gray-100 flex items-center justify-center">
        Фото товара
      </div>

      {/* INFO */}
      <div className="p-4 bg-white">

        <h1 className="text-xl font-light">{product.name}</h1>

        <div className="flex gap-3 mt-2">
          <span className="font-bold">{product.price} ₽</span>
          <span className="line-through text-gray-400">
            {product.oldPrice} ₽
          </span>
        </div>

        <p className="text-sm text-gray-500 mt-2">
          {product.desc}
        </p>

        {/* SIZE SELECT */}
        <div className="mt-6">

          <p className="text-sm mb-3">Выберите размер</p>

          <div className="grid grid-cols-3 gap-2">

            {sizes.map((s) => (
              <button
                key={s.label}
                onClick={() => setSize(s.label)}
                className={`p-3 border text-sm ${
                  size === s.label ? "bg-black text-white" : ""
                }`}
              >
                {s.label}
                <div className="text-xs text-gray-400">
                  {s.num}
                </div>
              </button>
            ))}

          </div>

        </div>
      </div>

      {/* FIXED BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">

        <button
          disabled={!size}
          onClick={addToCart}
          className="w-full bg-black text-white py-3 rounded-xl disabled:opacity-40"
        >
          В корзину
        </button>

      </div>

    </main>
  );
}