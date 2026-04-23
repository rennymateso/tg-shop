"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";

type CheckoutItem = {
  id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

type OrderStatus =
  | "Новый"
  | "Оплачен"
  | "В обработке"
  | "Собран"
  | "В доставке"
  | "Доставлен"
  | "Отменен";

type PaymentMethod = "Картой" | "Наличными";
type DeliveryMethod = "Доставка" | "Самовывоз";

type SavedOrderItem = {
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
};

type SavedOrder = {
  id: string;
  customer: string;
  phone: string;
  total: number;
  payment: PaymentMethod;
  delivery: DeliveryMethod;
  address: string;
  status: OrderStatus;
  createdAt: string;
  comment: string;
  items: SavedOrderItem[];
};

type ProductBadge = "Новинка" | "Скидка" | "В наличии" | "Из-за рубежа";
type ProductCategory = "Футболки" | "Поло" | "Джинсы" | "Брюки" | "Костюмы";
type ProductBrand =
  | "Lacoste"
  | "Polo Ralph Lauren"
  | "Tommy Hilfiger"
  | "Calvin Klein"
  | "GANT"
  | "BOSS"
  | "Emporio Armani"
  | "Armani Exchange"
  | "Beymen Club"
  | "Loro Piana"
  | "Brunello Cucinelli"
  | "BORZ"
  | "Massimo Carino"
  | "Другие бренды";

type Product = {
  id: string;
  name: string;
  brand: ProductBrand;
  price: number;
  oldPrice: number | null;
  badge: ProductBadge;
  image: string;
  images: string[];
  colorImages?: Record<string, string>;
  type: "top" | "bottom";
  category: ProductCategory;
  colors: string[];
  sizes: string[];
  description: string;
};

type ProductRow = {
  id: string;
  name: string;
  brand: ProductBrand;
  category: ProductCategory;
  price: number;
  old_price: number;
  badge: ProductBadge;
  status: "Активен" | "Скрыт";
  description: string;
  article: string;
  sizes: string[] | null;
  colors: string[] | null;
  image: string;
  color_images: Record<string, string[]> | null;
  created_at: string;
  updated_at: string;
};

function mapRowToProduct(row: ProductRow): Product {
  const normalizedColorImages: Record<string, string> = {};

  if (row.color_images && typeof row.color_images === "object") {
    Object.entries(row.color_images).forEach(([color, images]) => {
      if (Array.isArray(images) && images.length > 0) {
        normalizedColorImages[color] = images[0];
      }
    });
  }

  const galleryFromDb =
    row.color_images && typeof row.color_images === "object"
      ? Object.values(row.color_images)
          .filter((value) => Array.isArray(value))
          .flat()
      : [];

  const uniqueImages = Array.from(
    new Set([row.image, ...galleryFromDb].filter(Boolean))
  );

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: row.price,
    oldPrice: row.old_price || null,
    badge: row.badge,
    image: row.image || uniqueImages[0] || "/products/product-1.jpg",
    images:
      uniqueImages.length > 0
        ? uniqueImages
        : [row.image || "/products/product-1.jpg"],
    colorImages: normalizedColorImages,
    type:
      row.category === "Джинсы" || row.category === "Брюки"
        ? "bottom"
        : "top",
    category: row.category,
    colors: Array.isArray(row.colors) ? row.colors : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    description: row.description || "",
  };
}

function getDiscountPercent(oldPrice: number, newPrice: number) {
  if (oldPrice <= newPrice) return 0;
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^7/, "").slice(0, 10);

  let result = "+7";
  if (digits.length > 0) result += ` (${digits.slice(0, 3)}`;
  if (digits.length >= 3) result += ")";
  if (digits.length > 3) result += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) result += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) result += `-${digits.slice(8, 10)}`;

  return result;
}

function buildOrderStatus(paymentMethod: "card" | "cash"): OrderStatus {
  if (paymentMethod === "card") {
    return "Оплачен";
  }

  return "Новый";
}

function saveOrderToLocalStorage(order: SavedOrder) {
  const currentOrders = JSON.parse(localStorage.getItem("orders") || "[]");
  const safeOrders = Array.isArray(currentOrders) ? currentOrders : [];
  localStorage.setItem("orders", JSON.stringify([order, ...safeOrders]));
}

