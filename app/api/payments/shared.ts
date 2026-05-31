import type { SupabaseClient } from "@supabase/supabase-js";

export type AttemptItem = {
  id: string;
  name: string;
  price: number;
  size?: string;
  color?: string;
  quantity?: number;
};

export type PaymentAttemptRow = {
  id: string;
  order_id: string | null;
  customer_id: string | null;
  customer: string;
  phone: string;
  total: number;
  payment: "Картой";
  delivery: "Доставка" | "Самовывоз";
  address: string;
  comment: string | null;
  promo_code: string | null;
  items: AttemptItem[];
  tbank_order_id: string | null;
  tbank_payment_id: string | null;
  tbank_payment_status: string | null;
  status: "pending" | "confirmed" | "failed" | "cancelled";
  paid_at: string | null;
};

type ProductStockRow = {
  id: string;
  stock: Record<string, number> | null;
  sizes: string[] | null;
};

type CustomerTelegramRow = {
  telegram_user_id: number | null;
  first_name: string | null;
};

export const promoCodes: Record<string, number> = {
  MONTREAUX10: 10,
  SALE10: 10,
  WELCOME10: 10,
  VIP15: 15,
};

export type DeliverySettings = {
  freeCities: string[];
  deliveryPrice: number;
  inStockMinDays: number;
  inStockMaxDays: number;
  foreignMinDays: number;
  foreignMaxDays: number;
  pickupAddress: string;
};

type AppSettingRow = {
  value: Partial<DeliverySettings> | null;
};

export const defaultDeliverySettings: DeliverySettings = {
  freeCities: ["Казань"],
  deliveryPrice: 500,
  inStockMinDays: 1,
  inStockMaxDays: 3,
  foreignMinDays: 7,
  foreignMaxDays: 14,
  pickupAddress: 'г. Казань, Академика Глушко 16Г, ТЦ "АКАДЕМИК", 2 этаж',
};

export function normalizeCity(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^г\.?\s*/i, "")
    .replace(/^город\s+/i, "");
}

export function normalizeDeliverySettings(
  value: Partial<DeliverySettings> | null | undefined
): DeliverySettings {
  const freeCities =
    Array.isArray(value?.freeCities) && value.freeCities.length > 0
      ? value.freeCities.map((city) => String(city).trim()).filter(Boolean)
      : defaultDeliverySettings.freeCities;

  const deliveryPrice = Math.max(
    0,
    Number(value?.deliveryPrice ?? defaultDeliverySettings.deliveryPrice) || 0
  );

  const inStockMinDays = Math.max(
    1,
    Number(value?.inStockMinDays ?? defaultDeliverySettings.inStockMinDays) || 1
  );
  const inStockMaxDays = Math.max(
    inStockMinDays,
    Number(value?.inStockMaxDays ?? defaultDeliverySettings.inStockMaxDays) ||
      inStockMinDays
  );
  const foreignMinDays = Math.max(
    1,
    Number(value?.foreignMinDays ?? defaultDeliverySettings.foreignMinDays) || 1
  );
  const foreignMaxDays = Math.max(
    foreignMinDays,
    Number(value?.foreignMaxDays ?? defaultDeliverySettings.foreignMaxDays) ||
      foreignMinDays
  );

  return {
    freeCities,
    deliveryPrice,
    inStockMinDays,
    inStockMaxDays,
    foreignMinDays,
    foreignMaxDays,
    pickupAddress:
      value?.pickupAddress?.trim() || defaultDeliverySettings.pickupAddress,
  };
}

export async function getDeliverySettings(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "delivery")
    .maybeSingle<AppSettingRow>();

  return normalizeDeliverySettings(data?.value);
}

export function getDeliveryPrice(params: {
  deliveryMethod: string;
  city: string;
  settings: DeliverySettings;
}) {
  if (params.deliveryMethod !== "delivery") return 0;

  const freeCities = params.settings.freeCities.map(normalizeCity);
  return freeCities.includes(normalizeCity(params.city))
    ? 0
    : params.settings.deliveryPrice;
}

