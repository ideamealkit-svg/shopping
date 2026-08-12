"use client";

import { useEffect, useMemo, useState } from "react";
import { CATALOG_STORAGE_KEY, CatalogProduct, defaultCatalog, productSlug } from "../catalog";
import { withBasePath } from "../site-path";

export default function ProductsPage() {
  const [catalog, setCatalog] = useState<CatalogProduct[]>(defaultCatalog);
  const [collection, setCollection] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (stored) {
      try { const parsed = JSON.parse(stored); if (Array.isArray(parsed)) setCatalog(parsed); } catch { window.localStorage.removeItem(CATALOG_STORAGE_KEY); }
    }
    setCollection(new URLSearchParams(window.location.search).get("collection") ?? "");
  }, []);

  const products = useMemo(() => catalog.filter((product) => product.active && (!collection || product.name === collection)), [catalog, collection]);

  return (
    <main className="catalog-page">
      <header className="catalog-header"><a href={withBasePath("/")} className="catalog-brand">NOVA</a><nav><a href={withBasePath("/")}>홈</a><a href={withBasePath("/products")} aria-current="page">컬렉션</a><a href={withBasePath("/admin")}>관리자</a></nav></header>
      <section className="catalog-hero"><p>CATALOG / 2026</p><h1>모든 순간에<br /><em>정확한 사운드.</em></h1><span>{products.length.toString().padStart(2, "0")} MODELS</span></section>
      <section className="catalog-content"><div className="catalog-toolbar"><p>{collection ? `${collection} 컬렉션` : "ALL COLLECTIONS"}</p>{collection && <a href={withBasePath("/products")}>전체 보기</a>}</div><div className="catalog-grid">{products.map((product) => <article className="catalog-card" key={product.name}><a className="catalog-image" href={withBasePath(`/products/${productSlug(product)}`)}><img src={withBasePath(product.image)} alt={`${product.name} 헤드폰`} /></a><div className="catalog-card-copy"><p>{product.type}</p><h2><a href={withBasePath(`/products/${productSlug(product)}`)}>{product.name}</a></h2><div><span>{product.price}</span><a href={withBasePath(`/products/${productSlug(product)}`)}>상세 보기 →</a></div></div></article>)}</div>{!products.length && <div className="catalog-empty"><p>현재 노출 중인 제품이 없습니다.</p><a href={withBasePath("/products")}>전체 컬렉션 보기</a></div>}</section>
    </main>
  );
}