export default function CheckoutPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [address, setAddress] = useState("");
  const [promoCode, setPromoCode] = useState("");
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
    const loadProducts = async () => {
      setLoadingProducts(true);

      const { data, error } = await supabase.from("products").select("*");

      if (error) {
        console.error("Ошибка загрузки товаров для checkout:", error.message);
        setProductsMap({});
        setLoadingProducts(false);
        return;
      }

      const mapped = ((data || []) as ProductRow[]).map(mapRowToProduct);
      const nextMap: Record<string, Product> = {};

      mapped.forEach((product) => {
        nextMap[product.id] = product;
      });

      setProductsMap(nextMap);
      setLoadingProducts(false);
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (paymentStatus === "success") {
      localStorage.removeItem("cart");
      setItems([]);
    }
  }, [paymentStatus]);

  useEffect(() => {
    if (deliveryMethod === "delivery" && paymentMethod === "cash") {
      setPaymentMethod("card");
    }
  }, [deliveryMethod, paymentMethod]);

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

  const totals = useMemo(() => {
    const oldItemsTotal = items.reduce((sum, item) => {
      const oldUnitPrice = productsMap[item.id]?.oldPrice ?? item.price;
      return sum + oldUnitPrice * item.quantity;
    }, 0);

    const newItemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return { oldItemsTotal, newItemsTotal };
  }, [items, productsMap]);

  const deliveryPrice = deliveryMethod === "delivery" ? 500 : 0;
  const finalOldTotal = totals.oldItemsTotal + deliveryPrice;
  const finalNewTotal = totals.newItemsTotal + deliveryPrice;
  const finalDiscountPercent = getDiscountPercent(finalOldTotal, finalNewTotal);

  const phoneDigitsCount = phone.replace(/\D/g, "").replace(/^7/, "").length;
  const isPhoneValid = phoneDigitsCount === 10;

  const isFormValid =
    name.trim() &&
    isPhoneValid &&
    items.length > 0 &&
    (deliveryMethod === "pickup" || address.trim());

  const getProductById = (id: string) => productsMap[id];

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhone(value));
  };

  const createLocalOrder = (selectedPaymentMethod: "card" | "cash") => {
    const order: SavedOrder = {
      id: `ORD-${Date.now()}`,
      customer: name.trim(),
      phone,
      total: finalNewTotal,
      payment: selectedPaymentMethod === "card" ? "Картой" : "Наличными",
      delivery: deliveryMethod === "pickup" ? "Самовывоз" : "Доставка",
      address:
        deliveryMethod === "pickup"
          ? 'г. Казань, Академика Глушко 16Г, ТЦ "АКАДЕМИК", 2 этаж'
          : address.trim(),
      status: buildOrderStatus(selectedPaymentMethod),
      createdAt: new Date().toLocaleString("ru-RU"),
      comment: promoCode.trim() ? `Промокод: ${promoCode.trim()}` : "",
      items: items.map((item) => ({
        name: item.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    saveOrderToLocalStorage(order);
  };

  const handleCashOrder = () => {
    if (!isFormValid) {
      alert("Заполните все обязательные данные");
      return;
    }

    if (deliveryMethod !== "pickup") {
      alert("Оплата наличными доступна только при самовывозе");
      return;
    }

    createLocalOrder("cash");
    localStorage.removeItem("cart");
    alert("Заказ успешно оформлен. С вами свяжется менеджер для подтверждения.");
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

      createLocalOrder("card");

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
          promoCode,
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
        <div className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-sm font-medium text-black">Заказ успешно оформлен.</p>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Вам придет сообщение о статусе заказа. Также с вами свяжется менеджер для
            подтверждения и уточнения деталей.
          </p>
        </div>
      )}

      {paymentError && (
        <div className="mb-4 whitespace-pre-wrap break-words rounded-[20px] bg-white p-4 text-xs text-black shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          {paymentError}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-[24px] bg-white p-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-[16px] font-medium text-black">Нет товаров для оформления</p>

          <button
            onClick={() => router.push("/")}
            className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {loadingProducts && (
            <div className="rounded-[20px] bg-white p-4 text-sm text-gray-500 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
              Обновляем данные товаров...
            </div>
          )}

          {items.map((item, i) => {
            const product = getProductById(item.id);
            const oldUnitPrice = product?.oldPrice ?? item.price;
            const lineOldTotal = oldUnitPrice * item.quantity;
            const lineNewTotal = item.price * item.quantity;
            const lineDiscountPercent = getDiscountPercent(lineOldTotal, lineNewTotal);

            return (
              <div
                key={`${item.id}-${item.size}-${item.color}-${i}`}
                className="rounded-[24px] bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.05)]"
              >
                <div className="flex gap-4">
                  <div className="aspect-[3/4] w-[88px] shrink-0 overflow-hidden rounded-[18px] bg-[#ECECEC]">
                    <img
                      src={product?.image || "/products/product-1.jpg"}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-gray-400">
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] text-gray-400 line-through">
                          {lineOldTotal} ₽
                        </span>

                        <span className="text-[16px] font-semibold tracking-[-0.02em] text-[#16A34A]">
                          {lineNewTotal} ₽
                        </span>

                        <span className="rounded-full bg-[#E8F7EE] px-1.5 py-0.5 text-[10px] font-medium text-[#16A34A]">
                          -{lineDiscountPercent}%
                        </span>
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
            <h2 className="mb-4 text-[18px] font-medium text-black">Данные клиента</h2>

            <input
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-3 w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />

            <input
              placeholder="+7 (___) ___-__-__"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="mb-4 w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />

            <p className="mb-2 text-sm text-gray-500">Получение</p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeliveryMethod("delivery")}
                className={`rounded-2xl py-3 text-sm ${
                  deliveryMethod === "delivery" ? "bg-black text-white" : "bg-gray-100 text-black"
                }`}
              >
                Доставка
              </button>

              <button
                onClick={() => setDeliveryMethod("pickup")}
                className={`rounded-2xl py-3 text-sm ${
                  deliveryMethod === "pickup" ? "bg-black text-white" : "bg-gray-100 text-black"
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
              <div className="mb-4 rounded-2xl bg-[#F5F5F5] p-3.5 text-sm leading-6 text-gray-600">
                Самовывоз по адресу: г. Казань, Академика Глушко 16Г, ТЦ "АКАДЕМИК", 2 этаж.
                Подробнее уточняйте у менеджера.
              </div>
            )}

            <p className="mb-2 text-sm text-gray-500">Способ оплаты</p>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod("card")}
                className={`rounded-2xl py-3 text-sm ${
                  paymentMethod === "card" ? "bg-black text-white" : "bg-gray-100 text-black"
                }`}
              >
                Картой
              </button>

              <button
                onClick={() => {
                  if (deliveryMethod !== "pickup") return;
                  setPaymentMethod("cash");
                }}
                disabled={deliveryMethod !== "pickup"}
                className={`rounded-2xl py-3 text-sm ${
                  paymentMethod === "cash" ? "bg-black text-white" : "bg-gray-100 text-black"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Наличными
              </button>
            </div>

            {deliveryMethod !== "pickup" && (
              <div className="mb-3 rounded-2xl bg-[#F5F5F5] p-3 text-sm text-gray-500">
                Оплата наличными доступна только при выборе самовывоза.
              </div>
            )}

            <input
              placeholder="Промокод"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="mb-4 w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />

            <div className="mb-4 rounded-2xl bg-[#F7F7F7] px-4 py-3 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-gray-500">До скидки</span>
                <span className="text-gray-400 line-through">{finalOldTotal} ₽</span>
              </div>

              <div className="mb-2 flex items-center justify-between">
                <span className="text-gray-500">После скидки</span>
                <span className="text-[#16A34A]">{finalNewTotal} ₽</span>
              </div>

              <div className="mb-2 flex items-center justify-between">
                <span className="text-gray-500">Скидка</span>
                <span className="text-[#16A34A]">-{finalDiscountPercent}%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Доставка</span>
                <span className="text-black">{deliveryPrice} ₽</span>
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
                disabled={!isFormValid || deliveryMethod !== "pickup"}
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