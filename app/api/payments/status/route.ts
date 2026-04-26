import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const attemptId = req.nextUrl.searchParams.get("attemptId");

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
      .select("id, order_id, status, tbank_payment_status, paid_at, updated_at")
      .eq("id", attemptId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Попытка оплаты не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      attempt: data,
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