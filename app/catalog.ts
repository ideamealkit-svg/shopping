export type CatalogProduct = {
  name: string;
  type: string;
  price: string;
  image: string;
  description: string;
  stock: number;
  active: boolean;
};

export const CATALOG_STORAGE_KEY = "nova-admin-products";

export const defaultCatalog: CatalogProduct[] = [
  { name: "AURA H1", type: "SIGNATURE OVER-EAR", price: "₩429,000", image: "/products/aura-h1.png", description: "정교한 40mm 드라이버와 알루미늄 하우징으로 완성한 NOVA의 시그니처 사운드.", stock: 24, active: true },
  { name: "NOIR X", type: "ADAPTIVE NOISE CONTROL", price: "₩329,000", image: "/products/noir-x.png", description: "상황에 맞춰 소음을 조절하는 적응형 노이즈 캔슬링 헤드폰.", stock: 18, active: true },
  { name: "TIDE S", type: "SPATIAL AUDIO", price: "₩269,000", image: "/products/tide-s.png", description: "공간감 있는 몰입을 위한 가볍고 선명한 데일리 헤드폰.", stock: 31, active: true },
  { name: "ECHO PRO", type: "REFERENCE WIRELESS", price: "₩349,000", image: "/products/echo-pro.png", description: "섬세한 디테일까지 확인하는 레퍼런스 튜닝의 무선 헤드폰.", stock: 12, active: true },
];

export const productSlug = (product: Pick<CatalogProduct, "name">) => product.name.toLowerCase().replace(/\s+/g, "-");
