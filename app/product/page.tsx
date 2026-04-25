import { createClient } from "@supabase/supabase-js";
import ProductPageClient, { Product } from "./ProductPageClient";

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  category: Product["category"];
  price: number;
  old_price: number;
  badge: string | null;
  status: "Активен" | "Скрыт";
  description: string;
  article: string;
  sizes: string[] | null;
  colors: string[] | null;
  image: string | null;
  color_images: Record<string, string[]> | null;
  created_at: string;
  updated_at: string;
};

function mapRowToProduct(row: ProductRow): Product {
  const galleryByColor: Record<string, string[]> = {};
  const normalizedColorImages: Record<string, string> = {};

  if (row.color_images && typeof row.color_images === "object") {
    Object.entries(row.color_images).forEach(([color, images]) => {
      const safeImages = Array.isArray(images)
        ? images.filter((img) => typeof img === "string" && img.trim().length > 0)
        : [];

      if (safeImages.length > 0) {
        galleryByColor[color] = safeImages;
        normalizedColorImages[color] = safeImages[0];
      }
    });
  }

  const safeColors = Array.isArray(row.colors) ? row.colors : [];
  const defaultColor = safeColors[0] || Object.keys(galleryByColor)[0] || "Черный";
  const defaultImages = galleryByColor[defaultColor] || [];

  const safeRowImage =
    typeof row.image === "string" && row.image.trim().length > 0
      ? row.image.trim()
      : "";

  const fallbackImage = safeRowImage || defaultImages[0] || "/products/product-1.jpg";

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: row.price,
    oldPrice: row.old_price || null,
    badge: row.badge || "",
    image: fallbackImage,
    images: defaultImages.length ? defaultImages : [fallbackImage],
    colorImages: normalizedColorImages,
    galleryByColor,
    defaultColor,
    type:
      row.category === "Джинсы" || row.category === "Брюки"
        ? "bottom"
        : "top",
    category: row.category,
    colors: safeColors,
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    description: row.description || "",
  };
}

export default async function ProductPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const id = String(params?.id || "").trim();

  if (!id) {
    return <ProductPageClient initialProduct={null} initialError="Не передан id товара" />;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return <ProductPageClient initialProduct={null} initialError={error.message} />;
  }

  if (!data) {
    return (
      <ProductPageClient
        initialProduct={null}
        initialError={`Товар с id ${id} не найден`}
      />
    );
  }

  const initialProduct = mapRowToProduct(data as ProductRow);

  return <ProductPageClient initialProduct={initialProduct} initialError="" />;
}