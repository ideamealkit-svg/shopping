"use client";

import { useState } from "react";
import HeroScene from "./HeroScene";

const products = [
  { name: "NOVA Air X1", type: "ULTRA-LIGHT LAPTOP", price: "₩1,890,000", accent: "laptop", tone: "silver" },
  { name: "SONA H1", type: "SPATIAL HEADPHONES", price: "₩429,000", accent: "headphones", tone: "midnight" },
  { name: "ARC Glass", type: "IMMERSIVE DISPLAY", price: "₩699,000", accent: "glasses", tone: "frost" },
  { name: "ORBIT Mini", type: "SMART HOME HUB", price: "₩159,000", accent: "orb", tone: "blue" },
];

const categories = [
  { title: "Computing", count: "24 products", className: "category-computing" },
  { title: "Audio", count: "18 products", className: "category-audio" },
  { title: "Mobile", count: "12 products", className: "category-mobile" },
  { title: "Smart Home", count: "31 products", className: "category-home" },
  { title: "Gaming", count: "16 products", className: "category-gaming" },
];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default function Home() {
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const addToCart = () => {
    setCartCount((count) => count + 1);
    setCartOpen(true);
  };

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="NOVA 홈">NOVA<span>®</span></a>
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="주요 메뉴">
          <a href="#featured" onClick={() => setMenuOpen(false)}>신제품</a>
          <a href="#shop" onClick={() => setMenuOpen(false)}>스토어</a>
          <a href="#story" onClick={() => setMenuOpen(false)}>NOVA 이야기</a>
          <a href="#support" onClick={() => setMenuOpen(false)}>고객지원</a>
        </nav>
        <div className="header-actions">
          <button className="icon-button search-button" aria-label="검색 열기"><span>⌕</span></button>
          <button className="icon-button bag-button" aria-label={`장바구니 ${cartCount}개`} onClick={() => setCartOpen(true)}>
            <span className="bag-icon" aria-hidden="true" />
            {cartCount > 0 && <b>{cartCount}</b>}
          </button>
          <button className="menu-button" aria-label="메뉴 열기" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><i /><i /></button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-grain" />
        <HeroScene />
        <div className="hero-copy">
          <p className="eyebrow"><span /> NOVA SERIES 01</p>
          <h1>더 선명하게.<br />더 가볍게.<br /><em>한계를 넘어서.</em></h1>
          <p className="hero-description">정교한 성능과 조용한 디자인이 만나는<br />새로운 기준.</p>
          <div className="hero-actions">
            <a href="#featured" className="button button-light">제품 살펴보기 <Arrow /></a>
            <a href="#experience" className="text-link">3D로 경험하기 <span>↓</span></a>
          </div>
        </div>
        <div className="hero-bottom">
          <p>DESIGNED FOR THE WAY<br />YOU MOVE.</p>
          <span className="scroll-cue"><i /> SCROLL TO EXPLORE</span>
          <p>01 / 03</p>
        </div>
      </section>

      <section className="experience-band" id="experience">
        <p>FORM <span>FOLLOWS</span> FEELING</p>
        <p className="experience-copy">기술이 조용해질수록<br />당신의 생각은 더 멀리 갑니다.</p>
      </section>

      <section className="featured section-shell" id="featured">
        <div className="section-kicker"><span>01</span> FEATURED DROP</div>
        <div className="featured-grid">
          <div className="feature-copy">
            <p className="eyebrow dark"><span /> NEW RELEASE</p>
            <h2>새로운 공기의<br /><em>무게를</em> 만나다.</h2>
            <p>NOVA Air X1은 가장 정교한 기술을 가장 가벼운 형태로 담았습니다. 어디에서든 본연의 리듬을 이어가세요.</p>
            <div className="feature-specs"><span>1.02 <small>KG</small></span><span>18 <small>HRS</small></span><span>3 <small>NM</small></span></div>
            <div className="feature-actions"><button className="button button-dark" onClick={addToCart}>Air X1 담기 <Arrow /></button><a className="text-link dark-link" href="#shop">더 알아보기 <Arrow /></a></div>
          </div>
          <div className="feature-product" aria-label="NOVA Air X1 제품 이미지">
            <div className="feature-orbit orbit-one" /><div className="feature-orbit orbit-two" />
            <div className="laptop-visual"><div className="laptop-screen"><i /></div><div className="laptop-base"><i /></div></div>
            <span className="product-label label-top">AEROSPACE<br />ALUMINUM</span><span className="product-label label-bottom">NOVA<br />AIR X1</span>
          </div>
        </div>
      </section>

      <section className="category-section section-shell" id="shop">
        <div className="section-heading"><div><div className="section-kicker"><span>02</span> SHOP BY CATEGORY</div><h2>당신의 다음 <em>도약</em>을<br />고르세요.</h2></div><a className="text-link dark-link" href="#products">모든 제품 보기 <Arrow /></a></div>
        <div className="category-grid">
          {categories.map((category) => <a href="#products" className={`category-card ${category.className}`} key={category.title}><div><p>{category.count}</p><h3>{category.title}</h3></div><Arrow /></a>)}
        </div>
      </section>

      <section className="products-section" id="products">
        <div className="section-shell"><div className="product-intro"><div className="section-kicker light"><span>03</span> CURATED FOR NOW</div><h2>지금, 가장<br /><em>주목받는</em> 제품.</h2></div></div>
        <div className="product-rail">
          {products.map((product) => <article className="product-card" key={product.name}><div className={`product-art ${product.accent} ${product.tone}`}><button aria-label={`${product.name} 장바구니에 담기`} onClick={addToCart}>+</button><div className="product-object" /></div><p>{product.type}</p><h3>{product.name}</h3><div><span>{product.price}</span><button className="mini-add" onClick={addToCart}>담기</button></div></article>)}
        </div>
      </section>

      <section className="story-section" id="story">
        <div className="story-orb" /><div className="story-lines" />
        <div className="story-content section-shell"><p className="eyebrow"><span /> A QUIETER FUTURE</p><h2>생각을 방해하지 않는<br /><em>기술을</em> 만듭니다.</h2><p>보이지 않는 곳까지 다듬은 디테일. 당신에게 필요한 순간에만, 가장 자연스럽게.</p><a href="#support" className="button button-light">NOVA의 철학 <Arrow /></a></div>
        <div className="story-stat"><span>87<small>%</small></span><p>RECYCLED<br />ALUMINUM</p></div>
      </section>

      <section className="services section-shell" id="support">
        <div className="service-item"><span>01</span><div><h3>무료 익일 배송</h3><p>오후 2시 이전 주문 시, 내일 만나보세요.</p></div></div>
        <div className="service-item"><span>02</span><div><h3>14일 이내 무료 반품</h3><p>충분히 경험하고 결정할 수 있도록.</p></div></div>
        <div className="service-item"><span>03</span><div><h3>정품 보증과 케어</h3><p>전문가가 제품의 시작부터 함께합니다.</p></div></div>
      </section>

      <section className="newsletter section-shell"><p className="eyebrow dark"><span /> STAY IN THE LOOP</p><h2>새로운 기술이 도착하는<br />순간을 <em>가장 먼저</em> 만나보세요.</h2><form onSubmit={(event) => event.preventDefault()}><label htmlFor="email" className="sr-only">이메일 주소</label><input id="email" type="email" placeholder="이메일 주소를 입력하세요" /><button className="button button-dark" type="submit">구독하기 <Arrow /></button></form></section>

      <footer className="site-footer"><div className="footer-main section-shell"><a className="wordmark" href="#top">NOVA<span>®</span></a><p>Designing quiet technology<br />for moving minds.</p><div className="footer-links"><a href="#shop">스토어</a><a href="#story">브랜드</a><a href="#support">지원</a><a href="#top">Instagram</a></div></div><div className="footer-meta section-shell"><span>© 2026 NOVA INC.</span><span>개인정보 처리방침&nbsp;&nbsp; 이용약관</span><span>SEOUL · KOREA</span></div></footer>

      {cartOpen && <aside className="cart-panel" aria-label="장바구니"><button className="cart-close" aria-label="장바구니 닫기" onClick={() => setCartOpen(false)}>×</button><p className="eyebrow dark"><span /> YOUR BAG</p><h2>{cartCount ? `제품 ${cartCount}개가 기다리고 있어요.` : "장바구니가 비어 있어요."}</h2><p className="cart-note">무료 익일 배송 · 14일 이내 무료 반품</p><button className="button button-dark" onClick={() => setCartOpen(false)}>계속 쇼핑하기 <Arrow /></button></aside>}
    </main>
  );
}
