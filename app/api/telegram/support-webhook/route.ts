import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type TelegramChat = {
  id: number;
  type?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
};

type TelegramMessage = {
  message_id: number;
  from?: TelegramUser;
  chat?: TelegramChat;
  text?: string;
  caption?: string;
  reply_to_message?: TelegramMessage;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

type TelegramApiResponse<T = unknown> = {
  ok: boolean;
  result?: T;
  description?: string;
};

const SUPPORT_GREETING =
  "Здравствуйте! Вы написали в поддержку Montreaux. Опишите вопрос одним сообщением, и специалист ответит вам здесь.";

const SUPPORT_RECEIVED =
  "Спасибо, сообщение получили. Специалист ответит вам здесь.";

function getAdminChatIds(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getDisplayName(user?: TelegramUser, chat?: TelegramChat) {
  const firstName = user?.first_name || chat?.first_name || "";
  const lastName = user?.last_name || chat?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || user?.username || chat?.username || chat?.title || "Клиент";
}

function getUsername(user?: TelegramUser, chat?: TelegramChat) {
  const username = user?.username || chat?.username;
  return username ? `@${username}` : "без username";
}

function parseTargetChatId(text?: string) {
  if (!text) {
    return null;
  }

  const match = text.match(/Chat ID:\s*(-?\d+)/i);
  return match?.[1] || null;
}

async function telegramRequest<T>(
  botToken: string,
  method: string,
  body: Record<string, unknown>
) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  const result = (await response
    .json()
    .catch(() => null)) as TelegramApiResponse<T> | null;

  if (!response.ok || !result?.ok) {
    throw new Error(
      result?.description || `Telegram ${method} failed with ${response.status}`
    );
  }

  return result.result as T;
}

async function sendMessage(
  botToken: string,
  chatId: string | number,
  text: string
) {
  return telegramRequest(botToken, "sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
}

async function copyMessage(
  botToken: string,
  chatId: string | number,
  fromChatId: string | number,
  messageId: number
) {
  return telegramRequest(botToken, "copyMessage", {
    chat_id: chatId,
    from_chat_id: fromChatId,
    message_id: messageId,
  });
}

async function notifyAdmins(
  botToken: string,
  adminChatIds: string[],
  text: string
) {
  await Promise.all(
    adminChatIds.map((chatId) => sendMessage(botToken, chatId, text))
  );
}

export async function POST(req: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    const adminChatId =
      process.env.TELEGRAM_SUPPORT_ADMIN_CHAT_ID ||
      process.env.TELEGRAM_ADMIN_CHAT_ID;
    const secret = process.env.TELEGRAM_SUPPORT_WEBHOOK_SECRET;

    if (!botToken || !adminChatId || !secret) {
      console.error("SUPPORT WEBHOOK ERROR: missing env vars");
      return NextResponse.json(
        { ok: false, error: "Missing support bot environment variables" },
        { status: 500 }
      );
    }

    const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (headerSecret !== secret) {
      console.error("SUPPORT WEBHOOK ERROR: invalid secret");
      return NextResponse.json(
        { ok: false, error: "Invalid webhook secret" },
        { status: 401 }
      );
    }

    const adminChatIds = getAdminChatIds(adminChatId);
    const update = (await req.json()) as TelegramUpdate;
    const message = update.message;

    if (!message?.chat?.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const isAdminMessage = adminChatIds.includes(chatId);

    if (isAdminMessage) {
      const targetChatId = parseTargetChatId(
        message.reply_to_message?.text || message.reply_to_message?.caption
      );

      if (targetChatId && message.text?.trim()) {
        await sendMessage(botToken, targetChatId, message.text.trim());
        await sendMessage(botToken, chatId, "Ответ отправлен клиенту.");
      }

      return NextResponse.json({ ok: true });
    }

    if (message.text?.trim() === "/start") {
      await sendMessage(botToken, chatId, SUPPORT_GREETING);
      return NextResponse.json({ ok: true });
    }

    const customerName = getDisplayName(message.from, message.chat);
    const username = getUsername(message.from, message.chat);
    const messageText =
      message.text?.trim() ||
      message.caption?.trim() ||
      "Клиент отправил вложение.";

    const adminText = [
      "Новое сообщение в поддержку",
      "",
      `От: ${customerName} (${username})`,
      `Telegram ID: ${message.from?.id || "неизвестно"}`,
      `Chat ID: ${message.chat.id}`,
      "",
      "Сообщение:",
      messageText,
      "",
      "Чтобы ответить клиенту, нажми «Ответить» на это сообщение и напиши текст.",
    ].join("\n");

    await notifyAdmins(botToken, adminChatIds, adminText);

    if (!message.text && !message.caption) {
      await Promise.all(
        adminChatIds.map((adminId) =>
          copyMessage(botToken, adminId, message.chat!.id, message.message_id)
        )
      );
    }

    await sendMessage(botToken, chatId, SUPPORT_RECEIVED);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("SUPPORT WEBHOOK FATAL ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