export function getPromoPercent(value: string) {
  return promoCodes[value.trim().toUpperCase()] || 0;
}

export function calculatePromoDiscount(itemsTotal: number, promoCode: string) {
  const promoPercent = getPromoPercent(promoCode);
  return promoPercent > 0 ? Math.round((itemsTotal * promoPercent) / 100) : 0;
}

export function buildOrderIdFromAttemptId(attemptId: string) {
  return `ORD-${attemptId.replace(/^PAY-/, "")}`;
}

function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.max(0, Math.round(value)));
}

function escapeTelegramHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getItemQuantity(item: AttemptItem) {
  return item.quantity && item.quantity > 0 ? item.quantity : 1;
}

function getStockKey(color: string | undefined, size: string) {
  return color ? `${color}::${size}` : size;
}

function hasColorStock(product: ProductStockRow, color: string | undefined) {
  if (!product.stock || !color) return false;
  return Object.keys(product.stock).some((key) => key.startsWith(`${color}::`));
}

export async function getStockErrors(
  supabase: SupabaseClient,
  items: AttemptItem[]
) {
  const grouped = new Map<string, Map<string, number>>();

  for (const item of items) {
    if (!item.id) continue;

    const size = item.size?.trim() || "OS";
    const color = item.color?.trim() || "";
    const stockKey = getStockKey(color, size);
    const byStockKey = grouped.get(item.id) || new Map<string, number>();
    byStockKey.set(stockKey, (byStockKey.get(stockKey) || 0) + getItemQuantity(item));
    grouped.set(item.id, byStockKey);
  }

  const errors: string[] = [];

  for (const [productId, bySize] of grouped.entries()) {
    const { data: product } = await supabase
      .from("products")
      .select("id, name, stock, sizes")
      .eq("id", productId)
      .maybeSingle<ProductStockRow & { name?: string }>();

    if (!product) {
      errors.push(`Товар ${productId} не найден`);
      continue;
    }

    for (const [stockKey, quantity] of bySize.entries()) {
      const [color, sizeFromKey] = stockKey.includes("::")
        ? stockKey.split("::")
        : ["", stockKey];
      const size = sizeFromKey || "OS";
      const hasStockKey = Boolean(
        product.stock && Object.prototype.hasOwnProperty.call(product.stock, stockKey)
      );
      const hasSizeStockKey = Boolean(
        product.stock && Object.prototype.hasOwnProperty.call(product.stock, size)
      );
      const available = hasStockKey
        ? Math.max(0, Number(product.stock?.[stockKey]) || 0)
        : color && hasColorStock(product, color)
          ? 0
          : hasSizeStockKey
            ? Math.max(0, Number(product.stock?.[size]) || 0)
            : product.sizes?.includes(size)
              ? 1
              : 0;

      if (available <= 0) {
        errors.push(
          `${product.name || productId}, размер ${size}${color ? `, цвет ${color}` : ""}: нет в наличии`
        );
      } else if (quantity > available) {
        errors.push(
          `${product.name || productId}, размер ${size}${color ? `, цвет ${color}` : ""}: доступно ${available} шт.`
        );
      }
    }
  }

  return errors;
}

