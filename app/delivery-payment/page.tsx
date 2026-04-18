"use client";

import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

export default function DeliveryPaymentPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-5 pb-32">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-white px-4 py-2 text-sm text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
        >
          ← Назад
        </button>

        <h1 className="text-[20px] font-medium">Доставка и оплата</h1>

        <div className="w-[86px]" />
      </div>

      <div className="space-y-4">
        <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <h2 className="text-[16px] font-medium text-black">Доставка</h2>

          <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
            <p>
              Мы осуществляем доставку по <span className="text-black">г. Казань</span> и
              по <span className="text-black">всей России</span>.
            </p>

            <p>
              Доставка по России выполняется любой удобной транспортной компанией,
              в зависимости от региона и выбранного способа отправки.
            </p>

            <p>
              По г. Казань стандартная доставка занимает{" "}
              <span className="text-black">от 2 до 4 часов</span>, а для отдельных
              товаров срок может составлять{" "}
              <span className="text-black">до 7 дней</span>.
            </p>

            <p>
              По России срок доставки составляет{" "}
              <span className="text-black">от 3 до 14 дней</span>.
            </p>
          </div>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <h2 className="text-[16px] font-medium text-black">Стоимость доставки</h2>

          <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
            <p>
              Стоимость доставки по <span className="text-black">г. Казань</span>{" "}
              при покупке до <span className="text-black">10 000 ₽</span>{" "}
              составляет <span className="text-black">300 ₽</span>.
            </p>

            <p>
              При покупке от <span className="text-black">10 000 ₽</span> по
              г. Казань действует <span className="text-black">бесплатная доставка</span>.
            </p>

            <p>
              Стоимость доставки по России составляет{" "}
              <span className="text-black">от 300 ₽ до 1 000 ₽</span> в
              зависимости от региона и выбранного способа доставки.
            </p>

            <p>
              При покупке от <span className="text-black">20 000 ₽</span> по
              России действует <span className="text-black">бесплатная доставка</span>.
            </p>
          </div>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <h2 className="text-[16px] font-medium text-black">Сроки по наличию</h2>

          <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
            <p>
              Товары с бейджем{" "}
              <span className="rounded-full bg-[#F3F3F3] px-2 py-0.5 text-black">
                В наличии
              </span>{" "}
              доставляются по г. Казань{" "}
              <span className="text-black">в день оплаты</span>, а по России —{" "}
              <span className="text-black">от 3 до 7 дней</span>.
            </p>

            <p>
              Товары с бейджем{" "}
              <span className="rounded-full bg-black px-2 py-0.5 text-white">
                Из-за рубежа
              </span>{" "}
              доставляются по г. Казань{" "}
              <span className="text-black">до 7 дней</span>, а по России —{" "}
              <span className="text-black">от 7 до 14 дней</span>.
            </p>
          </div>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <h2 className="text-[16px] font-medium text-black">Оплата</h2>

          <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
            <p>
              Мы принимаем оплату{" "}
              <span className="text-black">
                банковской картой, наличными и переводом по СБП
              </span>
              .
            </p>

            <p>
              Оплата <span className="text-black">наличными</span> доступна только
              при выборе <span className="text-black">самовывоза</span>.
            </p>

            <p>
              После оформления заказа менеджер при необходимости свяжется с вами
              для подтверждения деталей доставки и оплаты.
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}