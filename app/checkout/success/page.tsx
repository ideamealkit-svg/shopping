"use client";

import { useEffect, useState } from "react";
import { withBasePath } from "../../site-path";
import "../result.css";

export default function CheckoutSuccess() {
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("결제 정보를 확인하고 있어요.");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentKey = params.get("paymentKey"); const orderId = params.get("orderId"); const amount = Number(params.get("amount"));
    if (!paymentKey || !orderId || !Number.isInteger(amount)) { setState("error"); setMessage("결제 정보가 올바르지 않습니다."); return; }
    window.localStorage.removeItem("nova-cart");
    setState("success");
    setMessage(`테스트 결제가 완료되었습니다. 주문번호 ${orderId}`);
  }, []);
  return <main className="payment-result"><p>PAYMENT / {state.toUpperCase()}</p><h1>{state === "loading" ? "결제를 확인하는 중이에요." : state === "success" ? <>결제가<br /><em>완료되었어요.</em></> : <>결제를<br /><em>완료하지 못했어요.</em></>}</h1><span>{message}</span>{state !== "loading" && <a href={withBasePath(state === "success" ? "/" : "/checkout")}>{state === "success" ? "스토어로 돌아가기" : "결제 다시 시도하기"} →</a>}</main>;
}
