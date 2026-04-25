"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";
import { syncTelegramCustomer } from "../lib/customer-profile";
import { getTelegramInitData } from "../lib/telegram-mini-app";

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

type CustomerAddress = {
  id: string;
  label: string;
  city: string | null;
  street: string | null;
  house: string | null;
  apartment: string | null;
  entrance: string | null;
  floor: string | null;
  comment: string | null;
  is_default: boolean;
};

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  badge: string;
  image: string;
  images: string[];
  colorImages?: Record<string, string>;
  type: "top" | "bottom";
  category: string;
  colors: string[];
  sizes: string[];
  description: string;
};

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  old_price: number;
  badge: string | null;
  status: "Активен" | "Скрыт";
  description: string;
  article: string;
  sizes: string[] | null;
  colors: string[] | null;
  image: string | null;
  color_images: Record<string, string[]> | null;
  created_at: string;
  updated_at: string;
};

type CheckoutDraft = {
  name: string;
  phone: string;
  deliveryMethod: "delivery" | "pickup";
  paymentMethod: "card" | "cash";
  city: string;
  street: string;
  house: string;
  apartment: string;
  entrance: string;
  floor: string;
  deliveryComment: string;
  promoCode: string;
  selectedAddressId: string;
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
  ) as string[];

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: row.price,
    oldPrice: row.old_price || null,
    badge: row.badge || "",
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

function buildDeliveryAddress(params: {
  city: string;
  street: string;
  house: string;
  apartment: string;
  entrance: string;
  floor: string;
  deliveryComment: string;
}) {
  const parts: string[] = [
    `г. ${params.city.trim()}`,
    `ул. ${params.street.trim()}`,
    `д. ${params.house.trim()}`,
  ];

  if (params.apartment.trim()) parts.push(`кв. ${params.apartment.trim()}`);
  if (params.entrance.trim()) parts.push(`подъезд ${params.entrance.trim()}`);
  if (params.floor.trim()) parts.push(`этаж ${params.floor.trim()}`);
  if (params.deliveryComment.trim()) {
    parts.push(`комментарий: ${params.deliveryComment.trim()}`);
  }

  return parts.join(", ");
}

function getValidationMessage(params: {
  name: string;
  isPhoneValid: boolean;
  itemsCount: number;
  deliveryMethod: "delivery" | "pickup";
  city: string;
  street: string;
  house: string;
}) {
  if (params.itemsCount === 0) return "Корзина пуста";
  if (!params.name.trim()) return "Введите имя";
  if (!params.isPhoneValid) return "Введите корректный телефон";

  if (params.deliveryMethod === "delivery") {
    if (!params.city.trim()) return "Введите город";
    if (!params.street.trim()) return "Введите улицу";
    if (!params.house.trim()) return "Введите дом";
  }

  return "";
}

function formatSavedAddress(address: CustomerAddress) {
  const parts = [
    address.city ? `г. ${address.city}` : "",
    address.street ? `ул. ${address.street}` : "",
    address.house ? `д. ${address.house}` : "",
    address.apartment ? `кв. ${address.apartment}` : "",
  ].filter(Boolean);

  return parts.join(", ");
}

