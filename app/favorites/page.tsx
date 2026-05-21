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

type FavoriteItem = {
  id: string;
  color: string;
};

type FavoriteProductCard = {
  product: Product;
  color: string;
  storageColor: string;
  image: string;
  favoriteKey: string;
};

function normalizeFavoriteItems(data: unknown): FavoriteItem[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      if (typeof item === "string") {
        return { id: item, color: "" };
      }

      if (
        item &&
        typeof item === "object" &&
        "id" in item &&
        typeof item.id === "string"
      ) {
        return {
          id: item.id,
          color:
            "color" in item && typeof item.color === "string"
              ? item.color
              : "",
        };
      }

      return null;
    })
    .filter(Boolean) as FavoriteItem[];
}

function syncFavoriteStorage(items: FavoriteItem[]) {
  const uniqueItems = items.filter(
    (item, index, array) =>
      array.findIndex(
        (current) => current.id === item.id && current.color === item.color
      ) === index
  );

  const uniqueIds = Array.from(new Set(uniqueItems.map((item) => item.id)));

  localStorage.setItem("favorite_items", JSON.stringify(uniqueItems));
  localStorage.setItem("favorites", JSON.stringify(uniqueIds));

  return uniqueItems;
}

function getFavoriteProductImage(product: Product, color: string) {
  return (
    (color ? product.colorImages?.[color] : "") ||
    product.image ||
    product.images?.[0] ||
    "/products/product-1.jpg"
  );
}

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
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [viewedProducts, setViewedProducts] = useState<Product[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const favoriteIdsData = JSON.parse(localStorage.getItem("favorites") || "[]");
    const favoriteItemsData = JSON.parse(
      localStorage.getItem("favorite_items") || "[]"
    );

    const normalizedItems = normalizeFavoriteItems(favoriteItemsData);
    const fallbackItems = normalizeFavoriteItems(favoriteIdsData);

    const nextItems =
      normalizedItems.length > 0
        ? normalizedItems
        : fallbackItems.map((item) => ({
            id: item.id,
            color: "",
          }));

    const syncedItems = syncFavoriteStorage(nextItems);

    setFavoriteItems(syncedItems);
    setFavoriteIds(Array.from(new Set(syncedItems.map((item) => item.id))));

    try {
      const viewed = JSON.parse(localStorage.getItem("viewed-products") || "[]");
      setViewedProducts(Array.isArray(viewed) ? viewed : []);
    } catch {
      setViewedProducts([]);
    }
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

  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const previousViewport = viewport?.getAttribute("content") || "";

    viewport?.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover"
    );

    const preventGesture = (event: Event) => {
      event.preventDefault();
    };

    const preventMultiTouch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };

    let lastTouchEnd = 0;

    const preventDoubleTapZoom = (event: TouchEvent) => {
      const now = Date.now();

      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }

      lastTouchEnd = now;
    };

    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("gesturechange", preventGesture);
    document.addEventListener("gestureend", preventGesture);
    document.addEventListener("touchmove", preventMultiTouch, { passive: false });
    document.addEventListener("touchend", preventDoubleTapZoom, { passive: false });

    return () => {
      if (viewport) viewport.setAttribute("content", previousViewport);

      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchmove", preventMultiTouch);
      document.removeEventListener("touchend", preventDoubleTapZoom);
    };
  }, []);

  const favoriteProducts = useMemo<FavoriteProductCard[]>(() => {
    return favoriteItems
      .map((item) => {
        const product = productsMap[item.id];

        if (!product) return null;

        const color = item.color || product.colors?.[0] || "";

        return {
          product,
          color,
          storageColor: item.color,
          image: getFavoriteProductImage(product, color),
          favoriteKey: `${product.id}-${item.color || color || "default"}`,
        };
      })
      .filter(Boolean) as FavoriteProductCard[];
  }, [favoriteItems, productsMap]);

  const recommendedProducts = useMemo(() => {
    const allProducts = Object.values(productsMap);
    const favoriteProductsSet = new Set(favoriteIds);

    const interestBrands = new Set<string>();
    const interestCategories = new Set<string>();

    viewedProducts.forEach((product) => {
      if (product.brand) interestBrands.add(product.brand);
      if (product.category) interestCategories.add(product.category);
    });

    allProducts.forEach((product) => {
      if (favoriteIds.includes(product.id)) {
        if (product.brand) interestBrands.add(product.brand);
        if (product.category) interestCategories.add(product.category);
      }
    });

    const scored = allProducts
      .filter((product) => !favoriteProductsSet.has(product.id))
      .map((product) => {
        let score = 0;

        if (interestBrands.has(product.brand)) score += 3;
        if (interestCategories.has(product.category)) score += 2;
        if (product.badge === "Скидка") score += 1;

        return { product, score };
      })
      .sort((a, b) => b.score - a.score);

    const personalized = scored.filter((item) => item.score > 0).map((item) => item.product);
    const fallback = scored.map((item) => item.product);

    return (personalized.length > 0 ? personalized : fallback).slice(0, 10);
  }, [favoriteIds, productsMap, viewedProducts]);

  const toggleFavorite = (id: string, color: string) => {
    const updatedItems = favoriteItems.filter(
      (item) => !(item.id === id && item.color === color)
    );

    const syncedItems = syncFavoriteStorage(updatedItems);

    setFavoriteItems(syncedItems);
    setFavoriteIds(Array.from(new Set(syncedItems.map((item) => item.id))));
    window.dispatchEvent(new Event("favorites-updated"));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&display=swap');

        .favorites-onest {
          font-family: 'Onest', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }

        html,
        body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          overscroll-behavior: none;
          -webkit-text-size-adjust: 100%;
          touch-action: pan-y;
        }

        .favorites-fixed-page {
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

        .no-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <main className="favorites-onest favorites-fixed-page bg-[#F5F5F5] px-3 pt-[76px] pb-32">
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
        <div className="grid grid-cols-2 gap-3">
          {favoriteProducts.map(({ product: p, color, storageColor, image, favoriteKey }) => {
            const discountPercent = getDiscountPercent(p.oldPrice, p.price);

            return (
              <div
                key={favoriteKey}
                onClick={() => router.push(`/product?id=${p.id}`)}
                className="cursor-pointer overflow-hidden rounded-[20px] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.05)] transition-all duration-300 active:scale-[0.985]"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[#EAEAEA]">
                  <img
                    src={image}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/products/product-1.jpg";
                    }}
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(p.id, storageColor);
                    }}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur"
                    aria-label="Убрать из избранного"
                  >
                    <HeartRemoveIcon />
                  </button>
                </div>

                <div className="flex flex-col p-3">
                  <div className="truncate text-[9px] font-normal uppercase tracking-[0.18em] text-[#aaa]">
                    {p.brand}
                  </div>

                  <h3 className="mt-1 line-clamp-2 text-[14px] font-medium leading-[1.2] tracking-[-0.02em] text-black">
                    {p.name}
                  </h3>

                  {color && (
                    <div className="mt-1 truncate text-[11px] text-gray-400">
                      Цвет: {color}
                    </div>
                  )}

                  <div className="mt-2 flex items-baseline gap-[5px] whitespace-nowrap">
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recommendedProducts.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-[18px] font-medium text-black">
            Вам может понравиться
          </h2>

          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {recommendedProducts.map((p) => {
              const discountPercent = getDiscountPercent(p.oldPrice, p.price);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => router.push(`/product?id=${p.id}`)}
                  className="w-[142px] shrink-0 text-left"
                >
                  <div className="overflow-hidden rounded-[18px] bg-[#EFEFEF]">
                    <div className="aspect-[3/4]">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/products/product-1.jpg";
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="truncate text-[9px] font-normal uppercase tracking-[0.18em] text-[#aaa]">
                      {p.brand}
                    </div>

                    <div className="mt-1 line-clamp-2 text-[14px] font-medium leading-[1.2] tracking-[-0.02em] text-black">
                      {p.name}
                    </div>
                  </div>

                  <div className="mt-2 flex items-baseline gap-[5px] whitespace-nowrap">
                    {p.oldPrice ? (
                      <span className="text-[11px] font-normal leading-none text-[#999] line-through">
                        {formatPrice(p.oldPrice)} ₽
                      </span>
                    ) : null}

                    {discountPercent > 0 ? (
                      <span className="text-[11px] font-semibold leading-none text-[#e13a3a]">
                        −{discountPercent}%
                      </span>
                    ) : null}

                    <span className="text-[16px] font-bold leading-none tracking-[-0.035em] text-[#16A34A]">
                      {formatPrice(p.price)} ₽
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <BottomNav />
      </main>
    </>
  );
}