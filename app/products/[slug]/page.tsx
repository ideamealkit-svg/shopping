import ProductDetailClient from "./ProductDetailClient";

export function generateStaticParams() {
  return [
    { slug: "aura-h1" },
    { slug: "noir-x" },
    { slug: "tide-s" },
    { slug: "echo-pro" },
    { slug: "nova-lite" },
  ];
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return <ProductDetailClient slug={params.slug} />;
}
