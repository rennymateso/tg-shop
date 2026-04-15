"use client";



export default function ProductPage() {
  const router = useRouter();
 
  const id = searchParams.get("id");

  const products: any = {
    1: { name: "Футболка Premium", price: 3500 },
    2: { name: "Поло Classic", price: 4500 },
    3: { name: "Джинсы Slim", price: 6500 },
  };

  const product = id ? products[id as keyof typeof products] : null;

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    cart.push({
      id,
      name: product.name,
      price: product.price,
      qty: 1,
    });

    localStorage.setItem("cart", JSON.stringify(cart));

    router.push("/cart");
  };

  if (!id || !product) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Товар не найден
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] p-4">

      <button onClick={() => router.back()}>
        ← Назад
      </button>

      <div className="mt-6 bg-white p-4 rounded-2xl">

        <div className="h-64 bg-gray-100 rounded-xl mb-4" />

        <h1 className="text-xl font-light">{product.name}</h1>

        <p className="text-lg font-bold mt-2">
          {product.price} ₽
        </p>

        <button
          onClick={addToCart}
          className="w-full mt-6 bg-black text-white py-3 rounded-xl"
        >
          В корзину
        </button>

      </div>
    </main>
  );
}