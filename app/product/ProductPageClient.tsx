"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { products } from "../data/products";

type CartItem = {
  id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

export default function ProductPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const product = products.find((item) => item.id === id);

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(data);
  }, []);

  const toggleFavorite = () => {
    if (!product) return;

    const updated = favorites.includes(product.id)
      ? favorites.filter((i) => i !== product.id)
      : [...favorites, product.id];

    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

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

  const sizes = product?.type === "bottom" ? bottomSizes : topSizes;

  const colorMap: Record<string, string> = {
    Черный: "#111111",
    Белый: "#FFFFFF",
    Серый: "#9CA3AF",
    Синий: "#1D3557",
    Бежевый: "#D6C2A1",
  };

  const article = product ? `ART-${product.id.padStart(4, "0")}` : "";
  const description = product?.description || "";

  const canOrder = selectedSizes.length > 0 && selectedColors.length > 0;

  const toggleSize = (value: string) => {
    setSelectedSizes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const toggleColor = (value: string) => {
    setSelectedColors((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const addToCart = () => {
    if (!product || !id || !canOrder) return;

    const existingCart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");

    const newItems: CartItem[] = [];

    selectedSizes.forEach((size) => {
      selectedColors.forEach((color) => {
        newItems.push({
          id,
          name: product.name,
          price: product.price,
          size,
          color,
          quantity: 1,
        });
      });
    });

    const updatedCart = [...existingCart];

    newItems.forEach((newItem) => {
      const existingIndex = updatedCart.findIndex(
        (item) =>
          item.id === newItem.id &&
          item.size === newItem.size &&
          item.color === newItem.color
      );

      if (existingIndex >= 0) {
        updatedCart[existingIndex].quantity += newItem.quantity;
      } else {
        updatedCart.push(newItem);
      }
    });

    localStorage.setItem("cart", JSON.stringify(updatedCart));
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

        <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-sm text-gray-500">Товар не найден</p>
        </div>

        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-5 pb-32">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-white px-4 py-2 text-sm text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-transform duration-200 active:scale-95"
        >
          ← Назад
        </button>

        <button
          onClick={toggleFavorite}
          aria-label="В избранное"
          className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl transition-all duration-200 active:scale-[0.99] ${
            favorites.includes(product.id)
              ? "bg-black text-white"
              : "bg-white text-black shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
          }`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={favorites.includes(product.id) ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9l-2.3-2.3c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
          </svg>
        </button>
      </div>

      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#ECECEC]">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />

          {product.badge && (
            <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium text-black backdrop-blur shadow-sm">
              {product.badge}
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-[11px] uppercase tracking-[0.16em] text-gray-400">
              {product.brand}
            </div>

            <div className="text-[11px] uppercase tracking-[0.16em] text-gray-400">
              {article}
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2">
            {product.oldPrice && (
              <span className="text-[14px] font-normal leading-none text-gray-400 line-through">
                {product.oldPrice} ₽
              </span>
            )}

            <span className="text-[21px] font-semibold leading-none tracking-[-0.02em] text-black">
              {product.price} ₽
            </span>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm text-gray-500">Размер</p>
            <div className="grid grid-cols-5 gap-1.5">
              {sizes.map((s) => (
                <button
                  key={s.label}
                  onClick={() => toggleSize(s.label)}
                  className={`rounded-xl border px-1.5 py-2 text-center transition-all duration-200 active:scale-95 ${
                    selectedSizes.includes(s.label)
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-black"
                  }`}
                >
                  <div className="text-[11px] font-medium">{s.label}</div>
                  <div
                    className={`mt-0.5 text-[9px] ${
                      selectedSizes.includes(s.label)
                        ? "text-white/70"
                        : "text-gray-400"
                    }`}
                  >
                    {s.sub}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-2 text-[12px] text-gray-400">
              {selectedSizes.length > 0
                ? `Выбрано размеров: ${selectedSizes.join(", ")}`
                : "Можно выбрать несколько размеров"}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm text-gray-500">Цвет</p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => {
                const swatch = colorMap[c] || "#E5E7EB";
                const isSelected = selectedColors.includes(c);
                const isWhite = c === "Белый";

                return (
                  <button
                    key={c}
                    onClick={() => toggleColor(c)}
                    aria-label={c}
                    title={c}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? "border-black ring-2 ring-black/10"
                        : "border-gray-200"
                    }`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-md ${
                        isWhite ? "border border-gray-300" : ""
                      }`}
                      style={{ backgroundColor: swatch }}
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-2 text-[12px] text-gray-400">
              {selectedColors.length > 0
                ? `Выбрано цветов: ${selectedColors.join(", ")}`
                : "Можно выбрать несколько цветов"}
            </div>
          </div>

          <div className="mt-5">
            <h1 className="text-[24px] font-medium leading-tight text-black">
              {product.name}
            </h1>
          </div>

          <div className="mt-5">
            <p className="text-[14px] leading-6 text-gray-600">
              {showFullDescription ? description : `${description.slice(0, 110)}...`}
            </p>

            {description.length > 110 && (
              <button
                onClick={() => setShowFullDescription((prev) => !prev)}
                className="mt-2 text-[13px] text-black underline underline-offset-2"
              >
                {showFullDescription ? "Свернуть" : "Читать полностью"}
              </button>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#F7F7F7] px-4 py-3">
            <span className="text-sm text-gray-500">Товаров к добавлению</span>
            <span className="text-[18px] font-semibold tracking-[-0.02em] text-black">
              {selectedSizes.length * selectedColors.length || 0}
            </span>
          </div>

          <div className="mt-5">
            <button
              onClick={addToCart}
              disabled={!canOrder}
              className={`w-full rounded-2xl py-3.5 text-sm font-medium transition-all duration-200 ${
                canOrder
                  ? "bg-black text-white active:scale-[0.99]"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              Добавить в корзину
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}