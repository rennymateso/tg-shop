"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";
import { FavoritesPageSkeleton } from "../components/PageSkeletons";

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

function formatPrice(value: number | null | undefined) {
  if (!value) return "";
  return value.toLocaleString("ru-RU");
}

function HeartRemoveIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6c-1.8-1.8-4.7-1.8-6.5 0L12 6.9 9.7 4.6c-1.8-1.8-4.7-1.8-6.5 0s-1.8 4.7 0 6.5L12 21l8.8-9.9c1.8-1.8 1.8-4.7 0-6.5Z" />
    </svg>
  );
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

export default function FavoritesPage() {
  const router = useRouter();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavoriteIds(Array.isArray(saved) ? saved : []);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);

      const { data, error } = await supabase.from("products").select("*");

      if (error) {
        console.error("Ошибка загрузки товаров для избранного:", error.message);
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPageReady(true);
    }, 250);

    return () => window.clearTimeout(timer);
  }, []);

  const favoriteProducts = useMemo(
    () =>
      Object.values(productsMap).filter((product) =>
        favoriteIds.includes(product.id)
      ),
    [favoriteIds, productsMap]
  );

  const toggleFavorite = (id: string) => {
    const updated = favoriteIds.includes(id)
      ? favoriteIds.filter((item) => item !== id)
      : [...favoriteIds, id];

    setFavoriteIds(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
    window.dispatchEvent(new Event("favorites-updated"));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&display=swap');

        .favorites-onest {
          font-family: 'Onest', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
      `}</style>

      <main className="favorites-onest min-h-screen bg-[#F5F5F5] px-4 pt-[76px] pb-32">
      <div className="mb-5 flex items-center justify-center">
        <h1 className="text-[20px] font-medium">Избранное</h1>
      </div>

      {!pageReady || loadingProducts ? (
        <FavoritesPageSkeleton />
      ) : favoriteProducts.length === 0 ? (
        <div className="rounded-[24px] bg-white p-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
          <p className="text-[16px] font-medium text-black">Избранное пусто</p>
          <p className="mt-2 text-sm text-gray-400">
            Добавьте товары, чтобы вернуться к ним позже
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {favoriteProducts.map((p) => {
            const discountPercent = getDiscountPercent(p.oldPrice, p.price);

            return (
              <div
                key={p.id}
                className="rounded-[22px] bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
              >
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/product?id=${p.id}`)}
                    className="aspect-[3/4] w-[82px] shrink-0 overflow-hidden rounded-[16px] bg-[#ECECEC]"
                    aria-label="Открыть товар"
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/products/product-1.jpg";
                      }}
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/product?id=${p.id}`)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="mb-1 truncate text-[9px] font-normal uppercase tracking-[0.18em] text-[#aaa]">
                          {p.brand}
                        </div>

                        <h2 className="line-clamp-2 text-[15px] font-medium leading-[1.2] tracking-[-0.02em] text-black">
                          {p.name}
                        </h2>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleFavorite(p.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6F6F6] text-black"
                        aria-label="Убрать из избранного"
                      >
                        <HeartRemoveIcon />
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-[#F3F3F3] px-2 py-1 text-[10px] text-gray-600">
                        {p.category}
                      </span>

                      {p.badge && (
                        <span className="rounded-full bg-[#F3F3F3] px-2 py-1 text-[10px] text-gray-600">
                          {p.badge}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-baseline gap-[5px] whitespace-nowrap">
                      {p.oldPrice && (
                        <span className="text-[11px] font-normal leading-none text-[#999] line-through">
                          {formatPrice(p.oldPrice)} ₽
                        </span>
                      )}

                      {discountPercent > 0 && (
                        <span className="text-[11px] font-semibold leading-none text-[#e13a3a]">
                          −{discountPercent}%
                        </span>
                      )}

                      <span className="text-[16px] font-bold leading-none tracking-[-0.035em] text-[#16A34A]">
                        {formatPrice(p.price)} ₽
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push(`/product?id=${p.id}`)}
                      className="mt-3 w-full rounded-2xl bg-black py-2.5 text-[13px] font-medium text-white"
                    >
                      Открыть товар
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
      </main>
    </>
  );
}