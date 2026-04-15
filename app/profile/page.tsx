"use client";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] p-4">

      <h1 className="text-2xl font-light mb-6">Профиль</h1>

      {/* USER INFO */}
      <div className="bg-white p-4 rounded-2xl">
        <p className="text-sm text-gray-500">Пользователь</p>
        <p className="text-lg">Гость</p>

        <p className="text-sm text-gray-500 mt-4">Телефон</p>
        <p className="text-lg">+7 (999) 000-00-00</p>
      </div>

      {/* INFO BLOCK */}
      <div className="bg-white p-4 rounded-2xl mt-4">
        <p className="text-sm text-gray-500">О магазине</p>
        <p className="text-sm mt-2">
          MONTREAUX — премиальная мужская одежда
        </p>
      </div>

      {/* CHANNEL BUTTON */}
      <a
        href="https://t.me/your_channel"
        className="block mt-4 bg-black text-white text-center py-3 rounded-xl"
      >
        Наш Telegram канал
      </a>

    </main>
  );
}