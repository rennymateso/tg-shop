import { getTelegramInitData } from "./telegram-mini-app";

export type CustomerProfile = {
  id: string;
  telegram_user_id: number;
  telegram_username: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export async function syncTelegramCustomer(phone?: string) {
  const initData = getTelegramInitData();

  if (!initData) {
    return null;
  }

  const response = await fetch("/api/customer/telegram-sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      initData,
      phone: phone || "",
    }),
  });

  const result = await response.json();

  if (!response.ok || !result?.success || !result?.customer) {
    return null;
  }

  return result.customer as CustomerProfile;
}