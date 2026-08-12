"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaultCatalog } from "../catalog";
import { withBasePath } from "../site-path";
import "./checkout.css";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => { widgets: (options: { customerKey: string }) => TossWidgets };
  }
}

type TossWidgets = {
  setAmount: (amount: { value: number; currency: "KRW" }) => Promise<void> | void;
  renderPaymentMethods: (params: { selector: string; variantKey?: string }) => Promise<unknown> | unknown;
  renderAgreement: (params: { selector: string; variantKey?: string }) => Promise<unknown> | unknown;
  requestPayment: (request: { orderId: string; orderName: string; successUrl: string; failUrl: string; customerEmail?: string; customerName?: string; customerMobilePhone?: string }) => Promise<void>;
};

type Cart = Record<string, number>;
type Address = { recipient?: string; phone?: string; zonecode?: string; address?: string; detail?: string };
const cartKey = "nova-cart";
const addressKey = "nova-default-delivery-address";
// 클라이언트 키는 결제 UI를 표시하기 위한 공개 키입니다. 승인용 시크릿 키는
// GitHub Pages에 둘 수 없으므로 절대 브라우저로 전달하지 않습니다.
const TOSS_CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbPOW43nO7xlzm";

function won(value: number) { return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(value); }
function customerKey() { const key = "nova-toss-customer-key"; const saved = window.localStorage.getItem(key); if (saved) return saved; const next = crypto.randomUUID(); window.localStorage.setItem(key, next); return next; }
function orderId() { return `NOVA-${crypto.randomUUID().replace(/-/g, "").slice(0, 26)}`; }

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart>({});
  const [address, setAddress] = useState<Address>({});
  const [ready, setReady] = useState(false);
  const [widgetState, setWidgetState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const widgets = useRef<TossWidgets | null>(null);

  const items = useMemo(() => defaultCatalog.filter((product) => cart[product.name]).map((product) => ({ ...product, quantity: cart[product.name] })), [cart]);
  const amount = useMemo(() => items.reduce((total, item) => total + Number(item.price.replace(/[^0-9]/g, "")) * item.quantity, 0), [items]);
  const orderName = items.length === 1 ? items[0]?.name ?? "NOVA 주문" : `${items[0]?.name ?? "NOVA"} 외 ${items.length - 1}건`;

  useEffect(() => {
    try { setCart(JSON.parse(window.localStorage.getItem(cartKey) ?? "{}")); } catch { window.localStorage.removeItem(cartKey); }
    try { setAddress(JSON.parse(window.localStorage.getItem(addressKey) ?? "{}")); } catch { window.localStorage.removeItem(addressKey); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !amount) return;
    let disposed = false;
    const render = async () => {
      try {
        if (!window.TossPayments) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.getElementById("toss-payments-sdk") as HTMLScriptElement | null;
            if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); existing.addEventListener("error", () => reject(new Error("SDK_LOAD_FAILED")), { once: true }); return; }
            const script = document.createElement("script"); script.id = "toss-payments-sdk"; script.src = "https://js.tosspayments.com/v2/standard"; script.async = true; script.onload = () => resolve(); script.onerror = () => reject(new Error("SDK_LOAD_FAILED")); document.head.appendChild(script);
          });
        }
        if (disposed || !window.TossPayments) return;
        const nextWidgets = window.TossPayments(TOSS_CLIENT_KEY).widgets({ customerKey: customerKey() });
        await nextWidgets.setAmount({ value: amount, currency: "KRW" });
        await nextWidgets.renderPaymentMethods({ selector: "#toss-payment-methods", variantKey: "DEFAULT" });
        await nextWidgets.renderAgreement({ selector: "#toss-payment-agreement", variantKey: "DEFAULT" });
        if (!disposed) { widgets.current = nextWidgets; setWidgetState("ready"); }
      } catch { if (!disposed) { setWidgetState("error"); setMessage("결제 UI를 불러오지 못했습니다. 테스트 클라이언트 키를 확인해 주세요."); } }
    };
    render();
    return () => { disposed = true; };
  }, [amount, ready]);

  const requestPayment = async () => {
    if (!widgets.current) return;
    if (!address.recipient || !address.phone || !address.address || !address.detail) { setMessage("배송지 정보가 없습니다. 마이페이지에서 기본 배송지를 저장해 주세요."); return; }
    setMessage("");
    try {
      const origin = `${window.location.origin}${window.location.pathname.split("/checkout")[0]}`;
      await widgets.current.requestPayment({ orderId: orderId(), orderName, successUrl: `${origin}/checkout/success`, failUrl: `${origin}/checkout/fail`, customerName: address.recipient, customerMobilePhone: address.phone });
    } catch (error) { setMessage(error instanceof Error ? error.message : "결제를 시작하지 못했습니다."); }
  };

  return <main className="checkout"><header className="checkout-header"><a href={withBasePath("/")}>NOVA</a><span>SECURE CHECKOUT / TEST MODE</span></header><section className="checkout-grid"><div className="checkout-summary"><p className="checkout-kicker">ORDER SUMMARY</p><h1>당신의 사운드를<br /><em>완성하세요.</em></h1>{items.length ? <div className="checkout-items">{items.map((item) => <article key={item.name}><img src={withBasePath(item.image)} alt="" /><div><b>{item.name}</b><span>{item.type} · {item.quantity}개</span></div><strong>{won(Number(item.price.replace(/[^0-9]/g, "")) * item.quantity)}</strong></article>)}</div> : <p className="checkout-empty">장바구니가 비어 있습니다. 스토어에서 제품을 골라 주세요.</p>}<div className="checkout-total"><span>결제 금액</span><strong>{won(amount)}</strong></div><div className="checkout-address"><span>DELIVERY TO</span><p>{address.recipient || "배송지 미입력"}<br />{address.address ? `(${address.zonecode}) ${address.address} ${address.detail ?? ""}` : "마이페이지에서 기본 배송지를 입력해 주세요."}</p><a href={withBasePath("/mypage")}>배송지 관리 →</a></div></div><div className="checkout-payment"><p className="checkout-kicker">PAYMENT</p><h2>결제 수단 선택</h2>{widgetState === "loading" && <div className="payment-skeleton">결제 수단을 준비하고 있어요.</div>}{widgetState !== "error" && <><div id="toss-payment-methods" /><div id="toss-payment-agreement" /></>}{widgetState === "error" && <div className="payment-config"><b>테스트 키 설정 필요</b><p>{message}</p><code>NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...</code></div>}{message && widgetState !== "error" && <p className="payment-message" role="alert">{message}</p>}<button type="button" className="checkout-pay" disabled={!amount || widgetState !== "ready"} onClick={requestPayment}>테스트 결제하기 <strong>{won(amount)}</strong><span>→</span></button><p className="payment-footnote">테스트 모드에서는 실제 결제가 발생하지 않습니다.</p></div></section></main>;
}
