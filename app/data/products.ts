export type Product = {
  id: string;
  name: string;
  brand:
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
    | "Massimo Carino";
  price: number;
  oldPrice: number | null;
  badge: "Новинка" | "Скидка" | "В наличии" | "Из-за рубежа";
  image: string;
  type: "top" | "bottom";
  category: "Футболки" | "Поло" | "Джинсы" | "Брюки" | "Костюмы";
  colors: string[];
  sizes: string[];
  description: string;
};

export const products: Product[] = [
  {
    id: "1",
    name: "Поло Premium",
    brand: "Lacoste",
    price: 3500,
    oldPrice: 4500,
    badge: "Новинка",
    image: "/products/product-1.jpg",
    type: "top",
    category: "Поло",
    colors: ["Черный", "Белый", "Серый"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Премиальное мужское поло из мягкого хлопка. Минималистичный силуэт и комфортная посадка на каждый день.",
  },
  {
    id: "2",
    name: "Поло Classic",
    brand: "Polo Ralph Lauren",
    price: 3900,
    oldPrice: 4900,
    badge: "Скидка",
    image: "/products/product-2.jpg",
    type: "top",
    category: "Поло",
    colors: ["Белый", "Синий"],
    sizes: ["M", "L", "XL"],
    description:
      "Классическое поло в лаконичном стиле. Подходит для повседневных и более собранных образов.",
  },
  {
    id: "3",
    name: "Поло Black",
    brand: "BORZ",
    price: 5200,
    oldPrice: 6500,
    badge: "В наличии",
    image: "/products/product-3.jpg",
    type: "top",
    category: "Поло",
    colors: ["Черный"],
    sizes: ["L", "XL", "XXL"],
    description:
      "Темное поло в современном стиле. Универсальная база для городского гардероба.",
  },
  {
    id: "4",
    name: "Поло White",
    brand: "Massimo Carino",
    price: 2900,
    oldPrice: 3900,
    badge: "Из-за рубежа",
    image: "/products/product-4.jpg",
    type: "top",
    category: "Поло",
    colors: ["Белый", "Бежевый"],
    sizes: ["S", "M", "L"],
    description:
      "Светлое базовое поло в минималистичном исполнении. Легко комбинируется с джинсами, брюками и шортами.",
  },
];