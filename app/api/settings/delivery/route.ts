import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  defaultDeliverySettings,
  getDeliverySettings,
  normalizeDeliverySettings,
} from "../../payments/shared";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json({
        success: true,
        settings: defaultDeliverySettings,
        source: "default",
      });
    }

    const settings = await getDeliverySettings(supabase);

    return NextResponse.json({
      success: true,
      settings,
      source: "database",
    });
  } catch {
    return NextResponse.json({
      success: true,
      settings: defaultDeliverySettings,
      source: "default",
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Не задан SUPABASE_SERVICE_ROLE_KEY. Настройки нельзя сохранить.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const settings = normalizeDeliverySettings(body?.settings);

    const { error } = await supabase.from("app_settings").upsert(
      {
        key: "delivery",
        value: settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Не удалось сохранить настройки. Проверь таблицу app_settings в Supabase.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings,
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
