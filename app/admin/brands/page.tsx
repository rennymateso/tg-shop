"use client";

import { useMemo, useState } from "react";

type BrandRow = {
  id: string;
  name: string;
  productsCount: number;
  status: "Активен" | "Скрыт";
};

const initialBrands: BrandRow[] = [
  { id: "B-001", name: "Lacoste", productsCount: 12, status: "Активен" },
  { id: "B-002", name: "Polo Ralph Lauren", productsCount: 8, status: "Активен" },
  { id: "B-003", name: "BORZ", productsCount: 5, status: "Активен" },
  { id: "B-004", name: "Massimo Carino", productsCount: 4, status: "Активен" },
  { id: "B-005", name: "Другие бренды", productsCount: 9, status: "Активен" },
];

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandRow[]>(initialBrands);
  const [search, setSearch] = useState("");
  const [newBrand, setNewBrand] = useState("");

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;

    return brands.filter(
      (brand) =>
        brand.name.toLowerCase().includes(q) ||
        brand.id.toLowerCase().includes(q)
    );
  }, [brands, search]);

  const addBrand = () => {
    if (!newBrand.trim()) return;

    setBrands((prev) => [
      {
        id: `B-${String(prev.length + 1).padStart(3, "0")}`,
        name: newBrand.trim(),
        productsCount: 0,
        status: "Активен",
      },
      ...prev,
    ]);

    setNewBrand("");
  };

  const toggleBrandStatus = (id: string) => {
    setBrands((prev) =>
      prev.map((brand) =>
        brand.id === id
          ? {
              ...brand,
              status: brand.status === "Активен" ? "Скрыт" : "Активен",
            }
          : brand
      )
    );
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">Бренды</h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <span className="text-gray-400">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по брендам"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 sm:w-72"
            />
          </div>
        </div>
      </div>

      <section className="mb-6 rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-black">Добавить бренд</h2>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            placeholder="Название бренда"
            className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          />
          <button
            onClick={addBrand}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Добавить
          </button>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-black">Список брендов</h2>
          <p className="text-sm text-gray-500">Управление отображением брендов</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-[0.18em] text-gray-400">
                <th className="pb-3 pr-4 font-medium">ID</th>
                <th className="pb-3 pr-4 font-medium">Бренд</th>
                <th className="pb-3 pr-4 font-medium">Товаров</th>
                <th className="pb-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredBrands.map((brand) => (
                <tr
                  key={brand.id}
                  className="border-b border-black/5 last:border-b-0"
                >
                  <td className="py-4 pr-4 text-sm text-gray-500">{brand.id}</td>
                  <td className="py-4 pr-4 text-sm font-medium text-black">
                    {brand.name}
                  </td>
                  <td className="py-4 pr-4 text-sm text-gray-600">
                    {brand.productsCount}
                  </td>
                  <td className="py-4">
                    <button
                      onClick={() => toggleBrandStatus(brand.id)}
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        brand.status === "Активен"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {brand.status}
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