"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgePercent,
  BarChart3,
  Boxes,
  ChevronRight,
  ClipboardList,
  Grid3X3,
  Image,
  LogOut,
  Package,
  Plus,
  Search,
  Settings,
  Tags,
  Warehouse,
} from "lucide-react";

const quickItems = [
  { href: "/admin/products/new", label: "Добавить товар", icon: Plus },
  { href: "/admin/orders", label: "Заказы", icon: ClipboardList },
  { href: "/admin/products", label: "Товары", icon: Package },
  { href: "/admin/statistics", label: "Аналитика", icon: BarChart3 },
  { href: "/admin/stocks", label: "Остатки", icon: Boxes },
  { href: "/admin/badges", label: "Бейджи", icon: Tags },
] as const;

const sections = [
  {
    title: "Продажи и товары",
    items: [
      { href: "/admin/orders", title: "Заказы", icon: ClipboardList },
      { href: "/admin/products", title: "Каталог товаров", icon: Package },
      { href: "/admin/products/new", title: "Создать товар", icon: Plus },
      { href: "/admin/stocks", title: "Остатки", icon: Boxes },
    ],
  },
  {
    title: "Витрина",
    items: [
      { href: "/admin/banners", title: "Баннеры", icon: Image },
      { href: "/admin/brands", title: "Бренды", icon: BadgePercent },
      { href: "/admin/badges", title: "Бейджи", icon: Tags },
      { href: "/admin/promocodes", title: "Промокоды", icon: BadgePercent },
    ],
  },
  {
    title: "Управление",
    items: [
      { href: "/admin/statistics", title: "Финансы и статистика", icon: BarChart3 },
      { href: "/admin/warehouses", title: "Склады", icon: Warehouse },
      { href: "/admin/settings", title: "Настройки", icon: Settings },
    ],
  },
] as const;

export default function AdminMenuPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin-logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <>
      <header className="mb-2 rounded-[22px] bg-white p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-black text-[11px] font-semibold text-white">
            M
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[19px] font-semibold text-black">
                MONTREAUX
              </h1>
            </div>
            <p className="mt-0.5 truncate text-[12px] text-slate-400">Админ-панель магазина</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f6fb] text-slate-500"
            aria-label="Выйти"
          >
            <LogOut size={19} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-[16px] bg-[#f4f6fb] px-3 py-2.5">
          <Search size={19} className="shrink-0 text-slate-400" />
          <span className="text-[13px] text-slate-400">Искать в админке</span>
          <Grid3X3 size={19} className="ml-auto shrink-0 text-slate-400" />
        </div>
      </header>

      <section className="mb-2 rounded-[22px] bg-white p-3 shadow-sm">
        <div className="grid grid-cols-3 gap-x-3 gap-y-4">
          {quickItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#f4f6fb] text-black">
                  <Icon size={22} />
                </span>
                <span className="mt-1.5 block text-[12px] font-medium leading-4 text-black">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.title} className="mb-2 rounded-[22px] bg-white p-3 shadow-sm">
          <h2 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {section.title}
          </h2>

          <div>
            {section.items.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 py-2.5 ${
                    index > 0 ? "border-t border-slate-100" : ""
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4f6fb] text-slate-400">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] font-medium text-black">
                    {item.title}
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-slate-300" />
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
