"use client";

import { useRouter } from "next/navigation";

export default function Profile() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F5F5F5] p-4">

      <h1 className="text-xl font-semibold">Профиль</h1>

      <div className="mt-4 bg-white p-4 rounded-2xl">

        <p className="font-medium">MONTREAUX</p>

        <p className="text-sm text-gray-500 mt-2">
          Телефон: +7 (900) 000-00-00
        </p>

        <p className="text-sm text-gray-500 mt-1">
          Доставка: Россия / Казань
        </p>

        <button className="w-full mt-4 bg-black text-white py-3 rounded-xl">
          Перейти в Telegram канал
        </button>

      </div>

      {/* BACK */}
      <button
        onClick={() => router.push("/")}
        className="mt-4 text-sm underline"
      >
        ← Назад
      </button>

    </main>
  );
}