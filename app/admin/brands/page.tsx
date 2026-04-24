"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type BrandRow = {
  id: string;
  name: string;
  created_at: string;
};

function createBrandId() {
  return `brand-${Date.now()}`;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [brands]);

  const loadBrands = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Ошибка загрузки: ${error.message}`);
      setBrands([]);
      setLoading(false);
      return;
    }

    setBrands((data || []) as BrandRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleAddBrand = async () => {
    const name = newBrand.trim();

    if (!name) {
      setMessage("Введите название бренда");
      return;
    }

    const alreadyExists = brands.some(
      (item) => item.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      setMessage("Такой бренд уже есть");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("brands").insert({
      id: createBrandId(),
      name,
    });

    if (error) {
      setMessage(`Ошибка добавления: ${error.message}`);
      setSaving(false);
      return;
    }

    setNewBrand("");
    await loadBrands();
    setSaving(false);
    setMessage("Бренд добавлен");
  };

  const startEdit = (brand: BrandRow) => {
    setEditingId(brand.id);
    setEditingName(brand.name);
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const name = editingName.trim();

    if (!name) {
      setMessage("Название бренда не может быть пустым");
      return;
    }

    const alreadyExists = brands.some(
      (item) =>
        item.id !== editingId &&
        item.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      setMessage("Бренд с таким названием уже существует");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("brands")
      .update({ name })
      .eq("id", editingId);

    if (error) {
      setMessage(`Ошибка сохранения: ${error.message}`);
      setSaving(false);
      return;
    }

    setEditingId(null);
    setEditingName("");
    await loadBrands();
    setSaving(false);
    setMessage("Бренд обновлен");
  };

  const handleDelete = async (brand: BrandRow) => {
    const confirmed = window.confirm(`Удалить бренд "${brand.name}"?`);
    if (!confirmed) return;

    setMessage("");

    const { error } = await supabase.from("brands").delete().eq("id", brand.id);

    if (error) {
      setMessage(`Ошибка удаления: ${error.message}`);
      return;
    }

    await loadBrands();
    setMessage("Бренд удален");
  };

  return (
    <>
      <div className="mb-6">
        <p className="text-sm text-gray-500">Админ-панель</p>
        <h1 className="text-2xl font-semibold text-black">Бренды</h1>
      </div>

      {message && (
        <div className="mb-6 rounded-[24px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      <section className="mb-6 rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-black">Добавить бренд</h2>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            placeholder="Например: Stone Island"
            className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          />

          <button
            type="button"
            onClick={handleAddBrand}
            disabled={saving}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Сохраняем..." : "Добавить"}
          </button>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-black">Список брендов</h2>
          <p className="text-sm text-gray-500">
            Здесь ты можешь добавлять, менять и удалять бренды
          </p>
        </div>

        {loading ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-8 text-center text-sm text-gray-500">
            Загрузка брендов...
          </div>
        ) : sortedBrands.length === 0 ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-8 text-center text-sm text-gray-500">
            Брендов пока нет
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBrands.map((brand) => (
              <div key={brand.id} className="rounded-[22px] bg-[#F7F7F7] p-4">
                {editingId === brand.id ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full rounded-2xl bg-white p-3 text-sm outline-none"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saving}
                        className="rounded-2xl bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
                      >
                        Сохранить
                      </button>

                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-2xl bg-white px-4 py-2 text-sm text-gray-700"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-black">{brand.name}</p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(brand)}
                        className="rounded-2xl bg-white px-4 py-2 text-sm text-gray-700"
                      >
                        Изменить
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(brand)}
                        className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}