"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CATALOG_STORAGE_KEY, CatalogProduct, defaultCatalog, productSlug } from "../../catalog";
import { withBasePath } from "../../site-path";

type Review = { id: number; author: string; rating: number; body: string; date: string };
type Inquiry = { id: number; author: string; title: string; body: string; date: string; status: "답변 대기" | "답변 완료" };

const auraGallery = [
  "/campaign/aura-look-01.png",
  "/campaign/aura-look-02.png",
  "/campaign/aura-look-03.png",
  "/campaign/aura-look-04.png",
  "/campaign/aura-look-05.png",
  "/campaign/aura-look-06.png",
  "/campaign/aura-look-07.png",
].map(withBasePath);

const initialReviews: Review[] = [
  { id: 1, author: "min***", rating: 5, body: "착용감이 가볍고, 차음도 자연스럽습니다. 출퇴근 시간이 편안해졌어요.", date: "2026.08.10" },
  { id: 2, author: "sora***", rating: 5, body: "보컬이 가까이 들리고 디자인도 사진 그대로 고급스러워요.", date: "2026.08.06" },
];

export default function ProductDetailClient({ slug }: { slug?: string }) {
  const params = useParams<{ slug: string }>();
  const [catalog, setCatalog] = useState<CatalogProduct[]>(defaultCatalog);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [notice, setNotice] = useState("");
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [reviewForm, setReviewForm] = useState({ author: "", rating: "5", body: "" });
  const [inquiryForm, setInquiryForm] = useState({ author: "", title: "", body: "" });

  const activeSlug = slug ?? params.slug;
  const product = useMemo(() => catalog.find((item) => productSlug(item) === activeSlug), [catalog, activeSlug]);
  const productKey = product ? productSlug(product) : "";
  const gallery = product?.name === "AURA H1" ? auraGallery : product ? [withBasePath(product.image)] : [];
  const average = reviews.length ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1) : "0.0";

  useEffect(() => {
    const saved = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCatalog(parsed);
      } catch {
        window.localStorage.removeItem(CATALOG_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (!productKey) return;
    setActiveImage(0);
    try {
      const storedReviews = window.localStorage.getItem(`nova-reviews-${productKey}`);
      const storedInquiries = window.localStorage.getItem(`nova-inquiries-${productKey}`);
      setReviews(storedReviews ? JSON.parse(storedReviews) : initialReviews);
      setInquiries(storedInquiries ? JSON.parse(storedInquiries) : []);
    } catch {
      setReviews(initialReviews);
      setInquiries([]);
    }
  }, [productKey]);

  const addToCart = () => {
    if (!product) return;
    const current = JSON.parse(window.localStorage.getItem("nova-cart") ?? "{}");
    window.localStorage.setItem("nova-cart", JSON.stringify({ ...current, [product.name]: (current[product.name] ?? 0) + 1 }));
    setAdded(true);
    setNotice("장바구니에 제품을 담았습니다.");
  };

  const submitReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reviewForm.author.trim() || !reviewForm.body.trim()) return setNotice("작성자와 후기를 입력해 주세요.");
    const next = [{ id: Date.now(), author: reviewForm.author.trim(), rating: Number(reviewForm.rating), body: reviewForm.body.trim(), date: "방금 전" }, ...reviews];
    setReviews(next);
    window.localStorage.setItem(`nova-reviews-${productKey}`, JSON.stringify(next));
    setReviewForm({ author: "", rating: "5", body: "" });
    setNotice("후기가 등록되었습니다.");
  };

  const submitInquiry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inquiryForm.author.trim() || !inquiryForm.title.trim() || !inquiryForm.body.trim()) return setNotice("문의 내용을 모두 입력해 주세요.");
    const next = [{ id: Date.now(), author: inquiryForm.author.trim(), title: inquiryForm.title.trim(), body: inquiryForm.body.trim(), date: "방금 전", status: "답변 대기" as const }, ...inquiries];
    setInquiries(next);
    window.localStorage.setItem(`nova-inquiries-${productKey}`, JSON.stringify(next));
    setInquiryForm({ author: "", title: "", body: "" });
    setNotice("상품 문의가 등록되었습니다.");
  };

  if (!product) {
    return <main className="detail-page detail-empty"><a href={withBasePath("/products")}>← 컬렉션으로 돌아가기</a><h1>제품을 찾을 수 없습니다.</h1></main>;
  }

  return (
    <main className="detail-page detail-page-v2">
      <header className="detail-header"><a href={withBasePath("/")} className="catalog-brand">NOVA</a><nav><a href={withBasePath("/products")}>컬렉션</a><a href="#reviews">후기</a><a href="#inquiries">문의</a></nav><a href={withBasePath("/#products")}>장바구니 보기</a></header>
      {notice && <p className="detail-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")}>×</button></p>}
      <section className="detail-main detail-main-v2">
        <div className="detail-gallery">
          <div className="detail-image"><img src={gallery[activeImage]} alt={`${product.name} 제품 이미지`} /></div>
          <div className="detail-thumbnails">{gallery.map((image, index) => <button type="button" className={index === activeImage ? "is-active" : ""} onClick={() => setActiveImage(index)} key={image} aria-label={`${index + 1}번 이미지 보기`}><img src={image} alt="" /></button>)}</div>
        </div>
        <div className="detail-copy">
          <p className="detail-kicker">{product.type}</p><h1>{product.name}</h1><p className="detail-description">{product.description}</p><p className="detail-price">{product.price}</p>
          <div className="detail-status"><span className={product.stock > 0 ? "is-available" : "is-soldout"}>{product.stock > 0 ? "IN STOCK" : "SOLD OUT"}</span><span>{product.stock > 0 ? `오늘 출고 가능 · 잔여 ${product.stock}개` : "재입고 알림을 준비 중입니다."}</span></div>
          <button className="detail-add" disabled={!product.stock} onClick={addToCart}>{added ? "장바구니에 담았습니다" : product.stock ? "장바구니에 담기" : "품절"} <span>→</span></button>
          <p className="detail-delivery">무료 익일 배송 · 14일 이내 무료 반품 · 정품 보증</p>
        </div>
      </section>
      <section className="detail-specs"><div><span>01</span><p>40mm 커스텀 드라이버</p></div><div><span>02</span><p>최대 42시간 재생</p></div><div><span>03</span><p>3 마이크 빔포밍 통화</p></div></section>
      <section className="detail-product-overview" id="product-detail"><div className="detail-overview-intro"><p className="detail-kicker">LISTENING, REFINED</p><h2>선을 가르는<br /><em>선명한</em><br />사운드</h2><p>{product.name}은 일상의 고요함과 또렷한 표현력을 함께 설계했습니다. 필요한 소리만 정교하게 남기고 오래 들어도 부담 없는 균형을 만듭니다.</p></div><div className="detail-feature-list"><article><span>01</span><h3>40mm 커스텀 드라이버</h3><p>저음은 단단하게, 보컬은 가까이. 모든 장르를 균형 있게 표현합니다.</p></article><article><span>02</span><h3>적응형 노이즈 캔슬링</h3><p>주변 소음을 실시간으로 분석해 이동 중에도 감상 환경을 지켜줍니다.</p></article><article><span>03</span><h3>42시간의 여유</h3><p>한 번의 충전으로 오래. 10분 충전만으로도 5시간을 재생합니다.</p></article></div></section>
      <section className="detail-sound-stage"><div className="detail-sound-image"><img src={withBasePath(product.name === "AURA H1" ? "/campaign/aura-look-03.png" : product.image)} alt={`${product.name} 사운드 경험`} /></div><div className="detail-sound-copy"><p className="detail-kicker">A QUIETER WAY TO MOVE</p><h2>도시는 작아지고.<br /><em>나의 리듬은 커집니다.</em></h2><p>투명 모드와 노이즈 캔슬링을 한 번의 터치로 전환하세요. 통화, 이동, 몰입의 순간마다 환경에 맞는 사운드를 선택할 수 있습니다.</p><dl><div><dt>ANC</dt><dd>적응형 노이즈 캔슬링</dd></div><div><dt>TRANSPARENCY</dt><dd>주변 소리 즉시 듣기</dd></div><div><dt>CALL</dt><dd>3 마이크 빔포밍 통화</dd></div></dl></div></section>
      {product.name === "AURA H1" && <section className="detail-editorial"><div><p className="detail-kicker">AURA / IN EVERY MOMENT</p><h2>당신의 하루에<br /><em>가장 자연스럽게.</em></h2></div><div className="detail-editorial-images"><img src={withBasePath("/campaign/aura-look-04.png")} alt="AURA H1을 착용한 전속 모델" /><img src={withBasePath("/campaign/aura-look-06.png")} alt="AURA H1의 이어컵을 조작하는 전속 모델" /><img src={withBasePath("/campaign/aura-look-02.png")} alt="오렌지 배경에서 AURA H1을 착용한 전속 모델" /></div></section>}
      <section className="detail-community" id="reviews"><div className="community-heading"><div><p className="detail-kicker">REVIEWS</p><h2>고객 후기 <span>{average}</span></h2></div><p>{reviews.length}개의 실제 착용 후기</p></div><div className="community-grid"><div className="review-list">{reviews.map((review) => <article key={review.id}><div><b>{review.author}</b><span>{"★".repeat(review.rating)}<i>{review.date}</i></span></div><p>{review.body}</p></article>)}</div><form className="community-form" onSubmit={submitReview}><p className="detail-kicker">WRITE A REVIEW</p><h3>후기 작성</h3><label>작성자<input value={reviewForm.author} onChange={(event) => setReviewForm({ ...reviewForm, author: event.target.value })} placeholder="닉네임" /></label><label>별점<select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })}>{[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{"★".repeat(rating)} {rating}점</option>)}</select></label><label>후기<textarea value={reviewForm.body} onChange={(event) => setReviewForm({ ...reviewForm, body: event.target.value })} placeholder="제품 사용 경험을 들려주세요." /></label><button type="submit">후기 등록 →</button></form></div></section>
      <section className="detail-community detail-inquiries" id="inquiries"><div className="community-heading"><div><p className="detail-kicker">PRODUCT Q&A</p><h2>상품 문의</h2></div><p>답변은 영업일 기준 1일 이내 등록됩니다.</p></div><div className="community-grid"><div className="inquiry-list">{inquiries.length ? inquiries.map((inquiry) => <article key={inquiry.id}><div><b>{inquiry.title}</b><span className={inquiry.status === "답변 완료" ? "is-done" : ""}>{inquiry.status}</span></div><p>{inquiry.body}</p><small>{inquiry.author} · {inquiry.date}</small></article>) : <p className="empty-community">첫 번째 상품 문의를 남겨주세요.</p>}</div><form className="community-form inquiry-form" onSubmit={submitInquiry}><p className="detail-kicker">ASK A QUESTION</p><h3>문의 작성</h3><label>작성자<input value={inquiryForm.author} onChange={(event) => setInquiryForm({ ...inquiryForm, author: event.target.value })} placeholder="닉네임" /></label><label>제목<input value={inquiryForm.title} onChange={(event) => setInquiryForm({ ...inquiryForm, title: event.target.value })} placeholder="문의 제목" /></label><label>문의 내용<textarea value={inquiryForm.body} onChange={(event) => setInquiryForm({ ...inquiryForm, body: event.target.value })} placeholder="궁금한 내용을 남겨주세요." /></label><button type="submit">문의 등록 →</button></form></div></section>
    </main>
  );
}
