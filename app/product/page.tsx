"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductPage() {
  const router = useRouter();

  const id =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("id")
      : null;

  const products: Record<string, any> = {
    "1": { name: "Футболка Premium", price: 3500 },
    "2": { name: "Поло Classic", price: 4500 },
    "3": { name: "Джинсы Slim", price: 6500 },
  };

  const product = id ? products[id] : null;

  const [open, setOpen] = useState(false);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");

  const sizes = ["S", "M", "L", "XL", "XXL"];
  const colors = ["Черный", "Белый", "Серый"];

  const addToCart = () => {
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    cart.push({
      id,
      name: product.name,
      price: product.price,
      size,
      color,
    });

    localStorage.setItem("cart", JSON.stringify(cart));

    setOpen(false);
    router.push("/cart");
  };

  if (!product) {
    return (
      <main className="p-4">Товар не найден</main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] p-4">

      <button onClick={() => router.back()} className="mb-4">
        ← Назад
      </button>

      <div className="bg-white p-4 rounded-2xl">

        <div className="h-60 bg-gray-100 rounded-xl mb-4" />

        <h1 className="text-lg font-semibold">{product.name}</h1>
        <p className="font-bold mt-2">{product.price} ₽</p>

        <button
          onClick={() => setOpen(true)}
          className="w-full mt-5 bg-black text-white py-3 rounded-xl"
        >
          В корзину
        </button>

      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center">

          <div className="bg-white w-full p-4 rounded-t-2xl">

            <h2 className="text-lg font-semibold mb-3">
              Выбор параметров
            </h2>

            {/* SIZE */}
            <p className="text-sm mb-1">Размер</p>
            <div className="flex gap-2 flex-wrap mb-3">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-3 py-1 rounded border ${
                    size === s ? "bg-black text-white" : ""
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* COLOR */}
            <p className="text-sm mb-1">Цвет</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`px-3 py-1 rounded border ${
                    color === c ? "bg-black text-white" : ""
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2">

              <button
                onClick={() => setOpen(false)}
                className="flex-1 bg-gray-200 py-3 rounded-xl"
              >
                Отмена
              </button>

              <button
                onClick={addToCart}
                className="flex-1 bg-black text-white py-3 rounded-xl"
              >
                Добавить
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}