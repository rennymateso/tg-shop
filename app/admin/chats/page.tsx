"use client";

import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";

export default function AdminChatsPage() {
  return (
    <>
      <header className="mb-3 rounded-[26px] bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-400">Seller panel</p>
        <h1 className="mt-1 text-[20px] font-semibold text-black">Чаты</h1>
        <p className="mt-1 text-sm leading-5 text-slate-500">
          Быстрый переход к заказам, где нужно связаться с клиентом.
        </p>
      </header>

      <section className="rounded-[26px] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4f6fb] text-slate-400">
            <MessageCircle size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-medium text-black">Сообщения по заказам</p>
            <p className="mt-1 text-sm text-slate-500">
              Пока отдельного чата нет, используем карточки заказов и телефоны клиентов.
            </p>
          </div>
          <Link href="/admin/orders" className="text-slate-300" aria-label="Открыть заказы">
            <ChevronRight />
          </Link>
        </div>
      </section>
    </>
  );
}
