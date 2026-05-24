"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const menu = [
  { href: "/admin", label: "Главная", icon: "▣" },
  { href: "/admin/orders", label: "Заказы", icon: "◎" },
  { href: "/admin/products", label: "Товары", icon: "◫" },
  { href: "/admin/products/new", label: "Добавить товар", icon: "+" },
  { href: "/admin/statistics", label: "Статистика", icon: "◔" },
  { href: "/admin/promocodes", label: "Промокоды", icon: "%" },
  { href: "/admin/banners", label: "Баннеры", icon: "▭" },
  { href: "/admin/brands", label: "Бренды", icon: "◆" },
  { href: "/admin/badges", label: "Бейджи", icon: "🏷" },
  { href: "/admin/stocks", label: "Остатки", icon: "≣" },
  { href: "/admin/warehouses", label: "Склады", icon: "▤" },
  { href: "/admin/settings", label: "Настройки", icon: "⚙" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/products") return pathname === "/admin/products";
  if (href === "/admin/products/new") return pathname === "/admin/products/new";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const previousContent = viewport?.getAttribute("content") || "";

    viewport?.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover"
    );

    return () => {
      if (viewport) {
        viewport.setAttribute("content", previousContent);
      }
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin-logout", {
      method: "POST",
    });

    router.push("/admin/login");
    router.refresh();
  };

  return (
    <>
      <style>{`
        html,
        body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          overscroll-behavior: none;
          -webkit-text-size-adjust: 100%;
          touch-action: pan-y;
          background: #f5f5f5;
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

        button:focus,
        button:focus-visible,
        a:focus,
        a:focus-visible {
          outline: none;
          box-shadow: none;
        }

        .admin-fixed-page {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100vh;
          height: 100dvh;
          overflow: hidden;
          overscroll-behavior: none;
          background: #f5f5f5;
        }

        .admin-scroll {
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }

        .admin-menu-scroll {
          max-height: calc(100dvh - 155px);
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .admin-menu-scroll::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 1023px) {
          .admin-shell {
            display: block;
            min-height: 100%;
          }

          .admin-sidebar {
            position: sticky;
            top: 0;
            z-index: 50;
            border-bottom: 1px solid rgba(0,0,0,.06);
            box-shadow: 0 8px 26px rgba(15,23,42,.05);
          }

          .admin-content {
            padding: 14px 12px 110px;
          }
        }
      `}</style>

      <div className="admin-fixed-page text-black">
        <div className="admin-scroll">
          <div className="admin-shell mx-auto grid min-h-full max-w-[1600px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="admin-sidebar border-b border-black/5 bg-white px-4 py-4 lg:border-b-0 lg:border-r lg:py-5">
              <div className="flex items-center justify-between gap-3 lg:mb-5 lg:block">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400 lg:text-[11px] lg:tracking-[0.28em]">
                    Admin panel
                  </p>
                  <h1 className="mt-1 truncate text-[20px] font-light tracking-[0.28em] lg:mt-2 lg:text-2xl lg:tracking-[0.35em]">
                    MONTREAUX
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  className="shrink-0 rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white lg:hidden"
                >
                  {isMobileMenuOpen ? "Закрыть" : "Меню"}
                </button>
              </div>

              <div
                className={`${
                  isMobileMenuOpen ? "block" : "hidden"
                } admin-menu-scroll mt-4 lg:mt-0 lg:block`}
              >
                <nav className="grid grid-cols-2 gap-2 lg:block lg:space-y-2">
                  {menu.map((item) => {
                    const active = isActive(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex min-h-[44px] w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left transition lg:gap-3 lg:px-4 lg:py-3 ${
                          active
                            ? "bg-black text-white"
                            : "bg-[#F7F7F7] text-gray-700 hover:bg-[#EFEFEF]"
                        }`}
                      >
                        <span className="w-4 shrink-0 text-center text-sm">
                          {item.icon}
                        </span>
                        <span className="min-w-0 truncate text-[13px] font-medium lg:text-sm">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </nav>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-4 w-full rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 lg:mt-6"
                >
                  Выйти
                </button>
              </div>
            </aside>

            <main className="admin-content min-w-0 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
