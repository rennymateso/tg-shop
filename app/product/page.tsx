"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import BottomNav from "../components/BottomNav";
import { products } from "../data/products";

export default function ProductPage() {
  const router = useRouter();

  const id =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("id")
      : null;

  const product = id ? products.find((item) => item.id === id) : null;

  const [open, setOpen] = useState(false);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");

  const topSizes = [
    { label: "S", sub: "46" },
    { label: "M", sub: "48" },
    { label: "L", sub: "50" },
    { label: "XL", sub: "52" },
    { label: "XXL", sub: "54" },
  ];

  const bottomSizes = [
    { label: "30", sub: "46" },
    { label: "31", sub: "46-48" },
    { label: "32", sub: "48" },
    { label: "33", sub: "48-50" },
    { label: "34", sub: "50" },
    { label: "36", sub: "52" },
    { label: "38", sub: "54" },
  ];

  const sizes = useMemo(() => {
    if (!product) return [];
    return product.type === "bottom" ? bottomSizes : topSizes;
  }, [product]);

  const addToCart = () => {
    if (!product || !id) return;

    if (!size || !color) {
      alert("Выберите размер и цвет");
      return;
    }

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
      <main className="min-h-screen bg-[#F5F5F5] px-4 pt-5 pb-32">
        <button
          onClick={() => router.back()}
          className="mb-4 rounded-full bg-white px-4 py-2 text-sm text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
        >
          ← Назад
        </button>

        <div className="rounded-[28px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-sm text-gray-500">Товар не найден</p>
        </div>

        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-5 pb-32">
      <div className="mb-4 flex items-center justify-between animate-[fadeIn_.3s_ease]">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-white px-4 py-2 text-sm text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-transform duration-200 active:scale-95"
        >
          ← Назад
        </button>

        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-transform duration-200 active:scale-95">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="1.7"
          >
            <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
          </svg>
        </button>
      </div>

      <div className="overflow-hidden rounded-[30px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] animate-[fadeIn_.35s_ease]">
        <div className="relative aspect-[3/4] bg-[#ECECEC] overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
          />

          {product.badge && (
            <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium text-black backdrop-blur shadow-sm">
              {product.badge}
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-center gap-2 text-[11px] text-gray-400">
            <span className="uppercase tracking-[0.16em]">{product.brand}</span>
            <span>•</span>
            <span>{product.category}</span>
          </div>

          <h1 className="text-[24px] font-medium leading-tight text-black">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-2">
            {product.oldPrice && (
              <span className="text-[13px] text-gray-400 line-through">
                {product.oldPrice} ₽
              </span>
            )}

            <span className="text-[20px] font-semibold text-black">
              {product.price} ₽
            </span>
          </div>

          <p className="mt-4 text-[14px] leading-6 text-gray-500">
            {product.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <span
                key={c}
                className="rounded-full bg-[#F5F5F5] px-3 py-1.5 text-[12px] text-gray-600 transition-transform duration-200 hover:scale-[1.02]"
              >
                {c}
              </span>
            ))}
          </div>

          <button
            onClick={() => setOpen(true)}
            className="mt-6 w-full rounded-2xl bg-black py-3.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-95 active:scale-[0.99]"
          >
            Выбрать размер и цвет
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/45 animate-[fadeIn_.2s_ease]">
          <div className="w-full rounded-t-[30px] bg-white p-5 pb-6 shadow-2xl">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-300" />

            <h2 className="mb-4 text-[18px] font-medium text-black">
              Выбор параметров
            </h2>

            <p className="mb-2 text-sm text-gray-500">Размер</p>
            <div className="mb-5 grid grid-cols-3 gap-2">
              {sizes.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSize(s.label)}
                  className={`rounded-2xl border px-3 py-3 text-center transition-all duration-200 active:scale-95 ${
                    size === s.label
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-black"
                  }`}
                >
                  <div className="text-sm font-medium">{s.label}</div>
                  <div
                    className={`mt-1 text-[11px] ${
                      size === s.label ? "text-white/70" : "text-gray-400"
                    }`}
                  >
                    {s.sub}
                  </div>
                </button>
              ))}
            </div>

            <p className="mb-2 text-sm text-gray-500">Цвет</p>
            <div className="mb-6 flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`rounded-full border px-4 py-2.5 text-sm transition-all duration-200 active:scale-95 ${
                    color === c
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-black"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-2xl bg-gray-100 py-3.5 text-sm font-medium text-black transition-transform duration-200 active:scale-[0.99]"
              >
                Отмена
              </button>

              <button
                onClick={addToCart}
                className="flex-1 rounded-2xl bg-black py-3.5 text-sm font-medium text-white transition-transform duration-200 active:scale-[0.99]"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

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