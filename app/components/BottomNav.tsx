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
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 10.8 12 4l8.5 6.8" />
      <path d="M5.5 9.7V20h13V9.7" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9 9.7 4.6c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 7h15l-1.5 8.5a2 2 0 0 1-2 1.6H8.2a2 2 0 0 1-2-1.6L4.8 4H2.5" />
      <circle cx="9" cy="20" r="1.2" />
      <circle cx="17" cy="20" r="1.2" />
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

  const isActive = (path: string) => pathname === path;

  const itemClass = (path: string) =>
    `relative flex flex-1 flex-col items-center justify-center gap-[3px] rounded-[18px] py-2 transition-colors ${
      isActive(path) ? "text-black" : "text-[#9A9A9A]"
    }`;

  const labelClass = (path: string) =>
    `text-[10px] leading-none tracking-[-0.01em] ${
      isActive(path) ? "font-medium" : "font-normal"
    }`;

  const profileInitial =
    customer?.first_name?.trim()?.charAt(0)?.toUpperCase() || "P";

  return (
    <nav className="fixed left-3 right-3 z-50" style={{ bottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }}>
      <div className="flex items-center justify-between rounded-[28px] bg-white/95 px-2 py-2 shadow-[0_12px_34px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => router.push("/")}
          className={itemClass("/")}
          aria-label="Главная"
        >
          <HomeIcon />
          <span className={labelClass("/")}>Главная</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/favorites")}
          className={itemClass("/favorites")}
          aria-label="Избранное"
        >
          {favoritesBadge && (
            <span className="absolute right-[calc(50%-22px)] top-[3px] min-w-[16px] rounded-full bg-black px-1 text-center text-[9px] font-medium leading-[16px] text-white">
              {favoritesBadge}
            </span>
          )}
          <HeartIcon />
          <span className={labelClass("/favorites")}>Избранное</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/cart")}
          className={itemClass("/cart")}
          aria-label="Корзина"
        >
          {cartBadge && (
            <span className="absolute right-[calc(50%-22px)] top-[3px] min-w-[16px] rounded-full bg-black px-1 text-center text-[9px] font-medium leading-[16px] text-white">
              {cartBadge}
            </span>
          )}
          <CartIcon />
          <span className={labelClass("/cart")}>Корзина</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/profile")}
          className={itemClass("/profile")}
          aria-label="Профиль"
        >
          <div className={`flex h-[23px] w-[23px] items-center justify-center overflow-hidden rounded-full bg-[#F3F3F3] text-[11px] ${
            isActive("/profile") ? "ring-1 ring-black" : ""
          }`}>
            {customer?.photo_url ? (
              <img
                src={customer.photo_url}
                alt="Профиль"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span>{profileInitial}</span>
            )}
          </div>
          <span className={labelClass("/profile")}>Профиль</span>
        </button>
      </div>
    </nav>
  );
}
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.8 12 3l9 7.8" />
      <path d="M5.5 9.6V21h4.8v-6.2h3.4V21h4.8V9.6" />
    </svg>
  );
}

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9 9.7 4.6c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5Z" />
    </svg>
  );
}

function CartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
      {active && <path d="M9 15h6" />}
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
    `relative flex flex-1 flex-col items-center justify-center gap-[3px] rounded-[22px] py-2 transition-colors ${
      isActive(path) ? "text-black" : "text-[#9B9B9B]"
    }`;

  const iconWrapClass = (path: string) =>
    `relative flex h-9 w-9 items-center justify-center rounded-[16px] transition-colors ${
      isActive(path) ? "bg-[#F1F1F1]" : "bg-transparent"
    }`;

  const labelClass = (path: string) =>
    `text-[10px] leading-none tracking-[-0.01em] ${
      isActive(path) ? "font-medium text-black" : "font-normal text-[#9B9B9B]"
    }`;

  return (
    <nav
      className="
        fixed left-3 right-3 z-50
        bottom-[calc(22px+env(safe-area-inset-bottom,0px))]
        rounded-[30px]
        bg-white/95 px-2 py-2
        shadow-[0_14px_40px_rgba(0,0,0,0.13)]
        backdrop-blur-xl
      "
      aria-label="Нижнее меню"
    >
      <div className="flex items-center justify-between gap-1">
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
            {favoritesBadge && (
              <span className="absolute -right-1 -top-1 min-w-[17px] rounded-full bg-black px-1.5 text-center text-[9px] font-medium leading-[17px] text-white">
                {favoritesBadge}
              </span>
            )}
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
            {cartBadge && (
              <span className="absolute -right-1 -top-1 min-w-[17px] rounded-full bg-black px-1.5 text-center text-[9px] font-medium leading-[17px] text-white">
                {cartBadge}
              </span>
            )}
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
            <span
              className={`flex h-[23px] w-[23px] items-center justify-center overflow-hidden rounded-full ${
                isActive("/profile") ? "bg-black text-white" : "bg-[#F1F1F1] text-[#777]"
              }`}
            >
              {customer?.photo_url ? (
                <img
                  src={customer.photo_url}
                  alt="Профиль"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-[11px] font-medium">{profileInitial}</span>
              )}
            </span>
          </span>
          <span className={labelClass("/profile")}>Профиль</span>
        </button>
      </div>
    </nav>
  );
}
