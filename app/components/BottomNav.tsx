"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type NavKey = "home" | "favorites" | "cart" | "profile";

type NavItem = {
  key: NavKey;
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { key: "home", label: "Главная", href: "/" },
  { key: "favorites", label: "Избранное", href: "/favorites" },
  { key: "cart", label: "Корзина", href: "/cart" },
  { key: "profile", label: "Профиль", href: "/profile" },
];

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getArrayCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length;
  }

  return 0;
}

function getCartCount() {
  const cart = safeJsonParse<unknown>(localStorage.getItem("cart"), []);
  const cartItems = safeJsonParse<unknown>(localStorage.getItem("cartItems"), []);

  const cartCount = getArrayCount(cart);
  const cartItemsCount = getArrayCount(cartItems);

  return Math.max(cartCount, cartItemsCount);
}

function getFavoritesCount() {
  const favorites = safeJsonParse<unknown>(localStorage.getItem("favorites"), []);
  return getArrayCount(favorites);
}

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.6 12 4l8 6.6V20a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 20v-9.4Z"
        stroke="currentColor"
        strokeWidth={active ? 2.15 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 21.5v-6.4h5.6v6.4"
        stroke="currentColor"
        strokeWidth={active ? 2.15 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHeart({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} aria-hidden="true">
      <path
        d="M20.4 5.1c-1.7-1.7-4.4-1.7-6.1 0L12 7.4 9.7 5.1c-1.7-1.7-4.4-1.7-6.1 0-1.7 1.7-1.7 4.4 0 6.1L12 20.2l8.4-9c1.7-1.7 1.7-4.4 0-6.1Z"
        stroke="currentColor"
        strokeWidth={active ? 1.65 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBag({ active }: { active: boolean }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.4 8.2h11.2l.9 11.1a1.7 1.7 0 0 1-1.7 1.8H7.2a1.7 1.7 0 0 1-1.7-1.8l.9-11.1Z"
        stroke="currentColor"
        strokeWidth={active ? 2.15 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.2V7a3 3 0 0 1 6 0v1.2"
        stroke="currentColor"
        strokeWidth={active ? 2.15 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="8"
        r="3.8"
        stroke="currentColor"
        strokeWidth={active ? 2.15 : 1.9}
      />
      <path
        d="M4.8 20.5a7.2 7.2 0 0 1 14.4 0"
        stroke="currentColor"
        strokeWidth={active ? 2.15 : 1.9}
        strokeLinecap="round"
      />
    </svg>
  );
}

function NavIcon({ type, active }: { type: NavKey; active: boolean }) {
  if (type === "home") return <IconHome active={active} />;
  if (type === "favorites") return <IconHeart active={active} />;
  if (type === "cart") return <IconBag active={active} />;
  return <IconUser active={active} />;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const [favoritesCount, setFavoritesCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const counts = useMemo<Record<NavKey, number>>(
    () => ({
      home: 0,
      favorites: favoritesCount,
      cart: cartCount,
      profile: 0,
    }),
    [favoritesCount, cartCount]
  );

  const syncCounts = () => {
    setFavoritesCount(getFavoritesCount());
    setCartCount(getCartCount());
  };

  useEffect(() => {
    syncCounts();

    const handleStorage = () => syncCounts();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("favorites-updated", handleStorage);
    window.addEventListener("cart-updated", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("favorites-updated", handleStorage);
      window.removeEventListener("cart-updated", handleStorage);
    };
  }, []);

  return (
    <>
      <style>{`
        .mn-bottom-nav-wrap {
          position: fixed;
          left: 50%;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
          z-index: 500;
          width: min(calc(100vw - 28px), 430px);
          transform: translateX(-50%);
          pointer-events: none;
        }

        .mn-bottom-nav {
          height: 74px;
          padding: 8px 12px 9px;
          border-radius: 28px;
          background: rgba(255,255,255,.96);
          box-shadow:
            0 16px 42px rgba(0,0,0,.13),
            0 2px 10px rgba(0,0,0,.04);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: center;
          pointer-events: auto;
        }

        .mn-bottom-nav-item {
          position: relative;
          min-width: 0;
          height: 58px;
          border: 0;
          border-radius: 18px;
          background: transparent;
          color: #9a9a9a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          transition:
            color .18s ease,
            transform .18s ease,
            background .18s ease;
        }

        .mn-bottom-nav-item:active {
          transform: translateY(1px);
        }

        .mn-bottom-nav-item.active {
          color: #111;
        }

        .mn-bottom-nav-icon {
          position: relative;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .mn-bottom-nav-label {
          max-width: 100%;
          font-size: 11.5px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mn-bottom-nav-item.active .mn-bottom-nav-label {
          font-weight: 650;
        }

        .mn-bottom-nav-badge {
          position: absolute;
          top: -5px;
          right: -8px;
          min-width: 17px;
          height: 17px;
          padding: 0 5px;
          border-radius: 999px;
          background: #111;
          color: #fff;
          border: 2px solid #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          line-height: 1;
          font-weight: 700;
        }

        @media (max-width: 370px) {
          .mn-bottom-nav-wrap {
            width: min(calc(100vw - 20px), 410px);
            bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
          }

          .mn-bottom-nav {
            height: 70px;
            padding: 7px 9px 8px;
            border-radius: 25px;
          }

          .mn-bottom-nav-item {
            height: 55px;
            border-radius: 16px;
            gap: 4px;
          }

          .mn-bottom-nav-label {
            font-size: 10.8px;
          }

          .mn-bottom-nav-icon {
            width: 26px;
            height: 26px;
          }
        }
      `}</style>

      <nav className="mn-bottom-nav-wrap" aria-label="Нижняя навигация">
        <div className="mn-bottom-nav">
          {navItems.map((item) => {
            const active = isActivePath(pathname || "/", item.href);
            const count = counts[item.key];

            return (
              <button
                key={item.key}
                type="button"
                className={`mn-bottom-nav-item${active ? " active" : ""}`}
                onClick={() => router.push(item.href)}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <span className="mn-bottom-nav-icon">
                  <NavIcon type={item.key} active={active} />
                  {count > 0 && item.key !== "home" && item.key !== "profile" ? (
                    <span className="mn-bottom-nav-badge">{count > 9 ? "9+" : count}</span>
                  ) : null}
                </span>
                <span className="mn-bottom-nav-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
