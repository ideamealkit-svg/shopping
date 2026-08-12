"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CATALOG_STORAGE_KEY, CatalogProduct, defaultCatalog, productSlug } from "./catalog";
import { withBasePath } from "./site-path";
import "./postcode.css";

const heroSlide = { eyebrow: "AURA H1 / VIVID FORM", description: "선명한 표현력으로 당신의 일상에 가장 따뜻한 사운드를 더합니다.", image: "/campaign/aura-look-02.png", word: "VIVID" };
const heroStatements = ["고요하게 듣고.", "선명하게 느끼고.", "온전히 몰입하다."];
const GOOGLE_CLIENT_ID = "857715531769-7id3m6u5icnefsarlmkd2omjrdkros24.apps.googleusercontent.com";
type GoogleUser = { name: string; email: string; picture?: string };

declare global {
  interface Window {
    google?: { accounts: { id: { initialize: (config: { client_id: string; callback: (response: { credential: string }) => void; auto_select?: boolean; cancel_on_tap_outside?: boolean; use_fedcm_for_button?: boolean }) => void; renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void } } };
    daum?: { Postcode: new (config: { oncomplete: (data: DaumPostcodeResult) => void }) => { open: () => void } };
  }
}

type DaumPostcodeResult = {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  apartment: "Y" | "N";
};

type DeliveryAddress = { zonecode: string; address: string; detail: string };

function DeliveryAddressForm({ value, onChange }: { value: DeliveryAddress; onChange: (next: DeliveryAddress) => void }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (window.daum?.Postcode) { setIsReady(true); return; }
    const existing = document.getElementById("daum-postcode-script") as HTMLScriptElement | null;
    const onLoad = () => setIsReady(true);
    if (existing) { existing.addEventListener("load", onLoad, { once: true }); return () => existing.removeEventListener("load", onLoad); }
    const script = document.createElement("script");
    script.id = "daum-postcode-script";
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = onLoad;
    document.head.appendChild(script);
    return () => script.removeEventListener("load", onLoad);
  }, []);

  const searchAddress = () => {
    if (!window.daum?.Postcode) return;
    new window.daum.Postcode({ oncomplete: (data) => {
      const base = data.roadAddress || data.address || data.jibunAddress;
      const extra = data.roadAddress && data.apartment === "Y" && data.buildingName ? ` (${data.buildingName})` : "";
      onChange({ ...value, zonecode: data.zonecode, address: `${base}${extra}` });
    } }).open();
  };

  return <fieldset className="delivery-address" aria-label="배송지 입력"><legend>DELIVERY ADDRESS</legend><div className="delivery-postcode"><input value={value.zonecode} readOnly placeholder="우편번호" aria-label="우편번호" /><button type="button" onClick={searchAddress} disabled={!isReady}>{isReady ? "주소 검색" : "불러오는 중"}</button></div><input value={value.address} readOnly placeholder="주소를 검색해 주세요" aria-label="기본 주소" /><input value={value.detail} onChange={(event) => onChange({ ...value, detail: event.target.value })} placeholder="상세 주소를 입력해 주세요" aria-label="상세 주소" /></fieldset>;
}

const categories = [
  { title: "Signature", count: "AURA H1 · SILVER", className: "category-signature", image: "/products/aura-h1.png", product: "AURA H1" },
  { title: "Silence", count: "NOIR X · GRAPHITE", className: "category-silence", image: "/products/noir-x.png", product: "NOIR X" },
  { title: "Color", count: "TIDE S · COBALT", className: "category-color", image: "/products/tide-s.png", product: "TIDE S" },
];

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

