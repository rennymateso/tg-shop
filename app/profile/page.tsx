"use client";

import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

export default function ProfilePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-5 pb-32">
      <div className="mb-5 flex items-center justify-between animate-[fadeIn_.3s_ease]">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-white px-4 py-2 text-sm text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-transform duration-200 active:scale-95"
        >
          ← Назад
        </button>

        <h1 className="text-[20px] font-medium">Профиль</h1>

        <div className="w-[86px]" />
      </div>

      <div className="rounded-[30px] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] animate-[fadeIn_.35s_ease]">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F3F3] text-lg font-medium text-black">
            M
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">
              Store
            </p>
            <h2 className="mt-1 text-[20px] font-medium text-black">
              MONTREAUX
            </h2>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-[#F8F8F8] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400">
              Телефон
            </p>
            <p className="mt-2 text-sm text-black">+7 (900) 000-00-00</p>
          </div>

          <div className="rounded-2xl bg-[#F8F8F8] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400">
              Доставка
            </p>
            <p className="mt-2 text-sm text-black">Казань и вся Россия</p>
          </div>

          <div className="rounded-2xl bg-[#F8F8F8] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400">
              Поддержка
            </p>
            <p className="mt-2 text-sm text-black">@montreaux_support</p>
          </div>
        </div>

        <button
          onClick={() => window.open("https://t.me/your_channel", "_blank")}
          className="mt-6 w-full rounded-2xl bg-black py-3.5 text-sm font-medium text-white transition-transform duration-200 active:scale-[0.99]"
        >
          Перейти в Telegram канал
        </button>
      </div>

      <div className="mt-4 rounded-[30px] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] animate-[fadeIn_.4s_ease]">
        <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400">
          О магазине
        </p>

        <p className="mt-3 text-[14px] leading-6 text-gray-600">
          MONTREAUX — минималистичный магазин мужской одежды с акцентом на
          аккуратный стиль, комфорт и современные базовые модели.
        </p>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <BottomNav />
    </main>
  );
}