"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const mainTabs = [
  { href: "/admin", label: "Главная", icon: "⌂" },
  { href: "/admin/orders", label: "Заказы", icon: "◎" },
  { href: "/admin/products", label: "Товары", icon: "◫" },
  { href: "/admin/menu", label: "Меню", icon: "☰" },
] as const;

const menu = [
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

function getActiveTab(pathname: string) {
  if (pathname === "/admin") return "/admin";
  if (pathname.startsWith("/admin/orders")) return "/admin/orders";
  if (pathname.startsWith("/admin/products")) return "/admin/products";
  return "/admin/menu";
}

function isMenuActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);

  const activeTab = useMemo(() => getActiveTab(pathname), [pathname]);

  useEffect(() => {
    setIsMenuSheetOpen(false);
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

  const handleBottomTabClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href !== "/admin/menu") return;

    event.preventDefault();
    setIsMenuSheetOpen(true);
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
          color: #111;
        }

        .admin-scroll {
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px));
        }

        .admin-bottom-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 90;
          padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px));
          background: rgba(255,255,255,.96);
          border-top: 1px solid rgba(17,17,17,.08);
          box-shadow: 0 -10px 30px rgba(15,23,42,.08);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .admin-bottom-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 6px;
          max-width: 520px;
          margin: 0 auto;
        }

        .admin-sheet {
          position: fixed;
          inset: 0;
          z-index: 120;
          background: rgba(0,0,0,.32);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 12px;
        }

        .admin-sheet-panel {
          width: min(100%, 520px);
          max-height: min(78vh, 680px);
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          border-radius: 28px;
          background: #fff;
          padding: 16px;
          box-shadow: 0 24px 80px rgba(0,0,0,.24);
        }

        .admin-desktop-sidebar {
          display: none;
        }

        @media (min-width: 1024px) {
          .admin-page-grid {
            display: grid;
            grid-template-columns: 260px minmax(0,1fr);
            min-height: 100%;
            max-width: 1600px;
            margin: 0 auto;
          }

          .admin-desktop-sidebar {
            display: block;
            border-right: 1px solid rgba(0,0,0,.06);
            background: #fff;
            padding: 20px 16px;
          }

          .admin-scroll {
            padding-bottom: 0;
          }

          .admin-bottom-nav {
            display: none;
          }

          .admin-content {
            padding: 28px 32px;
          }
        }

        @media (max-width: 1023px) {
          .admin-page-grid {
            min-height: 100%;
          }

          .admin-content {
            padding: 14px 12px 0;
          }
        }
      `}</style>

      <div className="admin-fixed-page">
        <div className="admin-scroll">
          <div className="admin-page-grid">
            <aside className="admin-desktop-sidebar">
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400">
                  Seller panel
                </p>
                <h1 className="mt-2 text-2xl font-light tracking-[0.35em]">
                  MONTREAUX
                </h1>
              </div>

              <nav className="space-y-2">
                {mainTabs.slice(0, 3).map((item) => {
                  const active = activeTab === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                        active
                          ? "bg-black text-white"
                          : "bg-[#F7F7F7] text-gray-700 hover:bg-[#EFEFEF]"
                      }`}
                    >
                      <span className="w-4 text-center text-sm">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}

                <div className="pt-4">
                  <p className="mb-2 px-2 text-xs font-medium text-gray-400">
                    Инструменты
                  </p>

                  {menu.map((item) => {
                    const active = isMenuActive(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                          active
                            ? "bg-black text-white"
                            : "bg-[#F7F7F7] text-gray-700 hover:bg-[#EFEFEF]"
                        }`}
                      >
                        <span className="w-4 text-center text-sm">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-6 w-full rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              >
                Выйти
              </button>
            </aside>

            <main className="admin-content min-w-0">{children}</main>
          </div>
        </div>

        <nav className="admin-bottom-nav" aria-label="Админ меню">
          <div className="admin-bottom-grid">
            {mainTabs.map((item) => {
              const active = activeTab === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(event) => handleBottomTabClick(event, item.href)}
                  className={`flex h-[56px] flex-col items-center justify-center rounded-2xl text-center transition ${
                    active
                      ? "bg-black text-white"
                      : "bg-[#F5F5F5] text-gray-600"
                  }`}
                >
                  <span className="text-[17px] leading-none">{item.icon}</span>
                  <span className="mt-1 text-[11px] font-medium leading-none">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {isMenuSheetOpen && (
          <div
            className="admin-sheet"
            onClick={() => setIsMenuSheetOpen(false)}
          >
            <div
              className="admin-sheet-panel"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Админ-панель</p>
                  <h2 className="text-xl font-semibold text-black">Меню</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5] text-lg text-black"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {menu.map((item) => {
                  const active = isMenuActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex min-h-[58px] items-center gap-3 rounded-2xl px-3 py-3 ${
                        active
                          ? "bg-black text-white"
                          : "bg-[#F7F7F7] text-gray-700"
                      }`}
                    >
                      <span className="w-5 text-center text-sm">{item.icon}</span>
                      <span className="min-w-0 text-[13px] font-medium">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 w-full rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              >
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