async function createOrderInSupabase(params: {
  customer: string;
  phone: string;
  total: number;
  payment: PaymentMethod;
  delivery: DeliveryMethod;
  address: string;
  status: OrderStatus;
  comment: string;
  promoCode: string;
  items: CheckoutItem[];
}) {
  const orderId = `ORD-${Date.now()}`;

  const orderPayload = {
    id: orderId,
    customer: params.customer,
    phone: params.phone,
    total: params.total,
    payment: params.payment,
    delivery: params.delivery,
    address: params.address,
    status: params.status,
    comment: params.comment,
    promo_code: params.promoCode,
    tbank_order_id: null,
    tbank_payment_id: null,
    tbank_payment_status: null,
    paid_at: null,
    updated_at: new Date().toISOString(),
  };

  const { error: orderError } = await supabase.from("orders").insert(orderPayload);

  if (orderError) {
    throw new Error(`Ошибка сохранения заказа: ${orderError.message}`);
  }

  const itemsPayload = params.items.map((item) => ({
    order_id: orderId,
    product_id: item.id,
    name: item.name,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    price: item.price,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", orderId);
    throw new Error(`Ошибка сохранения товаров заказа: ${itemsError.message}`);
  }

  return orderId;
}

export default function CheckoutPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initData = getTelegramInitData();

  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");

  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [apartment, setApartment] = useState("");
  const [entrance, setEntrance] = useState("");
  const [floor, setFloor] = useState("");
  const [deliveryComment, setDeliveryComment] = useState("");

  const [promoCode, setPromoCode] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const paymentStatus = searchParams.get("payment");

  const loadAddresses = async () => {
    if (!initData) {
      setSavedAddresses([]);
      setLoadingAddresses(false);
      return;
    }

    setLoadingAddresses(true);

    const response = await fetch(
      `/api/customer/addresses?initData=${encodeURIComponent(initData)}`
    );
    const result = await response.json();

    if (response.ok && result?.success && Array.isArray(result.addresses)) {
      const addresses = result.addresses as CustomerAddress[];
      setSavedAddresses(addresses);

      const defaultAddress = addresses.find((item) => item.is_default);
      if (defaultAddress && !selectedAddressId) {
        setSelectedAddressId(defaultAddress.id);
        setCity(defaultAddress.city || "");
        setStreet(defaultAddress.street || "");
        setHouse(defaultAddress.house || "");
        setApartment(defaultAddress.apartment || "");
        setEntrance(defaultAddress.entrance || "");
        setFloor(defaultAddress.floor || "");
        setDeliveryComment(defaultAddress.comment || "");
      }
    } else {
      setSavedAddresses([]);
    }

    setLoadingAddresses(false);
  };

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (Array.isArray(cart)) {
      setItems(cart);
    }

    try {
      const savedDraft = JSON.parse(
        localStorage.getItem("checkout_draft") || "null"
      ) as CheckoutDraft | null;

      if (savedDraft) {
        setName(savedDraft.name || "");
        setPhone(savedDraft.phone || "+7");
        setDeliveryMethod(savedDraft.deliveryMethod || "delivery");
        setPaymentMethod(savedDraft.paymentMethod || "card");
        setCity(savedDraft.city || "");
        setStreet(savedDraft.street || "");
        setHouse(savedDraft.house || "");
        setApartment(savedDraft.apartment || "");
        setEntrance(savedDraft.entrance || "");
        setFloor(savedDraft.floor || "");
        setDeliveryComment(savedDraft.deliveryComment || "");
        setPromoCode(savedDraft.promoCode || "");
        setSelectedAddressId(savedDraft.selectedAddressId || "");
      }
    } catch {
      //
    }
  }, []);

  useEffect(() => {
    const syncCustomer = async () => {
      const customer = await syncTelegramCustomer();

      if (!customer) return;

      const nextName =
        [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim();

      setName((prev) => (prev.trim() ? prev : nextName));
      setPhone((prev) => {
        const currentDigits = prev.replace(/\D/g, "").replace(/^7/, "");
        if (currentDigits.length === 10) return prev;
        return customer.phone || prev;
      });
    };

    syncCustomer();
  }, []);

  useEffect(() => {
    loadAddresses();
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
    const draft: CheckoutDraft = {
      name,
      phone,
      deliveryMethod,
      paymentMethod,
      city,
      street,
      house,
      apartment,
      entrance,
      floor,
      deliveryComment,
      promoCode,
      selectedAddressId,
    };

    localStorage.setItem("checkout_draft", JSON.stringify(draft));
  }, [
    name,
    phone,
    deliveryMethod,
    paymentMethod,
    city,
    street,
    house,
    apartment,
    entrance,
    floor,
    deliveryComment,
    promoCode,
    selectedAddressId,
  ]);

  useEffect(() => {
    if (paymentStatus === "success") {
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("cart-updated"));
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
    window.dispatchEvent(new Event("cart-updated"));
  };

  const removeItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const totals = useMemo(() => {
    const oldItemsTotal = items.reduce((sum, item) => {
      const oldUnitPrice = productsMap[item.id]?.oldPrice ?? item.price;
      return sum + oldUnitPrice * item.quantity;
    }, 0);

    const newItemsTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return { oldItemsTotal, newItemsTotal };
  }, [items, productsMap]);

  const deliveryPrice = deliveryMethod === "delivery" ? 500 : 0;
  const finalOldTotal = totals.oldItemsTotal + deliveryPrice;
  const finalNewTotal = totals.newItemsTotal + deliveryPrice;
  const finalDiscountPercent = getDiscountPercent(finalOldTotal, finalNewTotal);

  const phoneDigitsCount = phone.replace(/\D/g, "").replace(/^7/, "").length;
  const isPhoneValid = phoneDigitsCount === 10;

  const isDeliveryAddressValid =
    city.trim().length > 0 &&
    street.trim().length > 0 &&
    house.trim().length > 0;

  const isFormValid =
    name.trim().length > 0 &&
    isPhoneValid &&
    items.length > 0 &&
    (deliveryMethod === "pickup" || isDeliveryAddressValid);

  const validationMessage = getValidationMessage({
    name,
    isPhoneValid,
    itemsCount: items.length,
    deliveryMethod,
    city,
    street,
    house,
  });

  const getProductById = (id: string) => productsMap[id];

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhone(value));
  };

  const handleSelectSavedAddress = (address: CustomerAddress) => {
    setSelectedAddressId(address.id);
    setCity(address.city || "");
    setStreet(address.street || "");
    setHouse(address.house || "");
    setApartment(address.apartment || "");
    setEntrance(address.entrance || "");
    setFloor(address.floor || "");
    setDeliveryComment(address.comment || "");
  };

  const handleNewAddress = () => {
    setSelectedAddressId("");
    setCity("");
    setStreet("");
    setHouse("");
    setApartment("");
    setEntrance("");
    setFloor("");
    setDeliveryComment("");
  };

  const pickupAddress =
    'г. Казань, Академика Глушко 16Г, ТЦ "АКАДЕМИК", 2 этаж';

  const deliveryAddress = buildDeliveryAddress({
    city,
    street,
    house,
    apartment,
    entrance,
    floor,
    deliveryComment,
  });

  const orderComment = [
    promoCode.trim() ? `Промокод: ${promoCode.trim()}` : "",
    deliveryComment.trim() ? `Комментарий: ${deliveryComment.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const persistCustomerPhone = async () => {
    if (isPhoneValid) {
      await syncTelegramCustomer(phone);
    }
  };

  const handleCashOrder = async () => {
    if (!isFormValid) {
      alert("Заполните все обязательные данные");
      return;
    }

    if (deliveryMethod !== "pickup") {
      alert("Оплата наличными доступна только при самовывозе");
      return;
    }

    try {
      setIsPaying(true);
      setPaymentError("");

      await persistCustomerPhone();

      await createOrderInSupabase({
        customer: name.trim(),
        phone,
        total: finalNewTotal,
        payment: "Наличными",
        delivery: "Самовывоз",
        address: pickupAddress,
        status: "Новый",
        comment: orderComment,
        promoCode: promoCode.trim(),
        items,
      });

      localStorage.removeItem("cart");
      localStorage.removeItem("checkout_draft");
      window.dispatchEvent(new Event("cart-updated"));

      alert("Заказ успешно оформлен. С вами свяжется менеджер для подтверждения.");
      router.push("/checkout?payment=success");
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Не удалось сохранить заказ"
      );
      setIsPaying(false);
    }
  };

  const handleCardPayment = async () => {
    setPaymentError("");

    if (!isFormValid) {
      alert("Заполните все обязательные данные");
      return;
    }

    try {
      setIsPaying(true);
      await persistCustomerPhone();

      const finalAddress =
        deliveryMethod === "pickup" ? pickupAddress : deliveryAddress;

      const localOrderId = await createOrderInSupabase({
        customer: name.trim(),
        phone,
        total: finalNewTotal,
        payment: "Картой",
        delivery: deliveryMethod === "pickup" ? "Самовывоз" : "Доставка",
        address: finalAddress,
        status: "Новый",
        comment: orderComment,
        promoCode: promoCode.trim(),
        items,
      });

      const response = await fetch("/api/payments/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          localOrderId,
          name,
          phone,
          address: finalAddress,
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
        setIsPaying(false);
        return;
      }

      window.location.href = result.paymentUrl;
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Ошибка при переходе к оплате"
      );
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
          <p className="text-sm font-medium text-black">Заказ создан.</p>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            После подтверждения оплаты статус заказа автоматически станет
            «Оплачен». Если это был самовывоз с наличными, статус останется
            «Новый».
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
          {loadingProducts && (
            <div className="rounded-[20px] bg-white p-4 text-sm text-gray-500 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
              Обновляем данные товаров...
            </div>
          )}

          {items.map((item, i) => {
            const product = getProductById(item.id);
            const oldUnitPrice = productsMap[item.id]?.oldPrice ?? item.price;
            const lineOldTotal = oldUnitPrice * item.quantity;
            const lineNewTotal = item.price * item.quantity;
            const lineDiscountPercent = getDiscountPercent(
              lineOldTotal,
              lineNewTotal
            );

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
            <h2 className="mb-4 text-[18px] font-medium text-black">
              Данные клиента
            </h2>

            <input
              placeholder="Ваше имя *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-3 w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />

            <input
              placeholder="+7 (___) ___-__-__ *"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
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
              <>
                <div className="mb-4">
                  <p className="mb-2 text-sm text-gray-500">Сохранённые адреса</p>

                  {loadingAddresses ? (
                    <div className="rounded-2xl bg-[#F5F5F5] p-3 text-sm text-gray-500">
                      Загружаем адреса...
                    </div>
                  ) : savedAddresses.length === 0 ? (
                    <div className="rounded-2xl bg-[#F5F5F5] p-3 text-sm text-gray-500">
                      Сохранённых адресов пока нет
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {savedAddresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => handleSelectSavedAddress(address)}
                          className={`w-full rounded-2xl border p-3 text-left ${
                            selectedAddressId === address.id
                              ? "border-black bg-black text-white"
                              : "border-gray-200 bg-[#F5F5F5] text-black"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{address.label}</span>
                            {address.is_default && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] ${
                                  selectedAddressId === address.id
                                    ? "bg-white text-black"
                                    : "bg-black text-white"
                                }`}
                              >
                                Основной
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-1 text-sm ${
                              selectedAddressId === address.id
                                ? "text-white/80"
                                : "text-gray-500"
                            }`}
                          >
                            {formatSavedAddress(address)}
                          </p>
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={handleNewAddress}
                        className="w-full rounded-2xl border border-dashed border-gray-300 bg-white p-3 text-sm text-black"
                      >
                        Ввести новый адрес
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    placeholder="Город *"
                    value={city}
                    onChange={(e) => {
                      setSelectedAddressId("");
                      setCity(e.target.value);
                    }}
                    className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                  />

                  <input
                    placeholder="Улица *"
                    value={street}
                    onChange={(e) => {
                      setSelectedAddressId("");
                      setStreet(e.target.value);
                    }}
                    className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                  />

                  <input
                    placeholder="Дом *"
                    value={house}
                    onChange={(e) => {
                      setSelectedAddressId("");
                      setHouse(e.target.value);
                    }}
                    className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                  />

                  <input
                    placeholder="Квартира"
                    value={apartment}
                    onChange={(e) => {
                      setSelectedAddressId("");
                      setApartment(e.target.value);
                    }}
                    className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                  />

                  <input
                    placeholder="Подъезд"
                    value={entrance}
                    onChange={(e) => {
                      setSelectedAddressId("");
                      setEntrance(e.target.value);
                    }}
                    className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                  />

                  <input
                    placeholder="Этаж"
                    value={floor}
                    onChange={(e) => {
                      setSelectedAddressId("");
                      setFloor(e.target.value);
                    }}
                    className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                  />
                </div>

                <textarea
                  placeholder="Комментарий для доставки"
                  value={deliveryComment}
                  onChange={(e) => {
                    setSelectedAddressId("");
                    setDeliveryComment(e.target.value);
                  }}
                  rows={3}
                  className="mt-3 w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </>
            ) : (
              <div className="mb-4 rounded-2xl bg-[#F5F5F5] p-3.5 text-sm leading-6 text-gray-600">
                Самовывоз по адресу: {pickupAddress}. Подробнее уточняйте у менеджера.
              </div>
            )}

            <p className="mb-2 mt-4 text-sm text-gray-500">Способ оплаты</p>
            <div className="mb-3 grid grid-cols-2 gap-2">
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
                onClick={() => {
                  if (deliveryMethod !== "pickup") return;
                  setPaymentMethod("cash");
                }}
                disabled={deliveryMethod !== "pickup"}
                className={`rounded-2xl py-3 text-sm ${
                  paymentMethod === "cash"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-black"
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
                <span className="text-gray-400 line-through">
                  {finalOldTotal} ₽
                </span>
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

            {!!validationMessage && (
              <p className="mb-3 text-sm text-[#B45309]">{validationMessage}</p>
            )}

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
                disabled={!isFormValid || deliveryMethod !== "pickup" || isPaying}
                className="w-full rounded-2xl bg-black py-3.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {isPaying ? "Сохраняем..." : "Оформить заказ"}
              </button>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}