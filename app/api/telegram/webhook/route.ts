import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type TelegramContact = {
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  user_id?: number;
};

type TelegramMessage = {
  message_id: number;
  from?: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  contact?: TelegramContact;
  chat?: {
    id: number;
    type?: string;
  };
  text?: string;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!secret || !supabaseUrl || !serviceRoleKey) {
      console.error("WEBHOOK ERROR: missing env vars");
      return NextResponse.json(
        { ok: false, error: "Missing server environment variables" },
        { status: 500 }
      );
    }

    const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (headerSecret !== secret) {
      console.error("WEBHOOK ERROR: invalid secret", {
        received: headerSecret,
      });
      return NextResponse.json(
        { ok: false, error: "Invalid webhook secret" },
        { status: 401 }
      );
    }

    const update = (await req.json()) as TelegramUpdate;
    const message = update.message;

    console.log("WEBHOOK UPDATE:", JSON.stringify(update, null, 2));

    if (!message) {
      console.log("WEBHOOK INFO: no message in update");
      return NextResponse.json({ ok: true });
    }

    if (!message.contact?.phone_number) {
      console.log("WEBHOOK INFO: message received but no contact phone", {
        text: message.text || null,
        fromId: message.from?.id || null,
      });
      return NextResponse.json({ ok: true });
    }

    const telegramUserId =
      typeof message.contact.user_id === "number"
        ? message.contact.user_id
        : typeof message.from?.id === "number"
        ? message.from.id
        : null;

    if (!telegramUserId) {
      console.log("WEBHOOK INFO: no telegram user id", {
        contactUserId: message.contact.user_id || null,
        fromId: message.from?.id || null,
      });
      return NextResponse.json({ ok: true });
    }

    const phone = message.contact.phone_number.trim();

    console.log("WEBHOOK CONTACT RECEIVED:", {
      telegramUserId,
      phone,
      username: message.from?.username || null,
      firstName: message.from?.first_name || null,
      lastName: message.from?.last_name || null,
    });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const upsertPayload = {
      telegram_user_id: telegramUserId,
      telegram_username: message.from?.username || null,
      first_name:
        message.from?.first_name || message.contact.first_name || null,
      last_name:
        message.from?.last_name || message.contact.last_name || null,
      phone,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("customers")
      .upsert(upsertPayload, {
        onConflict: "telegram_user_id",
      });

    if (upsertError) {
      console.error("WEBHOOK SUPABASE UPSERT ERROR:", upsertError);
      return NextResponse.json(
        { ok: false, error: upsertError.message },
        { status: 500 }
      );
    }

    const { data: customer, error: selectError } = await supabase
      .from("customers")
      .select("telegram_user_id, first_name, telegram_username, phone, updated_at")
      .eq("telegram_user_id", telegramUserId)
      .single();

    if (selectError) {
      console.error("WEBHOOK SUPABASE SELECT ERROR:", selectError);
      return NextResponse.json(
        { ok: false, error: selectError.message },
        { status: 500 }
      );
    }

    console.log("WEBHOOK CUSTOMER SAVED:", customer);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("WEBHOOK FATAL ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}