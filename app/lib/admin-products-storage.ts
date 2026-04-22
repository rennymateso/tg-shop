import { AdminProduct } from "../types/admin-product";

const STORAGE_KEY = "admin_products";

export function getAdminProducts(): AdminProduct[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAdminProducts(products: AdminProduct[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function createAdminProductId() {
  return `P-${Date.now()}`;
}

export function getAdminProductById(id: string) {
  return getAdminProducts().find((item) => item.id === id) || null;
}

export function addAdminProduct(product: AdminProduct) {
  const current = getAdminProducts();
  saveAdminProducts([product, ...current]);
}

export function updateAdminProduct(id: string, nextProduct: AdminProduct) {
  const current = getAdminProducts();
  const updated = current.map((item) => (item.id === id ? nextProduct : item));
  saveAdminProducts(updated);
}

export function deleteAdminProduct(id: string) {
  const current = getAdminProducts();
  saveAdminProducts(current.filter((item) => item.id !== id));
}