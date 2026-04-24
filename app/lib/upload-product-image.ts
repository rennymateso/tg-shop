import { supabase } from "./supabase";

const BUCKET_NAME = "rennymateso";

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

export async function uploadProductImage(
  file: File,
  productId: string,
  color: string
) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
  const safeColor = color.toLowerCase().replace(/\s+/g, "-");
  const filePath = `${productId}/${safeColor}/${Date.now()}-${safeName}.${ext}`;

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