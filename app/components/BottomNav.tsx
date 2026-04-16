"use client";

import { usePathname, useRouter } from "next/navigation";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const activeClass = (path: string) =>
    pathname === path ? "text-blue-500" : "text-gray-400";

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-[34px] shadow-2xl border border-gray-100 px-4 py-3 flex justify-between z-50">
      <button
        onClick={() => router.push("/")}
        className={`flex flex-col items-center gap-1 flex-1 ${activeClass("/")}`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
        <span className="text-[13px]">Главная</span>
      </button>

      <button
        onClick={() => router.push("/favorites")}
        className={`flex flex-col items-center gap-1 flex-1 ${activeClass("/favorites")}`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21l-1.4-1.3C5.4 15 2 11.9 2 8.1 2 5 4.4 3 7.4 3c1.7 0 3.4.8 4.6 2.1C13.2 3.8 14.9 3 16.6 3 19.6 3 22 5 22 8.1c0 3.8-3.4 6.9-8.6 11.6z" />
        </svg>
        <span className="text-[13px]">Избранное</span>
      </button>

      <button
        onClick={() => router.push("/cart")}
        className={`flex flex-col items-center gap-1 flex-1 ${activeClass("/cart")}`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.2 14h9.9c.8 0 1.5-.5 1.8-1.2L22 6H6.2L5.3 4H2v2h2l3.6 7.6-1.3 2.4c-.2.3-.3.7-.3 1 0 1.1.9 2 2 2H20v-2H8.4c-.1 0-.2-.1-.2-.2v-.1l1-1.7z" />
        </svg>
        <span className="text-[13px]">Корзина</span>
      </button>

      <button
        onClick={() => router.push("/profile")}
        className={`flex flex-col items-center gap-1 flex-1 ${activeClass("/profile")}`}
      >
        <div className="w-7 h-7 rounded-full border border-current flex items-center justify-center text-sm">
          P
        </div>
        <span className="text-[13px]">Профиль</span>
      </button>
    </div>
  );
}