export async function decreaseProductStocks(
  supabase: SupabaseClient,
  items: AttemptItem[]
) {
  const grouped = new Map<string, Map<string, number>>();

  for (const item of items) {
    if (!item.id) continue;

    const size = item.size?.trim() || "OS";
    const color = item.color?.trim() || "";
    const stockKey = getStockKey(color, size);
    const byStockKey = grouped.get(item.id) || new Map<string, number>();
    byStockKey.set(stockKey, (byStockKey.get(stockKey) || 0) + getItemQuantity(item));
    grouped.set(item.id, byStockKey);
  }

  for (const [productId, bySize] of grouped.entries()) {
    const { data: product } = await supabase
      .from("products")
      .select("id, stock, sizes")
      .eq("id", productId)
      .maybeSingle<ProductStockRow>();

    if (!product) continue;

    const nextStock = { ...(product.stock || {}) };

    for (const [stockKey, quantity] of bySize.entries()) {
      const [, sizeFromKey] = stockKey.includes("::")
        ? stockKey.split("::")
        : ["", stockKey];
      const size = sizeFromKey || "OS";
      const targetKey = Object.prototype.hasOwnProperty.call(nextStock, stockKey)
        ? stockKey
        : size;
      const current = Math.max(0, Number(nextStock[targetKey]) || 0);
      nextStock[targetKey] = Math.max(0, current - quantity);
    }

    const nextSizes = Array.from(
      new Set(
        Object.entries(nextStock)
          .filter(([, value]) => Math.max(0, Number(value) || 0) > 0)
          .map(([size]) => size.split("::").pop() || size)
      )
    );

    await supabase
      .from("products")
      .update({
        stock: nextStock,
        sizes: nextSizes.length > 0 ? nextSizes : product.sizes || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);
  }
}

export async function sendCustomerPurchaseNotification(params: {
  supabase: SupabaseClient;
  botToken: string | undefined;
  customerId: string | null;
  orderId: string;
  total: number;
  delivery: string;
  payment: string;
  address: string;
}) {
  if (!params.botToken || !params.customerId) {
    return;
  }

  const { data: customer } = await params.supabase
    .from("customers")
    .select("telegram_user_id, first_name")
    .eq("id", params.customerId)
    .maybeSingle<CustomerTelegramRow>();

  if (!customer?.telegram_user_id) {
    return;
  }

  const name = customer.first_name?.trim() || "Покупатель";
  const text = [
    `${name}, благодарим за выбор.`,
    "",
    `Ваш заказ № ${params.orderId} успешно`,
    "оформлен и принят в работу.",
    "",
    `Сумма: ${formatRub(params.total)} RUB  |  ${params.delivery}`,
    "",
    "Наш специалист проверит детали",
    "и при необходимости свяжется с вами.",
    "",
    "Следить за статусом заказа можно",
    "в профиле → «Мои заказы».",
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${params.botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: customer.telegram_user_id,
      text,
      disable_web_page_preview: true,
    }),
    cache: "no-store",
  });
}

