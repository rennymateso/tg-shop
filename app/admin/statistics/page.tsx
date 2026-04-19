"use client";

import { useMemo, useState } from "react";

type RangeKey = "1d" | "7d" | "14d" | "30d";

const rangeLabels: Record<RangeKey, string> = {
  "1d": "За день",
  "7d": "7 дней",
  "14d": "14 дней",
  "30d": "Месяц",
};

const statsByRange: Record<
  RangeKey,
  {
    visits: number;
    productViews: number;
    favorites: number;
    cartAdds: number;
    orders: number;
    paidOrders: number;
    revenue: number;
  }
> = {
  "1d": {
    visits: 182,
    productViews: 96,
    favorites: 17,
    cartAdds: 24,
    orders: 5,
    paidOrders: 4,
    revenue: 24100,
  },
  "7d": {
    visits: 1284,
    productViews: 624,
    favorites: 143,
    cartAdds: 216,
    orders: 38,
    paidOrders: 31,
    revenue: 184500,
  },
  "14d": {
    visits: 2410,
    productViews: 1172,
    favorites: 268,
    cartAdds: 397,
    orders: 71,
    paidOrders: 59,
    revenue: 352400,
  },
  "30d": {
    visits: 5038,
    productViews: 2460,
    favorites: 544,
    cartAdds: 816,
    orders: 148,
    paidOrders: 122,
    revenue: 741900,
  },
};

export default function AdminStatisticsPage() {
  const [range, setRange] = useState<RangeKey>("7d");

  const current = statsByRange[range];

  const averageCheck = useMemo(() => {
    if (!current.paidOrders) return 0;
    return Math.round(current.revenue / current.paidOrders);
  }, [current]);

  const cartConversion = useMemo(() => {
    if (!current.visits) return 0;
    return ((current.cartAdds / current.visits) * 100).toFixed(1);
  }, [current]);

  const orderConversion = useMemo(() => {
    if (!current.visits) return 0;
    return ((current.orders / current.visits) * 100).toFixed(1);
  }, [current]);

  const funnel = [
    { label: "Зашли на сайт", value: current.visits },
    { label: "Открыли товар", value: current.productViews },
    { label: "Добавили в избранное", value: current.favorites },
    { label: "Добавили в корзину", value: current.cartAdds },
    { label: "Оформили заказ", value: current.orders },
    { label: "Оплатили", value: current.paidOrders },
  ];

  const stats = [
    {
      title: "Посетили сайт",
      value: current.visits.toLocaleString("ru-RU"),
      note: rangeLabels[range],
    },
    {
      title: "Добавили в корзину",
      value: current.cartAdds.toLocaleString("ru-RU"),
      note: `Конверсия ${cartConversion}%`,
    },
    {
      title: "Добавили в избранное",
      value: current.favorites.toLocaleString("ru-RU"),
      note: rangeLabels[range],
    },
    {
      title: "Оформили заказ",
      value: current.orders.toLocaleString("ru-RU"),
      note: `Конверсия ${orderConversion}%`,
    },
    {
      title: "Оплаченные заказы",
      value: current.paidOrders.toLocaleString("ru-RU"),
      note: rangeLabels[range],
    },
    {
      title: "Выручка",
      value: `${current.revenue.toLocaleString("ru-RU")} ₽`,
      note: `Средний чек ${averageCheck.toLocaleString("ru-RU")} ₽`,
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            Статистика
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(rangeLabels) as RangeKey[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={`rounded-2xl px-4 py-2 text-sm transition ${
                range === item
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 shadow-sm"
              }`}
            >
              {rangeLabels[item]}
            </button>
          ))}
        </div>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <div key={item.title} className="rounded-[28px] bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{item.title}</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
              {item.value}
            </p>
            <p className="mt-2 text-sm text-gray-400">{item.note}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-black">Воронка действий</h2>
          <p className="mt-1 text-sm text-gray-500">{rangeLabels[range]}</p>

          <div className="mt-5 space-y-4">
            {funnel.map((item, index) => {
              const max = funnel[0].value;
              const width = Math.max((item.value / max) * 100, 8);

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-black">
                      {index + 1}. {item.label}
                    </span>
                    <span className="text-gray-500">
                      {item.value.toLocaleString("ru-RU")}
                    </span>
                  </div>

                  <div className="h-3 w-full rounded-full bg-[#F2F2F2]">
                    <div
                      className="h-3 rounded-full bg-black"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-black">Что показывает блок</h2>

          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <div className="rounded-2xl bg-[#F7F7F7] p-4">
              1. Сколько человек зашли на сайт.
            </div>
            <div className="rounded-2xl bg-[#F7F7F7] p-4">
              2. Сколько добавили товар в избранное.
            </div>
            <div className="rounded-2xl bg-[#F7F7F7] p-4">
              3. Сколько добавили товар в корзину.
            </div>
            <div className="rounded-2xl bg-[#F7F7F7] p-4">
              4. Сколько оформили и оплатили заказ.
            </div>
            <div className="rounded-2xl bg-[#F7F7F7] p-4">
              5. Выручку и средний чек за выбранный период.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}