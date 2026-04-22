"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { deleteAdminProduct, getAdminProducts } from "../../lib/admin-products-storage";
import { AdminProduct } from "../../types/admin-product";

function getDiscountPercent(oldPrice: number, price: number) {
  if (oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<AdminProduct[]>([]);

  useEffect(() => {
    setProducts(getAdminProducts());
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;

    return products.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.article.toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  const handleDelete = (id: string) => {
    deleteAdminProduct(id);
    setProducts(getAdminProducts());
  };

  const toggleStatus = (id: string) => {
    const current = getAdminProducts();
    const next = current.map((item) =>
      item.id === id
        ? {
            ...item,
            status: item.status === "Активен" ? "Скрыт" : "Активен",
            updatedAt: new Date().toLocaleString("ru-RU"),
          }
        : item
    );

    localStorage.setItem("admin_products", JSON.stringify(next));
    setProducts(next);
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">Товары</h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <span className="text-gray-400">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по товарам"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 sm:w-72"
            />
          </div>

          <Link
            href="/admin/products/new"
            className="rounded-2xl bg-black px-5 py-3 text-center text-sm font-medium text-white"
          >
            + Добавить товар
          </Link>
        </div>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Всего товаров</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {products.length}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Активные</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {products.filter((item) => item.status === "Активен").length}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Со скидкой</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {products.filter((item) => item.oldPrice > item.price).length}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Скрытые</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
            {products.filter((item) => item.status === "Скрыт").length}
          </p>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-black">Каталог товаров</h2>
          <p className="text-sm text-gray-500">
            Тут показываются реально сохранённые товары из админки
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-8 text-center text-sm text-gray-500">
            Товаров пока нет
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-black/5 text-xs uppercase tracking-[0.18em] text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Товар</th>
                  <th className="pb-3 pr-4 font-medium">Фото</th>
                  <th className="pb-3 pr-4 font-medium">Цена</th>
                  <th className="pb-3 pr-4 font-medium">Бейдж</th>
                  <th className="pb-3 pr-4 font-medium">Статус</th>
                  <th className="pb-3 font-medium">Действия</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((item) => {
                  const discount = getDiscountPercent(item.oldPrice, item.price);

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-black/5 align-top last:border-b-0"
                    >
                      <td className="py-4 pr-4">
                        <div>
                          <p className="text-sm font-medium text-black">{item.name}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {item.brand} • {item.category}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {item.article || item.id}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <div className="h-16 w-12 overflow-hidden rounded-xl bg-[#ECECEC]">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-emerald-600">
                            {item.price.toLocaleString("ru-RU")} ₽
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {item.oldPrice.toLocaleString("ru-RU")} ₽
                          </span>
                          {discount > 0 && (
                            <span className="mt-1 text-xs text-emerald-600">
                              -{discount}%
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            item.badge === "Из-за рубежа"
                              ? "bg-black text-white"
                              : "bg-[#F5F5F5] text-gray-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      </td>

                      <td className="py-4 pr-4">
                        <button
                          type="button"
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

                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/products/${item.id}`}
                            className="rounded-2xl bg-[#F5F5F5] px-3 py-2 text-xs text-gray-700"
                          >
                            Редактировать
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-600"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}