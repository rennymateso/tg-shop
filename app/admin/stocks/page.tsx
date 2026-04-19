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
  {
    id: "ST-002",
    product: "Поло Premium",
    color: "Белый",
    size: "M",
    quantity: 2,
  },
  {
    id: "ST-003",
    product: "Поло Classic",
    color: "Синий",
    size: "XL",
    quantity: 5,
  },
  {
    id: "ST-004",
    product: "Поло White",
    color: "Белый",
    size: "M",
    quantity: 0,
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

  const totalQuantity = useMemo(
    () => stocks.reduce((sum, item) => sum + item.quantity, 0),
    [stocks]
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">Остатки</h1>
        </div>

        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
          Всего единиц товара: {totalQuantity}
        </div>
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
        <h2 className="text-lg font-medium text-black">Список остатков</h2>
        <p className="mt-1 text-sm text-gray-500">
          Формат: товар — цвет — размер — количество
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-[0.18em] text-gray-400">
                <th className="pb-3 pr-4 font-medium">Товар</th>
                <th className="pb-3 pr-4 font-medium">Цвет</th>
                <th className="pb-3 pr-4 font-medium">Размер</th>
                <th className="pb-3 pr-4 font-medium">Количество</th>
                <th className="pb-3 font-medium">Действия</th>
              </tr>
            </thead>

            <tbody>
              {filteredStocks.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-black/5 last:border-b-0"
                >
                  <td className="py-4 pr-4">
                    <div>
                      <p className="text-sm font-medium text-black">{item.product}</p>
                      <p className="mt-1 text-xs text-gray-400">{item.id}</p>
                    </div>
                  </td>

                  <td className="py-4 pr-4 text-sm text-gray-600">{item.color}</td>
                  <td className="py-4 pr-4 text-sm text-gray-600">{item.size}</td>

                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F5] text-black"
                      >
                        −
                      </button>

                      <span
                        className={`min-w-[50px] rounded-full px-3 py-1 text-center text-sm ${
                          item.quantity === 0
                            ? "bg-red-100 text-red-600"
                            : item.quantity <= 3
                            ? "bg-amber-100 text-amber-700"
                            : "bg-[#F5F5F5] text-gray-700"
                        }`}
                      >
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F5] text-black"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <td className="py-4">
                    <button
                      onClick={() => removeStock(item.id)}
                      className="rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-600"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStocks.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-500">
            Остатки не найдены
          </div>
        )}
      </section>
    </>
  );
}