import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

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

function getLocalOrderIdFromTbankOrderId(tbankOrderId: string) {
  if (!tbankOrderId.startsWith("TBANK-")) return tbankOrderId;
  return tbankOrderId.replace(/^TBANK-/, "");
}

export async function POST(req: NextRequest) {
  try {
    const terminalPassword = process.env.TBANK_TERMINAL_PASSWORD;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!terminalPassword || !supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ success: false, error: "Server env error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body = await req.json();
    const incomingToken = String(body?.Token || "");

    const expectedToken = generateToken(body, terminalPassword);

    if (!incomingToken || incomingToken !== expectedToken) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 400 });
    }

    const tbankOrderId = String(body?.OrderId || "");
    const paymentId = body?.PaymentId ? String(body.PaymentId) : null;
    const paymentStatus = String(body?.Status || "");

    if (!tbankOrderId) {
      return NextResponse.json({ success: false, error: "OrderId missing" }, { status: 400 });
    }

    const localOrderId = getLocalOrderIdFromTbankOrderId(tbankOrderId);

    const updatePayload: Record<string, unknown> = {
      tbank_order_id: tbankOrderId,
      tbank_payment_id: paymentId,
      tbank_payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    if (paymentStatus === "CONFIRMED") {
      updatePayload.status = "Оплачен";
      updatePayload.paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", localOrderId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
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