"use client";

import { useRouter } from "next/navigation";

export default function Profile() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F5F5F5] p-4 pb-24">

      <h1 className="text-xl font-semibold">
        Профиль
      </h1>

      <div className="mt-4 bg-white p-4 rounded-2xl">

        <p className="font-medium">MONTREAUX</p>

        <p className="text-sm text-gray-500 mt-2">
          Телефон: +7 (900) 000-00-00
        </p>

        <button className="w-full mt-4 bg-black text-white py-3 rounded-xl">
          Telegram канал
        </button>

      </div>

      <button
        onClick={() => router.push("/")}
        className="mt-4 text-sm underline"
      >
        ← Назад
      </button>

      {/* BOTTOM MENU */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 text-sm">

        <button onClick={() => router.push("/")}>Главная</button>
        <button onClick={() => router.push("/favorites")}>Избранное</button>
        <button onClick={() => router.push("/cart")}>Корзина</button>
        <button onClick={() => router.push("/profile")}>Профиль</button>

      </div>

    </main>
  );
}