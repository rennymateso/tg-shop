"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { href: "/admin", label: "Главная", icon: "▣" },
  { href: "/admin/orders", label: "Заказы", icon: "◎" },
  { href: "/admin/products", label: "Товары", icon: "◫" },
  { href: "/admin/products/new", label: "Добавить товар", icon: "+" },
  { href: "/admin/statistics", label: "Статистика", icon: "◔" },
  { href: "/admin/promocodes", label: "Промокоды", icon: "%" },
  { href: "/admin/banners", label: "Баннеры", icon: "▭" },
  { href: "/admin/brands", label: "Бренды", icon: "◆" },
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

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-black">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-black/5 bg-white px-4 py-5 lg:border-b-0 lg:border-r">
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400">
              Admin panel
            </p>
            <h1 className="mt-2 text-2xl font-light tracking-[0.35em]">
              MONTREAUX
            </h1>
          </div>

          <nav className="space-y-2">
            {menu.map((item) => {
              const active = isActive(pathname, item.href);

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
          </nav>
        </aside>

        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}