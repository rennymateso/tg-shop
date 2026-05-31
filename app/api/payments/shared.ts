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

function getItemQuantity(item: AttemptItem) {
  return item.quantity && item.quantity > 0 ? item.quantity : 1;
}

export async function decreaseProductStocks(
  supabase: SupabaseClient,
  items: AttemptItem[]
) {
  const grouped = new Map<string, Map<string, number>>();

  for (const item of items) {
    if (!item.id) continue;

    const size = item.size?.trim() || "OS";
    const bySize = grouped.get(item.id) || new Map<string, number>();
    bySize.set(size, (bySize.get(size) || 0) + getItemQuantity(item));
    grouped.set(item.id, bySize);
  }

  for (const [productId, bySize] of grouped.entries()) {
    const { data: product } = await supabase
      .from("products")
      .select("id, stock, sizes")
      .eq("id", productId)
      .maybeSingle<ProductStockRow>();

    if (!product) continue;

    const nextStock = { ...(product.stock || {}) };

    for (const [size, quantity] of bySize.entries()) {
      const current = Math.max(0, Number(nextStock[size]) || 0);
      nextStock[size] = Math.max(0, current - quantity);
    }

    const nextSizes = Object.entries(nextStock)
      .filter(([, value]) => Math.max(0, Number(value) || 0) > 0)
      .map(([size]) => size);

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

  const hello = customer.first_name ? `${customer.first_name}, ` : "";
  const text = [
    `${hello}заказ оплачен и принят в работу.`,
    "",
    `Номер заказа: ${params.orderId}`,
    `Сумма: ${formatRub(params.total)} ₽`,
    `Получение: ${params.delivery}`,
    "",
    "Менеджер проверит заказ и свяжется с вами, если нужно уточнить детали.",
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
