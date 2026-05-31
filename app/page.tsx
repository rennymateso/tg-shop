import HomePageClient, { HomeProduct } from "./HomePageClient";
import { products as fallbackProducts } from "./data/products";

function mapFallbackProduct(product: (typeof fallbackProducts)[number]): HomeProduct {
  const galleryByColor = Object.fromEntries(
    Object.entries(product.colorImages || {}).map(([color, image]) => [
      color,
      [image],
    ])
  );

  return {
    ...product,
    galleryByColor,
    defaultColor: product.colors[0] || "",
  };
}

export default function Page() {
  const initialProducts = fallbackProducts.map(mapFallbackProduct);
  const initialBrands = Array.from(
    new Set(initialProducts.map((product) => product.brand))
  ).map((name) => ({ id: name, name, created_at: "" }));
  const initialBadges = Array.from(
    new Set(initialProducts.map((product) => product.badge).filter(Boolean))
  ).map((name) => ({ id: name, name, created_at: "" }));

  return (
    <HomePageClient
      initialProducts={initialProducts}
      initialBrands={initialBrands}
      initialBadges={initialBadges}
    />
  );
}
