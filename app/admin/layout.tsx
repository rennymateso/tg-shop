"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Home,
  LayoutGrid,
  ShoppingBag,
} from "lucide-react";
import { useEffect } from "react";

const bottomTabs = [
  { href: "/admin", label: "Главная", icon: Home },
  { href: "/admin/orders", label: "Заказы", icon: Box },
  { href: "/admin/products", label: "Товары", icon: ShoppingBag },
  { href: "/admin/menu", label: "Меню", icon: LayoutGrid },
] as const;

function getActiveTab(pathname: string) {
  if (pathname === "/admin") return "/admin";
  if (pathname.startsWith("/admin/orders")) return "/admin/orders";
  if (pathname.startsWith("/admin/products")) return "/admin/products";
  if (pathname.startsWith("/admin/statistics")) return "/admin/statistics";
  if (pathname.startsWith("/admin/stocks") || pathname.startsWith("/admin/warehouses")) {
    return "/admin/stocks";
  }
  return "/admin/menu";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const previousContent = viewport?.getAttribute("content") || "";

    viewport?.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover"
    );

    return () => {
      if (viewport) viewport.setAttribute("content", previousContent);
    };
  }, []);

  return (
    <>
      <style>{`
        html,
        body {
          width: 100%;
          min-height: 100%;
          margin: 0;
          background: #f3f4f8;
          overscroll-behavior: none;
          -webkit-text-size-adjust: 100%;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        button,
        a {
          touch-action: manipulation;
        }

        .seller-page {
          min-height: 100vh;
          min-height: 100dvh;
          background: #f3f4f8;
          color: #0f172a;
          padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
        }

        .seller-shell {
          width: min(100%, 760px);
          margin: 0 auto;
          padding: 10px 10px 0;
        }

        .seller-shell h1 {
          font-size: 20px !important;
          line-height: 1.12 !important;
          font-weight: 600 !important;
          letter-spacing: -0.02em !important;
        }

        .seller-shell h2 {
          font-size: 17px !important;
          line-height: 1.18 !important;
          font-weight: 600 !important;
          letter-spacing: -0.01em !important;
        }

        .seller-shell p,
        .seller-shell input,
        .seller-shell select,
        .seller-shell textarea {
          letter-spacing: 0 !important;
        }

        .seller-shell button,
        .seller-shell a {
          font-weight: 500 !important;
        }

        .seller-bottom-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 80;
          border-top: 1px solid rgba(15,23,42,.08);
          background: rgba(255,255,255,.98);
          padding: 5px 8px calc(5px + env(safe-area-inset-bottom, 0px));
          box-shadow: 0 -10px 28px rgba(15,23,42,.08);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .seller-bottom-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
          width: min(100%, 760px);
          margin: 0 auto;
        }

        .seller-bottom-link {
          position: relative;
          display: flex;
          min-width: 0;
          height: 52px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          border-radius: 18px;
          color: #94a3b8;
          text-decoration: none;
        }

        .seller-bottom-link.is-active {
          color: #111827;
        }

        .seller-bottom-label {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 9px;
          line-height: 1;
          font-weight: 600;
        }

        @media (min-width: 1024px) {
          .seller-page {
            padding-bottom: 0;
          }

          .seller-shell {
            padding: 24px 18px;
          }

          .seller-bottom-nav {
            left: 50%;
            right: auto;
            bottom: 18px;
            width: min(720px, calc(100% - 36px));
            transform: translateX(-50%);
            border: 1px solid rgba(15,23,42,.08);
            border-radius: 26px;
          }
        }
      `}</style>

      <div className="seller-page">
        <main className="seller-shell">{children}</main>

        <nav className="seller-bottom-nav" aria-label="Админ меню">
          <div className="seller-bottom-grid">
            {bottomTabs.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`seller-bottom-link${active ? " is-active" : ""}`}
                >
                  <Icon size={22} strokeWidth={active ? 2.8 : 2.4} />
                  <span className="seller-bottom-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
