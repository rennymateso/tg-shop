import { createClient } from "@supabase/supabase-js";
import HomePageClient, { HomeProduct } from "./HomePageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  category: HomeProduct["category"];
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

type BrandRow = {
  id: string;
  name: string;
  created_at: string;
};

type BadgeRow = {
  id: string;
  name: string;
  created_at: string;
};

function mapRowToProduct(row: ProductRow): HomeProduct {
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
  const safeImages = defaultImages.length > 0 ? defaultImages : [fallbackImage];

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: row.price,
    oldPrice: row.old_price || null,
    badge: row.badge || "",
    image: fallbackImage,
    images: safeImages,
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

export default async function Page() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const [{ data: productsData }, { data: brandsData }, { data: badgesData }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("status", "Активен")
        .order("created_at", { ascending: false }),
      supabase
        .from("brands")
        .select("*")
        .order("name", { ascending: true }),
      supabase
        .from("badges")
        .select("*")
        .order("name", { ascending: true }),
    ]);

  const initialProducts = ((productsData || []) as ProductRow[]).map(mapRowToProduct);
  const initialBrands = (brandsData || []) as BrandRow[];
  const initialBadges = (badgesData || []) as BadgeRow[];

  return (
    <HomePageClient
      initialProducts={initialProducts}
      initialBrands={initialBrands}
      initialBadges={initialBadges}
    />
  );
}