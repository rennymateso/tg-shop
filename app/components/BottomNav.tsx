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
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.6 10.3 12 4.2l7.4 6.1v8.8a1.35 1.35 0 0 1-1.35 1.35H5.95A1.35 1.35 0 0 1 4.6 19.1v-8.8Z" />
      <path d="M9.25 20.45v-6.15h5.5v6.15" />
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
      <path d="M20.25 5.25c-1.7-1.65-4.3-1.65-6 0L12 7.5 9.75 5.25c-1.7-1.65-4.3-1.65-6 0-1.65 1.65-1.65 4.35 0 6L12 19.75l8.25-8.5c1.65-1.65 1.65-4.35 0-6Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.35 8.15h11.3l.82 10.8a1.55 1.55 0 0 1-1.55 1.68H7.08a1.55 1.55 0 0 1-1.55-1.68l.82-10.8Z" />
      <path d="M9.1 8.15V6.95a2.9 2.9 0 0 1 5.8 0v1.2" />
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
    pathname === path ? "text-[#111111]" : "text-[#8F8F8F]";

  const activeTextClass = (path: string) =>
    pathname === path ? "font-semibold text-[#111111]" : "font-normal text-[#8F8F8F]";

  const profileInitial =
    customer?.first_name?.trim()?.charAt(0)?.toUpperCase() || "P";

  return (
    <nav className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+11px)] left-1/2 z-50 w-[min(calc(100vw-30px),420px)] -translate-x-1/2 rounded-[30px] bg-white/95 px-[13px] pb-[9px] pt-2 shadow-[0_18px_46px_rgba(0,0,0,0.13),0_3px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="grid h-[55px] grid-cols-4 items-center">
        <button
          type="button"
          onClick={() => router.push("/")}
          className={`flex min-w-0 flex-col items-center justify-center gap-[5px] ${activeClass("/")}`}
          aria-label="Главная"
        >
          <HomeIcon />
          <span className={`max-w-full truncate text-[11.6px] leading-none tracking-[-0.025em] ${activeTextClass("/")}`}>
            Главная
          </span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/favorites")}
          className={`relative flex min-w-0 flex-col items-center justify-center gap-[5px] ${activeClass("/favorites")}`}
          aria-label="Избранное"
        >
          {favoritesBadge && (
            <span className="absolute right-[calc(50%-25px)] top-[-5px] flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-black px-1 text-[8.5px] font-semibold leading-none text-white">
              {favoritesBadge}
            </span>
          )}

          <HeartIcon />
          <span className={`max-w-full truncate text-[11.6px] leading-none tracking-[-0.025em] ${activeTextClass("/favorites")}`}>
            Избранное
          </span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/cart")}
          className={`relative flex min-w-0 flex-col items-center justify-center gap-[5px] ${activeClass("/cart")}`}
          aria-label="Корзина"
        >
          {cartBadge && (
            <span className="absolute right-[calc(50%-25px)] top-[-5px] flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-black px-1 text-[8.5px] font-semibold leading-none text-white">
              {cartBadge}
            </span>
          )}

          <BagIcon />
          <span className={`max-w-full truncate text-[11.6px] leading-none tracking-[-0.025em] ${activeTextClass("/cart")}`}>
            Корзина
          </span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/profile")}
          className={`flex min-w-0 flex-col items-center justify-center gap-[5px] ${activeClass("/profile")}`}
          aria-label="Профиль"
        >
          <div
            className={`h-[29px] w-[29px] overflow-hidden rounded-full bg-[#F5F5F5] ${
              pathname === "/profile" ? "ring-[1.5px] ring-black" : "ring-1 ring-black/5"
            }`}
          >
            {customer?.photo_url ? (
              <img
                src={customer.photo_url}
                alt="Профиль"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[12px] font-medium text-[#8F8F8F]">
                {profileInitial}
              </div>
            )}
          </div>
          <span className={`max-w-full truncate text-[11.6px] leading-none tracking-[-0.025em] ${activeTextClass("/profile")}`}>
            Профиль
          </span>
        </button>
      </div>
    </nav>
  );
}
