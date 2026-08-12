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

export default function MyPage() {
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [user, setUser] = useState<StoredUser>({});
  const [postcodeReady, setPostcodeReady] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const savedAddress = window.localStorage.getItem(ADDRESS_STORAGE_KEY);
    const savedUser = window.localStorage.getItem("nova-google-user");
    if (savedAddress) { try { setAddress({ ...emptyAddress, ...JSON.parse(savedAddress) }); } catch { window.localStorage.removeItem(ADDRESS_STORAGE_KEY); } }
    if (savedUser) { try { setUser(JSON.parse(savedUser)); } catch { window.localStorage.removeItem("nova-google-user"); } }

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

  const saveAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!address.recipient.trim() || !address.phone.trim() || !address.zonecode || !address.address || !address.detail.trim()) {
      setNotice("받는 분, 연락처, 주소와 상세 주소를 모두 입력해 주세요.");
      return;
    }
    window.localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(address));
    setNotice("기본 배송지가 저장되었습니다.");
  };

  return <main className="mypage"><header className="mypage-header"><a href={withBasePath("/")} className="mypage-logo">NOVA</a><nav aria-label="마이페이지 메뉴"><a href={withBasePath("/")}>스토어</a><a href="#delivery" className="is-active">배송지 관리</a></nav></header><section className="mypage-intro"><p>MY NOVA / ACCOUNT</p><h1>{user.name || "NOVA MEMBER"}님의<br /><em>배송지.</em></h1><span>{user.email || "주문을 더 빠르게 완료할 수 있도록 배송지를 저장하세요."}</span></section><section className="mypage-layout" id="delivery"><aside className="mypage-aside"><p>ACCOUNT</p><a href="#delivery" className="is-active">배송지 관리</a><a href={withBasePath("/products")}>주문 상품 보기</a><a href={withBasePath("/products/aura-h1#inquiries")}>상품 문의</a></aside><form className="delivery-form" onSubmit={saveAddress}><div className="delivery-form-heading"><div><p>DEFAULT DELIVERY</p><h2>기본 배송지</h2></div><span>안전하게 브라우저에 저장됩니다</span></div><div className="delivery-fields"><label>받는 분<input value={address.recipient} onChange={(event) => setAddress({ ...address, recipient: event.target.value })} placeholder="이름을 입력해 주세요" /></label><label>연락처<input value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} placeholder="010-0000-0000" inputMode="tel" /></label><label className="delivery-full">주소<div className="postcode-row"><input value={address.zonecode} readOnly placeholder="우편번호" /><button type="button" onClick={searchPostcode} disabled={!postcodeReady}>{postcodeReady ? "우편번호 찾기" : "불러오는 중"}</button></div></label><label className="delivery-full"><input value={address.address} readOnly placeholder="주소 검색 버튼을 눌러 주세요" /></label><label className="delivery-full"><input value={address.detail} onChange={(event) => setAddress({ ...address, detail: event.target.value })} placeholder="상세 주소를 입력해 주세요" /></label></div>{notice && <p className={notice.includes("저장") ? "delivery-notice is-success" : "delivery-notice"} role="status">{notice}</p>}<button className="save-delivery" type="submit">기본 배송지 저장 <span>→</span></button><p className="delivery-help">카카오 Daum 우편번호 서비스로 도로명 주소와 우편번호를 정확하게 검색할 수 있습니다.</p></form></section></main>;
}
