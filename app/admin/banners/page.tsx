"use client";

import { useState } from "react";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<string[]>([]);

  const handleBannerUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const freeSlots = 3 - banners.length;
    if (freeSlots <= 0) return;

    const urls = Array.from(files)
      .slice(0, freeSlots)
      .map((file) => URL.createObjectURL(file));

    setBanners((prev) => [...prev, ...urls]);
  };

  const removeBanner = (index: number) => {
    setBanners((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBannerLeft = (index: number) => {
    if (index === 0) return;
    setBanners((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveBannerRight = (index: number) => {
    if (index === banners.length - 1) return;
    setBanners((prev) => {
      const next = [...prev];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      return next;
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">Баннеры</h1>
        </div>

        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
          {banners.length}/3 баннера
        </div>
      </div>

      <section className="mb-6 rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-black">Загрузка баннеров</h2>
        <p className="mt-1 text-sm text-gray-500">
          Можно загрузить до 3 баннеров. Порядок можно менять кнопками.
        </p>

        <div className="mt-4">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleBannerUpload(e.target.files)}
            className="block w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:text-white"
          />
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-black">Текущие баннеры</h2>

        {banners.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-[#F7F7F7] p-6 text-sm text-gray-500">
            Баннеры пока не загружены
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            {banners.map((banner, index) => (
              <div
                key={`${banner}-${index}`}
                className="overflow-hidden rounded-[24px] bg-[#F7F7F7] p-3"
              >
                <div className="relative overflow-hidden rounded-[18px]">
                  <img
                    src={banner}
                    alt={`Баннер ${index + 1}`}
                    className="h-[180px] w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-black px-2 py-1 text-[10px] text-white">
                    Баннер {index + 1}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => moveBannerLeft(index)}
                    className="rounded-xl bg-white px-3 py-2 text-xs text-black"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBannerRight(index)}
                    className="rounded-xl bg-white px-3 py-2 text-xs text-black"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBanner(index)}
                    className="rounded-xl bg-[#FFF1F1] px-3 py-2 text-xs text-red-600"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}