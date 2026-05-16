"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { House, Heart, ShoppingBag } from "lucide-react";
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

function createProfilePlaceholder(initial: string) {
  const safeInitial = encodeURIComponent(initial || "P");

  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
      <rect width="56" height="56" rx="28" fill="#eeeeee"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="500" fill="#8f8f8f">${safeInitial}</text>
    </svg>
  `)}`;
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

  const profileInitial =
    customer?.first_name?.trim()?.charAt(0)?.toUpperCase() ||
    customer?.username?.trim()?.charAt(0)?.toUpperCase() ||
    "P";

  const profilePhoto = customer?.photo_url || createProfilePlaceholder(profileInitial);

  return (
    <>
      <style>{`
        .mn-tabbar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 50;
          background: #ffffff;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          padding: 7px 16px calc(env(safe-area-inset-bottom, 0px) + 9px);
          -webkit-font-smoothing: antialiased;
        }

        .mn-tabbar-inner {
          width: min(100%, 430px);
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: end;
        }

        .mn-tabbar-item {
          position: relative;
          min-width: 0;
          height: 52px;
          border: 0;
          padding: 0;
          background: transparent;
          color: #8f8f8f;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 5px;
          cursor: pointer;
          font-family: Arial, Helvetica, sans-serif;
          transition: color 0.16s ease, opacity 0.16s ease;
        }

        .mn-tabbar-item:active {
          opacity: 0.72;
        }

        .mn-tabbar-item.is-active {
          color: #111111;
        }

        .mn-tabbar-icon {
          position: relative;
          width: 29px;
          height: 29px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mn-tabbar-icon svg {
          width: 28px;
          height: 28px;
          stroke-width: 1.75;
        }

        .mn-tabbar-label {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          line-height: 1;
          font-weight: 400;
          letter-spacing: -0.02em;
        }

        .mn-tabbar-item.is-active .mn-tabbar-label {
          font-weight: 700;
        }

        .mn-tabbar-profile-photo {
          width: 28px;
          height: 28px;
          display: block;
          border-radius: 50%;
          object-fit: cover;
          background: #eeeeee;
        }

        .mn-tabbar-item.is-active .mn-tabbar-profile-photo {
          box-shadow: 0 0 0 1.5px #111111;
        }

        .mn-tabbar-badge {
          position: absolute;
          top: -4px;
          right: -8px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 999px;
          background: #111111;
          color: #ffffff;
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8.5px;
          line-height: 1;
          font-weight: 700;
        }

        .mn-home-indicator {
          width: 128px;
          height: 5px;
          border-radius: 999px;
          background: #000000;
          margin: 8px auto 0;
        }

        @media (max-width: 370px) {
          .mn-tabbar {
            padding-left: 10px;
            padding-right: 10px;
          }

          .mn-tabbar-label {
            font-size: 11.2px;
          }

          .mn-tabbar-icon svg {
            width: 27px;
            height: 27px;
          }
        }
      `}</style>

      <nav className="mn-tabbar" aria-label="Нижнее меню">
        <div className="mn-tabbar-inner">
          <button
            type="button"
            onClick={() => router.push("/")}
            className={`mn-tabbar-item ${isActive("/") ? "is-active" : ""}`}
            aria-current={isActive("/") ? "page" : undefined}
            aria-label="Главная"
          >
            <span className="mn-tabbar-icon">
              <House />
            </span>
            <span className="mn-tabbar-label">Главная</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/favorites")}
            className={`mn-tabbar-item ${isActive("/favorites") ? "is-active" : ""}`}
            aria-current={isActive("/favorites") ? "page" : undefined}
            aria-label="Избранное"
          >
            <span className="mn-tabbar-icon">
              <Heart />
              {favoritesBadge ? (
                <span className="mn-tabbar-badge">{favoritesBadge}</span>
              ) : null}
            </span>
            <span className="mn-tabbar-label">Избранное</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/cart")}
            className={`mn-tabbar-item ${isActive("/cart") ? "is-active" : ""}`}
            aria-current={isActive("/cart") ? "page" : undefined}
            aria-label="Корзина"
          >
            <span className="mn-tabbar-icon">
              <ShoppingBag />
              {cartBadge ? (
                <span className="mn-tabbar-badge">{cartBadge}</span>
              ) : null}
            </span>
            <span className="mn-tabbar-label">Корзина</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/profile")}
            className={`mn-tabbar-item ${isActive("/profile") ? "is-active" : ""}`}
            aria-current={isActive("/profile") ? "page" : undefined}
            aria-label="Профиль"
          >
            <span className="mn-tabbar-icon">
              <img
                src={profilePhoto}
                alt="Профиль"
                className="mn-tabbar-profile-photo"
                width={28}
                height={28}
              />
            </span>
            <span className="mn-tabbar-label">Профиль</span>
          </button>
        </div>

        <div className="mn-home-indicator" aria-hidden="true" />
      </nav>
    </>
  );
}
