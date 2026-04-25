import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

function buildDataCheckString(initData: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    throw new Error("Missing Telegram hash");
  }

  const entries = Array.from(params.entries())
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);

  return {
    hash,
    authDate: Number(params.get("auth_date") || 0),
    dataCheckString: entries.join("\n"),
    userRaw: params.get("user"),
  };
}

function validateTelegramInitData(initData: string, botToken: string) {
  const { hash, authDate, dataCheckString, userRaw } =
    buildDataCheckString(initData);

  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calculatedHash !== hash) {
    throw new Error("Invalid Telegram signature");
  }

  const now = Math.floor(Date.now() / 1000);
  const maxAgeSeconds = 60 * 60 * 24;

  if (!authDate || now - authDate > maxAgeSeconds) {
    throw new Error("Telegram auth data is expired");
  }

  if (!userRaw) {
    throw new Error("Telegram user is missing");
  }

  const user = JSON.parse(userRaw) as TelegramUser;

  if (!user?.id) {
    throw new Error("Telegram user id is missing");
  }

  return user;
}

export async function POST(req: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!botToken || !supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: "Missing server environment variables" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const initData = String(body?.initData || "");
    const phone =
      typeof body?.phone === "string" ? body.phone.trim() : "";

    if (!initData) {
      return NextResponse.json(
        { success: false, error: "Missing initData" },
        { status: 400 }
      );
    }

    const telegramUser = validateTelegramInitData(initData, botToken);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload = {
      telegram_user_id: telegramUser.id,
      telegram_username: telegramUser.username || null,
      first_name: telegramUser.first_name || null,
      last_name: telegramUser.last_name || null,
      photo_url: telegramUser.photo_url || null,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("customers")
      .upsert(payload, {
        onConflict: "telegram_user_id",
      });

    if (upsertError) {
      return NextResponse.json(
        { success: false, error: upsertError.message },
        { status: 500 }
      );
    }

    const { data: customer, error: selectError } = await supabase
      .from("customers")
      .select("*")
      .eq("telegram_user_id", telegramUser.id)
      .single();

    if (selectError) {
      return NextResponse.json(
        { success: false, error: selectError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}