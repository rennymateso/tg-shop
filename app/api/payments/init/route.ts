import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type CartItem = {
  id: string;
  name: string;
  price: number;
  size?: string;
  color?: string;
  quantity?: number;
};

function generateToken(payload: Record<string, unknown>, password: string) {
  const data: Record<string, string> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (
      key === "Token" ||
      value === undefined ||
      value === null ||
      typeof value === "object"
    ) {
      continue;
    }

    data[key] = String(value);
  }

  data.Password = password;

  const source = Object.keys(data)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => data[key])
    .join("");

  return createHash("sha256").update(source, "utf8").digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const terminalKey = process.env.TBANK_TERMINAL_KEY;
    const terminalPassword = process.env.TBANK_TERMINAL_PASSWORD;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !terminalKey ||
      !terminalPassword ||
      !baseUrl ||
      !supabaseUrl ||
      !supabaseServiceRoleKey
    ) {
      return NextResponse.json(
        { success: false, error: "Не заполнены переменные окружения" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body = await req.json();

    const customerId = body?.customerId ? String(body.customerId) : null;
    const customer = String(body?.customer || body?.name || "").trim();
    const phone = String(body?.phone || "").trim();
    const address = String(body?.address || "").trim();
    const deliveryMethod = String(body?.deliveryMethod || "delivery").trim();
    const promoCode = String(body?.promoCode || "").trim();
    const comment = String(body?.comment || "").trim();
    const items = (body?.items || []) as CartItem[];

    if (!customer || !phone || !address || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Некорректные данные заказа" },
        { status: 400 }
      );
    }

    const itemsTotal = items.reduce((sum, item) => {
      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      return sum + item.price * qty;
    }, 0);

    const deliveryPrice = deliveryMethod === "delivery" ? 500 : 0;
    const totalRub = itemsTotal + deliveryPrice;
    const amount = Math.round(totalRub * 100);

    const attemptId = `PAY-${Date.now()}`;
    const tbankOrderId = `TBANK-${attemptId}`;

    const attemptPayload = {
      id: attemptId,
      customer_id: customerId,
      customer,
      phone,
      total: totalRub,
      payment: "Картой",
      delivery: deliveryMethod === "pickup" ? "Самовывоз" : "Доставка",
      address,
      comment,
      promo_code: promoCode,
      items,
      status: "pending",
      updated_at: new Date().toISOString(),
    };

    const { error: attemptInsertError } = await supabase
      .from("payment_attempts")
      .insert(attemptPayload);

    if (attemptInsertError) {
      return NextResponse.json(
        {
          success: false,
          error: `Не удалось создать попытку оплаты: ${attemptInsertError.message}`,
        },
        { status: 500 }
      );
    }

    const descriptionParts = [
      `Попытка оплаты ${attemptId}`,
      `Получение: ${deliveryMethod === "delivery" ? "доставка" : "самовывоз"}`,
    ];

    if (address) {
      descriptionParts.push(`Адрес: ${address}`);
    }

    const payload: Record<string, unknown> = {
      TerminalKey: terminalKey,
      Amount: amount,
      OrderId: tbankOrderId,
      Description: descriptionParts.join(" | "),
      NotificationURL: `${baseUrl}/api/payments/notification`,
      SuccessURL: `${baseUrl}/checkout?payment=success&attemptId=${attemptId}`,
      FailURL: `${baseUrl}/checkout?payment=fail&attemptId=${attemptId}`,
    };

    const token = generateToken(payload, terminalPassword);

    const response = await fetch("https://securepay.tinkoff.ru/v2/Init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        Token: token,
      }),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || !result?.Success || !result?.PaymentURL) {
      await supabase
        .from("payment_attempts")
        .update({
          status: "failed",
          tbank_order_id: tbankOrderId,
          tbank_payment_status: result?.Status ? String(result.Status) : "INIT_FAILED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", attemptId);

      return NextResponse.json(
        {
          success: false,
          error: result?.Message || result?.Details || "Ошибка Init T-Bank",
          raw: result,
        },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from("payment_attempts")
      .update({
        tbank_order_id: tbankOrderId,
        tbank_payment_id: result.PaymentId ? String(result.PaymentId) : null,
        tbank_payment_status: result.Status ? String(result.Status) : "NEW",
        updated_at: new Date().toISOString(),
      })
      .eq("id", attemptId);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: `Платеж создан, но не удалось обновить попытку оплаты: ${updateError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentUrl: result.PaymentURL,
      paymentId: result.PaymentId ?? null,
      attemptId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Внутренняя ошибка сервера",
        details: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 }
    );
  }
}