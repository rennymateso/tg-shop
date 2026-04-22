export type AdminProductStatus = "Активен" | "Скрыт";

export type AdminProductBadge =
  | "Без бейджа"
  | "Новинка"
  | "Скидка"
  | "В наличии"
  | "Из-за рубежа";

export type AdminProductCategory =
  | "Футболки"
  | "Поло"
  | "Джинсы"
  | "Брюки"
  | "Костюмы";

export type AdminProduct = {
  id: string;
  name: string;
  brand: string;
  category: AdminProductCategory;
  price: number;
  oldPrice: number;
  badge: AdminProductBadge;
  status: AdminProductStatus;
  description: string;
  article: string;
  sizes: string[];
  colors: string[];
  image: string;
  colorImages: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
};