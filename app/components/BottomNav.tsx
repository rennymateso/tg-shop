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
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 10.8 12 4l8.5 6.8" />
      <path d="M5.5 9.8V20h4.2v-5.8h4.6V20h4.2V9.8" />
    </svg>
  );
}

function FavoriteIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6c-1.8-1.8-4.8-1.8-6.6 0L12 6.8 9.8 4.6C8 2.8 5 2.8 3.2 4.6s-1.8 4.8 0 6.6L12 20l8.8-8.8c1.8-1.8 1.8-4.8 0-6.6Z" />
    </svg>
  );
}

function CartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 8h14l-1.4 7.2a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6L5.2 4H2.8" />
      <circle cx="9.5" cy="20" r="1.2" />
      <circle cx="17" cy="20" r="1.2" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M5.2 20.2a6.8 6.8 0 0 1 13.6 0" />
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

  const itemClass = (active: boolean) =>
    `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-[22px] px-1 py-2 transition-colors ${
      active ? "text-black" : "text-[#9A9A9A]"
    }`;

  const labelClass = (active: boolean) =>
    `max-w-full truncate text-[10.5px] leading-none tracking-[-0.01em] ${
      active ? "font-medium text-black" : "font-normal text-[#9A9A9A]"
    }`;

  const badgeClass =
    "absolute right-[calc(50%-25px)] top-[4px] min-w-[17px] rounded-full bg-black px-1.5 text-center text-[9px] font-medium leading-[17px] text-white ring-2 ring-white";

  const goTo = (path: string) => {
    if (pathname !== path) router.push(path);
  };

  return (
    <nav
      className="fixed left-3 right-3 z-50 mx-auto max-w-[520px]"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      aria-label="Нижнее меню"
    >
      <div className="rounded-[30px] border border-black/[0.06] bg-white/95 px-2 py-2 shadow-[0_12px_34px_rgba(0,0,0,0.14)] backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => goTo("/")}
            className={itemClass(isActive("/"))}
            aria-label="Главная"
            aria-current={isActive("/") ? "page" : undefined}
          >
            {isActive("/") && <span className="absolute top-1 h-[3px] w-5 rounded-full bg-black" />}
            <HomeIcon active={isActive("/")} />
            <span className={labelClass(isActive("/"))}>Главная</span>
          </button>

          <button
            type="button"
            onClick={() => goTo("/favorites")}
            className={itemClass(isActive("/favorites"))}
            aria-label="Избранное"
            aria-current={isActive("/favorites") ? "page" : undefined}
          >
            {isActive("/favorites") && <span className="absolute top-1 h-[3px] w-5 rounded-full bg-black" />}
            {favoritesBadge && <span className={badgeClass}>{favoritesBadge}</span>}
            <FavoriteIcon active={isActive("/favorites")} />
            <span className={labelClass(isActive("/favorites"))}>Избранное</span>
          </button>

          <button
            type="button"
            onClick={() => goTo("/cart")}
            className={itemClass(isActive("/cart"))}
            aria-label="Корзина"
            aria-current={isActive("/cart") ? "page" : undefined}
          >
            {isActive("/cart") && <span className="absolute top-1 h-[3px] w-5 rounded-full bg-black" />}
            {cartBadge && <span className={badgeClass}>{cartBadge}</span>}
            <CartIcon active={isActive("/cart")} />
            <span className={labelClass(isActive("/cart"))}>Корзина</span>
          </button>

          <button
            type="button"
            onClick={() => goTo("/profile")}
            className={itemClass(isActive("/profile"))}
            aria-label="Профиль"
            aria-current={isActive("/profile") ? "page" : undefined}
          >
            {isActive("/profile") && <span className="absolute top-1 h-[3px] w-5 rounded-full bg-black" />}

            {customer?.photo_url ? (
              <span className={`h-[22px] w-[22px] overflow-hidden rounded-full border ${isActive("/profile") ? "border-black" : "border-[#BDBDBD]"}`}>
                <img
                  src={customer.photo_url}
                  alt="Профиль"
                  className="h-full w-full rounded-full object-cover"
                />
              </span>
            ) : customer?.first_name ? (
              <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[11px] font-medium ${isActive("/profile") ? "border-black text-black" : "border-[#BDBDBD] text-[#9A9A9A]"}`}>
                {profileInitial}
              </span>
            ) : (
              <ProfileIcon />
            )}

            <span className={labelClass(isActive("/profile"))}>Профиль</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
