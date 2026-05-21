"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";
import {
  syncTelegramCustomer,
  type CustomerProfile,
} from "../lib/customer-profile";
import { getTelegramInitData } from "../lib/telegram-mini-app";
import { CheckoutPageSkeleton } from "../components/PageSkeletons";

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
  | "Частично готов"
  | "В пути из-за рубежа"
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
  deliveryComment: string;
  promoCode: string;
  selectedAddressId: string;
};

type PaymentAttemptStatus = {
  id: string;
  order_id: string | null;
  status: "pending" | "confirmed" | "failed" | "cancelled";
  tbank_payment_status: string | null;
  paid_at: string | null;
  updated_at: string;
};

type DadataSuggestion = {
  value: string;
};

function isKazanCity(value: string) {
  return value.trim().toLowerCase() === "казань";
}

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

function formatPrice(value: number | null | undefined) {
  if (!value) return "0";
  return value.toLocaleString("ru-RU");
}

function TrashIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function AddressDeleteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
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
  deliveryComment: string;
}) {
  const city = cleanCityValue(params.city);
  const street = cleanStreetValue(params.street, city);

  const parts: string[] = [
    `г. ${city}`,
    `ул. ${street}`,
    `д. ${params.house.trim()}`,
  ];

  if (params.apartment.trim()) parts.push(`кв. ${params.apartment.trim()}`);
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

function normalizeAddressPart(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function cleanCityValue(value: string) {
  return value
    .replace(/^\s*г\.?\s*/i, "")
    .replace(/^\s*город\s+/i, "")
    .trim();
}

function cleanStreetValue(value: string, cityValue = "") {
  let next = value.trim();

  const city = cleanCityValue(cityValue);

  next = next
    .replace(/^\s*г\.?\s*/i, "")
    .replace(/^\s*город\s+/i, "")
    .trim();

  if (city) {
    next = next
      .replace(new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\s*,?\s*`, "i"), "")
      .trim();
  }

  next = next
    .replace(/^\s*ул\.?\s*/i, "")
    .replace(/^\s*улица\s+/i, "")
    .trim();

  return next;
}

function readLocalAddresses() {
  try {
    const data = JSON.parse(localStorage.getItem("customer_addresses_local") || "[]");
    return Array.isArray(data) ? (data as CustomerAddress[]) : [];
  } catch {
    return [];
  }
}

function writeLocalAddresses(addresses: CustomerAddress[]) {
  localStorage.setItem("customer_addresses_local", JSON.stringify(addresses));
}

function getCheckoutItemImage(product: Product | undefined, color: string) {
  if (!product) return "/products/product-1.jpg";

  return (
    product.colorImages?.[color] ||
    product.image ||
    product.images?.[0] ||
    "/products/product-1.jpg"
  );
}

async function createOrderInSupabase(params: {
  customerId: string | null;
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
    customer_id: params.customerId,
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

  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showSavedAddressesModal, setShowSavedAddressesModal] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");

  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [apartment, setApartment] = useState("");
  const [deliveryComment, setDeliveryComment] = useState("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);

  const [promoCode, setPromoCode] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentCheckMessage, setPaymentCheckMessage] = useState("");

  const paymentStatus = searchParams.get("payment");
  const attemptId = searchParams.get("attemptId");

  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const previousViewport = viewport?.getAttribute("content") || "";

    viewport?.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover"
    );

    const preventGesture = (event: Event) => {
      event.preventDefault();
    };

    const preventMultiTouch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };

    let lastTouchEnd = 0;

    const preventDoubleTapZoom = (event: TouchEvent) => {
      const now = Date.now();

      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }

      lastTouchEnd = now;
    };

    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("gesturechange", preventGesture);
    document.addEventListener("gestureend", preventGesture);
    document.addEventListener("touchmove", preventMultiTouch, { passive: false });
    document.addEventListener("touchend", preventDoubleTapZoom, { passive: false });

    return () => {
      if (viewport) viewport.setAttribute("content", previousViewport);

      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchmove", preventMultiTouch);
      document.removeEventListener("touchend", preventDoubleTapZoom);
    };
  }, []);

  const loadAddresses = async () => {
    if (!initData) {
      const localAddresses = readLocalAddresses();
      setSavedAddresses(localAddresses);

      const defaultAddress = localAddresses.find((item) => item.is_default) || localAddresses[0];

      if (defaultAddress && !selectedAddressId) {
        setSelectedAddressId(defaultAddress.id);
        setCity(defaultAddress.city || "");
        setStreet(defaultAddress.street || "");
        setHouse(defaultAddress.house || "");
        setApartment(defaultAddress.apartment || "");
        setDeliveryComment(defaultAddress.comment || "");
        setShowNewAddressForm(false);
        setShowSavedAddressesModal(false);
      }

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
        setDeliveryComment(defaultAddress.comment || "");
        setShowNewAddressForm(false);
    setShowSavedAddressesModal(false);
      }
    } else {
      const localAddresses = readLocalAddresses();
      setSavedAddresses(localAddresses);
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
        setDeliveryComment(savedDraft.deliveryComment || "");
        setPromoCode(savedDraft.promoCode || "");
        setSelectedAddressId(savedDraft.selectedAddressId || "");
        setShowNewAddressForm(
          !savedDraft.selectedAddressId &&
            Boolean(savedDraft.city || savedDraft.street || savedDraft.house)
        );
      }
    } catch {
      //
    }
  }, []);

  useEffect(() => {
    const syncCustomer = async () => {
      const customer = await syncTelegramCustomer();

      if (!customer) return;

      setCustomerProfile(customer);

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
    deliveryComment,
    promoCode,
    selectedAddressId,
  ]);

  useEffect(() => {
    if (!paymentStatus || !attemptId) return;

    let cancelled = false;

    const checkAttempt = async () => {
      if (paymentStatus === "fail") {
        setPaymentError("Оплата не была завершена.");
        return;
      }

      setPaymentCheckMessage("Проверяем оплату...");

      for (let i = 0; i < 8; i += 1) {
        if (cancelled) return;

        const response = await fetch(
          `/api/payments/status?attemptId=${encodeURIComponent(attemptId)}`,
          { cache: "no-store" }
        );
        const result = await response.json();

        if (response.ok && result?.success) {
          const attempt = result.attempt as PaymentAttemptStatus;

          if (attempt.status === "confirmed") {
            localStorage.removeItem("cart");
            localStorage.removeItem("checkout_draft");
            window.dispatchEvent(new Event("cart-updated"));
            setItems([]);
            setPaymentCheckMessage("Оплата подтверждена. Заказ успешно создан.");
            return;
          }

          if (attempt.status === "failed" || attempt.status === "cancelled") {
            setPaymentCheckMessage("");
            setPaymentError("Оплата не подтверждена.");
            return;
          }
        }

        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }

      setPaymentCheckMessage(
        "Платёж ещё обрабатывается банком. Если оплата уже прошла, статус обновится чуть позже."
      );
    };

    checkAttempt();

    return () => {
      cancelled = true;
    };
  }, [paymentStatus, attemptId]);

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

  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryPrice =
    deliveryMethod === "delivery" && !isKazanCity(city) ? 500 : 0;
  const finalOldTotal = totals.oldItemsTotal + deliveryPrice;
  const finalNewTotal = totals.newItemsTotal + deliveryPrice;
  const discountAmount = Math.max(0, totals.oldItemsTotal - totals.newItemsTotal);

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

  useEffect(() => {
    const loadCitySuggestions = async () => {
      if (city.trim().length < 2) {
        setCitySuggestions([]);
        return;
      }

      try {
        const response = await fetch("/api/address/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: city,
          }),
        });

        const data = await response.json();

        setCitySuggestions(
          ((data.suggestions || []) as DadataSuggestion[])
            .map((item) => item.value)
            .filter(Boolean)
        );
      } catch {
        setCitySuggestions([]);
      }
    };

    const timeout = window.setTimeout(loadCitySuggestions, 250);

    return () => window.clearTimeout(timeout);
  }, [city]);

  useEffect(() => {
    const loadStreetSuggestions = async () => {
      if (street.trim().length < 2) {
        setStreetSuggestions([]);
        return;
      }

      try {
        const response = await fetch("/api/address/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: city.trim() ? `${cleanCityValue(city)}, ${street}` : street,
          }),
        });

        const data = await response.json();

        setStreetSuggestions(
          ((data.suggestions || []) as DadataSuggestion[])
            .map((item) => item.value)
            .filter(Boolean)
        );
      } catch {
        setStreetSuggestions([]);
      }
    };

    const timeout = window.setTimeout(loadStreetSuggestions, 250);

    return () => window.clearTimeout(timeout);
  }, [city, street]);

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
    setDeliveryComment(address.comment || "");
    setShowNewAddressForm(false);
    setShowSavedAddressesModal(false);
  };

  const handleNewAddress = () => {
    setSelectedAddressId("");
    setCity("");
    setStreet("");
    setHouse("");
    setApartment("");
    setDeliveryComment("");
    setShowNewAddressForm(true);
    setShowAddressModal(true);
  };

  const handleSaveAddressModal = async () => {
    if (!city.trim() || !street.trim() || !house.trim()) return;

    const newAddress: CustomerAddress = {
      id: `local-${Date.now()}`,
      label: savedAddresses.length === 0 ? "Основной адрес" : "Адрес доставки",
      city: cleanCityValue(city),
      street: cleanStreetValue(street, city),
      house: house.trim(),
      apartment: apartment.trim() || null,
      comment: deliveryComment.trim() || null,
      is_default: savedAddresses.length === 0,
    };

    const nextAddresses = [newAddress, ...savedAddresses];
    setSavedAddresses(nextAddresses);
    writeLocalAddresses(nextAddresses);
    setSelectedAddressId(newAddress.id);

    setShowAddressModal(false);
    setShowNewAddressForm(false);
    setShowSavedAddressesModal(false);

    await saveAddressIfNeeded();
  };

  const handleDeleteAddress = (addressId: string) => {
    const nextAddresses = savedAddresses.filter((address) => address.id !== addressId);

    const normalizedAddresses =
      nextAddresses.length > 0 && !nextAddresses.some((address) => address.is_default)
        ? nextAddresses.map((address, index) => ({
            ...address,
            is_default: index === 0,
          }))
        : nextAddresses;

    setSavedAddresses(normalizedAddresses);
    writeLocalAddresses(normalizedAddresses);

    if (selectedAddressId === addressId) {
      const nextSelected = normalizedAddresses[0];

      if (nextSelected) {
        handleSelectSavedAddress(nextSelected);
      } else {
        setSelectedAddressId("");
        setCity("");
        setStreet("");
        setHouse("");
        setApartment("");
        setDeliveryComment("");
      }
    }
  };

  const pickupAddress =
    'г. Казань, Академика Глушко 16Г, ТЦ "АКАДЕМИК", 2 этаж';

  const deliveryAddress = buildDeliveryAddress({
    city,
    street,
    house,
    apartment,
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
      const updatedCustomer = await syncTelegramCustomer(phone);
      if (updatedCustomer) {
        setCustomerProfile(updatedCustomer);
      }
    }
  };

  const saveAddressIfNeeded = async () => {
    if (deliveryMethod !== "delivery") return;
    if (!initData) return;
    if (!city.trim() || !street.trim() || !house.trim()) return;
    if (selectedAddressId) return;

    const addressExists = savedAddresses.some((address) => {
      return (
        normalizeAddressPart(address.city) === normalizeAddressPart(city) &&
        normalizeAddressPart(address.street) === normalizeAddressPart(street) &&
        normalizeAddressPart(address.house) === normalizeAddressPart(house) &&
        normalizeAddressPart(address.apartment) === normalizeAddressPart(apartment)
      );
    });

    if (addressExists) return;

    const response = await fetch("/api/customer/addresses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        initData,
        label: "Другой адрес",
        city: cleanCityValue(city),
        street: cleanStreetValue(street, city),
        house,
        apartment,
        comment: deliveryComment,
        is_default: savedAddresses.length === 0,
      }),
    });

    const result = await response.json();

    if (response.ok && result?.success) {
      await loadAddresses();
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
      setPaymentCheckMessage("");

      await persistCustomerPhone();

      await createOrderInSupabase({
        customerId: customerProfile?.id || null,
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
    setPaymentCheckMessage("");

    if (!isFormValid) {
      alert("Заполните все обязательные данные");
      return;
    }

    try {
      setIsPaying(true);
      await persistCustomerPhone();
      await saveAddressIfNeeded();

      const finalAddress =
        deliveryMethod === "pickup" ? pickupAddress : deliveryAddress;

      const response = await fetch("/api/payments/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customerProfile?.id || null,
          customer: name.trim(),
          phone,
          address: finalAddress,
          deliveryMethod,
          promoCode,
          comment: orderComment,
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

  const isPageLoading = loadingProducts;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&display=swap');

        .checkout-onest {
          font-family: 'Onest', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        html,
        body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          overscroll-behavior: none;
          -webkit-text-size-adjust: 100%;
          touch-action: pan-y;
        }

        input,
        textarea,
        select {
          font-size: 16px;
        }

        .checkout-fixed-page {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100vh;
          height: 100dvh;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y;
        }
      `}</style>

      <main className="checkout-onest checkout-fixed-page bg-[#F5F5F5] px-4 pt-[76px] pb-32">
      <div className="mb-5 flex items-center justify-center">
        <h1 className="text-[20px] font-medium">Оформление</h1>
      </div>

      {isPageLoading ? (
        <CheckoutPageSkeleton />
      ) : (
        <>
          {paymentCheckMessage && (
            <div className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
              <p className="text-sm font-medium text-black">{paymentCheckMessage}</p>
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
                className="mt-5 rounded-2xl bg-[#F0F0F0] px-5 py-3 text-sm font-medium text-black"
              >
                Перейти в каталог
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, i) => {
                const product = getProductById(item.id);
                const oldUnitPrice = productsMap[item.id]?.oldPrice ?? item.price;
                const lineOldTotal = oldUnitPrice * item.quantity;
                const lineNewTotal = item.price * item.quantity;
                const lineDiscountPercent = getDiscountPercent(
                  lineOldTotal,
                  lineNewTotal
                );
                const itemImage = getCheckoutItemImage(product, item.color);

                return (
                  <div
                    key={`${item.id}-${item.size}-${item.color}-${i}`}
                    className="rounded-[22px] bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => router.push(`/product?id=${item.id}`)}
                        className="aspect-[3/4] w-[82px] shrink-0 overflow-hidden rounded-[16px] bg-[#ECECEC]"
                        aria-label="Открыть товар"
                      >
                        <img
                          src={itemImage}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/products/product-1.jpg";
                          }}
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="mb-1 truncate text-[9px] font-normal uppercase tracking-[0.18em] text-[#aaa]">
                              {product?.brand || "MONTREAUX"}
                            </div>

                            <h2 className="line-clamp-2 text-[15px] font-medium leading-[1.2] tracking-[-0.02em] text-black">
                              {item.name}
                            </h2>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6F6F6] text-gray-400"
                            aria-label="Удалить товар"
                          >
                            <TrashIcon />
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-[#F3F3F3] px-2 py-1 text-[10px] text-gray-600">
                            Размер: {item.size}
                          </span>

                          <span className="rounded-full bg-[#F3F3F3] px-2 py-1 text-[10px] text-gray-600">
                            Цвет: {item.color}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap items-baseline gap-[5px]">
                            {lineOldTotal > lineNewTotal && (
                              <span className="text-[11px] font-normal leading-none text-[#999] line-through">
                                {formatPrice(lineOldTotal)} ₽
                              </span>
                            )}

                            {lineDiscountPercent > 0 && (
                              <span className="text-[11px] font-semibold leading-none text-[#e13a3a]">
                                −{lineDiscountPercent}%
                              </span>
                            )}

                            <span className="text-[16px] font-bold leading-none tracking-[-0.035em] text-[#16A34A]">
                              {formatPrice(lineNewTotal)} ₽
                            </span>
                          </div>

                          <div className="flex h-8 shrink-0 items-center rounded-full bg-[#F5F5F5] px-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(i, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-[17px] leading-none text-black"
                              aria-label="Уменьшить количество"
                            >
                              −
                            </button>

                            <span className="min-w-5 text-center text-[13px] font-medium text-black">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => updateQuantity(i, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-[17px] leading-none text-black"
                              aria-label="Увеличить количество"
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
                <h2 className="mb-3 text-[18px] font-medium text-black">
                  Получатель
                </h2>

                <div className="mb-4 grid gap-2">
                  <input
                    placeholder="Имя *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl bg-[#F5F5F5] px-3.5 py-3 text-sm outline-none"
                  />

                  <input
                    placeholder="+7 (___) ___-__-__ *"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full rounded-2xl bg-[#F5F5F5] px-3.5 py-3 text-sm outline-none"
                  />
                </div>

                <p className="mb-2 text-sm text-gray-500">Получение</p>
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDeliveryMethod("delivery")}
                    className={`rounded-2xl py-3 text-sm ${
                      deliveryMethod === "delivery"
                        ? "bg-white text-black ring-1 ring-black/20"
                        : "bg-[#F5F5F5] text-gray-500"
                    }`}
                  >
                    Доставка
                  </button>

                  <button
                    onClick={() => setDeliveryMethod("pickup")}
                    className={`rounded-2xl py-3 text-sm ${
                      deliveryMethod === "pickup"
                        ? "bg-white text-black ring-1 ring-black/20"
                        : "bg-[#F5F5F5] text-gray-500"
                    }`}
                  >
                    Самовывоз
                  </button>
                </div>

                {deliveryMethod === "delivery" ? (
                  <>
                    <div className="mb-4">
                      <p className="mb-2 text-sm text-gray-500">Адрес доставки</p>

                      {loadingAddresses ? (
                        <div className="rounded-2xl bg-[#F5F5F5] p-3 text-sm text-gray-500">
                          Загружаем адрес...
                        </div>
                      ) : selectedAddressId ? (
                        <button
                          type="button"
                          onClick={() => setShowSavedAddressesModal(true)}
                          className="w-full rounded-2xl border border-[#16A34A]/35 bg-[#EAF8F0] p-3 text-left"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-black">
                                {savedAddresses.find((item) => item.id === selectedAddressId)?.label || "Основной адрес"}
                              </div>
                              <div className="mt-1 truncate text-sm text-gray-500">
                                {formatSavedAddress(
                                  savedAddresses.find((item) => item.id === selectedAddressId) ||
                                    savedAddresses[0]
                                )}
                              </div>
                            </div>
                            <span className="shrink-0 text-[22px] leading-none text-gray-400">›</span>
                          </div>
                        </button>
                      ) : city || street || house ? (
                        <button
                          type="button"
                          onClick={() => setShowAddressModal(true)}
                          className="w-full rounded-2xl border border-[#16A34A]/35 bg-[#EAF8F0] p-3 text-left"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-black">Новый адрес</div>
                              <div className="mt-1 truncate text-sm text-gray-500">
                                {[
                                  city ? `г. ${cleanCityValue(city)}` : "",
                                  street ? `ул. ${cleanStreetValue(street, city)}` : "",
                                  house ? `д. ${house}` : "",
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            </div>
                            <span className="shrink-0 text-[22px] leading-none text-gray-400">›</span>
                          </div>
                        </button>
                      ) : (
                        <div className="rounded-2xl bg-[#F5F5F5] p-3 text-sm text-gray-500">
                          Адрес не выбран
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleNewAddress}
                        className="mt-2 w-full rounded-2xl border border-dashed border-gray-300 bg-white p-3 text-sm text-black"
                      >
                        + Создать новый адрес
                      </button>
                    </div>

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
                        ? "bg-white text-black ring-1 ring-black/20"
                        : "bg-[#F5F5F5] text-gray-500"
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
                        ? "bg-white text-black ring-1 ring-black/20"
                        : "bg-[#F5F5F5] text-gray-500"
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

                <div className="mb-4 rounded-2xl bg-[#F7F7F7] px-4 py-4 text-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[15px] font-medium text-black">Ваш заказ</span>
                    <span className="text-[13px] text-gray-500">
                      {itemsCount} шт.
                    </span>
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-gray-500">Товары ({itemsCount} шт.)</span>
                    <span className="text-black">{formatPrice(totals.oldItemsTotal)} ₽</span>
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-gray-500">Скидка</span>
                    <span className="text-[#e13a3a]">−{formatPrice(discountAmount)} ₽</span>
                  </div>

                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-gray-500">Доставка</span>
                    <span className={deliveryPrice > 0 ? "text-black" : "text-[#16A34A]"}>
                      {deliveryMethod === "delivery" && isKazanCity(city)
                        ? "Без доплат"
                        : deliveryPrice > 0
                        ? `${formatPrice(deliveryPrice)} ₽`
                        : "Бесплатно"}
                    </span>
                  </div>

                  <div className="flex items-end justify-between border-t border-[#E7E7E7] pt-3">
                    <span className="text-[15px] font-medium text-black">Итого</span>
                    <span className="text-[22px] font-semibold leading-none tracking-[-0.04em] text-[#2B2824]">
                      {formatPrice(finalNewTotal)} ₽
                    </span>
                  </div>
                </div>

                {!!validationMessage && (
                  <p className="mb-3 text-sm text-[#B45309]">{validationMessage}</p>
                )}

                {paymentMethod === "card" ? (
                  <button
                    onClick={handleCardPayment}
                    disabled={!isFormValid || isPaying}
                    className="w-full rounded-2xl bg-[#16A34A] py-3.5 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {isPaying ? "Переход..." : "Перейти к оплате"}
                  </button>
                ) : (
                  <button
                    onClick={handleCashOrder}
                    disabled={!isFormValid || deliveryMethod !== "pickup" || isPaying}
                    className="w-full rounded-2xl bg-[#16A34A] py-3.5 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {isPaying ? "Сохраняем..." : "Оформить заказ"}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showSavedAddressesModal && (
        <div
          className="fixed inset-0 z-[120] flex items-end bg-black/40 px-4"
          onClick={() => setShowSavedAddressesModal(false)}
        >
          <div
            className="w-full rounded-t-[28px] bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[17px] font-medium text-black">Сохранённые адреса</h3>
              <button
                type="button"
                onClick={() => setShowSavedAddressesModal(false)}
                className="text-sm text-gray-400"
              >
                Закрыть
              </button>
            </div>

            <div className="space-y-2">
              {savedAddresses.map((address) => (
                <div
                  key={address.id}
                  className={`flex items-center gap-2 rounded-2xl border p-2 ${
                    selectedAddressId === address.id
                      ? "border-[#16A34A]/40 bg-[#EAF8F0]"
                      : "border-gray-200 bg-[#F5F5F5]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectSavedAddress(address)}
                    className="min-w-0 flex-1 p-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-black">{address.label}</span>
                      {address.is_default && (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-black">
                          Основной
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {formatSavedAddress(address)}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddress(address.id);
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-gray-400"
                    aria-label="Удалить адрес"
                  >
                    <AddressDeleteIcon />
                  </button>
                </div>
              ))}
</div>
          </div>
        </div>
      )}

      {showAddressModal && (
        <div
          className="fixed inset-0 z-[130] flex items-end bg-black/40 px-4"
          onClick={() => setShowAddressModal(false)}
        >
          <div
            className="w-full rounded-t-[28px] bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-[17px] font-medium text-black">
              Новый адрес
            </h3>

            <div className="relative mb-3">
              <input
                placeholder="Город *"
                value={city}
                onChange={(e) => {
                  setSelectedAddressId("");
                  setCity(e.target.value);
                  setShowCitySuggestions(e.target.value.trim().length > 0);
                }}
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />

              {showCitySuggestions && citySuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[52px] z-40 overflow-hidden rounded-2xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.10)]">
                  {citySuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setCity(suggestion);
                        setShowCitySuggestions(false);
                      }}
                      className="block w-full px-4 py-3 text-left text-sm text-black active:bg-[#F5F5F5]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-[1fr_82px_92px] gap-2">
              <div className="relative">
                <input
                  placeholder="Улица *"
                  value={street}
                  onChange={(e) => {
                    setSelectedAddressId("");
                    setStreet(e.target.value);
                    setShowStreetSuggestions(e.target.value.trim().length > 0);
                  }}
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />

                {showStreetSuggestions && streetSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[52px] z-40 overflow-hidden rounded-2xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.10)]">
                    {streetSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setStreet(suggestion);
                          setShowStreetSuggestions(false);
                        }}
                        className="block w-full px-4 py-3 text-left text-sm text-black active:bg-[#F5F5F5]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
                placeholder="Кв."
                value={apartment}
                onChange={(e) => {
                  setSelectedAddressId("");
                  setApartment(e.target.value);
                }}
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            </div>

            <textarea
              placeholder="Комментарий: подъезд, этаж, код домофона"
              value={deliveryComment}
              onChange={(e) => {
                setSelectedAddressId("");
                setDeliveryComment(e.target.value);
              }}
              rows={3}
              className="mt-3 w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />

            <button
              type="button"
              onClick={handleSaveAddressModal}
              disabled={!city.trim() || !street.trim() || !house.trim()}
              className="mt-4 w-full rounded-2xl bg-black py-3.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      <BottomNav />
      </main>
    </>
  );
}