export default function Home() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [catalog, setCatalog] = useState<CatalogProduct[]>(defaultCatalog);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [googleLoginMessage, setGoogleLoginMessage] = useState("");
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [activeStatement, setActiveStatement] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "success">("idle");
  const [checkoutStatus, setCheckoutStatus] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({ zonecode: "", address: "", detail: "" });
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCart = window.localStorage.getItem("nova-cart");
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch { window.localStorage.removeItem("nova-cart"); }
    }
    setCartLoaded(true);
    const savedGoogleUser = window.localStorage.getItem("nova-google-user");
    if (savedGoogleUser) {
      try { setGoogleUser(JSON.parse(savedGoogleUser)); } catch { window.localStorage.removeItem("nova-google-user"); }
    }
  }, []);

  useEffect(() => {
    const savedCatalog = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!savedCatalog) return;
    try {
      const parsed = JSON.parse(savedCatalog);
      if (Array.isArray(parsed)) setCatalog(parsed);
    } catch { window.localStorage.removeItem(CATALOG_STORAGE_KEY); }
  }, []);

  useEffect(() => {
    if (cartLoaded) window.localStorage.setItem("nova-cart", JSON.stringify(cart));
  }, [cart, cartLoaded]);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveStatement((current) => (current + 1) % heroStatements.length), 2800);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loginOpen || !googleButtonRef.current) return;
    let cancelled = false;
    const handleCredential = (response: { credential: string }) => {
      try {
        const encodedProfile = response.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const profile = JSON.parse(decodeURIComponent(Array.from(atob(encodedProfile)).map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")));
        const user = { name: profile.name || profile.email || "NOVA MEMBER", email: profile.email || "", picture: profile.picture };
        setGoogleUser(user); window.localStorage.setItem("nova-google-user", JSON.stringify(user)); setLoginOpen(false); setGoogleLoginMessage("");
      } catch { setGoogleLoginMessage("Google 계정 정보를 확인하지 못했습니다. 다시 시도해 주세요."); }
    };
    const renderGoogleButton = () => {
      if (cancelled || !googleButtonRef.current || !window.google) return;
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredential, auto_select: false, cancel_on_tap_outside: true, use_fedcm_for_button: window.location.hostname !== "localhost" });
      window.google.accounts.id.renderButton(googleButtonRef.current, { type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "rectangular", locale: "ko", width: Math.min(370, googleButtonRef.current.clientWidth) });
    };
    const existingScript = document.getElementById("google-identity-services") as HTMLScriptElement | null;
    if (window.google) renderGoogleButton();
    else if (existingScript) existingScript.addEventListener("load", renderGoogleButton, { once: true });
    else {
      const script = document.createElement("script"); script.id = "google-identity-services"; script.src = "https://accounts.google.com/gsi/client"; script.async = true; script.onload = renderGoogleButton; script.onerror = () => setGoogleLoginMessage("Google 로그인 도구를 불러오지 못했습니다."); document.head.appendChild(script);
    }
    return () => { cancelled = true; };
  }, [loginOpen]);

  const cartCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  const cartItems = catalog.filter((product) => cart[product.name]).map((product) => ({ ...product, quantity: cart[product.name] }));
  const filteredProducts = useMemo(() => catalog.filter((product) => product.active && `${product.name} ${product.type}`.toLowerCase().includes(searchQuery.toLowerCase())), [catalog, searchQuery]);

  const addToCart = (product: CatalogProduct) => {
    setCart((current) => ({ ...current, [product.name]: (current[product.name] ?? 0) + 1 }));
    setCheckoutStatus(false);
    setCartOpen(true);
  };

  const updateQuantity = (name: string, change: number) => {
    setCart((current) => {
      const quantity = (current[name] ?? 0) + change;
      if (quantity <= 0) { const { [name]: _, ...rest } = current; return rest; }
      return { ...current, [name]: quantity };
    });
  };

  const showProduct = (product: CatalogProduct) => { setSelectedProduct(product); setMenuOpen(false); };
  const showCollection = (name: string) => { setSearchQuery(name); document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" }); };
  const submitSearch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSearchOpen(false); document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" }); };
  const subscribe = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setNewsletterStatus("success"); };
  const checkout = () => {
    if (!cartCount) return;
    if (!deliveryAddress.zonecode || !deliveryAddress.address || !deliveryAddress.detail.trim()) {
      setCheckoutMessage("배송지와 상세 주소를 입력해 주세요.");
      return;
    }
    setCheckoutMessage("");
    setCart({});
    setCheckoutStatus(true);
  };
  const signOutGoogle = () => { window.localStorage.removeItem("nova-google-user"); setGoogleUser(null); setAccountOpen(false); };

  return (
    <main>
      <header className="site-header">
        <a className="wordmark logo-wordmark" href="#top" aria-label="NOVA 홈"><span className="logo-crop"><img src={withBasePath("/brand/nova-logo.png")} alt="NOVA" /></span></a>
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="주요 메뉴">
          <a href="#featured" onClick={() => setMenuOpen(false)}>신제품</a><a href="#shop" onClick={() => setMenuOpen(false)}>컬렉션</a><a href="#story" onClick={() => setMenuOpen(false)}>NOVA 사운드</a><a href="#support" onClick={() => setMenuOpen(false)}>고객지원</a>
        </nav>
        <div className="header-actions">
          {googleUser ? <button className="google-login-button google-account-button" type="button" onClick={() => setAccountOpen(true)} aria-label={`${googleUser.name} 계정 메뉴`}><span aria-hidden="true">{googleUser.picture ? <img src={googleUser.picture} alt="" /> : googleUser.name.slice(0, 1)}</span><b>{googleUser.name}</b></button> : <button className="google-login-button" type="button" onClick={() => setLoginOpen(true)}><span aria-hidden="true">G</span><b>Google 로그인</b></button>}
          <button className="icon-button search-button" aria-label="검색 열기" onClick={() => setSearchOpen(true)}><span>⌕</span></button>
          <button className="icon-button bag-button" aria-label={`장바구니 ${cartCount}개`} onClick={() => setCartOpen(true)}><span className="bag-icon" aria-hidden="true" />{cartCount > 0 && <b>{cartCount}</b>}</button>
          <button className="menu-button" aria-label="메뉴 열기" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><i /><i /></button>
        </div>
      </header>

      <section className="hero hero-carousel" id="top">
        <img className="hero-image hero-image-2" src={withBasePath(heroSlide.image)} alt="빨간 배경에서 AURA H1을 착용한 NOVA 전속 모델" /><div className="hero-grain" />
        <p className="hero-word" aria-hidden="true">{heroSlide.word}</p><p className="hero-index" aria-hidden="true">AURA / H1</p>
        <div className="hero-copy"><p className="eyebrow"><span /> {heroSlide.eyebrow}</p><h1 className="hero-rotator" aria-label="고요하게 듣고, 선명하게 느끼고, 온전히 몰입하다."><span className="hero-rotator-window" aria-hidden="true"><span className="hero-rotator-line" key={heroStatements[activeStatement]}>{heroStatements[activeStatement]}</span></span></h1><p className="hero-description">{heroSlide.description}</p></div>
        <div className="hero-bottom"><p>DESIGNED FOR THE WAY<br />YOU LISTEN.</p><p>ONE / SIGNATURE CAMPAIGN</p></div>
      </section>

      <section className="experience-band" id="experience"><p>SOUND <span>FOLLOWS</span> FEELING</p><p className="experience-copy">방해가 사라질수록<br />당신의 시간은 더 깊어집니다.</p></section>

      <section className="featured section-shell" id="featured"><div className="section-kicker"><span>01</span> FEATURED DROP</div><div className="featured-grid"><div className="feature-copy"><p className="eyebrow dark"><span /> NEW RELEASE</p><h2>당신의 플레이를<br /><em>더 가까이.</em></h2><p>AURA H1은 플레이가 머무는 공간을 정교하게 구분합니다. 어디서든 당신만의 리듬을 이어가세요.</p><div className="feature-specs"><span>40 <small>MM</small></span><span>42 <small>HRS</small></span><span>3 <small>MIC</small></span></div><div className="feature-actions"><button className="button button-dark" onClick={() => addToCart(catalog[0] ?? defaultCatalog[0])}>AURA H1 담기 <Arrow /></button><a className="text-link dark-link" href="#products">전체 제품 보기 <Arrow /></a></div></div><div className="feature-product" aria-label="AURA H1 제품 이미지"><img className="feature-headphone-image" src={withBasePath("/products/aura-h1-feature-v2.png")} alt="AURA H1 실버 헤드폰" /></div></div></section>

      <section className="category-section section-shell" id="shop"><div className="section-heading"><div><div className="section-kicker"><span>02</span> SHOP BY COLLECTION</div><h2>당신의 <em>사운드</em>를<br />고르세요.</h2></div><a className="text-link dark-link" href={withBasePath("/products")}>모든 제품 보기 <Arrow /></a></div><div className="category-grid">{categories.map((category, index) => <a href={withBasePath(`/products?collection=${encodeURIComponent(category.product)}`)} className={`category-card ${category.className}`} key={category.title}><img src={withBasePath(category.image)} alt="" /><div className="category-scrim" /><div className="category-card-copy"><p><span>0{index + 1}</span>{category.count}</p><h3>{category.title}</h3></div><Arrow /></a>)}</div></section>

      <section className="products-section" id="products"><div className="section-shell"><div className="product-intro"><div className="section-kicker light"><span>03</span> CURATED FOR NOW</div><h2>지금, 가장<br /><em>주목받는</em> 제품.</h2></div>{searchQuery && <div className="product-filter"><span>“{searchQuery}” 검색 결과</span><button type="button" onClick={() => setSearchQuery("")}>필터 지우기</button></div>}</div><div className="product-rail">{filteredProducts.length ? filteredProducts.map((product) => <article className="product-card" key={product.name}><div className="product-art"><button aria-label={`${product.name} 장바구니에 담기`} onClick={() => addToCart(product)}>+</button><a className="product-image-button" href={withBasePath(`/products/${productSlug(product)}`)} aria-label={`${product.name} 상세 보기`}><img src={withBasePath(product.image)} alt={`${product.name} 헤드폰`} /></a></div><p>{product.type}</p><a className="product-open" href={withBasePath(`/products/${productSlug(product)}`)}>{product.name}</a><div><span>{product.price}</span><button className="mini-add" onClick={() => addToCart(product)}>담기</button></div></article>) : <p className="empty-products">찾으시는 제품이 없습니다. 다른 검색어로 다시 시도해 보세요.</p>}</div><a className="products-page-link" href={withBasePath("/products")}>전체 컬렉션 보기 <Arrow /></a></section>

      <section className="story-section" id="story"><div className="story-grid section-shell"><div className="story-content"><p className="eyebrow"><span /> NOVA CAMPAIGN / 2026</p><h2>당신의 순간을<br /><em>온전히</em> 듣다.</h2><p>소리가 선명해질수록, 당신만의 리듬도 더 또렷해집니다. NOVA는 그 순간을 위한 사운드를 만듭니다.</p><a href="#field-notes" className="button button-light">캠페인 스토리 <Arrow /></a></div><div className="story-visual"><div className="story-visual-label"><span>NOVA<br />SIGNATURE FACE</span><b>01<small>/ 01</small></b></div><img src={withBasePath("/campaign/nova-model-headphones.png")} alt="NOVA 전속 모델이 실버 헤드폰을 착용한 캠페인 이미지" /></div></div></section>

      <section className="campaign-section" id="field-notes" aria-labelledby="field-notes-title"><div className="campaign-heading section-shell"><div><p className="section-kicker"><span>04</span> AURA IN MOTION</p><h2 id="field-notes-title">나의 리듬에<br /><em>가장 가까이.</em></h2></div><p>고요한 몰입부터 선명한 일상까지.<br />AURA H1과 함께하는 모든 장면.</p></div><div className="campaign-grid campaign-grid-four section-shell"><figure className="campaign-card"><img src={withBasePath("/campaign/aura-look-03.png")} alt="AURA H1을 착용하고 눈을 감은 NOVA 전속 모델" /><figcaption><span>01</span><p>THE PAUSE<small>QUIET LISTENING</small></p></figcaption></figure><figure className="campaign-card"><img src={withBasePath("/campaign/aura-look-04.png")} alt="AURA H1을 착용한 NOVA 전속 모델" /><figcaption><span>02</span><p>WARM FREQUENCY<small>DAILY RHYTHM</small></p></figcaption></figure><figure className="campaign-card"><img src={withBasePath("/campaign/aura-look-05.png")} alt="도시에서 AURA H1을 착용한 NOVA 전속 모델" /><figcaption><span>03</span><p>OUTSIDE IN<small>URBAN SILENCE</small></p></figcaption></figure><figure className="campaign-card"><img src={withBasePath("/campaign/aura-look-06.png")} alt="AURA H1의 이어컵을 조작하는 NOVA 전속 모델" /><figcaption><span>04</span><p>ONE TOUCH<small>YOUR SOUND</small></p></figcaption></figure></div></section>

      <section className="services section-shell" id="support"><div className="service-item"><span>01</span><div><h3>무료 익일 배송</h3><p>오후 2시 이전 주문 시, 내일 만나보세요.</p></div></div><div className="service-item"><span>02</span><div><h3>14일 이내 무료 반품</h3><p>충분히 경험하고 결정할 수 있도록.</p></div></div><div className="service-item"><span>03</span><div><h3>정품 보증과 케어</h3><p>전문가가 제품의 시작부터 함께합니다.</p></div></div></section>
      <section className="newsletter section-shell"><p className="eyebrow dark"><span /> STAY IN THE LOOP</p><h2>새로운 사운드가 도착하는<br />순간을 <em>가장 먼저</em> 만나보세요.</h2><form onSubmit={subscribe}><label htmlFor="email" className="sr-only">이메일 주소</label><input id="email" type="email" required placeholder="이메일 주소를 입력하세요" disabled={newsletterStatus === "success"} /><button className="button button-dark" type="submit" disabled={newsletterStatus === "success"}>{newsletterStatus === "success" ? "구독 완료" : "구독하기"} <Arrow /></button></form>{newsletterStatus === "success" && <p className="form-success" role="status">구독이 완료되었습니다. 새로운 소식으로 찾아올게요.</p>}</section>
      <footer className="site-footer"><div className="footer-main section-shell"><a className="wordmark logo-wordmark" href="#top" aria-label="NOVA 홈"><span className="logo-crop"><img src={withBasePath("/brand/nova-logo.png")} alt="NOVA" /></span></a><p>Designing quiet sound<br />for moving minds.</p><div className="footer-links"><a href="#shop">컬렉션</a><a href="#story">브랜드</a><a href="#support">지원</a><a href={withBasePath("/admin")}>관리자</a></div></div><div className="footer-meta section-shell"><span>© 2026 NOVA AUDIO INC.</span><span>개인정보 처리방침&nbsp;&nbsp; 이용약관</span><span>SEOUL · KOREA</span></div></footer>

      {searchOpen && <div className="overlay" role="dialog" aria-modal="true" aria-label="제품 검색"><form className="search-panel" onSubmit={submitSearch}><button type="button" className="overlay-close" aria-label="검색 닫기" onClick={() => setSearchOpen(false)}>×</button><p className="eyebrow dark"><span /> SEARCH NOVA</p><label htmlFor="product-search">찾고 있는 헤드폰이 있나요?</label><input id="product-search" autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="AURA H1, NOIR X..." /><button className="button button-dark" type="submit">제품 검색 <Arrow /></button></form></div>}
      {loginOpen && <div className="overlay google-login-overlay" role="dialog" aria-modal="true" aria-label="Google 로그인"><section className="google-login-panel"><button className="overlay-close" type="button" aria-label="로그인 닫기" onClick={() => setLoginOpen(false)}>×</button><div className="google-login-identity"><span className="google-mark" aria-hidden="true">G</span><p>NOVA ACCOUNT</p></div><h2>로그인하고<br />나의 사운드를<br /><em>이어가세요.</em></h2><p className="google-login-copy">Google 계정으로 로그인하면 주문 내역과 상품 문의를 한 곳에서 관리할 수 있습니다.</p><div className="google-connect google-widget" ref={googleButtonRef} aria-label="Google 계정으로 계속" /><div className="google-config-note"><b>{googleLoginMessage ? "안내" : "보안 로그인"}</b><span>{googleLoginMessage || "Google의 보안 계정 선택 창에서 로그인을 진행합니다."}</span></div></section></div>}
      {accountOpen && googleUser && <div className="overlay account-overlay" role="dialog" aria-modal="true" aria-label="내 계정"><section className="account-panel"><button className="overlay-close" type="button" aria-label="계정 메뉴 닫기" onClick={() => setAccountOpen(false)}>×</button><div className="account-avatar">{googleUser.picture ? <img src={googleUser.picture} alt="" /> : googleUser.name.slice(0, 1)}</div><p className="eyebrow dark"><span /> SIGNED IN WITH GOOGLE</p><h2>{googleUser.name}</h2><p>{googleUser.email}</p><div><a href={withBasePath("/#products")} onClick={() => setAccountOpen(false)}>주문 내역 보기</a><a href={withBasePath("/products/aura-h1#inquiries")} onClick={() => setAccountOpen(false)}>상품 문의 보기</a></div><button type="button" onClick={signOutGoogle}>로그아웃</button></section></div>}
      {selectedProduct && <div className="overlay" role="dialog" aria-modal="true" aria-label={`${selectedProduct.name} 상세 정보`}><section className="product-modal"><button className="overlay-close" aria-label="상세 정보 닫기" onClick={() => setSelectedProduct(null)}>×</button><div className="product-modal-image"><img src={selectedProduct.image} alt={`${selectedProduct.name} 헤드폰`} /></div><div className="product-modal-copy"><p className="eyebrow dark"><span /> {selectedProduct.type}</p><h2>{selectedProduct.name}</h2><p>{selectedProduct.description}</p><strong>{selectedProduct.price}</strong><button className="button button-dark" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>장바구니에 담기 <Arrow /></button></div></section></div>}
      {cartOpen && <aside className="cart-panel" aria-label="장바구니"><button className="cart-close" aria-label="장바구니 닫기" onClick={() => setCartOpen(false)}>×</button><p className="eyebrow dark"><span /> YOUR BAG</p>{checkoutStatus ? <><h2>주문 요청이<br />완료되었어요.</h2><p className="cart-note">입력한 배송지로 주문이 접수되었습니다.</p></> : cartItems.length ? <><h2>선택한 사운드를<br />확인하세요.</h2><div className="cart-list">{cartItems.map((item) => <div className="cart-item" key={item.name}><img src={item.image} alt="" /><div><strong>{item.name}</strong><span>{item.price}</span><div className="quantity"><button aria-label={`${item.name} 수량 줄이기`} onClick={() => updateQuantity(item.name, -1)}>−</button><b>{item.quantity}</b><button aria-label={`${item.name} 수량 늘리기`} onClick={() => updateQuantity(item.name, 1)}>+</button></div></div></div>)}</div><DeliveryAddressForm value={deliveryAddress} onChange={(next) => { setDeliveryAddress(next); setCheckoutMessage(""); }} />{checkoutMessage && <p className="checkout-message" role="alert">{checkoutMessage}</p>}<button className="button button-dark" onClick={checkout}>주문 요청하기 <Arrow /></button></> : <><h2>장바구니가 비어 있어요.</h2><p className="cart-note">NOVA의 사운드를 골라 담아보세요.</p></>}<button className="cart-continue" onClick={() => setCartOpen(false)}>계속 쇼핑하기</button></aside>}
    </main>
  );
}
