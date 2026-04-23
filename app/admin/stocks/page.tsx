"use client";

import { useMemo, useState } from "react";

type StockRow = {
  id: string;
  product: string;
  color: string;
  size: string;
  quantity: number;
};

const initialStocks: StockRow[] = [
  {
    id: "ST-001",
    product: "Поло Premium",
    color: "Черный",
    size: "L",
    quantity: 4,
  },
];

export default function AdminStocksPage() {
  const [stocks, setStocks] = useState<StockRow[]>(initialStocks);
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState("");

  const filteredStocks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stocks;

    return stocks.filter((item) => {
      return (
        item.product.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q) ||
        item.size.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    });
  }, [stocks, search]);

  const addStock = () => {
    if (!product.trim() || !color.trim() || !size.trim() || !quantity.trim()) {
      return;
    }

    setStocks((prev) => [
      {
        id: `ST-${String(prev.length + 1).padStart(3, "0")}`,
        product: product.trim(),
        color: color.trim(),
        size: size.trim(),
        quantity: Number(quantity),
      },
      ...prev,
    ]);

    setProduct("");
    setColor("");
    setSize("");
    setQuantity("");
  };

  const updateQuantity = (id: string, nextValue: number) => {
    setStocks((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, nextValue) } : item
      )
    );
  };

  const removeStock = (id: string) => {
    setStocks((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <>
      <div className="mb-6">
        <p className="text-sm text-gray-500">Админ-панель</p>
        <h1 className="text-2xl font-semibold text-black">Остатки</h1>
        <p className="mt-2 text-sm text-gray-500">
          Остатки заполняются отдельно: товар → цвет → размер → количество
        </p>
      </div>

      <section className="mb-6 rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-black">Добавить остаток</h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Товар"
            className="rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          />
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Цвет"
            className="rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          />
          <input
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="Размер"
            className="rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          />
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Количество"
            className="rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-2xl bg-[#F7F7F7] px-4 py-3">
            <span className="text-gray-400">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по остаткам"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 sm:w-72"
            />
          </div>

          <button
            onClick={addStock}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Добавить строку
          </button>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        {filteredStocks.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            Остатков пока нет
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStocks.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-[#F7F7F7] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">{item.product}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.color} • {item.size}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black"
                    >
                      −
                    </button>

                    <span className="min-w-[48px] text-center text-sm font-medium text-black">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black"
                    >
                      +
                    </button>

                    <button
                      onClick={() => removeStock(item.id)}
                      className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}