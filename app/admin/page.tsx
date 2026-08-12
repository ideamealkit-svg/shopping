"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CATALOG_STORAGE_KEY, CatalogProduct, defaultCatalog } from "../catalog";
import { withBasePath } from "../site-path";

type AdminTab = "dashboard" | "products" | "orders" | "shipping" | "customers";
type OrderStatus = "결제 완료" | "배송 준비" | "배송 중" | "배송 완료" | "취소 요청";
type Order = { id: string; customer: string; product: string; amount: string; date: string; status: OrderStatus; carrier: string; tracking: string };
type Inquiry = { id: number; customer: string; subject: string; status: "답변 대기" | "답변 완료" };

const ORDER_STORAGE_KEY = "nova-admin-orders";
const INQUIRY_STORAGE_KEY = "nova-admin-inquiries";
const imageOptions = ["/products/aura-h1.png", "/products/noir-x.png", "/products/tide-s.png", "/products/echo-pro.png"];
const initialOrders: Order[] = [
  { id: "NOVA-260812-041", customer: "김서윤", product: "AURA H1", amount: "₩429,000", date: "2026.08.12", status: "결제 완료", carrier: "CJ대한통운", tracking: "" },
  { id: "NOVA-260812-040", customer: "이도현", product: "NOIR X", amount: "₩329,000", date: "2026.08.12", status: "배송 준비", carrier: "CJ대한통운", tracking: "6894-1032-9981" },
  { id: "NOVA-260811-039", customer: "박지안", product: "TIDE S", amount: "₩269,000", date: "2026.08.11", status: "배송 완료", carrier: "한진택배", tracking: "5123-8290-1704" },
];
const initialInquiries: Inquiry[] = [
  { id: 1, customer: "최민호", subject: "AURA H1 재입고 일정 문의", status: "답변 대기" },
  { id: 2, customer: "윤하린", subject: "주문 취소 가능 여부 문의", status: "답변 대기" },
  { id: 3, customer: "김지수", subject: "제품 보증 등록 방법", status: "답변 완료" },
];

