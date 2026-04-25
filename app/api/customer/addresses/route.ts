import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type TelegramUser = {
  id: number;
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

async function getCustomerIdByInitData(params: {
  initData: string;
  botToken: string;
  supabaseUrl: string;
  serviceRoleKey: string;
}) {
  const telegramUser = validateTelegramInitData(params.initData, params.botToken);
  const supabase = createClient(params.supabaseUrl, params.serviceRoleKey);

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id")
    .eq("telegram_user_id", telegramUser.id)
    .single();

  if (error || !customer) {
    throw new Error(error?.message || "Customer not found");
  }

  return {
    customerId: customer.id as string,
    supabase,
  };
}

export async function GET(req: NextRequest) {
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

    const initData = req.nextUrl.searchParams.get("initData") || "";

    if (!initData) {
      return NextResponse.json(
        { success: false, error: "Missing initData" },
        { status: 400 }
      );
    }

    const { customerId, supabase } = await getCustomerIdByInitData({
      initData,
      botToken,
      supabaseUrl,
      serviceRoleKey,
    });

    const { data, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", customerId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      addresses: data || [],
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
    const label = String(body?.label || "Дом").trim();
    const city = String(body?.city || "").trim();
    const street = String(body?.street || "").trim();
    const house = String(body?.house || "").trim();
    const apartment = String(body?.apartment || "").trim();
    const comment = String(body?.comment || "").trim();
    const isDefault = Boolean(body?.is_default);

    if (!initData) {
      return NextResponse.json(
        { success: false, error: "Missing initData" },
        { status: 400 }
      );
    }

    if (!city || !street || !house) {
      return NextResponse.json(
        { success: false, error: "Заполните город, улицу и дом" },
        { status: 400 }
      );
    }

    const { customerId, supabase } = await getCustomerIdByInitData({
      initData,
      botToken,
      supabaseUrl,
      serviceRoleKey,
    });

    if (isDefault) {
      await supabase
        .from("customer_addresses")
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq("customer_id", customerId);
    }

    const { data, error } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: customerId,
        label: label || "Дом",
        city,
        street,
        house,
        apartment: apartment || null,
        comment: comment || null,
        is_default: isDefault,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      address: data,
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

export async function PATCH(req: NextRequest) {
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
    const addressId = String(body?.addressId || "");

    if (!initData || !addressId) {
      return NextResponse.json(
        { success: false, error: "Missing initData or addressId" },
        { status: 400 }
      );
    }

    const { customerId, supabase } = await getCustomerIdByInitData({
      initData,
      botToken,
      supabaseUrl,
      serviceRoleKey,
    });

    const hasFieldUpdate =
      body?.label !== undefined ||
      body?.city !== undefined ||
      body?.street !== undefined ||
      body?.house !== undefined ||
      body?.apartment !== undefined ||
      body?.comment !== undefined;

    if (hasFieldUpdate) {
      const label = String(body?.label || "Дом").trim();
      const city = String(body?.city || "").trim();
      const street = String(body?.street || "").trim();
      const house = String(body?.house || "").trim();
      const apartment = String(body?.apartment || "").trim();
      const comment = String(body?.comment || "").trim();

      if (!city || !street || !house) {
        return NextResponse.json(
          { success: false, error: "Заполните город, улицу и дом" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("customer_addresses")
        .update({
          label: label || "Дом",
          city,
          street,
          house,
          apartment: apartment || null,
          comment: comment || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", addressId)
        .eq("customer_id", customerId)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        address: data,
      });
    }

    const isDefault = Boolean(body?.is_default);

    if (isDefault) {
      await supabase
        .from("customer_addresses")
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq("customer_id", customerId);
    }

    const { data, error } = await supabase
      .from("customer_addresses")
      .update({
        is_default: isDefault,
        updated_at: new Date().toISOString(),
      })
      .eq("id", addressId)
      .eq("customer_id", customerId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      address: data,
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

export async function DELETE(req: NextRequest) {
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
    const addressId = String(body?.addressId || "");

    if (!initData || !addressId) {
      return NextResponse.json(
        { success: false, error: "Missing initData or addressId" },
        { status: 400 }
      );
    }

    const { customerId, supabase } = await getCustomerIdByInitData({
      initData,
      botToken,
      supabaseUrl,
      serviceRoleKey,
    });

    const { error } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", addressId)
      .eq("customer_id", customerId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
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