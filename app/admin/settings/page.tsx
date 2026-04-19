"use client";

import { useState } from "react";

export default function AdminSettingsPage() {
  const [shopName, setShopName] = useState("MONTREAUX");
  const [supportPhone, setSupportPhone] = useState("+7 (999) 999-99-99");
  const [telegramChannel, setTelegramChannel] = useState("https://t.me/montreaux");
  const [pickupAddress, setPickupAddress] = useState(
    'г. Казань, Академика Глушко 16Г, ТЦ "АКАДЕМИК", 2 этаж'
  );
  const [saveMessage, setSaveMessage] = useState("");

  const saveSettings = () => {
    setSaveMessage("Настройки сохранены.");
  };

  return (
    <>
      <div className="mb-6">
        <p className="text-sm text-gray-500">Админ-панель</p>
        <h1 className="text-2xl font-semibold text-black">Настройки</h1>
      </div>

      {saveMessage && (
        <div className="mb-6 rounded-[24px] bg-white p-4 text-sm text-black shadow-sm">
          {saveMessage}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-black">Основные настройки</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-gray-500">
                Название магазина
              </label>
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">
                Телефон поддержки
              </label>
              <input
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">
                Ссылка на Telegram-канал
              </label>
              <input
                value={telegramChannel}
                onChange={(e) => setTelegramChannel(e.target.value)}
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">
                Адрес самовывоза
              </label>
              <textarea
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                rows={4}
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            </div>

            <button
              onClick={saveSettings}
              className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Сохранить настройки
            </button>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-black">Информация</h2>

          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <div className="rounded-2xl bg-[#F7F7F7] p-4">
              Здесь можно менять контакты, ссылки и базовые настройки магазина.
            </div>
            <div className="rounded-2xl bg-[#F7F7F7] p-4">
              Тему админ-панели убрали, к ней вернемся позже.
            </div>
            <div className="rounded-2xl bg-[#F7F7F7] p-4">
              Следующим шагом можно связать настройки с реальными данными сайта.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}