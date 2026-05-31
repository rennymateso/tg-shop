import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  finalizeConfirmedPayment,
  type PaymentAttemptRow,
} from "../shared";

export const runtime = "nodejs";

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

async function getTbankStatus(params: {
  terminalKey: string;
  terminalPassword: string;
  paymentId: string;
}) {
  const payload: Record<string, unknown> = {
    TerminalKey: params.terminalKey,
    PaymentId: params.paymentId,
  };

  const token = generateToken(payload, params.terminalPassword);

  const response = await fetch("https://securepay.tinkoff.ru/v2/GetState", {
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

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as {
    Success?: boolean;
    Status?: string;
    PaymentId?: string | number;
    OrderId?: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    const attemptId = req.nextUrl.searchParams.get("attemptId");

    const terminalKey = process.env.TBANK_TERMINAL_KEY;
    const terminalPassword = process.env.TBANK_TERMINAL_PASSWORD;
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!attemptId || !supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { success: false, error: "Некорректный запрос" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data, error } = await supabase
      .from("payment_attempts")
      .select("*")
      .eq("id", attemptId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Попытка оплаты не найдена" },
        { status: 404 }
      );
    }

    let attempt = data as PaymentAttemptRow;

    if (
      attempt.status !== "confirmed" &&
      attempt.tbank_payment_id &&
      terminalKey &&
      terminalPassword
    ) {
      const tbankState = await getTbankStatus({
        terminalKey,
        terminalPassword,
        paymentId: attempt.tbank_payment_id,
      });

      const tbankStatus = String(tbankState?.Status || attempt.tbank_payment_status || "");

      if (tbankState?.Success && tbankStatus === "CONFIRMED") {
        const orderId = await finalizeConfirmedPayment({
          supabase,
          attempt,
          tbankOrderId: attempt.tbank_order_id,
          paymentId: attempt.tbank_payment_id,
          paymentStatus: tbankStatus,
          botToken: telegramBotToken,
        });

        attempt = {
          ...attempt,
          order_id: orderId,
          status: "confirmed",
          tbank_payment_status: tbankStatus,
          paid_at: attempt.paid_at || new Date().toISOString(),
        };
      } else if (
        ["CANCELED", "REJECTED", "DEADLINE_EXPIRED", "AUTH_FAIL"].includes(tbankStatus)
      ) {
        const nextStatus = tbankStatus === "CANCELED" ? "cancelled" : "failed";

        await supabase
          .from("payment_attempts")
          .update({
            status: nextStatus,
            tbank_payment_status: tbankStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", attempt.id);

        attempt = {
          ...attempt,
          status: nextStatus,
          tbank_payment_status: tbankStatus,
        };
      }
    }

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        order_id: attempt.order_id,
        status: attempt.status,
        tbank_payment_status: attempt.tbank_payment_status,
        paid_at: attempt.paid_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 }
    );
  }
}
