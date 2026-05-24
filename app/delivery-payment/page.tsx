"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

export default function DeliveryPaymentPage() {
  const router = useRouter();

  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0];

      if (!touch) return;

      touchStartX = touch.screenX;
      touchStartY = touch.screenY;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];

      if (!touch) return;

      const diffX = touch.screenX - touchStartX;
      const diffY = Math.abs(touch.screenY - touchStartY);

      if (touchStartX < 45 && diffX > 90 && diffY < 70) {
        router.back();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [router]);

  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const previousContent = viewport?.getAttribute("content") || "";

    viewport?.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover"
    );

    return () => {
      if (viewport) {
        viewport.setAttribute("content", previousContent);
      }
    };
  }, []);

  return (
    <>
      <style>{`
        html,
        body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          overscroll-behavior: none;
          -webkit-text-size-adjust: 100%;
          touch-action: pan-y;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        .delivery-payment-fixed-page {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100vh;
          height: 100dvh;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y;
        }
      `}</style>

      <main className="delivery-payment-fixed-page bg-[#F5F5F5] px-4 pt-[76px] pb-32">
      <div className="mb-5 flex items-center justify-center">
        <h1 className="text-[20px] font-medium">Доставка и оплата</h1>
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
              <span className="rounded-full bg-[#EAF8F0] px-2 py-0.5 font-medium text-[#16A34A]">
                В наличии
              </span>{" "}
              доставляются по г. Казань{" "}
              <span className="text-black">в день оплаты</span>, а по России —{" "}
              <span className="text-black">от 3 до 7 дней</span>.
            </p>

            <p>
              Товары с бейджем{" "}
              <span className="rounded-full bg-[#F1F1F1] px-2 py-0.5 font-normal text-[#666]">
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
    </>
  );
}
