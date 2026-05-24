"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

export default function ReturnExchangePage() {
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

        .return-exchange-fixed-page {
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

      <main className="return-exchange-fixed-page bg-[#F5F5F5] px-4 pt-[76px] pb-32">
        <div className="mb-5 flex items-center justify-center">
          <h1 className="text-[20px] font-medium">Возврат и обмен</h1>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
            <h2 className="text-[16px] font-medium text-black">
              Правила возврата и обмена товара
            </h2>

            <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
              <p>
                Вы можете произвести возврат или обмен товара надлежащего качества
                без указания причин в течение{" "}
                <span className="text-black">7 календарных дней</span>, не считая
                дня покупки.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
            <h2 className="text-[16px] font-medium text-black">
              Условия возврата
            </h2>

            <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
              <p>Товар не был в употреблении.</p>
              <p>Сохранены фабричные ярлыки и товарный вид.</p>
              <p>Сохранены потребительские свойства.</p>
              <p>
                Товар ненадлежащего качества (брак) подлежит возврату в сроки,
                установленные действующим законодательством.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
            <h2 className="text-[16px] font-medium text-black">
              Способы возврата
            </h2>

            <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
              <p>
                <span className="text-black">Интернет-заказ:</span> обмен на
                аналогичный товар возможен через процедуру возврата и оформление
                новой покупки.
              </p>

              <p>
                <span className="text-black">Самовывоз:</span> заказ, оформленный
                методом «самовывоз», можно вернуть только в тот магазин, где он
                был получен.
              </p>

              <p>
                <span className="text-black">Доставка:</span> заказ, оформленный с
                доставкой, можно вернуть через Почту России или транспортную
                компанию СДЭК.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
            <h2 className="text-[16px] font-medium text-black">Важно</h2>

            <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
              <p>
                Денежные средства будут возвращены вам в течение{" "}
                <span className="text-black">10 календарных дней</span> после того,
                как мы получим товар и проверим его.
              </p>
            </div>
          </div>
        </div>

        <BottomNav />
      </main>
    </>
  );
}
