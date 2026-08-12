"use client";

import { useMemo } from "react";
import { withBasePath } from "../../site-path";
import "../result.css";

export default function CheckoutFail() {
  const message = useMemo(() => new URLSearchParams(window.location.search).get("message") || "결제가 취소되었거나 진행할 수 없습니다.", []);
  return <main className="payment-result"><p>PAYMENT / CANCELED</p><h1>결제가<br /><em>중단되었어요.</em></h1><span>{message}</span><a href={withBasePath("/checkout")}>결제 다시 시도하기 →</a></main>;
}
