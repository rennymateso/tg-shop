"use client";

import { useEffect, useState } from "react";

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const data = localStorage.getItem("cart");
    if (data) {
      setCart(JSON.parse(data));
    }
  }, []);

  const updateCart = (newCart: any[]) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const removeItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    updateCart(newCart);
  };

  const changeQty = (index: number, type: "inc" | "dec") => {
    const newCart = [...cart];

    if (!newCart[index].qty) newCart[index].qty = 1;

    if (type === "inc") {
      newCart[index].qty += 1;
    } else {
      newCart[index].qty -= 1;
      if (newCart[index].qty < 1) newCart[index].qty = 1;
    }

    updateCart(newCart);
  };

  const total = cart.reduce((sum, item) => {
    const qty = item.qty || 1;
    return sum + item.price * qty;
  }, 0);

  return (
    <main className="min-h-screen bg-[#F5F5F5] p-4 pb-28">

      {/* HEADER */}
      <h1 className="text-2xl font-light mb-6">Корзина</h1>

      {/* EMPTY STATE */}
      {cart.length === 0 ? (
        <div className="text-center mt-24">

          <p className="text-lg font-light text-gray-700">
            Корзина пустая
          </p>

          <p className="text-sm text-gray-400 mt-2">
            Добавьте товары из каталога
          </p>

          <button
            onClick={() => (window.location.href = "/")}
            className="mt-6 bg-black text-white px-6 py-3 rounded-xl"
          >
            Перейти в каталог
          </button>

        </div>
      ) : (
        <>
          {/* ITEMS */}
          {cart.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-2xl mb-3">

              <h2 className="font-medium">{item.name}</h2>

              <p className="text-sm text-gray-500 mt-1">
                {item.price} ₽
              </p>

              {/* QTY */}
              <div className="flex items-center gap-3 mt-3">

                <button
                  onClick={() => changeQty(index, "dec")}
                  className="px-3 py-1 border rounded"
                >
                  -
                </button>

                <span className="font-medium">
                  {item.qty || 1}
                </span>

                <button
                  onClick={() => changeQty(index, "inc")}
                  className="px-3 py-1 border rounded"
                >
                  +
                </button>

                <button
                  onClick={() => removeItem(index)}
                  className="ml-auto text-red-500 text-sm"
                >
                  удалить
                </button>

              </div>
            </div>
          ))}

          {/* TOTAL + PAY */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">

            <div className="flex justify-between mb-3">
              <span className="text-gray-600">Итого</span>
              <span className="font-bold">{total} ₽</span>
            </div>

            <button
              onClick={async () => {
                try {
                  const res = await fetch("http://localhost:5000/create-payment", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ amount: total }),
                  });

                  const data = await res.json();

                  if (data.url) {
                    window.location.href = data.url;
                  } else {
                    alert("Ошибка оплаты");
                  }
                } catch (err) {
                  alert("Ошибка соединения с сервером");
                }
              }}
              className="w-full bg-black text-white py-3 rounded-xl"
            >
              Оформить заказ
            </button>

          </div>
        </>
      )}

    </main>
  );
}