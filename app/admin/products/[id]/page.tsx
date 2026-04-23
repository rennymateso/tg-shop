"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ProductStatus = "Активен" | "Скрыт";
type BadgeType =
  | "Без бейджа"
  | "Новинка"
  | "Скидка"
  | "В наличии"
  | "Из-за рубежа";

type ProductCategory =
  | "Футболки"
  | "Поло"
  | "Джинсы"
  | "Брюки"
  | "Костюмы";

type AdminProduct = {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  oldPrice: number;
  badge: BadgeType;
  status: ProductStatus;
  description: string;
  article: string;
  sizes: string[];
  colors: string[];
  image: string;
  colorImages: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "admin_products";

const badgeOptions: BadgeType[] = [
  "Без бейджа",
  "Новинка",
  "Скидка",
  "В наличии",
  "Из-за рубежа",
];

const statusOptions: ProductStatus[] = ["Активен", "Скрыт"];

const categoryOptions: ProductCategory[] = [
  "Футболки",
  "Поло",
  "Джинсы",
  "Брюки",
  "Костюмы",
];

function getAdminProducts(): AdminProduct[] {
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

function saveAdminProducts(products: AdminProduct[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function getAdminProductById(id: string) {
  return getAdminProducts().find((item) => item.id === id) || null;
}

function updateAdminProduct(id: string, nextProduct: AdminProduct) {
  const current = getAdminProducts();
  const updated = current.map((item) => (item.id === id ? nextProduct : item));
  saveAdminProducts(updated);
}

function deleteAdminProduct(id: string) {
  const current = getAdminProducts();
  const filtered = current.filter((item) => item.id !== id);
  saveAdminProducts(filtered);
}

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setProduct(getAdminProductById(id));
  }, [id]);

  const discountPercent = useMemo(() => {
    if (!product) return 0;
    if (product.oldPrice <= product.price) return 0;
    return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  }, [product]);

  const saveChanges = () => {
    if (!product) return;

    updateAdminProduct(id, {
      ...product,
      updatedAt: new Date().toLocaleString("ru-RU"),
    });

    setMessage("Изменения сохранены.");
  };

  const handleDelete = () => {
    deleteAdminProduct(id);
    router.push("/admin/products");
    router.refresh();
  };

  if (!product) {
    return (
      <div className="rounded-[24px] bg-white p-6 text-sm text-gray-500 shadow-sm">
        Товар не найден
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Админ-панель</p>
          <h1 className="text-2xl font-semibold text-black">Редактировать товар</h1>
          <p className="mt-1 text-sm text-gray-400">{product.id}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/admin/products"
            className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-medium text-gray-700 shadow-sm"
          >
            Назад
          </Link>

          <button
            onClick={handleDelete}
            className="rounded-2xl bg-red-50 px-5 py-3 text-sm font-medium text-red-600"
          >
            Удалить
          </button>

          <button
            onClick={saveChanges}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Сохранить
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-[24px] bg-white p-4 text-sm text-black shadow-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <section className="rounded-[28px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-black">Основные данные</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-gray-500">Название</label>
              <input
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">Бренд</label>
              <input
                value={product.brand}
                onChange={(e) => setProduct({ ...product, brand: e.target.value })}
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">Категория</label>
              <select
                value={product.category}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    category: e.target.value as ProductCategory,
                  })
                }
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              >
                {categoryOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">Цена</label>
              <input
                value={product.price}
                onChange={(e) =>
                  setProduct({ ...product, price: Number(e.target.value || 0) })
                }
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">Старая цена</label>
              <input
                value={product.oldPrice}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    oldPrice: Number(e.target.value || 0),
                  })
                }
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">Бейдж</label>
              <select
                value={product.badge}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    badge: e.target.value as BadgeType,
                  })
                }
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              >
                {badgeOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">Статус</label>
              <select
                value={product.status}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    status: e.target.value as ProductStatus,
                  })
                }
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              >
                {statusOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-gray-500">Описание</label>
              <textarea
                value={product.description}
                onChange={(e) =>
                  setProduct({ ...product, description: e.target.value })
                }
                rows={5}
                className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
              />
            </div>
          </div>
        </section>

        <aside className="rounded-[28px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-black">Предпросмотр</h2>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-black/5 bg-[#FAFAFA]">
            <div className="aspect-[3/4] bg-[#ECECEC]">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            <div className="p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                {product.brand}
              </p>

              <h3 className="mt-2 text-[16px] font-medium text-black">
                {product.name}
              </h3>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-400 line-through">
                  {product.oldPrice} ₽
                </span>

                <span className="text-[18px] font-semibold text-[#16A34A]">
                  {product.price} ₽
                </span>

                {discountPercent > 0 && (
                  <span className="rounded-full bg-[#E8F7EE] px-2 py-0.5 text-xs text-[#16A34A]">
                    -{discountPercent}%
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    product.badge === "Из-за рубежа"
                      ? "bg-black text-white"
                      : "bg-[#F5F5F5] text-gray-700"
                  }`}
                >
                  {product.badge}
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    product.status === "Активен"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {product.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>Артикул: {product.article}</p>
                <p>Размеров: {product.sizes.length}</p>
                <p>Цветов: {product.colors.length}</p>
                <p>Обновлен: {product.updatedAt}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}