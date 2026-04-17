"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { products } from "../data/products";

type CartItem = {
  id: string;
  name: string;
  price: number;
  size?: string;
  color?: string;
  quantity?: number;
};

export default function CartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"cart" | "form">("cart");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const paymentStatus = searchParams.get("payment");
  const urlStep = searchParams.get("step");

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(data);
  }, []);

  useEffect(() => {
    if (urlStep === "form") {
      setStep("form");
    }
  }, [urlStep]);

  useEffect(() => {
    if (paymentStatus === "success") {
      localStorage.removeItem("cart");
      setCart([]);
      setStep("cart");
    }
  }, [paymentStatus]);

  const removeItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.price * (item.quantity ? item.quantity : 1),
        0
      ),
    [cart]
  );

  const getProductById = (id: string) => {
    return products.find((item) => item.id === id);
  };

  const handlePay = async () => {
    setPaymentError("");

    if (!name.trim() || !phone.trim()) {
      alert("Введите имя и телефон");
      return;
    }

    if (cart.length === 0) {
      alert("Корзина пустая");
      return;
    }

    try {
      setIsPaying(true);

      const response = await fetch("/api/payments/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          items: cart,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success || !result?.paymentUrl) {
        const rawText = result?.raw
          ? JSON.stringify(result.raw, null, 2)
          : result?.details || result?.error || "Не удалось создать платеж";

        setPaymentError(rawText);
        throw new Error(result?.error || "Не удалось создать платеж");
      }

      window.location.href = result.paymentUrl;
    } catch (error) {
      if (!paymentError) {
        setPaymentError(
          error instanceof Error ? error.message : "Ошибка при переходе к оплате"
        );
      }
      setIsPaying(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-5 pb-32">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-white px-4 py-2 text-sm text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-transform duration-200 active:scale-95"
        >
          ← Назад
        </button>

        <h1 className="text-[20px] font-medium">Корзина</h1>

        <div className="w-[86px]" />
      </div>

      {paymentStatus === "success" && (
        <div className="mb-4 rounded-[20px] bg-white p-4 text-sm text-black shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          Оплата завершена. Заказ успешно оформлен.
        </div>
      )}

      {paymentStatus === "fail" && (
        <div className="mb-4 rounded-[20px] bg-white p-4 text-sm text-black shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          Оплата не завершена. Можно попробовать снова.
        </div>
      )}

      {paymentError && (
        <div className="mb-4 rounded-[20px] bg-white p-4 text-xs text-black shadow-[0_8px_28px_rgba(0,0,0,0.05)] whitespace-pre-wrap break-words">
          {paymentError}
        </div>
      )}

      {cart.length === 0 && (
        <div className="rounded-[24px] bg-white p-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F3F3]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="1.6"
            >
              <path d="M6 6h15l-1.5 9h-12z" />
              <path d="M6 6L5 3H2" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
          </div>

          <p className="mt-4 text-[16px] font-medium text-black">
            Корзина пустая
          </p>

          <p className="mt-2 text-sm text-gray-400">
            Добавьте товары из каталога
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition-transform duration-200 active:scale-[0.99]"
          >
            Перейти в каталог
          </button>
        </div>
      )}

      {cart.length > 0 && (
        <div className="space-y-4">
          {cart.map((item, i) => {
            const product = getProductById(item.id);
            const quantity = item.quantity || 1;

            return (
              <div
                key={i}
                className="rounded-[24px] bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.05)]"
              >
                <div className="flex gap-4">
                  <div className="w-[88px] shrink-0 overflow-hidden rounded-[18px] bg-[#ECECEC] aspect-[3/4]">
                    <img
                      src={product?.image || "/products/product-1.jpg"}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-1 flex items-center gap-2 text-[11px] text-gray-400">
                          <span className="uppercase tracking-[0.14em]">
                            {product?.brand || "MONTREAUX"}
                          </span>
                        </div>

                        <h2 className="text-[15px] font-medium leading-[1.3] text-black">
                          {item.name}
                        </h2>
                      </div>

                      <button
                        onClick={() => removeItem(i)}
                        className="whitespace-nowrap text-xs text-gray-400"
                      >
                        удалить
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.size && (
                        <span className="rounded-full bg-[#F3F3F3] px-2.5 py-1 text-[11px] text-gray-600">
                          Размер: {item.size}
                        </span>
                      )}

                      {item.color && (
                        <span className="rounded-full bg-[#F3F3F3] px-2.5 py-1 text-[11px] text-gray-600">
                          Цвет: {item.color}
                        </span>
                      )}

                      <span className="rounded-full bg-[#F3F3F3] px-2.5 py-1 text-[11px] text-gray-600">
                        Кол-во: {quantity}
                      </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <span className="text-[12px] text-gray-400">
                        {item.price} ₽ × {quantity}
                      </span>

                      <span className="text-[17px] font-semibold tracking-[-0.02em] text-black">
                        {item.price * quantity} ₽
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="h-2" />

          <div className="rounded-[24px] border border-white bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            {step === "cart" ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Итого</span>
                  <span className="text-[18px] font-semibold tracking-[-0.02em] text-black">
                    {total} ₽
                  </span>
                </div>

                <button
                  onClick={() => setStep("form")}
                  className="w-full rounded-2xl bg-black py-3.5 text-sm font-medium text-white"
                >
                  Оформить заказ
                </button>
              </>
            ) : (
              <>
                <h2 className="mb-4 text-[18px] font-medium text-black">
                  Оформление заказа
                </h2>

                <div className="mb-4 rounded-2xl bg-[#F7F7F7] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Итого</span>
                    <span className="text-[18px] font-semibold tracking-[-0.02em] text-black">
                      {total} ₽
                    </span>
                  </div>
                </div>

                <input
                  placeholder="Ваше имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mb-3 w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />

                <input
                  placeholder="Телефон"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mb-4 w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />

                <button
                  onClick={handlePay}
                  disabled={isPaying}
                  className="w-full rounded-2xl bg-black py-3.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {isPaying ? "Переход..." : "Оплатить"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}