"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: string;
  name: string;
  price: number;
  size?: string;
  color?: string;
};

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(data);
  }, []);

  const removeItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const submitOrder = () => {
    if (!name || !phone) {
      alert("Введите имя и телефон");
      return;
    }

    const order = {
      name,
      phone,
      items: cart,
      total,
    };

    console.log("ORDER:", order);

    alert("Заказ оформлен!");

    localStorage.removeItem("cart");
    setCart([]);
    setShowCheckout(false);

    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] p-4 pb-24">

      {/* HEADER */}
      <h1 className="text-xl font-semibold mb-4">
        Корзина
      </h1>

      {/* EMPTY */}
      {cart.length === 0 && (
        <div className="bg-white p-6 rounded-2xl text-center">

          <p className="text-gray-500">
            Корзина пустая
          </p>

          <p className="text-sm text-gray-400 mt-2">
            Добавьте товары из каталога
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-black text-white px-4 py-2 rounded-xl"
          >
            Перейти в каталог
          </button>

        </div>
      )}

      {/* ITEMS */}
      <div className="space-y-3">
        {cart.map((item, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl">

            <h2 className="font-medium">{item.name}</h2>

            <p className="text-sm text-gray-500 mt-1">
              {item.size && `Размер: ${item.size}`}{" "}
              {item.color && `| Цвет: ${item.color}`}
            </p>

            <div className="flex justify-between items-center mt-2">
              <span className="font-bold">{item.price} ₽</span>

              <button
                onClick={() => removeItem(i)}
                className="text-red-500 text-sm"
              >
                удалить
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* TOTAL BUTTON */}
      {cart.length > 0 && !showCheckout && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4">

          <div className="flex justify-between mb-2">
            <span>Итого:</span>
            <span className="font-bold">{total} ₽</span>
          </div>

          <button
            onClick={() => setShowCheckout(true)}
            className="w-full bg-black text-white py-3 rounded-xl"
          >
            Оформить заказ
          </button>

        </div>
      )}

      {/* CHECKOUT FORM */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-end">

          <div className="bg-white w-full p-4 rounded-t-2xl">

            <h2 className="text-lg font-semibold mb-3">
              Оформление заказа
            </h2>

            <input
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-gray-100 rounded-xl mb-2"
            />

            <input
              placeholder="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 bg-gray-100 rounded-xl mb-4"
            />

            <div className="flex gap-2">

              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 bg-gray-200 py-3 rounded-xl"
              >
                Назад
              </button>

              <button
                onClick={submitOrder}
                className="flex-1 bg-black text-white py-3 rounded-xl"
              >
                Подтвердить
              </button>

            </div>

          </div>

        </div>
      )}

      {/* BOTTOM MENU */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 text-sm">

        <button onClick={() => router.push("/")}>
          Главная
        </button>

        <button onClick={() => router.push("/favorites")}>
          Избранное
        </button>

        <button onClick={() => router.push("/cart")}>
          Корзина
        </button>

        <button onClick={() => router.push("/profile")}>
          Профиль
        </button>

      </div>

    </main>
  );
}