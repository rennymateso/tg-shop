"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { products } from "../data/products";

export default function ProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const product = products.find((item) => item.id === id);

  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);

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

  const sizes = useMemo(() => {
    if (!product) return [];
    return product.type === "bottom" ? bottomSizes : topSizes;
  }, [product]);

  const canOrder = Boolean(size && color);

  const colorMap: Record<string, string> = {
    Черный: "#111111",
    Белый: "#FFFFFF",
    Серый: "#9CA3AF",
    Синий: "#1D3557",
    Бежевый: "#D6C2A1",
  };

  const article = product ? `ART-${product.id.padStart(4, "0")}` : "";

  const shortDescription = product?.description || "";

  const detailedDescription = product
    ? "Модель выполнена в минималистичном стиле и подходит для повседневного гардероба. Материал комфортен в носке, силуэт аккуратный и универсальный. Товар хорошо сочетается с джинсами, брюками и базовой обувью."
    : "";

  const addToCart = () => {
    if (!product || !id || !canOrder) return;

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    cart.push({
      id,
      name: product.name,
      price: product.price,
      size,
      color,
      quantity,
    });

    localStorage.setItem("cart", JSON.stringify(cart));
    router.push("/cart?step=form");
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

        <div className="text-[11px] uppercase tracking-[0.16em] text-gray-400">
          {article}
        </div>
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
          <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-gray-400">
            {product.brand}
          </div>

          <h1 className="text-[24px] font-medium leading-tight text-black">
            {product.name}
          </h1>

          <div className="mt-3 flex items-end gap-2">
            {product.oldPrice && (
              <span className="text-[13px] font-normal text-gray-400 line-through">
                {product.oldPrice} ₽
              </span>
            )}

            <span className="text-[21px] font-semibold tracking-[-0.02em] text-black">
              {product.price} ₽
            </span>
          </div>

          <div className="mt-5">
            <p className="text-[12px] uppercase tracking-[0.12em] text-gray-400">
              Краткое описание
            </p>
            <p className="mt-2 text-[14px] leading-6 text-gray-600">
              {shortDescription}
            </p>
          </div>

          <div className="mt-5">
            <p className="text-[12px] uppercase tracking-[0.12em] text-gray-400">
              Подробное описание
            </p>
            <p className="mt-2 text-[14px] leading-6 text-gray-600">
              {detailedDescription}
            </p>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm text-gray-500">Размер</p>
            <div className="grid grid-cols-3 gap-2">
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
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm text-gray-500">Цвет</p>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((c) => {
                const swatch = colorMap[c] || "#E5E7EB";
                const isSelected = color === c;
                const isWhite = c === "Белый";

                return (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={c}
                    title={c}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? "border-black ring-2 ring-black/10"
                        : "border-gray-200"
                    }`}
                  >
                    <span
                      className={`block h-7 w-7 rounded-md ${
                        isWhite ? "border border-gray-300" : ""
                      }`}
                      style={{ backgroundColor: swatch }}
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-2 text-[12px] text-gray-400">
              {color ? `Выбран цвет: ${color}` : "Выберите цвет"}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm text-gray-500">Количество</p>
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F5] text-lg text-black"
              >
                −
              </button>

              <span className="text-[16px] font-medium text-black">
                {quantity}
              </span>

              <button
                onClick={() => setQuantity((prev) => prev + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F5] text-lg text-black"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-6 mb-4 flex items-center justify-between rounded-2xl bg-[#F7F7F7] px-4 py-3">
            <span className="text-sm text-gray-500">Итого</span>
            <span className="text-[18px] font-semibold tracking-[-0.02em] text-black">
              {product.price * quantity} ₽
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addToCart}
              disabled={!canOrder}
              className={`flex-1 rounded-2xl py-3.5 text-sm font-medium transition-all duration-200 ${
                canOrder
                  ? "bg-black text-white active:scale-[0.99]"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              Оформить заказ
            </button>

            <button
              onClick={toggleFavorite}
              aria-label="В избранное"
              className={`flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl transition-all duration-200 active:scale-[0.99] ${
                favorites.includes(product.id)
                  ? "bg-black text-white"
                  : "bg-gray-100 text-black"
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
        </div>
      </div>

      <BottomNav />
    </main>
  );
}