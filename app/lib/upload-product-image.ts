import { supabase } from "./supabase";

const BUCKET_NAME = "rennymateso";

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

function slugifyColor(color: string) {
  const map: Record<string, string> = {
    "черный": "black",
    "белый": "white",
    "серый": "gray",
    "синий": "blue",
    "бежевый": "beige",
    "зеленый": "green",
    "коричневый": "brown",
  };

  const normalized = color.trim().toLowerCase();
  return map[normalized] || normalized.replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
}

export async function uploadProductImage(
  file: File,
  productId: string,
  color: string
) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
  const safeProductId = productId
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
  const safeColor = slugifyColor(color);

  const filePath = `${safeProductId}/${safeColor}/${Date.now()}-${safeName}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return data.publicUrl;
}