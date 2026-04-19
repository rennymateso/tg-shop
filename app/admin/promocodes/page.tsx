"use client";

import { useMemo, useState } from "react";

type PromoStatus = "Активен" | "Отключен";

type PromoRow = {
  id: string;
  code: string;
  discountPercent: number | null;
  discountRub: number | null;
  hasPeriod: boolean;
  startsAt: string;
  endsAt: string;
  perClientLimit: number;
  usedCount: number;
  status: PromoStatus;
};

const initialPromos: PromoRow[] = [
  {
    id: "PR-001",
    code: "WELCOME10",
    discountPercent: 10,
    discountRub: null,
    hasPeriod: true,
    startsAt: "2026-04-20",
    endsAt: "2026-05-30",
    perClientLimit: 1,
    usedCount: 14,
    status: "Активен",
  },
  {
    id: "PR-002",
    code: "SALE1000",
    discountPercent: null,
    discountRub: 1000,
    hasPeriod: false,
    startsAt: "",
    endsAt: "",
    perClientLimit: 2,
    usedCount: 7,
    status: "Активен",
  },
];

export default function AdminPromoCodesPage() {
  const [promos, setPromos] = useState<PromoRow[]>(initialPromos);
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountRub, setDiscountRub] = useState("");
  const [hasPeriod, setHasPeriod] = useState(true);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [perClientLimit, setPerClientLimit] = useState("1");

  const activeCount = useMemo(
    () => promos.filter((item) => item.status === "Активен").length,
    [promos]
  );

  const addPromo = () => {
    if (!code.trim()) return;
    if (!discountPercent.trim() && !discountRub.trim()) return;
    if (hasPeriod && (!startsAt.trim() || !endsAt.trim())) return;

    setPromos((prev) => [
      {
        id: `PR-${String(prev.length + 1).padStart(3, "0")}`,
        code: code.trim().toUpperCase(),
        discountPercent: discountPercent.trim() ? Number(discountPercent) : null,
        discountRub: discountRub.trim() ? Number(discountRub) : null,
        hasPeriod,
        startsAt: hasPeriod ? startsAt : "",
        endsAt: hasPeriod ? endsAt : "",
        perClientLimit: Number(perClientLimit),
        usedCount: 0,
        status: "Активен",
      },
      ...prev,
    ]);

    setCode("");
    setDiscountPercent("");
    setDiscountRub("");
    setHasPeriod(true);
    setStartsAt("");
    setEndsAt("");
    setPerClientLimit("1");
  };

  const toggleStatus = (id: string) => {
    setPromos((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "Активен" ? "Отключен" : "Активен",
            }
          : item
      )
    );
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">Промокоды</h1>
        </div>

        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
          Активных промокодов: {activeCount}
        </div>
      </div>

      <section className="mb-6 rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-black">Добавить промокод</h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Код промокода"
            className="rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          />

          <input
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            placeholder="Скидка %"
            className="rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          />

          <input
            value={discountRub}
            onChange={(e) => setDiscountRub(e.target.value)}
            placeholder="Скидка ₽"
            className="rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          />

          <input
            value={perClientLimit}
            onChange={(e) => setPerClientLimit(e.target.value)}
            placeholder="Сколько раз 1 клиент"
            className="rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          />
        </div>

        <div className="mt-4 rounded-2xl bg-[#F7F7F7] p-4">
          <label className="flex items-center gap-3 text-sm text-black">
            <input
              type="checkbox"
              checked={hasPeriod}
              onChange={(e) => setHasPeriod(e.target.checked)}
            />
            У промокода есть срок действия
          </label>

          {hasPeriod ? (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-500">Начало</label>
                <input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full rounded-2xl bg-white p-3.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-500">Конец</label>
                <input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full rounded-2xl bg-white p-3.5 text-sm outline-none"
                />
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">Промокод будет бессрочным.</p>
          )}
        </div>

        <button
          onClick={addPromo}
          className="mt-4 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
        >
          Добавить промокод
        </button>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-black">Список промокодов</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-[0.18em] text-gray-400">
                <th className="pb-3 pr-4 font-medium">Код</th>
                <th className="pb-3 pr-4 font-medium">Скидка</th>
                <th className="pb-3 pr-4 font-medium">Срок</th>
                <th className="pb-3 pr-4 font-medium">На клиента</th>
                <th className="pb-3 pr-4 font-medium">Использован</th>
                <th className="pb-3 font-medium">Статус</th>
              </tr>
            </thead>

            <tbody>
              {promos.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-black/5 last:border-b-0"
                >
                  <td className="py-4 pr-4 text-sm font-medium text-black">
                    {item.code}
                  </td>

                  <td className="py-4 pr-4 text-sm text-gray-600">
                    {item.discountPercent ? `${item.discountPercent}%` : ""}
                    {item.discountPercent && item.discountRub ? " / " : ""}
                    {item.discountRub ? `${item.discountRub} ₽` : ""}
                  </td>

                  <td className="py-4 pr-4 text-sm text-gray-600">
                    {item.hasPeriod
                      ? `${item.startsAt} — ${item.endsAt}`
                      : "Бессрочно"}
                  </td>

                  <td className="py-4 pr-4 text-sm text-gray-600">
                    {item.perClientLimit} раз
                  </td>

                  <td className="py-4 pr-4 text-sm text-gray-600">
                    {item.usedCount}
                  </td>

                  <td className="py-4">
                    <button
                      onClick={() => toggleStatus(item.id)}
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        item.status === "Активен"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {item.status}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}