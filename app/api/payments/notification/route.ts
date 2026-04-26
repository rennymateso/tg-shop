import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type AttemptItem = {
  id: string;
  name: string;
  price: number;
  size?: string;
  color?: string;
  quantity?: number;
};

type PaymentAttemptRow = {
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

function getAttemptIdFromTbankOrderId(tbankOrderId: string) {
  if (!tbankOrderId.startsWith("TBANK-")) return tbankOrderId;
  return tbankOrderId.replace(/^TBANK-/, "");
}

function buildOrderIdFromAttemptId(attemptId: string) {
  return `ORD-${attemptId.replace(/^PAY-/, "")}`;
}

export async function POST(req: NextRequest) {
  try {
    const terminalPassword = process.env.TBANK_TERMINAL_PASSWORD;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!terminalPassword || !supabaseUrl || !supabaseServiceRoleKey) {
      return new NextResponse("ERROR", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body = await req.json();
    const incomingToken = String(body?.Token || "");
    const expectedToken = generateToken(body, terminalPassword);

    if (!incomingToken || incomingToken !== expectedToken) {
      return new NextResponse("ERROR", { status: 400 });
    }

    const tbankOrderId = String(body?.OrderId || "");
    const paymentId = body?.PaymentId ? String(body.PaymentId) : null;
    const paymentStatus = String(body?.Status || "");

    if (!tbankOrderId) {
      return new NextResponse("ERROR", { status: 400 });
    }

    const attemptId = getAttemptIdFromTbankOrderId(tbankOrderId);

    const { data: attemptData, error: attemptError } = await supabase
      .from("payment_attempts")
      .select("*")
      .eq("id", attemptId)
      .single();

    if (attemptError || !attemptData) {
      return new NextResponse("OK", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const attempt = attemptData as PaymentAttemptRow;

    const attemptUpdate: Record<string, unknown> = {
      tbank_order_id: tbankOrderId,
      tbank_payment_id: paymentId,
      tbank_payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    if (paymentStatus === "CONFIRMED") {
      attemptUpdate.status = "confirmed";
      attemptUpdate.paid_at = new Date().toISOString();
    } else if (["CANCELED"].includes(paymentStatus)) {
      attemptUpdate.status = "cancelled";
    } else if (["REJECTED", "DEADLINE_EXPIRED", "AUTH_FAIL"].includes(paymentStatus)) {
      attemptUpdate.status = "failed";
    }

    await supabase.from("payment_attempts").update(attemptUpdate).eq("id", attemptId);

    if (paymentStatus === "CONFIRMED") {
      const existingOrderId = attempt.order_id || buildOrderIdFromAttemptId(attempt.id);

      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("id", existingOrderId)
        .maybeSingle();

      if (!existingOrder) {
        const orderPayload = {
          id: existingOrderId,
          customer_id: attempt.customer_id,
          customer: attempt.customer,
          phone: attempt.phone,
          total: attempt.total,
          payment: "Картой",
          delivery: attempt.delivery,
          address: attempt.address,
          status: "Оплачен",
          comment: attempt.comment || "",
          promo_code: attempt.promo_code || "",
          tbank_order_id: tbankOrderId,
          tbank_payment_id: paymentId,
          tbank_payment_status: paymentStatus,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: orderInsertError } = await supabase
          .from("orders")
          .insert(orderPayload);

        if (!orderInsertError) {
          const itemsPayload = (attempt.items || []).map((item) => ({
            order_id: existingOrderId,
            product_id: item.id,
            name: item.name,
            size: item.size || "",
            color: item.color || "",
            quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
            price: item.price,
            item_status: "Подтвержден",
          }));

          if (itemsPayload.length > 0) {
            await supabase.from("order_items").insert(itemsPayload);
          }

          await supabase
            .from("payment_attempts")
            .update({
              order_id: existingOrderId,
              status: "confirmed",
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", attemptId);
        }
      }
    }

    return new NextResponse("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch {
    return new NextResponse("ERROR", { status: 500 });
  }
}