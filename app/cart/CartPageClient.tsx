"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";

type CartItem = {
  id: string;
  name: string;
  price: number;
  size?: string;
  color?: string;
  quantity?: number;
};

type ProductBadge = "Новинка" | "Скидка" | "В наличии" | "Из-за рубежа";
type ProductCategory = "Футболки" | "Поло" | "Джинсы" | "Брюки" | "Костюмы";
type ProductBrand =
  | "Lacoste"
  | "Polo Ralph Lauren"
  | "Tommy Hilfiger"
  | "Calvin Klein"
  | "GANT"
  | "BOSS"
  | "Emporio Armani"
  | "Armani Exchange"
  | "Beymen Club"
  | "Loro Piana"
  | "Brunello Cucinelli"
  | "BORZ"
  | "Massimo Carino"
  | "Другие бренды";

type Product = {
  id: string;
  name: string;
  brand: ProductBrand;
  price: number;
  oldPrice: number | null;
  badge: ProductBadge;
  image: string;
  images: string[];
  colorImages?: Record<string, string>;
  type: "top" | "bottom";
  category: ProductCategory;
  colors: string[];
  sizes: string[];
  description: string;
};

type ProductRow = {
  id: string;
  name: string;
  brand: ProductBrand;
  category: ProductCategory;
  price: number;
  old_price: number;
  badge: ProductBadge;
  status: "Активен" | "Скрыт";
  description: string;
  article: string;
  sizes: string[] | null;
  colors: string[] | null;
  image: string;
  color_images: Record<string, string[]> | null;
  created_at: string;
  updated_at: string;
};

function getDiscountPercent(oldPrice: number | null, price: number) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function mapRowToProduct(row: ProductRow): Product {
  const normalizedColorImages: Record<string, string> = {};

  if (row.color_images && typeof row.color_images === "object") {
    Object.entries(row.color_images).forEach(([color, images]) => {
      if (Array.isArray(images) && images.length > 0) {
        normalizedColorImages[color] = images[0];
      }
    });
  }

  const galleryFromDb =
    row.color_images && typeof row.color_images === "object"
      ? Object.values(row.color_images)
          .filter((value) => Array.isArray(value))
          .flat()
      : [];

  const uniqueImages = Array.from(
    new Set([row.image, ...galleryFromDb].filter(Boolean))
  );

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: row.price,
    oldPrice: row.old_price || null,
    badge: row.badge,
    image: row.image || uniqueImages[0] || "/products/product-1.jpg",
    images:
      uniqueImages.length > 0
        ? uniqueImages
        : [row.image || "/products/product-1.jpg"],
    colorImages: normalizedColorImages,
    type:
      row.category === "Джинсы" || row.category === "Брюки"
        ? "bottom"
        : "top",
    category: row.category,
    colors: Array.isArray(row.colors) ? row.colors : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    description: row.description || "",
  };
}

export default function CartPageClient() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(data);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);

      const { data, error } = await supabase.from("products").select("*");

      if (error) {
        console.error("Ошибка загрузки товаров для корзины:", error.message);
        setProductsMap({});
        setLoadingProducts(false);
        return;
      }

      const mapped = ((data || []) as ProductRow[]).map(mapRowToProduct);
      const nextMap: Record<string, Product> = {};

      mapped.forEach((product) => {
        nextMap[product.id] = product;
      });

      setProductsMap(nextMap);
      setLoadingProducts(false);
    };

    loadProducts();
  }, []);

  const removeItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.price * (item.quantity ? item.quantity : 1),
        0
      ),
    [cart]
  );

  const totalOld = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const product = productsMap[item.id];
        const quantity = item.quantity || 1;
        const oldPrice = product?.oldPrice ?? item.price;
        return sum + oldPrice * quantity;
      }, 0),
    [cart, productsMap]
  );

  const getProductById = (id: string) => {
    return productsMap[id];
  };

  const goToCheckout = () => {
    router.push("/checkout");
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-5 pb-32">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-white px-4 py-2 text-sm text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-transform duration-200 active:scale-95"
        >
          ← Назад
        </button>

        <h1 className="text-[20px] font-medium">Корзина</h1>

        <button onClick={clearCart} className="text-xs text-gray-400">
          очистить
        </button>
      </div>

      {cart.length === 0 && (
        <div className="rounded-[24px] bg-white p-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F3F3]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="1.6"
            >
              <path d="M6 6h15l-1.5 9h-12z" />
              <path d="M6 6L5 3H2" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
          </div>

          <p className="mt-4 text-[16px] font-medium text-black">
            Корзина пустая
          </p>

          <p className="mt-2 text-sm text-gray-400">
            Добавьте товары из каталога
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition-transform duration-200 active:scale-[0.99]"
          >
            Перейти в каталог
          </button>
        </div>
      )}

      {cart.length > 0 && (
        <div className="space-y-4">
          {loadingProducts && (
            <div className="rounded-[24px] bg-white p-4 text-sm text-gray-500 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
              Обновляем данные товаров...
            </div>
          )}

          {cart.map((item, i) => {
            const product = getProductById(item.id);
            const quantity = item.quantity || 1;
            const oldUnitPrice = product?.oldPrice ?? item.price;
            const discountPercent = getDiscountPercent(product?.oldPrice ?? null, item.price);

            return (
              <div
                key={`${item.id}-${item.size}-${item.color}-${i}`}
                className="rounded-[24px] bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.05)]"
              >
                <div className="flex gap-4">
                  <div className="aspect-[3/4] w-[88px] shrink-0 overflow-hidden rounded-[18px] bg-[#ECECEC]">
                    <img
                      src={product?.image || "/products/product-1.jpg"}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-gray-400">
                          {product?.brand || "MONTREAUX"}
                        </div>

                        <h2 className="text-[15px] font-medium leading-[1.3] text-black">
                          {item.name}
                        </h2>
                      </div>

                      <button
                        onClick={() => removeItem(i)}
                        className="whitespace-nowrap text-xs text-gray-400"
                      >
                        удалить
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.size && (
                        <span className="rounded-full bg-[#F3F3F3] px-2.5 py-1 text-[11px] text-gray-600">
                          Размер: {item.size}
                        </span>
                      )}

                      {item.color && (
                        <span className="rounded-full bg-[#F3F3F3] px-2.5 py-1 text-[11px] text-gray-600">
                          Цвет: {item.color}
                        </span>
                      )}

                      <span className="rounded-full bg-[#F3F3F3] px-2.5 py-1 text-[11px] text-gray-600">
                        Кол-во: {quantity}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {oldUnitPrice > item.price && (
                          <span className="text-[13px] text-gray-400 line-through">
                            {oldUnitPrice * quantity} ₽
                          </span>
                        )}

                        <span className="text-[16px] font-semibold tracking-[-0.02em] text-[#16A34A]">
                          {item.price * quantity} ₽
                        </span>

                        {discountPercent > 0 && (
                          <span className="rounded-full bg-[#E8F7EE] px-1.5 py-0.5 text-[10px] font-medium text-[#16A34A]">
                            -{discountPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="rounded-[24px] border border-white bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Итого</span>

              <div className="flex items-center gap-2">
                {totalOld > total && (
                  <span className="text-[13px] text-gray-400 line-through">
                    {totalOld} ₽
                  </span>
                )}

                <span className="text-[18px] font-semibold tracking-[-0.02em] text-[#16A34A]">
                  {total} ₽
                </span>
              </div>
            </div>

            <button
              onClick={goToCheckout}
              className="w-full rounded-2xl bg-black py-3.5 text-sm font-medium text-white"
            >
              Оформить заказ
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}