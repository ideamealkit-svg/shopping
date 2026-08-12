/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  TOSS_CLIENT_KEY?: string;
  TOSS_SECRET_KEY?: string;
  TOSS_ORDER_TOKEN_SECRET?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

type OrderItem = { name: string; quantity: number };
type PreparedOrder = { orderId: string; amount: number; orderName: string; orderToken: string };

const catalogPrices: Record<string, number> = { "AURA H1": 429000, "NOIR X": 329000, "TIDE S": 269000, "ECHO PRO": 349000, "NOVA LITE": 1000 };

function json(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }); }
function base64Url(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
function fromBase64Url(value: string) { const encoded = value.replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(encoded + "=".repeat((4 - encoded.length % 4) % 4)), (char) => char.charCodeAt(0)); }
async function signOrder(payload: Omit<PreparedOrder, "orderToken">, secret: string) { const body = new TextEncoder().encode(JSON.stringify(payload)); const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, body)); return `${base64Url(body)}.${base64Url(signature)}`; }
async function verifyOrder(token: string, secret: string) { const [body, signature] = token.split("."); if (!body || !signature) return null; const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]); const valid = await crypto.subtle.verify("HMAC", key, fromBase64Url(signature), fromBase64Url(body)); if (!valid) return null; try { return JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as Omit<PreparedOrder, "orderToken">; } catch { return null; } }
function newOrderId() { return `NOVA-${crypto.randomUUID().replace(/-/g, "").slice(0, 26)}`; }
function normalizeBasePath(pathname: string) { const basePath = pathname.startsWith("/shopping/") ? "/shopping" : ""; return { basePath, route: basePath ? pathname.slice(basePath.length) || "/" : pathname }; }
async function paymentApi(request: Request, env: Env) {
  const { basePath, route } = normalizeBasePath(new URL(request.url).pathname);
  if (!route.startsWith("/api/payments/")) return null;
  if (route === "/api/payments/config" && request.method === "GET") {
    if (!env.TOSS_CLIENT_KEY) return json({ message: "토스페이먼츠 클라이언트 키가 설정되지 않았습니다." }, 503);
    return json({ clientKey: env.TOSS_CLIENT_KEY });
  }
  if (request.method !== "POST") return json({ message: "지원하지 않는 결제 요청입니다." }, 405);
  if (route === "/api/payments/prepare") {
    const body = await request.json().catch(() => null) as { items?: OrderItem[] } | null;
    if (!body?.items?.length || !env.TOSS_ORDER_TOKEN_SECRET) return json({ message: "결제 주문을 준비할 수 없습니다. 서버 설정을 확인해 주세요." }, 400);
    const amount = body.items.reduce((total, item) => total + (catalogPrices[item.name] ?? 0) * Math.max(0, Math.trunc(item.quantity)), 0);
    if (!Number.isInteger(amount) || amount < 1000) return json({ message: "올바른 주문 금액이 아닙니다." }, 400);
    const orderName = body.items.length === 1 ? body.items[0].name : `${body.items[0].name} 외 ${body.items.length - 1}건`;
    const prepared = { orderId: newOrderId(), amount, orderName };
    const orderToken = await signOrder(prepared, env.TOSS_ORDER_TOKEN_SECRET);
    return json({ ...prepared, orderToken, basePath });
  }
  if (route === "/api/payments/confirm") {
    const body = await request.json().catch(() => null) as { paymentKey?: string; orderId?: string; amount?: number; orderToken?: string } | null;
    if (!body?.paymentKey || !body.orderId || !Number.isInteger(body.amount) || !body.orderToken || !env.TOSS_ORDER_TOKEN_SECRET || !env.TOSS_SECRET_KEY) return json({ message: "결제 승인 정보가 올바르지 않습니다." }, 400);
    const prepared = await verifyOrder(body.orderToken, env.TOSS_ORDER_TOKEN_SECRET);
    if (!prepared || prepared.orderId !== body.orderId || prepared.amount !== body.amount) return json({ message: "주문 금액 검증에 실패했습니다." }, 400);
    const authorization = `Basic ${btoa(`${env.TOSS_SECRET_KEY}:`)}`;
    const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", { method: "POST", headers: { Authorization: authorization, "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ paymentKey: body.paymentKey, orderId: prepared.orderId, amount: prepared.amount }) });
    const tossBody = await tossResponse.json().catch(() => ({}));
    if (!tossResponse.ok) return json({ message: tossBody.message || "결제 승인에 실패했습니다.", code: tossBody.code }, tossResponse.status);
    return json({ orderName: prepared.orderName, paymentKey: tossBody.paymentKey, status: tossBody.status });
  }
  return json({ message: "지원하지 않는 결제 요청입니다." }, 404);
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const paymentResponse = await paymentApi(request, env);
    if (paymentResponse) return paymentResponse;

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const response = await handler.fetch(request, env, ctx);
    const responseHeaders = new Headers(response.headers);
    // Google Identity Services keeps a popup open during legacy sign-in flows.
    // This opt-in preserves the opener relationship so its completion message can
    // return to the NOVA page rather than leaving a blank accounts.google.com window.
    responseHeaders.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    responseHeaders.set("Referrer-Policy", "no-referrer-when-downgrade");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  },
};

export default worker;
