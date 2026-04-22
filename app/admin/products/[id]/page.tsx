"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function AdminEditProductPage() {
  const params = useParams();
  const id = String(params.id || "");

  const [name, setName] = useState("Поло Premium");
  const [brand, setBrand] = useState("Lacoste");
  const [price, setPrice] = useState("3500");
  const [oldPrice, setOldPrice] = useState("4500");
  const [description, setDescription] = useState(
    "Премиальное мужское поло из мягкого хлопка."
  );
  const [message, setMessage] = useState("");

  const saveChanges = () => {
    setMessage("Изменения товара сохранены.");
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">
            Редактировать товар
          </h1>
          <p className="mt-1 text-sm text-gray-400">ID: {id}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/admin/products"
            className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-medium text-gray-700 shadow-sm"
          >
            Назад к товарам
          </Link>

          <button
            onClick={saveChanges}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Сохранить изменения
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-[24px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-black">Основные данные</h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-gray-500">Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-500">Бренд</label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-500">Цена</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-500">Старая цена</label>
            <input
              value={oldPrice}
              onChange={(e) => setOldPrice(e.target.value)}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-gray-500">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />
          </div>
        </div>
      </section>
    </>
  );
}