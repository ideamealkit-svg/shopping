"use client";

import { FormEvent, useEffect, useState } from "react";
import { withBasePath } from "../site-path";
import "./mypage.css";

type Address = { recipient: string; phone: string; zonecode: string; address: string; detail: string };
type DaumPostcodeResult = { zonecode: string; address: string; roadAddress: string; jibunAddress: string; buildingName: string; apartment: "Y" | "N" };
type StoredUser = { name?: string; email?: string; picture?: string };

declare global {
  interface Window {
    daum?: { Postcode: new (config: { oncomplete: (data: DaumPostcodeResult) => void }) => { open: () => void } };
  }
}

const ADDRESS_STORAGE_KEY = "nova-default-delivery-address";
const emptyAddress: Address = { recipient: "", phone: "", zonecode: "", address: "", detail: "" };

type OrderItem = { name: string; price: string; quantity: number; image: string };
type OrderRecord = { id: string; date: string; items: OrderItem[]; totalPrice: string; address: { zonecode: string; address: string; detail: string }; status: string };

const defaultOrders: OrderRecord[] = [
  {
    id: "N-984210",
    date: "2026. 08. 12 10:15",
    items: [{ name: "AURA H1", price: "₩389,000", quantity: 1, image: "/products/aura-h1.png" }],
    totalPrice: "₩389,000",
    address: { zonecode: "06164", address: "서울특별시 강남구 영동대로 513 (삼성동, 코엑스)", detail: "101호 NOVA 체험관" },
    status: "주문 완료"
  }
];

