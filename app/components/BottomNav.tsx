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

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? "2.15" : "1.9"}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 10.7 12 3.4l8.5 7.3" />
      <path d="M5.8 9.7v10.1h12.4V9.7" />
      <path d="M9.7 19.8v-5.6h4.6v5.6" />
    </svg>
  );
}

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? "2.05" : "1.9"}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.3 5.1a5 5 0 0 0-7.1 0L12 6.3l-1.2-1.2a5 5 0 0 0-7.1 7.1L12 20.5l8.3-8.3a5 5 0 0 0 0-7.1Z" />
    </svg>
  );
}

function CartIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? "2.1" : "1.9"}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 8.2h10.6l-1 8.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6.2 8.2Z" />
      <path d="M9.2 8.2a2.8 2.8 0 0 1 5.6 0" />
      <path d="M8.2 20.4h8.6" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? "2.1" : "1.9"}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8.2" r="3.7" />
      <path d="M5.4 20.2a6.6 6.6 0 0 1 13.2 0" />
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

  const profileInitial =
    customer?.first_name?.trim()?.charAt(0)?.toUpperCase() || "P";

  const isActive = (path: string) => pathname === path;

  const navItemClass = (path: string) =>
    `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-[4px] rounded-[22px] py-[7px] transition-colors duration-200 ${
      isActive(path) ? "text-black" : "text-[#9A9A9A]"
    }`;

  const iconWrapClass = (path: string) =>
    `relative flex h-11 w-11 items-center justify-center rounded-[18px] transition-colors duration-200 ${
      isActive(path) ? "bg-black text-white" : "bg-transparent text-[#8F8F8F]"
    }`;

  const labelClass = (path: string) =>
    `text-[10px] leading-none tracking-[-0.02em] ${
      isActive(path) ? "font-semibold text-black" : "font-medium text-[#A0A0A0]"
    }`;

  const badgeClass =
    "absolute -right-1 -top-1 min-w-[17px] rounded-full bg-[#111] px-1.5 text-center text-[9px] font-semibold leading-[17px] text-white ring-2 ring-white";

  return (
    <nav
      className="
        fixed left-1/2 z-50
        w-[calc(100%-32px)] max-w-[390px] -translate-x-1/2
        bottom-[calc(18px+env(safe-area-inset-bottom,0px))]
        rounded-[28px]
        bg-white/96 px-[7px] py-[6px]
        shadow-[0_18px_44px_rgba(0,0,0,0.16)]
        backdrop-blur-2xl
      "
      aria-label="Нижнее меню"
    >
      <div className="grid grid-cols-4 items-center gap-[3px]">
        <button
          type="button"
          onClick={() => router.push("/")}
          className={navItemClass("/")}
          aria-label="Главная"
        >
          <span className={iconWrapClass("/")}>
            <HomeIcon active={isActive("/")} />
          </span>
          <span className={labelClass("/")}>Главная</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/favorites")}
          className={navItemClass("/favorites")}
          aria-label="Избранное"
        >
          <span className={iconWrapClass("/favorites")}>
            {favoritesBadge && <span className={badgeClass}>{favoritesBadge}</span>}
            <HeartIcon active={isActive("/favorites")} />
          </span>
          <span className={labelClass("/favorites")}>Избранное</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/cart")}
          className={navItemClass("/cart")}
          aria-label="Корзина"
        >
          <span className={iconWrapClass("/cart")}>
            {cartBadge && <span className={badgeClass}>{cartBadge}</span>}
            <CartIcon active={isActive("/cart")} />
          </span>
          <span className={labelClass("/cart")}>Корзина</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/profile")}
          className={navItemClass("/profile")}
          aria-label="Профиль"
        >
          <span className={iconWrapClass("/profile")}>
            {customer?.photo_url ? (
              <span className="flex h-[29px] w-[29px] items-center justify-center overflow-hidden rounded-full bg-white">
                <img
                  src={customer.photo_url}
                  alt="Профиль"
                  className="h-full w-full rounded-full object-cover"
                />
              </span>
            ) : isActive("/profile") ? (
              <span className="text-[14px] font-semibold leading-none">
                {profileInitial}
              </span>
            ) : (
              <ProfileIcon active={false} />
            )}
          </span>
          <span className={labelClass("/profile")}>Профиль</span>
        </button>
      </div>
    </nav>
  );
}
