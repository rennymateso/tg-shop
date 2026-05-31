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

function getAttemptIdFromTbankOrderId(tbankOrderId: string) {
  if (!tbankOrderId.startsWith("TBANK-")) return tbankOrderId;
  return tbankOrderId.replace(/^TBANK-/, "");
}

export async function POST(req: NextRequest) {
  try {
    const terminalPassword = process.env.TBANK_TERMINAL_PASSWORD;
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
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
      await finalizeConfirmedPayment({
        supabase,
        attempt,
        tbankOrderId,
        paymentId,
        paymentStatus,
        botToken: telegramBotToken,
      });
    }

    return new NextResponse("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch {
    return new NextResponse("ERROR", { status: 500 });
  }
}
