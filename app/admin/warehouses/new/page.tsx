"use client";

import { useState } from "react";

type BadgeType = "В наличии" | "Из-за рубежа";
type WarehouseStatus = "Активен" | "Скрыт";

export default function AdminNewWarehousePage() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Россия");
  const [badge, setBadge] = useState<BadgeType>("В наличии");
  const [kazDelivery, setKazDelivery] = useState("");
  const [rfDelivery, setRfDelivery] = useState("");
  const [status, setStatus] = useState<WarehouseStatus>("Активен");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  const fillKazanWarehouse = () => {
    setName("Склад Казань");
    setCity("Казань");
    setCountry("Россия");
    setBadge("В наличии");
    setKazDelivery("День в день");
    setRfDelivery("3–7 дней");
  };

  const fillIstanbulWarehouse = () => {
    setName("Склад Стамбул");
    setCity("Стамбул");
    setCountry("Турция");
    setBadge("Из-за рубежа");
    setKazDelivery("Около 7 дней");
    setRfDelivery("До 14 дней");
  };

  const handleSave = () => {
    if (!name.trim()) {
      setMessage("Введите название склада");
      return;
    }

    if (!city.trim()) {
      setMessage("Введите город склада");
      return;
    }

    if (!kazDelivery.trim() || !rfDelivery.trim()) {
      setMessage("Заполните сроки доставки");
      return;
    }

    setMessage(
      "Склад сохранен как черновик. Следующим шагом подключим реальное сохранение и связь со складами товаров."
    );
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">Добавить склад</h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleSave}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Сохранить склад
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-[24px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium text-black">
              Основная информация
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={fillKazanWarehouse}
                  className="rounded-2xl bg-[#F5F5F5] px-4 py-2 text-sm text-gray-700"
                >
                  Шаблон: Казань
                </button>

                <button
                  type="button"
                  onClick={fillIstanbulWarehouse}
                  className="rounded-2xl bg-[#F5F5F5] px-4 py-2 text-sm text-gray-700"
                >
                  Шаблон: Стамбул
                </button>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-gray-500">
                  Название склада
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Склад Казань"
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">Город</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Казань"
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">
                  Страна
                </label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Россия"
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">
                  Бейдж склада
                </label>
                <select
                  value={badge}
                  onChange={(e) => setBadge(e.target.value as BadgeType)}
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                >
                  <option>В наличии</option>
                  <option>Из-за рубежа</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">
                  Статус
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as WarehouseStatus)
                  }
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                >
                  <option>Активен</option>
                  <option>Скрыт</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">
                  Срок по Казани
                </label>
                <input
                  value={kazDelivery}
                  onChange={(e) => setKazDelivery(e.target.value)}
                  placeholder="День в день / около 7 дней"
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">
                  Срок по России
                </label>
                <input
                  value={rfDelivery}
                  onChange={(e) => setRfDelivery(e.target.value)}
                  placeholder="3–7 дней / до 14 дней"
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-gray-500">
                  Комментарий
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Дополнительная информация по складу"
                  className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium text-black">
              Автоматическая логика
            </h2>

            <div className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
              <div className="rounded-2xl bg-[#F7F7F7] p-4">
                Если на товар поставлен остаток на складе с бейджем{" "}
                <span className="rounded-full bg-[#F0F0F0] px-2 py-0.5 text-black">
                  В наличии
                </span>
                , товар автоматически получает этот бейдж.
              </div>

              <div className="rounded-2xl bg-[#F7F7F7] p-4">
                Если на товар поставлен остаток на складе с бейджем{" "}
                <span className="rounded-full bg-black px-2 py-0.5 text-white">
                  Из-за рубежа
                </span>
                , товар автоматически получает этот бейдж.
              </div>

              <div className="rounded-2xl bg-[#F7F7F7] p-4">
                Срок доставки клиенту потом рассчитывается по его городу и бейджу товара.
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium text-black">Предпросмотр</h2>

            <div className="mt-4 rounded-[24px] border border-black/5 bg-[#FAFAFA] p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                Склад
              </p>

              <h3 className="mt-2 text-[18px] font-medium text-black">
                {name || "Название склада"}
              </h3>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#F5F5F5] px-2.5 py-1 text-xs text-gray-700">
                  {city || "Город"}
                </span>

                <span className="rounded-full bg-[#F5F5F5] px-2.5 py-1 text-xs text-gray-700">
                  {country || "Страна"}
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    badge === "Из-за рубежа"
                      ? "bg-black text-white"
                      : "bg-[#F5F5F5] text-gray-700"
                  }`}
                >
                  {badge}
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    status === "Активен"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>Казань: {kazDelivery || "Не указано"}</p>
                <p>Россия: {rfDelivery || "Не указано"}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}