"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  syncTelegramCustomer,
  type CustomerProfile,
} from "../lib/customer-profile";
import { getTelegramWebApp } from "../lib/telegram-mini-app";

type CartItem = {
  id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

function getCartCount() {
  try {
    const raw = localStorage.getItem("cart") || "[]";
    const cart = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  } catch {
    return 0;
  }
}

function getFavoritesCount() {
  try {
    const raw = localStorage.getItem("favorites") || "[]";
    const favorites = JSON.parse(raw) as string[];
    if (!Array.isArray(favorites)) return 0;
    return favorites.length;
  } catch {
    return 0;
  }
}

function getCachedCustomer() {
  try {
    const raw = localStorage.getItem("customer_profile_cache") || "null";
    const parsed = JSON.parse(raw) as CustomerProfile | null;
    return parsed;
  } catch {
    return null;
  }
}

function setCachedCustomer(customer: CustomerProfile | null) {
  if (!customer) return;
  localStorage.setItem("customer_profile_cache", JSON.stringify(customer));
  window.dispatchEvent(new Event("customer-profile-updated"));
}

function HomeIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10.4 12 4l8 6.4v9.2A1.4 1.4 0 0 1 18.6 21H5.4A1.4 1.4 0 0 1 4 19.6v-9.2Z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.3 5.2c-1.7-1.7-4.4-1.7-6.1 0L12 7.4 9.8 5.2c-1.7-1.7-4.4-1.7-6.1 0-1.7 1.7-1.7 4.4 0 6.1L12 20l8.3-8.7c1.7-1.7 1.7-4.4 0-6.1Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.3 8.2h11.4l.8 10.8a1.6 1.6 0 0 1-1.6 1.7H7.1A1.6 1.6 0 0 1 5.5 19l.8-10.8Z" />
      <path d="M9.2 8.2V7a2.8 2.8 0 0 1 5.6 0v1.2" />
    </svg>
  );
}

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);

  useEffect(() => {
    const syncCounts = () => {
      setCartCount(getCartCount());
      setFavoritesCount(getFavoritesCount());
    };

    syncCounts();

    const handleStorage = () => syncCounts();
    const handleFocus = () => syncCounts();
    const handleCartUpdated = () => syncCounts();
    const handleFavoritesUpdated = () => syncCounts();
    const handleVisibility = () => {
      if (!document.hidden) syncCounts();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("cart-updated", handleCartUpdated);
    window.addEventListener("favorites-updated", handleFavoritesUpdated);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("cart-updated", handleCartUpdated);
      window.removeEventListener("favorites-updated", handleFavoritesUpdated);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [pathname]);

  useEffect(() => {
    const loadCustomer = async () => {
      const cached = getCachedCustomer();
      if (cached) {
        setCustomer(cached);
      }

      const webApp = getTelegramWebApp();
      if (!webApp?.initData) return;

      const profile = await syncTelegramCustomer();
      if (profile) {
        setCustomer(profile);
        setCachedCustomer(profile);
      }
    };

    loadCustomer();

    const handleProfileUpdated = () => {
      const cached = getCachedCustomer();
      setCustomer(cached);
    };

    window.addEventListener("customer-profile-updated", handleProfileUpdated);
    window.addEventListener("focus", handleProfileUpdated);

    return () => {
      window.removeEventListener("customer-profile-updated", handleProfileUpdated);
      window.removeEventListener("focus", handleProfileUpdated);
    };
  }, []);

  const cartBadge = useMemo(() => {
    if (cartCount <= 0) return "";
    if (cartCount > 99) return "99+";
    return String(cartCount);
  }, [cartCount]);

  const favoritesBadge = useMemo(() => {
    if (favoritesCount <= 0) return "";
    if (favoritesCount > 99) return "99+";
    return String(favoritesCount);
  }, [favoritesCount]);

  const activeClass = (path: string) =>
    pathname === path ? "text-black" : "text-gray-400";

  const activeLabelClass = (path: string) =>
    pathname === path ? "font-semibold text-black" : "font-normal text-gray-400";

  const profileInitial =
    customer?.first_name?.trim()?.charAt(0)?.toUpperCase() || "P";

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-between rounded-[34px] border border-gray-100 bg-white px-4 py-3 shadow-2xl">
      <button
        type="button"
        onClick={() => router.push("/")}
        className={`flex flex-1 flex-col items-center gap-1 ${activeClass("/")}`}
        aria-label="Главная"
      >
        <HomeIcon />
        <span className={`text-[13px] ${activeLabelClass("/")}`}>Главная</span>
      </button>

      <button
        type="button"
        onClick={() => router.push("/favorites")}
        className={`relative flex flex-1 flex-col items-center gap-1 ${activeClass("/favorites")}`}
        aria-label="Избранное"
      >
        {favoritesBadge && (
          <span className="absolute right-[calc(50%-24px)] top-0 min-w-[18px] rounded-full bg-black px-1.5 py-[1px] text-center text-[10px] font-medium leading-[16px] text-white">
            {favoritesBadge}
          </span>
        )}

        <HeartIcon />
        <span className={`text-[13px] ${activeLabelClass("/favorites")}`}>
          Избранное
        </span>
      </button>

      <button
        type="button"
        onClick={() => router.push("/cart")}
        className={`relative flex flex-1 flex-col items-center gap-1 ${activeClass("/cart")}`}
        aria-label="Корзина"
      >
        {cartBadge && (
          <span className="absolute right-[calc(50%-24px)] top-0 min-w-[18px] rounded-full bg-black px-1.5 py-[1px] text-center text-[10px] font-medium leading-[16px] text-white">
            {cartBadge}
          </span>
        )}

        <BagIcon />
        <span className={`text-[13px] ${activeLabelClass("/cart")}`}>
          Корзина
        </span>
      </button>

      <button
        type="button"
        onClick={() => router.push("/profile")}
        className={`flex flex-1 flex-col items-center gap-1 ${activeClass("/profile")}`}
        aria-label="Профиль"
      >
        <div className="h-7 w-7 overflow-hidden rounded-full border border-current bg-[#F5F5F5]">
          {customer?.photo_url ? (
            <img
              src={customer.photo_url}
              alt="Профиль"
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm">
              {profileInitial}
            </div>
          )}
        </div>
        <span className={`text-[13px] ${activeLabelClass("/profile")}`}>
          Профиль
        </span>
      </button>
    </div>
  );
}