const emptyProduct: CatalogProduct = { name: "", type: "OVER-EAR HEADPHONES", price: "₩0", image: imageOptions[0], description: "", stock: 0, active: true };

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [catalog, setCatalog] = useState<CatalogProduct[]>(defaultCatalog);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [draft, setDraft] = useState<CatalogProduct>(emptyProduct);
  const [notice, setNotice] = useState("");
  const [trackingNotice, setTrackingNotice] = useState("");

  useEffect(() => {
    const load = <T,>(key: string, fallback: T, apply: (value: T) => void) => {
      const stored = window.localStorage.getItem(key);
      if (!stored) return apply(fallback);
      try { apply(JSON.parse(stored)); } catch { window.localStorage.removeItem(key); apply(fallback); }
    };
    load(CATALOG_STORAGE_KEY, defaultCatalog, setCatalog);
    load(ORDER_STORAGE_KEY, initialOrders, setOrders);
    load(INQUIRY_STORAGE_KEY, initialInquiries, setInquiries);
  }, []);

  const totalStock = useMemo(() => catalog.reduce((total, product) => total + Number(product.stock || 0), 0), [catalog]);
  const activeCount = catalog.filter((product) => product.active).length;
  const lowStock = catalog.filter((product) => product.stock < 15);
  const pendingOrders = orders.filter((order) => order.status === "결제 완료" || order.status === "배송 준비").length;
  const pendingInquiries = inquiries.filter((inquiry) => inquiry.status === "답변 대기").length;

  const saveCatalog = (next: CatalogProduct[], message = "상품 정보가 저장되었습니다.") => { setCatalog(next); window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(next)); setNotice(message); };
  const saveOrders = (next: Order[], message = "주문 정보가 저장되었습니다.") => { setOrders(next); window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(next)); setNotice(message); };
  const saveInquiries = (next: Inquiry[]) => { setInquiries(next); window.localStorage.setItem(INQUIRY_STORAGE_KEY, JSON.stringify(next)); setNotice("문의 상태가 변경되었습니다."); };

  const updateProduct = (index: number, field: keyof CatalogProduct, value: string | number | boolean) => saveCatalog(catalog.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item), "상품 정보가 반영되었습니다.");
  const registerProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim()) return setNotice("상품명을 입력해 주세요.");
    if (catalog.some((product) => product.name.toLowerCase() === draft.name.trim().toLowerCase())) return setNotice("같은 상품명이 이미 등록되어 있습니다.");
    saveCatalog([...catalog, { ...draft, name: draft.name.trim() }], "새 상품이 등록되었습니다.");
    setDraft(emptyProduct);
  };
  const removeProduct = (name: string) => { if (window.confirm(`${name} 상품을 삭제할까요?`)) saveCatalog(catalog.filter((product) => product.name !== name), "상품이 삭제되었습니다."); };
  const updateOrder = (id: string, patch: Partial<Order>) => saveOrders(orders.map((order) => order.id === id ? { ...order, ...patch } : order));
  const dispatchOrder = (order: Order) => {
    if (!order.tracking.trim()) return setNotice("송장 번호를 입력해 주세요.");
    updateOrder(order.id, { status: "배송 중" });
    setNotice(`${order.id} 주문이 배송 처리되었습니다.`);
  };
  const trackOrder = (order: Order) => setTrackingNotice(order.tracking ? `${order.carrier} · ${order.tracking} / 현재 배송 ${order.status}` : "등록된 송장 번호가 없습니다.");

  return (
    <main className="commerce-admin">
      <aside className="commerce-sidebar"><a href={withBasePath("/")} className="commerce-brand">NOVA<span>COMMERCE</span></a><nav aria-label="관리자 메뉴">{([ ["dashboard", "대시보드"], ["products", "상품 관리"], ["orders", "주문 관리"], ["shipping", "배송 조회"], ["customers", "고객 · 문의"] ] as [AdminTab, string][]).map(([key, label]) => <button type="button" className={tab === key ? "is-active" : ""} onClick={() => { setTab(key); setNotice(""); }}>{label}</button>)}</nav><div className="commerce-sidebar-bottom"><a href={withBasePath("/")}>스토어 보기 ↗</a><span>LOCAL ADMIN / 2026</span></div></aside>
      <section className="commerce-content">
        <header className="commerce-topbar"><p>{tab === "dashboard" ? "OVERVIEW" : tab === "products" ? "PRODUCT OPERATIONS" : tab === "orders" ? "ORDER OPERATIONS" : tab === "shipping" ? "FULFILLMENT CENTER" : "CUSTOMER CARE"}</p><div><span>관리자</span><b>NA</b></div></header>
        {notice && <p className="commerce-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")}>×</button></p>}

        {tab === "dashboard" && <section className="commerce-view"><div className="commerce-title"><div><p className="commerce-kicker">TODAY / AUG 12</p><h1>운영 현황을<br /><em>한눈에.</em></h1></div><button type="button" className="commerce-primary" onClick={() => setTab("products")}>상품 등록하기 +</button></div><div className="commerce-metrics"><button type="button" onClick={() => setTab("orders")}><span>처리 대기 주문</span><strong>{pendingOrders}</strong><small>주문 관리 →</small></button><button type="button" onClick={() => setTab("products")}><span>재고 주의 상품</span><strong>{lowStock.length}</strong><small>상품 관리 →</small></button><button type="button" onClick={() => setTab("customers")}><span>답변 대기 문의</span><strong>{pendingInquiries}</strong><small>고객 문의 →</small></button><div><span>오늘 매출</span><strong>₩1.84M</strong><small className="is-positive">+18.4% 지난주 대비</small></div></div><div className="commerce-dashboard-grid"><article className="commerce-orders-card"><div className="commerce-card-title"><div><p className="commerce-kicker">RECENT ORDERS</p><h2>최근 주문</h2></div><button type="button" onClick={() => setTab("orders")}>전체 보기 →</button></div>{orders.slice(0, 3).map((order) => <div className="commerce-order-row" key={order.id}><div><b>{order.customer}</b><span>{order.id} · {order.product}</span></div><strong>{order.amount}</strong><em className={`status-${order.status.replaceAll(" ", "")}`}>{order.status}</em></div>)}</article><article className="commerce-stock-card"><p className="commerce-kicker">STOCK ALERT</p><h2>재고 확인</h2>{lowStock.map((product) => <div key={product.name}><span>{product.name}</span><b>{product.stock}개</b></div>)}<button type="button" onClick={() => setTab("products")}>재고 수정하기 →</button></article></div></section>}

        {tab === "products" && <section className="commerce-view"><div className="commerce-title"><div><p className="commerce-kicker">CATALOG</p><h1>상품<br /><em>관리.</em></h1></div><span>{catalog.length}개 등록됨</span></div><div className="commerce-product-layout"><form className="commerce-product-form" onSubmit={registerProduct}><p className="commerce-kicker">NEW PRODUCT</p><h2>새 상품 등록</h2><label>상품명<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="예: STUDIO M" /></label><label>제품 분류<input value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} /></label><label>판매가<input value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} /></label><label>초기 재고<input type="number" min="0" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} /></label><label>대표 이미지<select value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })}>{imageOptions.map((image) => <option value={image} key={image}>{image.split("/").pop()}</option>)}</select></label><button className="commerce-primary" type="submit">상품 등록 +</button></form><div className="commerce-product-list"><div className="commerce-list-head"><span>상품</span><span>판매가</span><span>재고</span><span>상태</span></div>{catalog.map((product, index) => <article className="commerce-product-row" key={product.name}><img src={product.image} alt="" onError={(event) => { event.currentTarget.src = imageOptions[0]; }} /><div><input aria-label={`${product.name} 상품명`} value={product.name} onChange={(event) => updateProduct(index, "name", event.target.value)} /><input aria-label={`${product.name} 제품 분류`} value={product.type} onChange={(event) => updateProduct(index, "type", event.target.value)} /></div><input aria-label={`${product.name} 판매가`} value={product.price} onChange={(event) => updateProduct(index, "price", event.target.value)} /><input aria-label={`${product.name} 재고`} type="number" min="0" value={product.stock} onChange={(event) => updateProduct(index, "stock", Number(event.target.value))} /><div className="commerce-product-actions"><button type="button" className={product.active ? "is-active" : ""} onClick={() => updateProduct(index, "active", !product.active)}>{product.active ? "노출 중" : "비공개"}</button><button type="button" onClick={() => removeProduct(product.name)}>삭제</button></div></article>)}</div></div></section>}

        {tab === "orders" && <section className="commerce-view"><div className="commerce-title"><div><p className="commerce-kicker">ORDERS</p><h1>주문<br /><em>관리.</em></h1></div><span>오늘 {orders.length}건</span></div><div className="commerce-table"><div className="commerce-order-head"><span>주문 정보</span><span>결제 금액</span><span>주문 상태</span><span>송장 등록</span><span>처리</span></div>{orders.map((order) => <article className="commerce-order-manage" key={order.id}><div><b>{order.customer}</b><span>{order.id}<br />{order.date} · {order.product}</span></div><strong>{order.amount}</strong><select value={order.status} onChange={(event) => updateOrder(order.id, { status: event.target.value as OrderStatus })}>{(["결제 완료", "배송 준비", "배송 중", "배송 완료", "취소 요청"] as OrderStatus[]).map((status) => <option key={status}>{status}</option>)}</select><div className="commerce-tracking-input"><select value={order.carrier} onChange={(event) => updateOrder(order.id, { carrier: event.target.value })}><option>CJ대한통운</option><option>한진택배</option><option>롯데택배</option></select><input value={order.tracking} placeholder="송장 번호" onChange={(event) => updateOrder(order.id, { tracking: event.target.value })} /></div><button type="button" className="commerce-dispatch" onClick={() => dispatchOrder(order)}>{order.status === "배송 중" || order.status === "배송 완료" ? "처리됨" : "출고 처리"}</button></article>)}</div></section>}

        {tab === "shipping" && <section className="commerce-view"><div className="commerce-title"><div><p className="commerce-kicker">FULFILLMENT</p><h1>배송<br /><em>조회.</em></h1></div><span>운송장 {orders.filter((order) => order.tracking).length}건</span></div><div className="commerce-shipping-grid">{orders.map((order) => <article className="commerce-shipment" key={order.id}><div><span>{order.carrier}</span><em className={`status-${order.status.replaceAll(" ", "")}`}>{order.status}</em></div><h2>{order.tracking || "송장 번호 미등록"}</h2><p>{order.customer} · {order.product}</p><button type="button" onClick={() => trackOrder(order)}>배송 상태 확인 →</button></article>)}</div>{trackingNotice && <p className="commerce-tracking-result" role="status">{trackingNotice}</p>}</section>}

        {tab === "customers" && <section className="commerce-view"><div className="commerce-title"><div><p className="commerce-kicker">CUSTOMER CARE</p><h1>고객과<br /><em>문의.</em></h1></div><span>답변 대기 {pendingInquiries}건</span></div><div className="commerce-customer-grid"><article className="commerce-customer-card"><p className="commerce-kicker">CUSTOMER SNAPSHOT</p><h2>고객 현황</h2><div><span>총 고객</span><b>128</b></div><div><span>신규 고객</span><b>16</b></div><div><span>재구매율</span><b>32%</b></div></article><article className="commerce-inquiry-card"><div className="commerce-card-title"><div><p className="commerce-kicker">INQUIRIES</p><h2>고객 문의</h2></div><span>{pendingInquiries}건 대기</span></div>{inquiries.map((inquiry) => <div className="commerce-inquiry" key={inquiry.id}><div><b>{inquiry.customer}</b><p>{inquiry.subject}</p></div><button type="button" className={inquiry.status === "답변 완료" ? "is-done" : ""} onClick={() => saveInquiries(inquiries.map((item) => item.id === inquiry.id ? { ...item, status: item.status === "답변 대기" ? "답변 완료" : "답변 대기" } : item))}>{inquiry.status}</button></div>)}</article></div></section>}
      </section>
    </main>
  );
}
