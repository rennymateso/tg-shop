"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type BadgeRow = {
  id: string;
  name: string;
  created_at: string;
};

function createBadgeId() {
  return `badge-${Date.now()}`;
}

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [newBadge, setNewBadge] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const sortedBadges = useMemo(() => {
    return [...badges].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [badges]);

  const loadBadges = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("badges")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Ошибка загрузки: ${error.message}`);
      setBadges([]);
      setLoading(false);
      return;
    }

    setBadges((data || []) as BadgeRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const handleAddBadge = async () => {
    const name = newBadge.trim();

    if (!name) {
      setMessage("Введите название бейджа");
      return;
    }

    const alreadyExists = badges.some(
      (item) => item.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      setMessage("Такой бейдж уже есть");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("badges").insert({
      id: createBadgeId(),
      name,
    });

    if (error) {
      setMessage(`Ошибка добавления: ${error.message}`);
      setSaving(false);
      return;
    }

    setNewBadge("");
    setSaving(false);
    await loadBadges();
    setMessage("Бейдж добавлен");
  };

  const startEdit = (badge: BadgeRow) => {
    setEditingId(badge.id);
    setEditingName(badge.name);
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
      setMessage("Название бейджа не может быть пустым");
      return;
    }

    const alreadyExists = badges.some(
      (item) =>
        item.id !== editingId &&
        item.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      setMessage("Бейдж с таким названием уже существует");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("badges")
      .update({ name })
      .eq("id", editingId);

    if (error) {
      setMessage(`Ошибка сохранения: ${error.message}`);
      setSaving(false);
      return;
    }

    setEditingId(null);
    setEditingName("");
    setSaving(false);
    await loadBadges();
    setMessage("Бейдж обновлен");
  };

  const handleDelete = async (badge: BadgeRow) => {
    const confirmed = window.confirm(`Удалить бейдж "${badge.name}"?`);
    if (!confirmed) return;

    setMessage("");

    const { error } = await supabase.from("badges").delete().eq("id", badge.id);

    if (error) {
      setMessage(`Ошибка удаления: ${error.message}`);
      return;
    }

    await loadBadges();
    setMessage("Бейдж удален");
  };

  return (
    <>
      <div className="mb-6">
        <p className="text-sm text-gray-500">Админ-панель</p>
        <h1 className="text-2xl font-semibold text-black">Бейджи</h1>
      </div>

      {message && (
        <div className="mb-6 rounded-[24px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      <section className="mb-6 rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-black">Добавить бейдж</h2>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={newBadge}
            onChange={(e) => setNewBadge(e.target.value)}
            placeholder="Например: Хит"
            className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          />

          <button
            type="button"
            onClick={handleAddBadge}
            disabled={saving}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Сохраняем..." : "Добавить"}
          </button>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-black">Список бейджей</h2>
          <p className="text-sm text-gray-500">
            Здесь ты можешь добавлять, менять и удалять бейджи
          </p>
        </div>

        {loading ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-8 text-center text-sm text-gray-500">
            Загрузка бейджей...
          </div>
        ) : sortedBadges.length === 0 ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-8 text-center text-sm text-gray-500">
            Бейджей пока нет
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBadges.map((badge) => (
              <div key={badge.id} className="rounded-[22px] bg-[#F7F7F7] p-4">
                {editingId === badge.id ? (
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
                    <p className="text-sm font-medium text-black">{badge.name}</p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(badge)}
                        className="rounded-2xl bg-white px-4 py-2 text-sm text-gray-700"
                      >
                        Изменить
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(badge)}
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