"use client";

export default function AdminBannersPage() {
  return (
    <>
      <div className="mb-6">
        <p className="text-sm text-gray-500">Админ-панель</p>
        <h1 className="text-2xl font-semibold text-black">Баннеры</h1>
      </div>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-black">Главный баннер</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Сейчас баннер главной страницы хранится как файл в public/banner.jpg.
          Здесь позже можно добавить загрузку изображения, ссылку баннера и
          включение/выключение акций.
        </p>

        <div className="mt-5 overflow-hidden rounded-[24px] bg-[#F5F5F5]">
          <img
            src="/banner.jpg"
            alt="Главный баннер"
            className="h-auto w-full object-cover"
          />
        </div>
      </section>
    </>
  );
}