export default function MyPage() {
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [user, setUser] = useState<StoredUser>({});
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [postcodeReady, setPostcodeReady] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const savedAddress = window.localStorage.getItem(ADDRESS_STORAGE_KEY);
    const savedUser = window.localStorage.getItem("nova-google-user");
    const savedOrders = window.localStorage.getItem("nova-orders");
    if (savedAddress) { try { setAddress({ ...emptyAddress, ...JSON.parse(savedAddress) }); } catch { window.localStorage.removeItem(ADDRESS_STORAGE_KEY); } }
    if (savedUser) { try { setUser(JSON.parse(savedUser)); } catch { window.localStorage.removeItem("nova-google-user"); } }
    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed) && parsed.length > 0) setOrders(parsed);
        else setOrders(defaultOrders);
      } catch { setOrders(defaultOrders); }
    } else { setOrders(defaultOrders); }

    if (window.daum?.Postcode) { setPostcodeReady(true); return; }
    const existing = document.getElementById("daum-postcode-script") as HTMLScriptElement | null;
    const onLoad = () => setPostcodeReady(true);
    if (existing) { existing.addEventListener("load", onLoad, { once: true }); return () => existing.removeEventListener("load", onLoad); }
    const script = document.createElement("script");
    script.id = "daum-postcode-script";
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = onLoad;
    document.head.appendChild(script);
    return () => script.removeEventListener("load", onLoad);
  }, []);

  const searchPostcode = () => {
    if (!window.daum?.Postcode) return;
    new window.daum.Postcode({ oncomplete: (data) => {
      const base = data.roadAddress || data.address || data.jibunAddress;
      const extra = data.roadAddress && data.apartment === "Y" && data.buildingName ? ` (${data.buildingName})` : "";
      setAddress((current) => ({ ...current, zonecode: data.zonecode, address: `${base}${extra}` }));
      setNotice("");
    } }).open();
  };

  const updateOrderAddress = (orderId: string) => {
    if (!window.daum?.Postcode) return;
    new window.daum.Postcode({
      oncomplete: (data) => {
        const base = data.roadAddress || data.address || data.jibunAddress;
        const extra = data.roadAddress && data.apartment === "Y" && data.buildingName ? ` (${data.buildingName})` : "";
        const updatedAddress = { zonecode: data.zonecode, address: `${base}${extra}`, detail: address.detail || "상세 주소" };
        const nextOrders = orders.map((ord) => (ord.id === orderId ? { ...ord, address: updatedAddress } : ord));
        setOrders(nextOrders);
        window.localStorage.setItem("nova-orders", JSON.stringify(nextOrders));
      }
    }).open();
  };

  const saveAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!address.recipient.trim() || !address.phone.trim() || !address.zonecode || !address.address || !address.detail.trim()) {
      setNotice("받는 분, 연락처, 주소와 상세 주소를 모두 입력해 주세요.");
      return;
    }
    window.localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(address));
    setNotice("기본 배송지가 저장되었습니다.");
  };

  return (
    <main className="mypage">
      <header className="mypage-header">
        <a href={withBasePath("/")} className="mypage-logo">NOVA</a>
        <nav aria-label="마이페이지 메뉴">
          <a href={withBasePath("/")}>스토어</a>
          <a href="#orders" className="is-active">주문 내역</a>
          <a href="#delivery">배송지 관리</a>
        </nav>
      </header>
      <section className="mypage-intro">
        <p>MY NOVA / ACCOUNT</p>
        <h1>{user.name || "NOVA MEMBER"}님의<br /><em>주문 내역 & 배송지.</em></h1>
        <span>{user.email || "주문 내역 조회와 카카오 Daum 우편번호 서비스로 배송지를 손쉽게 관리하세요."}</span>
      </section>
      <section className="mypage-layout" id="orders">
        <aside className="mypage-aside">
          <p>ACCOUNT</p>
          <a href="#orders" className="is-active">주문 내역 ({orders.length}건)</a>
          <a href="#delivery">기본 배송지 관리</a>
          <a href={withBasePath("/products")}>전체 상품 보기</a>
          <a href={withBasePath("/products/aura-h1#inquiries")}>상품 문의</a>
        </aside>
        <div className="mypage-main-content">
          <section className="mypage-orders-section" style={{ marginBottom: "60px" }}>
            <div className="delivery-form-heading">
              <div>
                <p>PURCHASE HISTORY</p>
                <h2>주문 내역</h2>
              </div>
              <span>총 {orders.length}건의 주문</span>
            </div>
            <div className="orders-list">
              {orders.map((order) => (
                <article className="order-card" key={order.id}>
                  <div className="order-card-header">
                    <div>
                      <strong>주문 번호 {order.id}</strong>
                      <span>{order.date}</span>
                    </div>
                    <span className="order-status-tag">{order.status}</span>
                  </div>
                  <div className="order-items-list">
                    {order.items.map((item) => (
                      <div className="order-item-row" key={item.name}>
                        <img src={withBasePath(item.image)} alt={item.name} />
                        <div>
                          <strong>{item.name}</strong>
                          <span>{item.quantity}개 · {item.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="order-card-footer">
                    <div className="order-address-box">
                      <b>배송지 정보 (다음 우편번호 연동)</b>
                      <p>[{order.address.zonecode}] {order.address.address} {order.address.detail}</p>
                      <button type="button" onClick={() => updateOrderAddress(order.id)} style={{ marginTop: "6px", textDecoration: "underline", color: "#16191c", background: "transparent", border: 0, padding: 0, font: "inherit", fontSize: "12px", cursor: "pointer" }}>
                        배송지 주소 변경 (다음 우편번호)
                      </button>
                    </div>
                    <div className="order-total">
                      <span>총 결제금액</span>
                      <strong>{order.totalPrice}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <form className="delivery-form" id="delivery" onSubmit={saveAddress}>
            <div className="delivery-form-heading">
              <div>
                <p>DEFAULT DELIVERY</p>
                <h2>기본 배송지 관리</h2>
              </div>
              <span>다음 우편번호 서비스 지원</span>
            </div>
            <div className="delivery-fields">
              <label>받는 분<input value={address.recipient} onChange={(event) => setAddress({ ...address, recipient: event.target.value })} placeholder="이름을 입력해 주세요" /></label>
              <label>연락처<input value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} placeholder="010-0000-0000" inputMode="tel" /></label>
              <label className="delivery-full">주소<div className="postcode-row"><input value={address.zonecode} readOnly placeholder="우편번호" /><button type="button" onClick={searchPostcode} disabled={!postcodeReady}>{postcodeReady ? "우편번호 찾기" : "불러오는 중"}</button></div></label>
              <label className="delivery-full"><input value={address.address} readOnly placeholder="주소 검색 버튼을 눌러 주세요" /></label>
              <label className="delivery-full"><input value={address.detail} onChange={(event) => setAddress({ ...address, detail: event.target.value })} placeholder="상세 주소를 입력해 주세요" /></label>
            </div>
            {notice && <p className={notice.includes("저장") ? "delivery-notice is-success" : "delivery-notice"} role="status">{notice}</p>}
            <button className="save-delivery" type="submit">기본 배송지 저장 <span>→</span></button>
            <p className="delivery-help">카카오 Daum 우편번호 서비스로 도로명 주소와 우편번호를 정확하게 검색할 수 있습니다.</p>
          </form>
        </div>
      </section>
    </main>
  );
}
