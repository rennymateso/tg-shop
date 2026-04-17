"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { products } from "../data/products";
import BottomNav from "../components/BottomNav";

type CheckoutItem = {
  id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

export default function CheckoutPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">(
    "delivery"
  );
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [address, setAddress] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const paymentStatus = searchParams.get("payment");

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (Array.isArray(cart)) {
      setItems(cart);
    }
  }, []);

  useEffect(() => {
    if (paymentStatus === "success") {
      localStorage.removeItem("cart");
      setItems([]);
    }
  }, [paymentStatus]);

  const updateQuantity = (index: number, nextQty: number) => {
    const safeQty = Math.max(1, nextQty);
    const updated = [...items];
    updated[index] = { ...updated[index], quantity: safeQty };
    setItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const removeItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const deliveryPrice = deliveryMethod === "delivery" ? 500 : 0;
  const total = totalItems + deliveryPrice;

  const isFormValid =
    name.trim() &&
    phone.trim() &&
    items.length > 0 &&
    (deliveryMethod === "pickup" || address.trim());

  const getProductById = (id: string) => {
    return products.find((item) => item.id === id);
  };

  const handleCashOrder = () => {
    if (!isFormValid) {
      alert("Заполните все обязательные данные");
      return;
    }

    localStorage.removeItem("cart");
    alert("Заказ оформлен. Менеджер свяжется с вами.");
    router.push("/checkout?payment=success");
  };

  const handleCardPayment = async () => {
    setPaymentError("");

    if (!isFormValid) {
      alert("Заполните все обязательные данные");
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
          address,
          deliveryMethod,
          paymentMethod,
          items,
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
          className="rounded-full bg-white px-4 py-2 text-sm text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
        >
          ← Назад
        </button>

        <h1 className="text-[20px] font-medium">Оформление</h1>

        <div className="w-[86px]" />
      </div>

      {paymentStatus === "success" && (
        <div className="mb-4 rounded-[20px] bg-white p-4 text-sm text-black shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          Оплата завершена. Заказ успешно оформлен.
        </div>
      )}

      {paymentError && (
        <div className="mb-4 rounded-[20px] bg-white p-4 text-xs text-black shadow-[0_8px_28px_rgba(0,0,0,0.05)] whitespace-pre-wrap break-words">
          {paymentError}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-[24px] bg-white p-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-[16px] font-medium text-black">
            Нет товаров для оформления
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, i) => {
            const product = getProductById(item.id);

            return (
              <div
                key={`${item.id}-${item.size}-${item.color}-${i}`}
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
                        <div className="mb-1 text-[11px] text-gray-400 uppercase tracking-[0.14em]">
                          {product?.brand || "MONTREAUX"}
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
                      <span className="rounded-full bg-[#F3F3F3] px-2.5 py-1 text-[11px] text-gray-600">
                        Размер: {item.size}
                      </span>

                      <span className="rounded-full bg-[#F3F3F3] px-2.5 py-1 text-[11px] text-gray-600">
                        Цвет: {item.color}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-[16px] font-semibold tracking-[-0.02em] text-[#16A34A]">
                        {item.price * item.quantity} ₽
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(i, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F5] text-lg text-black"
                        >
                          −
                        </button>

                        <span className="w-6 text-center text-[15px] font-medium text-black">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQuantity(i, item.quantity + 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F5] text-lg text-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="rounded-[24px] bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <h2 className="mb-4 text-[18px] font-medium text-black">
              Данные клиента
            </h2>

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

            <p className="mb-2 text-sm text-gray-500">Получение</p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeliveryMethod("delivery")}
                className={`rounded-2xl py-3 text-sm ${
                  deliveryMethod === "delivery"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-black"
                }`}
              >
                Доставка
              </button>

              <button
                onClick={() => setDeliveryMethod("pickup")}
                className={`rounded-2xl py-3 text-sm ${
                  deliveryMethod === "pickup"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-black"
                }`}
              >
                Самовывоз
              </button>
            </div>

            {deliveryMethod === "delivery" ? (
              <input
                placeholder="Адрес доставки"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mb-4 w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            ) : (
              <div className="mb-4 rounded-2xl bg-[#F5F5F5] p-3.5 text-sm text-gray-600">
                Самовывоз: адрес магазина уточняется менеджером после заказа.
              </div>
            )}

            <p className="mb-2 text-sm text-gray-500">Способ оплаты</p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod("card")}
                className={`rounded-2xl py-3 text-sm ${
                  paymentMethod === "card"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-black"
                }`}
              >
                Картой
              </button>

              <button
                onClick={() => setPaymentMethod("cash")}
                className={`rounded-2xl py-3 text-sm ${
                  paymentMethod === "cash"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-black"
                }`}
              >
                Наличными
              </button>
            </div>

            <div className="mb-4 rounded-2xl bg-[#F7F7F7] px-4 py-3 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-gray-500">Товары</span>
                <span className="text-[#16A34A]">{totalItems} ₽</span>
              </div>

              <div className="mb-2 flex items-center justify-between">
                <span className="text-gray-500">Доставка</span>
                <span className="text-black">{deliveryPrice} ₽</span>
              </div>

              <div className="flex items-center justify-between text-[16px] font-semibold">
                <span>Итого</span>
                <span className="text-[#16A34A]">{total} ₽</span>
              </div>
            </div>

            {paymentMethod === "card" ? (
              <button
                onClick={handleCardPayment}
                disabled={!isFormValid || isPaying}
                className="w-full rounded-2xl bg-black py-3.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {isPaying ? "Переход..." : "Перейти к оплате"}
              </button>
            ) : (
              <button
                onClick={handleCashOrder}
                disabled={!isFormValid}
                className="w-full rounded-2xl bg-black py-3.5 text-sm font-medium text-white disabled:opacity-60"
              >
                Оформить заказ
              </button>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}