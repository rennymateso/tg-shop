"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type NavKey = "home" | "favorites" | "cart" | "profile";

type NavItem = {
  key: NavKey;
  label: string;
  href: string;
};

type ProfileLike = {
  photo_url?: string;
  photoUrl?: string;
  avatar?: string;
  avatar_url?: string;
  user?: {
    photo_url?: string;
    photoUrl?: string;
    avatar?: string;
    avatar_url?: string;
  };
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
  if (typeof window === "undefined") return 0;

  const cart = safeJsonParse<unknown>(localStorage.getItem("cart"), []);
  const cartItems = safeJsonParse<unknown>(localStorage.getItem("cartItems"), []);

  return Math.max(getArrayCount(cart), getArrayCount(cartItems));
}

function getFavoritesCount() {
  if (typeof window === "undefined") return 0;

  const favorites = safeJsonParse<unknown>(localStorage.getItem("favorites"), []);
  return getArrayCount(favorites);
}

function getProfilePhoto() {
  if (typeof window === "undefined") return "";

  const keys = [
    "customer_profile_cache",
    "telegram_user",
    "telegramUser",
    "user",
    "profile",
  ];

  for (const key of keys) {
    const data = safeJsonParse<ProfileLike | null>(localStorage.getItem(key), null);
    const photo =
      data?.photo_url ||
      data?.photoUrl ||
      data?.avatar ||
      data?.avatar_url ||
      data?.user?.photo_url ||
      data?.user?.photoUrl ||
      data?.user?.avatar ||
      data?.user?.avatar_url;

    if (typeof photo === "string" && photo.trim()) {
      return photo;
    }
  }

  const tgPhoto = window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url;
  return typeof tgPhoto === "string" ? tgPhoto : "";
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            photo_url?: string;
          };
        };
      };
    };
  }
}

function HomeIcon() {
  return (
    <svg className="mn-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 10.4 12 4.2l7.5 6.2v8.7a1.4 1.4 0 0 1-1.4 1.4H5.9a1.4 1.4 0 0 1-1.4-1.4v-8.7Z" />
      <path d="M9.2 20.5v-6.1h5.6v6.1" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="mn-nav-svg mn-nav-heart" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20.3 5.2c-1.7-1.6-4.3-1.6-6 0L12 7.5 9.7 5.2c-1.7-1.6-4.3-1.6-6 0-1.7 1.7-1.7 4.4 0 6l8.3 8.5 8.3-8.5c1.7-1.6 1.7-4.3 0-6Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg className="mn-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6.3 8.1h11.4l.8 10.9a1.55 1.55 0 0 1-1.55 1.7h-9.9A1.55 1.55 0 0 1 5.5 19l.8-10.9Z" />
      <path d="M9.1 8.1V6.9a2.9 2.9 0 0 1 5.8 0v1.2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="mn-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="7.8" r="3.55" />
      <path d="M5 20.2c.7-3.35 3.45-5.65 7-5.65s6.3 2.3 7 5.65" />
    </svg>
  );
}

function NavIcon({
  type,
  active,
  profilePhoto,
}: {
  type: NavKey;
  active: boolean;
  profilePhoto: string;
}) {
  if (type === "home") return <HomeIcon />;
  if (type === "favorites") return <HeartIcon />;
  if (type === "cart") return <BagIcon />;

  if (profilePhoto) {
    return (
      <span className={`mn-profile-photo${active ? " active" : ""}`}>
        <img src={profilePhoto} alt="" />
      </span>
    );
  }

  return <UserIcon />;
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
  const [profilePhoto, setProfilePhoto] = useState("");

  const counts = useMemo<Record<NavKey, number>>(
    () => ({
      home: 0,
      favorites: favoritesCount,
      cart: cartCount,
      profile: 0,
    }),
    [favoritesCount, cartCount]
  );

  const syncState = () => {
    setFavoritesCount(getFavoritesCount());
    setCartCount(getCartCount());
    setProfilePhoto(getProfilePhoto());
  };

  useEffect(() => {
    syncState();

    const handleUpdate = () => syncState();

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("favorites-updated", handleUpdate);
    window.addEventListener("cart-updated", handleUpdate);
    window.addEventListener("profile-updated", handleUpdate);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("favorites-updated", handleUpdate);
      window.removeEventListener("cart-updated", handleUpdate);
      window.removeEventListener("profile-updated", handleUpdate);
    };
  }, []);

  return (
    <>
      <style>{`
        .mn-bottom-nav-wrap {
          position: fixed;
          left: 50%;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 11px);
          z-index: 500;
          width: min(calc(100vw - 30px), 420px);
          transform: translateX(-50%);
          pointer-events: none;
        }

        .mn-bottom-nav {
          height: 72px;
          padding: 8px 13px 9px;
          border-radius: 30px;
          background: rgba(255,255,255,.96);
          box-shadow:
            0 18px 46px rgba(0,0,0,.13),
            0 3px 12px rgba(0,0,0,.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: center;
          pointer-events: auto;
        }

        .mn-bottom-nav-item {
          position: relative;
          min-width: 0;
          height: 55px;
          border: 0;
          border-radius: 18px;
          background: transparent;
          color: #8f8f8f;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          transition: color .16s ease, transform .16s ease;
        }

        .mn-bottom-nav-item:active {
          transform: translateY(1px);
        }

        .mn-bottom-nav-item.active {
          color: #111;
        }

        .mn-bottom-nav-icon {
          position: relative;
          width: 29px;
          height: 29px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .mn-nav-svg {
          width: 27px;
          height: 27px;
          stroke: currentColor;
          stroke-width: 1.55;
          stroke-linecap: round;
          stroke-linejoin: round;
          vector-effect: non-scaling-stroke;
        }

        .mn-bottom-nav-item.active .mn-nav-svg {
          stroke-width: 1.8;
        }

        .mn-nav-heart {
          width: 28px;
          height: 28px;
        }

        .mn-bottom-nav-label {
          max-width: 100%;
          font-size: 11.6px;
          line-height: 1;
          font-weight: 400;
          letter-spacing: -0.025em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mn-bottom-nav-item.active .mn-bottom-nav-label {
          color: #111;
          font-weight: 600;
        }

        .mn-profile-photo {
          width: 29px;
          height: 29px;
          border-radius: 999px;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #efefef;
          box-shadow: 0 0 0 1px rgba(0,0,0,.06);
        }

        .mn-profile-photo.active {
          box-shadow: 0 0 0 2px rgba(17,17,17,.78);
        }

        .mn-profile-photo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .mn-bottom-nav-badge {
          position: absolute;
          top: -5px;
          right: -8px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 999px;
          background: #111;
          color: #fff;
          border: 2px solid #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 8.5px;
          line-height: 1;
          font-weight: 600;
        }

        @media (max-width: 370px) {
          .mn-bottom-nav-wrap {
            width: min(calc(100vw - 22px), 405px);
            bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
          }

          .mn-bottom-nav {
            height: 69px;
            padding: 7px 10px 8px;
            border-radius: 27px;
          }

          .mn-bottom-nav-item {
            height: 53px;
            gap: 4px;
          }

          .mn-bottom-nav-label {
            font-size: 10.8px;
          }

          .mn-bottom-nav-icon,
          .mn-profile-photo {
            width: 27px;
            height: 27px;
          }

          .mn-nav-svg {
            width: 25.5px;
            height: 25.5px;
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
                  <NavIcon type={item.key} active={active} profilePhoto={profilePhoto} />
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