export async function sendSellerPurchaseNotification(params: {
  botToken: string | undefined;
  orderId: string;
  total: number;
  delivery: string;
  payment: string;
  customer: string;
  phone: string;
  address: string;
  items: AttemptItem[];
}) {
  const chatIds = (process.env.TELEGRAM_ADMIN_CHAT_ID || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!params.botToken || chatIds.length === 0) {
    return;
  }

  const itemsText = params.items
    .map((item) => {
      const qty = getItemQuantity(item);
      const name = escapeTelegramHtml(item.name);
      const size = item.size ? ` / ${escapeTelegramHtml(item.size)}` : "";
      const color = item.color ? ` / ${escapeTelegramHtml(item.color)}` : "";
      return `${name}${size}${color} / ${qty} шт.`;
    })
    .join("\n") || "Товары уточняются";

  const text = [
    "<b>Есть новый заказ</b>",
    "",
    `Продажи идут — вы получили заказ ${escapeTelegramHtml(params.orderId)}. Вот что в нём:`,
    "·",
    itemsText,
    "",
    `Общая сумма заказа — ${formatRub(params.total)} RUB - ${params.payment}`,
    "",
    `Покупатель: ${escapeTelegramHtml(params.customer)}`,
    `Телефон: ${escapeTelegramHtml(params.phone)}`,
    "",
    `Способ получения: ${escapeTelegramHtml(params.delivery)}`,
    "",
    `Адрес покупателя: ${escapeTelegramHtml(params.address || "не указан")}`,
    "",
    "Команда Montreaux",
  ].join("\n");

  await Promise.all(
    chatIds.map((chatId) =>
      fetch(`https://api.telegram.org/bot${params.botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        cache: "no-store",
      })
    )
  );
}

export async function finalizeConfirmedPayment(params: {
  supabase: SupabaseClient;
  attempt: PaymentAttemptRow;
  tbankOrderId: string | null;
  paymentId: string | null;
  paymentStatus: string;
  botToken: string | undefined;
}) {
  const existingOrderId =
    params.attempt.order_id || buildOrderIdFromAttemptId(params.attempt.id);
  const paidAt = new Date().toISOString();

  const { data: existingOrder } = await params.supabase
    .from("orders")
    .select("id")
    .eq("id", existingOrderId)
    .maybeSingle();

  if (existingOrder) {
    await params.supabase
      .from("payment_attempts")
      .update({
        order_id: existingOrderId,
        status: "confirmed",
        tbank_order_id: params.tbankOrderId,
        tbank_payment_id: params.paymentId,
        tbank_payment_status: params.paymentStatus,
        paid_at: params.attempt.paid_at || paidAt,
        updated_at: paidAt,
      })
      .eq("id", params.attempt.id);

    return existingOrderId;
  }

  const orderPayload = {
    id: existingOrderId,
    customer_id: params.attempt.customer_id,
    customer: params.attempt.customer,
    phone: params.attempt.phone,
    total: params.attempt.total,
    payment: "Картой",
    delivery: params.attempt.delivery,
    address: params.attempt.address,
    status: "Оплачен",
    comment: params.attempt.comment || "",
    promo_code: params.attempt.promo_code || "",
    tbank_order_id: params.tbankOrderId,
    tbank_payment_id: params.paymentId,
    tbank_payment_status: params.paymentStatus,
    paid_at: paidAt,
    updated_at: paidAt,
  };

  const { error: orderInsertError } = await params.supabase
    .from("orders")
    .insert(orderPayload);

  if (orderInsertError) {
    throw new Error(orderInsertError.message);
  }

  const itemsPayload = (params.attempt.items || []).map((item) => ({
    order_id: existingOrderId,
    product_id: item.id,
    name: item.name,
    size: item.size || "",
    color: item.color || "",
    quantity: getItemQuantity(item),
    price: item.price,
    item_status: "Подтвержден",
  }));

  if (itemsPayload.length > 0) {
    await params.supabase.from("order_items").insert(itemsPayload);
  }

  await decreaseProductStocks(params.supabase, params.attempt.items || []);

  await params.supabase
    .from("payment_attempts")
    .update({
      order_id: existingOrderId,
      status: "confirmed",
      tbank_order_id: params.tbankOrderId,
      tbank_payment_id: params.paymentId,
      tbank_payment_status: params.paymentStatus,
      paid_at: paidAt,
      updated_at: paidAt,
    })
    .eq("id", params.attempt.id);

  try {
    await sendCustomerPurchaseNotification({
      supabase: params.supabase,
      botToken: params.botToken,
      customerId: params.attempt.customer_id,
      orderId: existingOrderId,
      total: params.attempt.total,
      delivery: params.attempt.delivery,
      payment: "Оплачен картой",
      address: params.attempt.address,
    });
  } catch (error) {
    console.error("Telegram customer notification error:", error);
  }

  try {
    await sendSellerPurchaseNotification({
      botToken: params.botToken,
      orderId: existingOrderId,
      total: params.attempt.total,
      delivery: params.attempt.delivery,
      payment: "Оплачен картой",
      address: params.attempt.address,
      customer: params.attempt.customer,
      phone: params.attempt.phone,
      items: params.attempt.items || [],
    });
  } catch (error) {
    console.error("Telegram seller notification error:", error);
  }

  return existingOrderId;
}
